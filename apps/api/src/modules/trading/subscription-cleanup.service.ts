import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SubscriptionStatus, SubscriptionTier } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CopyFactorySyncService } from '../copy-factory/copy-factory-sync.service';
import { isPaidCopySubscription } from '../../common/utils/copy-subscription.util';
import { NotificationsService } from '../notifications/notifications.service';
import { RedisService } from '../auth/redis.service';

function dayWindow(daysFromNow: number): { start: Date; end: Date } {
  const start = new Date();
  start.setDate(start.getDate() + daysFromNow);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

@Injectable()
export class SubscriptionCleanupService {
  private readonly logger = new Logger(SubscriptionCleanupService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly copyFactorySync: CopyFactorySyncService,
    private readonly notifications: NotificationsService,
    private readonly redis: RedisService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async expireSubscriptions(): Promise<void> {
    try {
      const now = new Date();

      // Marketplace period end: paid expiresAt, or bot trialEndsAt when no
      // surviving paid expiresAt remains ahead of now.
      const subscriptions = await this.prisma.userStrategySubscription.findMany(
        {
          where: {
            status: SubscriptionStatus.ACTIVE,
            OR: [
              { expiresAt: { lte: now } },
              {
                trialEndsAt: { lte: now },
                OR: [{ expiresAt: null }, { expiresAt: { lte: now } }],
              },
            ],
          },
          select: {
            id: true,
            userId: true,
            strategyId: true,
            brokerAccountId: true,
            expiresAt: true,
            trialEndsAt: true,
            strategy: {
              select: {
                copyFactoryStrategyId: true,
                masterBrokerAccountId: true,
                name: true,
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

      for (const subscription of subscriptions) {
        const wasTrialOnly =
          subscription.trialEndsAt != null &&
          subscription.trialEndsAt <= now &&
          (!subscription.expiresAt || subscription.expiresAt <= now);
        if (wasTrialOnly) {
          await this.notifications
            .create(
              subscription.userId,
              'Bot trial ended',
              `Your trial access to ${subscription.strategy.name} has ended. Subscribe to keep copying this bot.`,
              'INFO',
              '/marketplace',
            )
            .catch(() => undefined);
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
            trialEndsAt: subscription.trialEndsAt?.toISOString() ?? null,
            copyFactoryUnlinked: Boolean(
              subscription.strategy.copyFactoryStrategyId,
            ),
            processedAt: now.toISOString(),
          },
          triggeredBy: 'SYSTEM_CRON',
        })),
      });

      this.logger.log(
        `Auto-expired ${subscriptions.length} marketplace subscription(s); CopyFactory unlink queued where applicable.`,
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

      // Paid / non-trial periods only — trials expired by TrialLifecycleService
      // (same FREE downgrade rules).
      const lapsed = await this.prisma.userSubscription.findMany({
        where: {
          status: SubscriptionStatus.ACTIVE,
          isTrial: false,
          expiresAt: { lte: now },
        },
        select: {
          id: true,
          userId: true,
          planId: true,
          expiresAt: true,
          cancelledAt: true,
          autoRenewal: true,
        },
      });

      if (lapsed.length === 0) return;

      await this.prisma.userSubscription.updateMany({
        where: {
          id: { in: lapsed.map((s) => s.id) },
          status: SubscriptionStatus.ACTIVE,
          isTrial: false,
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
            softCancelledBeforeExpiry: Boolean(s.cancelledAt),
            autoRenewal: s.autoRenewal,
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

  /**
   * Platform model is prepaid one-shot (no stored mandate / no auto-charge).
   * When autoRenewal is still true, remind users before expiresAt so they can
   * manually re-purchase. Never extends access or creates payment orders.
   */
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async sendPlatformRenewalReminders(): Promise<void> {
    try {
      await this.sendPlatformRenewalReminderForDays(3);
      await this.sendPlatformRenewalReminderForDays(1);
    } catch (error) {
      this.logger.warn(
        `Platform renewal reminders skipped: ${(error as Error).message}`,
      );
    }
  }

  /** Exposed for unit tests / manual trigger. */
  async sendPlatformRenewalReminderForDays(daysLeft: 3 | 1): Promise<number> {
    const { start, end } = dayWindow(daysLeft);
    const campaign = daysLeft === 3 ? 'renew3d' : 'renew1d';

    const subs = await this.prisma.userSubscription.findMany({
      where: {
        status: SubscriptionStatus.ACTIVE,
        autoRenewal: true,
        cancelledAt: null,
        isTrial: false,
        expiresAt: { gte: start, lte: end },
      },
      include: {
        plan: { select: { name: true } },
      },
    });

    let sent = 0;
    for (const sub of subs) {
      const dedupeKey = `platform:renew-reminder:${campaign}:${sub.id}`;
      try {
        if (await this.redis.get(dedupeKey)) continue;
        await this.redis.set(dedupeKey, '1', 60 * 60 * 24 * 10);
      } catch {
        // Redis down: still attempt notify once per cron run (acceptable noise).
      }

      const ends = sub.expiresAt.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });

      await this.notifications
        .create(
          sub.userId,
          'Plan renewal reminder',
          `Your ${sub.plan.name} access ends in ${daysLeft} day${
            daysLeft === 1 ? '' : 's'
          } (${ends}). Renew now to keep your plan — billing does not auto-charge.`,
          'WARNING',
          '/settings/billing',
        )
        .catch(() => undefined);

      await this.prisma.auditLog
        .create({
          data: {
            eventType: 'PLATFORM_RENEWAL_REMINDER',
            userId: sub.userId,
            detailsJson: {
              subscriptionId: sub.id,
              planId: sub.planId,
              daysLeft,
              expiresAt: sub.expiresAt.toISOString(),
              campaign,
            },
            triggeredBy: 'SYSTEM_CRON',
          },
        })
        .catch(() => undefined);

      sent++;
    }

    if (sent > 0) {
      this.logger.log(
        `Platform renewal reminder (${daysLeft}d) sent to ${sent} subscription(s)`,
      );
    }
    return sent;
  }

  /**
   * Marketplace prepaid bot access: remind before expiresAt when auto-renew
   * intent is on. Never charges or extends. Stripe-managed subs (stripeSubId)
   * are skipped — invoice.paid webhooks own that path (Phase 9A).
   */
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async sendMarketplaceRenewalReminders(): Promise<void> {
    try {
      await this.sendMarketplaceRenewalReminderForDays(3);
      await this.sendMarketplaceRenewalReminderForDays(1);
    } catch (error) {
      this.logger.warn(
        `Marketplace renewal reminders skipped: ${(error as Error).message}`,
      );
    }
  }

  async sendMarketplaceRenewalReminderForDays(
    daysLeft: 3 | 1,
  ): Promise<number> {
    const { start, end } = dayWindow(daysLeft);
    const campaign = daysLeft === 3 ? 'mkt-renew3d' : 'mkt-renew1d';

    const subs = await this.prisma.userStrategySubscription.findMany({
      where: {
        status: SubscriptionStatus.ACTIVE,
        cancelledAt: null,
        stripeSubId: null,
        expiresAt: { gte: start, lte: end },
        NOT: { planType: 'LIFETIME' },
      },
      select: {
        id: true,
        userId: true,
        strategyId: true,
        expiresAt: true,
        executionProfileJson: true,
        strategy: { select: { name: true } },
      },
    });

    let sent = 0;
    for (const sub of subs) {
      if (!sub.expiresAt) continue;

      // Persist-aware: profile autoRenew:false wins; missing defaults true
      // (legacy Redis-only and never-toggled subs).
      const profile = sub.executionProfileJson as
        | { autoRenew?: boolean }
        | null
        | undefined;
      if (profile && profile.autoRenew === false) continue;

      const dedupeKey = `marketplace:renew-reminder:${campaign}:${sub.id}`;
      try {
        if (await this.redis.get(dedupeKey)) continue;
        await this.redis.set(dedupeKey, '1', 60 * 60 * 24 * 10);
      } catch {
        /* best-effort */
      }

      const ends = sub.expiresAt.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });

      await this.notifications
        .create(
          sub.userId,
          'Bot subscription renewal reminder',
          `Your access to ${sub.strategy.name} ends in ${daysLeft} day${
            daysLeft === 1 ? '' : 's'
          } (${ends}). Renew from Marketplace or My Bots — access does not auto-renew without payment.`,
          'WARNING',
          '/subscriptions',
        )
        .catch(() => undefined);

      await this.prisma.auditLog
        .create({
          data: {
            eventType: 'MARKETPLACE_RENEWAL_REMINDER',
            userId: sub.userId,
            detailsJson: {
              subscriptionId: sub.id,
              strategyId: sub.strategyId,
              daysLeft,
              expiresAt: sub.expiresAt.toISOString(),
              campaign,
            },
            triggeredBy: 'SYSTEM_CRON',
          },
        })
        .catch(() => undefined);

      sent++;
    }

    if (sent > 0) {
      this.logger.log(
        `Marketplace renewal reminder (${daysLeft}d) sent to ${sent} subscription(s)`,
      );
    }
    return sent;
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
