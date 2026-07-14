import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { RedisService } from '../auth/redis.service';
import { ACTIVATION_EVENTS } from './activation.service';

@Injectable()
export class LifecycleService {
  private readonly logger = new Logger(LifecycleService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
    private readonly redis: RedisService,
  ) {}

  private async markSent(userId: string, campaign: string, ttlSeconds: number) {
    await this.redis.set(`lifecycle:${campaign}:${userId}`, '1', ttlSeconds);
  }

  private async alreadySent(userId: string, campaign: string) {
    return Boolean(await this.redis.get(`lifecycle:${campaign}:${userId}`));
  }

  /**
   * Runs `handler` over `items` in concurrency-limited batches instead of one
   * at a time — these cron jobs were doing sequential per-user Redis/DB round
   * trips, which scales linearly (and slowly) with signup volume.
   */
  private async processInBatches<T>(
    items: T[],
    batchSize: number,
    handler: (item: T) => Promise<boolean>,
  ): Promise<number> {
    let sent = 0;
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const results = await Promise.all(batch.map((item) => handler(item)));
      sent += results.filter(Boolean).length;
    }
    return sent;
  }

  /** Day 1 — portfolio waiting nudge */
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async sendDay1Nudges() {
    const start = new Date();
    start.setDate(start.getDate() - 1);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setHours(23, 59, 59, 999);

    const users = await this.prisma.user.findMany({
      where: {
        emailVerified: true,
        createdAt: { gte: start, lte: end },
        onboardingCompleted: false,
      },
      select: { id: true, email: true, fullName: true },
    });

    const sent = await this.processInBatches(users, 20, async (user) => {
      if (await this.alreadySent(user.id, 'day1')) return false;
      await this.markSent(user.id, 'day1', 60 * 60 * 24 * 14);
      this.email
        .sendLifecycleEmail(user.email, user.fullName, {
          subject: `${user.fullName}, your portfolio is waiting`,
          headline: 'Complete your setup in 2 minutes',
          body: 'Traders who connect a broker or start paper trading in the first 24 hours are 3× more likely to see positive results in month one.',
          ctaLabel: 'Complete Onboarding',
          ctaPath: '/onboarding/risk',
        })
        .catch(() => {});
      return true;
    });

    if (sent) {
      this.logger.log(`Day 1 nudges sent to ${sent} users`);
    }
  }

  /** Day 3 — broker connect prompt */
  @Cron(CronExpression.EVERY_DAY_AT_10AM)
  async sendDay3BrokerNudges() {
    const start = new Date();
    start.setDate(start.getDate() - 3);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setHours(23, 59, 59, 999);

    const users = await this.prisma.user.findMany({
      where: {
        emailVerified: true,
        createdAt: { gte: start, lte: end },
      },
      select: { id: true, email: true, fullName: true },
    });

    let sent = 0;
    if (users.length) {
      const connectedEvents = await this.prisma.userActivationEvent.findMany({
        where: {
          userId: { in: users.map((u) => u.id) },
          event: ACTIVATION_EVENTS.BROKER_CONNECTED,
        },
        select: { userId: true },
      });
      const connectedUserIds = new Set(connectedEvents.map((e) => e.userId));
      const eligible = users.filter((u) => !connectedUserIds.has(u.id));

      sent = await this.processInBatches(eligible, 20, async (user) => {
        if (await this.alreadySent(user.id, 'day3')) return false;

        await this.markSent(user.id, 'day3', 60 * 60 * 24 * 14);
        this.email
          .sendLifecycleEmail(user.email, user.fullName, {
            subject: 'Connect MT5 and start copying verified strategies',
            headline: '3 traders like you connected this week',
            body: 'Link your MetaTrader 5 account or start with a free paper account — no capital required.',
            ctaLabel: 'Connect Broker',
            ctaPath: '/copy-trading',
          })
          .catch(() => {});
        return true;
      });
    }

    if (sent) {
      this.logger.log(`Day 3 nudges sent to ${sent} users`);
    }
  }

  /** Day 7 — trial summary for users without marketplace sub */
  @Cron(CronExpression.EVERY_DAY_AT_11AM)
  async sendDay7TrialSummary() {
    const start = new Date();
    start.setDate(start.getDate() - 7);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setHours(23, 59, 59, 999);

    const users = await this.prisma.user.findMany({
      where: {
        emailVerified: true,
        createdAt: { gte: start, lte: end },
      },
      select: { id: true, email: true, fullName: true },
    });

    let sent = 0;
    if (users.length) {
      const tradeCounts = await this.prisma.trade.groupBy({
        by: ['userId'],
        where: { userId: { in: users.map((u) => u.id) } },
        _count: { id: true },
      });
      const tradeCountByUser = new Map(
        tradeCounts.map((row) => [row.userId, row._count.id]),
      );

      sent = await this.processInBatches(users, 20, async (user) => {
        if (await this.alreadySent(user.id, 'day7')) return false;

        const tradeCount = tradeCountByUser.get(user.id) ?? 0;
        await this.markSent(user.id, 'day7', 60 * 60 * 24 * 30);
        this.email
          .sendLifecycleEmail(user.email, user.fullName, {
            subject: `Your 7-day Profytron report: ${tradeCount} trades`,
            headline: 'Your first week on Profytron',
            body: `You executed ${tradeCount} trades this week. Upgrade to Starter (₹3,999/mo) for live copy trading and unlimited analytics.`,
            ctaLabel: 'View Plans',
            ctaPath: '/pricing',
          })
          .catch(() => {});
        return true;
      });
    }

    if (sent) {
      this.logger.log(`Day 7 summaries sent to ${sent} users`);
    }
  }

  /** Re-engagement — inactive 7 days */
  @Cron(CronExpression.EVERY_DAY_AT_6PM)
  async sendReengagementEmails() {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);

    const users = await this.prisma.user.findMany({
      where: {
        emailVerified: true,
        isActive: true,
        OR: [{ lastLoginAt: { lt: cutoff } }, { lastLoginAt: null }],
        createdAt: { lt: cutoff },
      },
      take: 100,
      select: { id: true, email: true, fullName: true },
    });

    const sent = await this.processInBatches(users, 20, async (user) => {
      if (await this.alreadySent(user.id, 'reengagement')) return false;

      await this.markSent(user.id, 'reengagement', 60 * 60 * 24 * 14);
      this.email
        .sendLifecycleEmail(user.email, user.fullName, {
          subject: "Your strategies may still be running — check today's P&L",
          headline: 'We saved your settings',
          body: 'Log back in to review open positions, copy subscriptions, and AI risk insights.',
          ctaLabel: 'Open Dashboard',
          ctaPath: '/dashboard',
        })
        .catch(() => {});
      return true;
    });

    if (sent) {
      this.logger.log(`Re-engagement emails sent to ${sent} users`);
    }
  }
}
