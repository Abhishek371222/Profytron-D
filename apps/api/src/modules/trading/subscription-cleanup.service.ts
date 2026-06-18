import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SubscriptionStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CopyFactorySyncService } from '../copy-factory/copy-factory-sync.service';
import { isPaidCopySubscription } from '../../common/utils/copy-subscription.util';

@Injectable()
export class SubscriptionCleanupService {
  private readonly logger = new Logger(SubscriptionCleanupService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly copyFactorySync: CopyFactorySyncService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async expireSubscriptions(): Promise<void> {
    try {
      const now = new Date();

      const subscriptions = await this.prisma.userStrategySubscription.findMany(
        {
          where: {
            status: SubscriptionStatus.ACTIVE,
            expiresAt: { lte: now },
          },
          select: {
            id: true,
            userId: true,
            strategyId: true,
            brokerAccountId: true,
            expiresAt: true,
            strategy: {
              select: {
                copyFactoryStrategyId: true,
                masterBrokerAccountId: true,
              },
            },
          },
        },
      );

      if (subscriptions.length === 0) {
        return;
      }

      const subscriptionIds = subscriptions.map(
        (subscription) => subscription.id,
      );

      await this.prisma.userStrategySubscription.updateMany({
        where: {
          id: { in: subscriptionIds },
          status: SubscriptionStatus.ACTIVE,
        },
        data: {
          status: SubscriptionStatus.EXPIRED,
          cancelledAt: now,
        },
      });

      for (const subscription of subscriptions) {
        if (subscription.strategy.copyFactoryStrategyId) {
          await this.copyFactorySync.enqueueUnlinkSubscription(subscription.id);
        }
      }

      await this.prisma.auditLog.createMany({
        data: subscriptions.map((subscription) => ({
          eventType: 'SUBSCRIPTION_AUTO_EXPIRED',
          userId: subscription.userId,
          detailsJson: {
            subscriptionId: subscription.id,
            strategyId: subscription.strategyId,
            brokerAccountId: subscription.brokerAccountId,
            expiresAt: subscription.expiresAt?.toISOString() ?? null,
            copyFactoryUnlinked: Boolean(
              subscription.strategy.copyFactoryStrategyId,
            ),
            processedAt: now.toISOString(),
          },
          triggeredBy: 'SYSTEM_CRON',
        })),
      });

      this.logger.log(
        `Auto-expired ${subscriptions.length} subscription(s); CopyFactory unlink queued where applicable.`,
      );
    } catch (error) {
      this.logger.warn(
        `Subscription cleanup skipped: ${(error as Error).message}`,
      );
    }
  }

  /** Revoke CopyFactory links for unpaid / expired copy subscriptions. */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async reconcileCopyFactoryLinks(): Promise<void> {
    try {
      const now = new Date();
      const subs = await this.prisma.userStrategySubscription.findMany({
        where: {
          strategy: { copyFactoryStrategyId: { not: null } },
          status: {
            in: [
              SubscriptionStatus.ACTIVE,
              SubscriptionStatus.EXPIRED,
              SubscriptionStatus.CANCELLED,
              SubscriptionStatus.INACTIVE,
            ],
          },
        },
        select: {
          id: true,
          status: true,
          expiresAt: true,
          trialEndsAt: true,
          stripeSubId: true,
          planType: true,
        },
      });

      for (const sub of subs) {
        const shouldBeLinked =
          sub.status === SubscriptionStatus.ACTIVE &&
          isPaidCopySubscription(sub, now);
        if (shouldBeLinked) {
          await this.copyFactorySync.enqueueLinkSubscription(sub.id);
        } else {
          await this.copyFactorySync.enqueueUnlinkSubscription(sub.id);
        }
      }
    } catch (error) {
      this.logger.warn(
        `CopyFactory reconcile skipped: ${(error as Error).message}`,
      );
    }
  }
}
