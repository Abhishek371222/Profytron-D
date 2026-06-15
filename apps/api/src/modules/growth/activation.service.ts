import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { AchievementTier, NotificationType, Prisma } from '@prisma/client';

export const ACTIVATION_EVENTS = {
  FIRST_LOGIN: 'FIRST_LOGIN',
  ONBOARDING_COMPLETED: 'ONBOARDING_COMPLETED',
  BROKER_CONNECTED: 'BROKER_CONNECTED',
  FIRST_PAPER_TRADE: 'FIRST_PAPER_TRADE',
  FIRST_WALLET_DEPOSIT: 'FIRST_WALLET_DEPOSIT',
  FIRST_MARKETPLACE_SUB: 'FIRST_MARKETPLACE_SUB',
  FIRST_REAL_TRADE: 'FIRST_REAL_TRADE',
  POWER_USER: 'POWER_USER',
} as const;

export type ActivationEventKey =
  (typeof ACTIVATION_EVENTS)[keyof typeof ACTIVATION_EVENTS];

const ACHIEVEMENT_MAP: Partial<
  Record<ActivationEventKey, { key: string; tier: AchievementTier; title: string }>
> = {
  [ACTIVATION_EVENTS.FIRST_PAPER_TRADE]: {
    key: 'FIRST_BLOOD',
    tier: 'BRONZE',
    title: 'First Trade',
  },
  [ACTIVATION_EVENTS.BROKER_CONNECTED]: {
    key: 'BROKER_LINKED',
    tier: 'BRONZE',
    title: 'Broker Connected',
  },
  [ACTIVATION_EVENTS.FIRST_WALLET_DEPOSIT]: {
    key: 'FIRST_DEPOSIT',
    tier: 'SILVER',
    title: 'First Deposit',
  },
  [ACTIVATION_EVENTS.FIRST_MARKETPLACE_SUB]: {
    key: 'COPY_CAT',
    tier: 'SILVER',
    title: 'Strategy Subscriber',
  },
  [ACTIVATION_EVENTS.POWER_USER]: {
    key: 'POWER_USER',
    tier: 'GOLD',
    title: 'Power User',
  },
};

@Injectable()
export class ActivationService {
  private readonly logger = new Logger(ActivationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
  ) {}

  async track(
    userId: string,
    event: ActivationEventKey,
    metadata?: Record<string, unknown>,
  ): Promise<boolean> {
    try {
      const existing = await this.prisma.userActivationEvent.findUnique({
        where: { userId_event: { userId, event } },
      });
      if (existing) return false;

      await this.prisma.userActivationEvent.create({
        data: {
          userId,
          event,
          metadata: (metadata ?? {}) as Prisma.InputJsonValue,
        },
      });

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, fullName: true },
      });

      const achievement = ACHIEVEMENT_MAP[event];
      if (achievement) {
        await this.prisma.userAchievement.upsert({
          where: {
            userId_achievementKey: {
              userId,
              achievementKey: achievement.key,
            },
          },
          create: {
            userId,
            achievementKey: achievement.key,
            tier: achievement.tier,
            metadataJson: (metadata ?? {}) as Prisma.InputJsonValue,
          },
          update: {},
        });

        await this.createNotification(
          userId,
          `Achievement Unlocked: ${achievement.title}`,
          `You earned the ${achievement.title} badge. Keep building your edge.`,
          'SUCCESS',
          '/dashboard',
        );
      }

      await this.handleLifecycleSideEffects(userId, event, user);
      await this.maybeAwardPowerUser(userId);
      return true;
    } catch (error) {
      this.logger.warn(`Activation track failed for ${userId}/${event}: ${error}`);
      return false;
    }
  }

  async getProgress(userId: string) {
    const events = await this.prisma.userActivationEvent.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
    const eventSet = new Set(events.map((e) => e.event));

    const checklist = [
      {
        id: 'onboarding',
        label: 'Complete risk profile',
        event: ACTIVATION_EVENTS.ONBOARDING_COMPLETED,
        href: '/onboarding/risk',
        done: eventSet.has(ACTIVATION_EVENTS.ONBOARDING_COMPLETED),
      },
      {
        id: 'broker',
        label: 'Connect broker or paper account',
        event: ACTIVATION_EVENTS.BROKER_CONNECTED,
        href: '/copy-trading',
        done: eventSet.has(ACTIVATION_EVENTS.BROKER_CONNECTED),
      },
      {
        id: 'paper',
        label: 'Execute first paper trade',
        event: ACTIVATION_EVENTS.FIRST_PAPER_TRADE,
        href: '/marketplace',
        done: eventSet.has(ACTIVATION_EVENTS.FIRST_PAPER_TRADE),
      },
      {
        id: 'deposit',
        label: 'Fund wallet (optional for live)',
        event: ACTIVATION_EVENTS.FIRST_WALLET_DEPOSIT,
        href: '/wallet',
        done: eventSet.has(ACTIVATION_EVENTS.FIRST_WALLET_DEPOSIT),
      },
      {
        id: 'subscribe',
        label: 'Subscribe to a marketplace strategy',
        event: ACTIVATION_EVENTS.FIRST_MARKETPLACE_SUB,
        href: '/marketplace',
        done: eventSet.has(ACTIVATION_EVENTS.FIRST_MARKETPLACE_SUB),
      },
    ];

    const completed = checklist.filter((c) => c.done).length;
    return {
      events: events.map((e) => ({
        event: e.event,
        createdAt: e.createdAt,
        metadata: e.metadata,
      })),
      checklist,
      progressPct: Math.round((completed / checklist.length) * 100),
      completed,
      total: checklist.length,
      isActivated: eventSet.has(ACTIVATION_EVENTS.FIRST_PAPER_TRADE) ||
        eventSet.has(ACTIVATION_EVENTS.BROKER_CONNECTED),
    };
  }

  async getAdminMetrics() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      totalUsers,
      newUsers,
      activationEvents,
      paidSubs,
      walletDeposits,
      plans,
    ] = await Promise.all([
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.user.count({
        where: { createdAt: { gte: thirtyDaysAgo }, deletedAt: null },
      }),
      this.prisma.userActivationEvent.groupBy({
        by: ['event'],
        _count: { event: true },
      }),
      this.prisma.userSubscription.findMany({
        where: { status: 'ACTIVE' },
        include: { plan: true },
      }),
      this.prisma.walletTransaction.aggregate({
        where: {
          type: 'DEPOSIT',
          status: 'CONFIRMED',
          createdAt: { gte: thirtyDaysAgo },
        },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.subscriptionPlan.findMany(),
    ]);

    const mrr = paidSubs.reduce((sum, sub) => {
      const plan = sub.plan;
      const monthly =
        sub.billingCycle === 'ANNUAL'
          ? (plan.annualPrice ?? plan.monthlyPrice * 12) / 12
          : plan.monthlyPrice;
      return sum + monthly;
    }, 0);

    const activatedUsers = await this.prisma.userActivationEvent.groupBy({
      by: ['userId'],
      where: {
        event: {
          in: [
            ACTIVATION_EVENTS.BROKER_CONNECTED,
            ACTIVATION_EVENTS.FIRST_PAPER_TRADE,
          ],
        },
      },
    });

    const activationRate =
      totalUsers > 0
        ? ((activatedUsers.length / totalUsers) * 100).toFixed(1)
        : '0';

    return {
      mrr,
      arr: mrr * 12,
      totalUsers,
      newUsers30d: newUsers,
      activationRate: `${activationRate}%`,
      activatedUsers: activatedUsers.length,
      deposits30d: walletDeposits._sum.amount ?? 0,
      depositCount30d: walletDeposits._count,
      payingUsers: paidSubs.length,
      arpu: paidSubs.length > 0 ? mrr / paidSubs.length : 0,
      activationFunnel: activationEvents.map((e) => ({
        event: e.event,
        count: e._count.event,
      })),
      plans: plans.map((p) => ({
        name: p.name,
        monthlyPrice: p.monthlyPrice,
        activeSubs: paidSubs.filter((s) => s.planId === p.id).length,
      })),
    };
  }

  private async maybeAwardPowerUser(userId: string) {
    const milestones = [
      ACTIVATION_EVENTS.ONBOARDING_COMPLETED,
      ACTIVATION_EVENTS.BROKER_CONNECTED,
      ACTIVATION_EVENTS.FIRST_PAPER_TRADE,
      ACTIVATION_EVENTS.FIRST_WALLET_DEPOSIT,
      ACTIVATION_EVENTS.FIRST_MARKETPLACE_SUB,
    ];

    const completed = await this.prisma.userActivationEvent.count({
      where: { userId, event: { in: milestones } },
    });
    if (completed < 4) return;

    const existing = await this.prisma.userActivationEvent.findUnique({
      where: {
        userId_event: { userId, event: ACTIVATION_EVENTS.POWER_USER },
      },
    });
    if (existing) return;

    await this.prisma.userActivationEvent.create({
      data: { userId, event: ACTIVATION_EVENTS.POWER_USER, metadata: {} },
    });

    const achievement = ACHIEVEMENT_MAP[ACTIVATION_EVENTS.POWER_USER];
    if (achievement) {
      await this.prisma.userAchievement.upsert({
        where: {
          userId_achievementKey: {
            userId,
            achievementKey: achievement.key,
          },
        },
        create: {
          userId,
          achievementKey: achievement.key,
          tier: achievement.tier,
          metadataJson: {},
        },
        update: {},
      });
      await this.createNotification(
        userId,
        `Achievement Unlocked: ${achievement.title}`,
        `You earned the ${achievement.title} badge. Keep building your edge.`,
        'SUCCESS',
        '/dashboard',
      );
    }
  }

  private async handleLifecycleSideEffects(
    userId: string,
    event: ActivationEventKey,
    user: { email: string; fullName: string } | null,
  ) {
    if (!user) return;
    const base = process.env.FRONTEND_URL || 'https://profytron.com';

    if (event === ACTIVATION_EVENTS.FIRST_PAPER_TRADE) {
      this.email
        .sendActivationCelebrationEmail(user.email, user.fullName, {
          title: 'Your first algo trade is live',
          body: 'Your paper copy trade executed successfully. Log in to see performance and explore more strategies.',
          ctaUrl: `${base}/dashboard`,
          ctaLabel: 'View Dashboard',
        })
        .catch(() => {});
    }

    if (event === ACTIVATION_EVENTS.BROKER_CONNECTED) {
      this.email
        .sendActivationCelebrationEmail(user.email, user.fullName, {
          title: 'Broker connected — you are ready to trade',
          body: 'Your account is linked. Browse the marketplace or deploy your first copy subscription.',
          ctaUrl: `${base}/marketplace`,
          ctaLabel: 'Browse Strategies',
        })
        .catch(() => {});
    }
  }

  private async createNotification(
    userId: string,
    title: string,
    body: string,
    type: NotificationType = 'INFO',
    actionUrl?: string,
  ) {
    await this.prisma.notification.create({
      data: { userId, title, body, type, actionUrl },
    });
  }
}
