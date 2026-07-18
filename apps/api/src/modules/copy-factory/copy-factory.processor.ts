import { Process, Processor, OnQueueFailed } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { SubscriptionStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CryptoService } from '../../common/crypto.service';
import { isPaidCopySubscription } from '../../common/utils/copy-subscription.util';
import { CopyFactoryService } from './copy-factory.service';
import type { CopyFactorySyncJob } from './copy-factory-sync.service';
import { SubscriptionProvisioningService } from '../provisioning/subscription-provisioning.service';

@Processor('copyfactory_sync')
export class CopyFactoryProcessor {
  private readonly logger = new Logger(CopyFactoryProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
    private readonly copyFactory: CopyFactoryService,
    private readonly provisioning: SubscriptionProvisioningService,
  ) {}

  @Process('sync_copyfactory')
  async handle(job: Job<CopyFactorySyncJob>) {
    if (!this.copyFactory.isEnabled()) {
      this.logger.debug(
        'CopyFactory disabled — completing provisioning without link',
      );
      if (job.data.subscriptionId) {
        await this.completeWithoutCopyFactory(job.data.subscriptionId);
      }
      return;
    }

    const { action, subscriptionId, strategyId, userId } = job.data;

    if (action === 'provision_provider' && strategyId) {
      await this.provisionProvider(strategyId);
      return;
    }

    if (action === 'unlink' && subscriptionId) {
      await this.unlinkOne(subscriptionId);
      return;
    }

    if (action === 'link') {
      if (subscriptionId) {
        await this.linkOne(subscriptionId);
        return;
      }
      if (userId) {
        await this.linkAllForUser(userId);
      }
    }
  }

  @OnQueueFailed({ name: 'sync_copyfactory' })
  async onFailed(job: Job<CopyFactorySyncJob>, error: Error) {
    if (job.data.action !== 'link' || !job.data.subscriptionId) return;

    const sub = await this.prisma.userStrategySubscription.findUnique({
      where: { id: job.data.subscriptionId },
      include: { strategy: { select: { id: true, name: true } } },
    });
    if (!sub || sub.status !== SubscriptionStatus.PROVISIONING) return;

    await this.provisioning.recordProvisioningAttempt(
      job.data.subscriptionId,
      error.message,
    );

    const maxAttempts = job.opts.attempts ?? 4;
    if (job.attemptsMade >= maxAttempts) {
      await this.provisioning.failProvisioning(
        job.data.subscriptionId,
        sub.userId,
        sub.strategyId,
        sub.strategy.name,
        error.message,
      );
    }
  }

  private async completeWithoutCopyFactory(subscriptionId: string) {
    const sub = await this.prisma.userStrategySubscription.findUnique({
      where: { id: subscriptionId },
      include: { strategy: { select: { id: true, name: true } } },
    });
    if (!sub) return;
    if (sub.status === SubscriptionStatus.PROVISIONING) {
      await this.provisioning.completeProvisioning(
        subscriptionId,
        sub.userId,
        sub.strategyId,
        sub.strategy.name,
      );
    }
  }

  private async provisionProvider(profytronStrategyId: string) {
    const strategy = await this.prisma.strategy.findUnique({
      where: { id: profytronStrategyId },
      include: {
        masterBrokerAccount: { select: { credentialsEncrypted: true } },
      },
    });

    if (!strategy?.masterBrokerAccount) {
      throw new Error(`Strategy ${profytronStrategyId} has no master broker`);
    }

    const creds = JSON.parse(
      this.crypto.decrypt(strategy.masterBrokerAccount.credentialsEncrypted),
    );
    if (!creds.metaApiAccountId) {
      throw new Error('Master broker missing metaApiAccountId');
    }

    const cfStrategyId = await this.copyFactory.provisionProviderStrategy({
      profytronStrategyId,
      providerMetaApiAccountId: creds.metaApiAccountId,
      name: strategy.name,
      description: strategy.description,
      existingCopyFactoryStrategyId: strategy.copyFactoryStrategyId,
    });

    if (cfStrategyId) {
      await this.prisma.strategy.update({
        where: { id: profytronStrategyId },
        data: { copyFactoryStrategyId: cfStrategyId },
      });
    }
  }

  private async linkOne(subscriptionId: string) {
    const sub = await this.prisma.userStrategySubscription.findUnique({
      where: { id: subscriptionId },
      include: {
        strategy: {
          select: {
            id: true,
            name: true,
            copyFactoryStrategyId: true,
            masterBrokerAccountId: true,
          },
        },
        brokerAccount: {
          select: { credentialsEncrypted: true, isActive: true },
        },
        user: { select: { fullName: true, email: true } },
      },
    });

    if (!sub) return;

    if (!sub.strategy.masterBrokerAccountId) {
      if (sub.status === SubscriptionStatus.PROVISIONING) {
        await this.provisioning.completeProvisioning(
          subscriptionId,
          sub.userId,
          sub.strategyId,
          sub.strategy.name,
        );
      }
      return;
    }

    if (!isPaidCopySubscription(sub)) return;

    await this.provisioning.recordProvisioningAttempt(subscriptionId);

    let cfStrategyId = sub.strategy.copyFactoryStrategyId;
    if (!cfStrategyId) {
      await this.provisionProvider(sub.strategyId);
      const refreshed = await this.prisma.strategy.findUnique({
        where: { id: sub.strategyId },
        select: { copyFactoryStrategyId: true },
      });
      cfStrategyId = refreshed?.copyFactoryStrategyId ?? null;
    }
    if (!cfStrategyId) {
      throw new Error('CopyFactory strategy could not be provisioned');
    }

    const broker = await this.resolveBrokerAccount(
      sub.userId,
      sub.brokerAccountId,
    );
    if (!broker) {
      throw new Error(
        `No MT5 trading account available for user ${sub.userId}`,
      );
    }

    const creds = JSON.parse(this.crypto.decrypt(broker.credentialsEncrypted));
    if (!creds.metaApiAccountId) {
      throw new Error('Broker account missing MetaAPI connection');
    }

    await this.copyFactory.linkSubscriber({
      subscriberMetaApiAccountId: creds.metaApiAccountId,
      copyFactoryStrategyId: cfStrategyId,
      multiplier: sub.lotMultiplier ?? 1,
      subscriberName: sub.user.fullName || sub.user.email,
    });

    if (sub.status === SubscriptionStatus.PROVISIONING) {
      await this.provisioning.completeProvisioning(
        subscriptionId,
        sub.userId,
        sub.strategyId,
        sub.strategy.name,
      );
    }
  }

  private async unlinkOne(subscriptionId: string) {
    const sub = await this.prisma.userStrategySubscription.findUnique({
      where: { id: subscriptionId },
      include: {
        strategy: { select: { copyFactoryStrategyId: true } },
        brokerAccount: { select: { credentialsEncrypted: true } },
      },
    });

    if (!sub?.strategy.copyFactoryStrategyId) return;

    const broker = await this.resolveBrokerAccount(
      sub.userId,
      sub.brokerAccountId,
    );
    if (!broker) return;

    const creds = JSON.parse(this.crypto.decrypt(broker.credentialsEncrypted));
    if (!creds.metaApiAccountId) return;

    await this.copyFactory.unlinkSubscriber({
      subscriberMetaApiAccountId: creds.metaApiAccountId,
      copyFactoryStrategyId: sub.strategy.copyFactoryStrategyId,
    });
  }

  private async linkAllForUser(userId: string) {
    const now = new Date();
    const subs = await this.prisma.userStrategySubscription.findMany({
      where: {
        userId,
        status: {
          in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.PROVISIONING],
        },
        strategy: { masterBrokerAccountId: { not: null } },
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      select: {
        id: true,
        stripeSubId: true,
        trialEndsAt: true,
        status: true,
        expiresAt: true,
        planType: true,
      },
    });

    for (const sub of subs) {
      if (isPaidCopySubscription(sub, now)) {
        await this.linkOne(sub.id);
      }
    }
  }

  private async resolveBrokerAccount(
    userId: string,
    preferredId: string | null,
  ) {
    if (preferredId) {
      const preferred = await this.prisma.brokerAccount.findFirst({
        where: {
          id: preferredId,
          userId,
          isActive: true,
          isPaperTrading: false,
        },
      });
      if (preferred) return preferred;
    }

    return this.prisma.brokerAccount.findFirst({
      where: {
        userId,
        isActive: true,
        isPaperTrading: false,
        brokerName: { in: ['MT4', 'MT5'] },
      },
      orderBy: [{ isDefault: 'desc' }, { connectedAt: 'desc' }],
    });
  }
}
