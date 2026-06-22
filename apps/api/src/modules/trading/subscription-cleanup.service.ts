import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SubscriptionStatus, SubscriptionTier } from '@prisma/client';
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

  /**
   * Expire lapsed PLATFORM subscriptions (UserSubscription) and downgrade the
   * user's tier back to FREE when they have no remaining active plan.
   *
   * Previously nothing acted on `UserSubscription.expiresAt`, so a paid tier
   * (ELITE/PRO/INSTITUTIONAL) was retained indefinitely after the billing
   * period ended — a real revenue leak. A successful renewal pushes `expiresAt`
   * forward via the payment webhook, so anything still <= now has genuinely
   * lapsed.
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async expirePlatformSubscriptions(): Promise<void> {
    try {
      const now = new Date();

      const lapsed = await this.prisma.userSubscription.findMany({
        where: { status: SubscriptionStatus.ACTIVE, expiresAt: { lte: now } },
        select: { id: true, userId: true, planId: true, expiresAt: true },
      });

      if (lapsed.length === 0) return;

      await this.prisma.userSubscription.updateMany({
        where: {
          id: { in: lapsed.map((s) => s.id) },
          status: SubscriptionStatus.ACTIVE,
        },
        data: { status: SubscriptionStatus.EXPIRED, cancelledAt: now },
      });

      // Downgrade each affected user to FREE only if they have no other plan
      // still active (a user may hold multiple plan rows).
      const affectedUserIds = [...new Set(lapsed.map((s) => s.userId))];
      for (const userId of affectedUserIds) {
        const stillActive = await this.prisma.userSubscription.count({
          where: { userId, status: SubscriptionStatus.ACTIVE },
        });
        if (stillActive === 0) {
          await this.prisma.user.update({
            where: { id: userId },
            data: { subscriptionTier: SubscriptionTier.FREE },
          });
        }
      }

      await this.prisma.auditLog.createMany({
        data: lapsed.map((s) => ({
          eventType: 'PLATFORM_SUBSCRIPTION_EXPIRED',
          userId: s.userId,
          detailsJson: {
            subscriptionId: s.id,
            planId: s.planId,
            expiresAt: s.expiresAt?.toISOString() ?? null,
            processedAt: now.toISOString(),
          },
          triggeredBy: 'SYSTEM_CRON',
        })),
      });

      this.logger.log(
        `Expired ${lapsed.length} platform subscription(s); downgraded lapsed users to FREE.`,
      );
    } catch (error) {
      this.logger.warn(
        `Platform subscription expiry skipped: ${(error as Error).message}`,
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
