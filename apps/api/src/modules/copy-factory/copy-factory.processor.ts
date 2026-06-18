import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { SubscriptionStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CryptoService } from '../../common/crypto.service';
import { isPaidCopySubscription } from '../../common/utils/copy-subscription.util';
import { CopyFactoryService } from './copy-factory.service';
import type { CopyFactorySyncJob } from './copy-factory-sync.service';

@Processor('copyfactory_sync')
export class CopyFactoryProcessor {
  private readonly logger = new Logger(CopyFactoryProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
    private readonly copyFactory: CopyFactoryService,
  ) {}

  @Process('sync_copyfactory')
  async handle(job: Job<CopyFactorySyncJob>) {
    if (!this.copyFactory.isEnabled()) {
      this.logger.debug('CopyFactory disabled — job ignored');
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

    if (!sub || !sub.strategy.masterBrokerAccountId) return;
    if (!isPaidCopySubscription(sub)) return;

    let cfStrategyId = sub.strategy.copyFactoryStrategyId;
    if (!cfStrategyId) {
      await this.provisionProvider(sub.strategyId);
      const refreshed = await this.prisma.strategy.findUnique({
        where: { id: sub.strategyId },
        select: { copyFactoryStrategyId: true },
      });
      cfStrategyId = refreshed?.copyFactoryStrategyId ?? null;
    }
    if (!cfStrategyId) return;

    const broker = await this.resolveBrokerAccount(
      sub.userId,
      sub.brokerAccountId,
    );
    if (!broker) {
      this.logger.warn(
        `Subscription ${subscriptionId}: no MT5 broker to link for user ${sub.userId}`,
      );
      return;
    }

    const creds = JSON.parse(this.crypto.decrypt(broker.credentialsEncrypted));
    if (!creds.metaApiAccountId) return;

    await this.copyFactory.linkSubscriber({
      subscriberMetaApiAccountId: creds.metaApiAccountId,
      copyFactoryStrategyId: cfStrategyId,
      multiplier: sub.lotMultiplier ?? 1,
      subscriberName: sub.user.fullName || sub.user.email,
    });
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
        status: SubscriptionStatus.ACTIVE,
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
