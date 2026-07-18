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

      await Promise.all(
        subscriptions
          .filter((subscription) => subscription.strategy.copyFactoryStrategyId)
          .map((subscription) =>
            this.copyFactorySync.enqueueUnlinkSubscription(subscription.id),
          ),
      );

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

      const affectedUserIds = [...new Set(lapsed.map((s) => s.userId))];
      const stillActiveCounts = await this.prisma.userSubscription.groupBy({
        by: ['userId'],
        where: {
          userId: { in: affectedUserIds },
          status: SubscriptionStatus.ACTIVE,
        },
        _count: { id: true },
      });
      const stillActiveUserIds = new Set(
        stillActiveCounts.map((row) => row.userId),
      );
      const usersToDowngrade = affectedUserIds.filter(
        (userId) => !stillActiveUserIds.has(userId),
      );
      if (usersToDowngrade.length > 0) {
        await this.prisma.user.updateMany({
          where: { id: { in: usersToDowngrade } },
          data: { subscriptionTier: SubscriptionTier.FREE },
        });
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
              SubscriptionStatus.PAUSED,
              SubscriptionStatus.FAILED,
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

      await Promise.all(
        subs.map((sub) => {
          const shouldBeLinked =
            sub.status === SubscriptionStatus.ACTIVE &&
            isPaidCopySubscription(sub, now);
          return shouldBeLinked
            ? this.copyFactorySync.enqueueLinkSubscription(sub.id)
            : this.copyFactorySync.enqueueUnlinkSubscription(sub.id);
        }),
      );
    } catch (error) {
      this.logger.warn(
        `CopyFactory reconcile skipped: ${(error as Error).message}`,
      );
    }
  }
}
