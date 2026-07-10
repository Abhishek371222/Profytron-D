import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { AffiliateFunnelEventType, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AffiliateTier } from '@prisma/client';
import { randomUUID } from 'crypto';
import {
  REFERRAL_DEPOSIT_BONUS_INR,
  REFERRAL_MIN_DEPOSIT_INR,
} from '../../common/constants/pricing.constants';

type FunnelEventInput = {
  referrerId: string;
  eventType: AffiliateFunnelEventType;
  refereeId?: string;
  amount?: number;
  sourceRef?: string;
};

@Injectable()
export class AffiliatesService {
  constructor(private prisma: PrismaService) {}

  private async recordFunnelEvent(
    tx: Prisma.TransactionClient | PrismaService,
    input: FunnelEventInput,
  ) {
    if (input.sourceRef) {
      const existing = await tx.affiliateFunnelEvent.findUnique({
        where: { sourceRef: input.sourceRef },
      });
      if (existing) return existing;
    }

    try {
      return await tx.affiliateFunnelEvent.create({
        data: {
          referrerId: input.referrerId,
          refereeId: input.refereeId,
          eventType: input.eventType,
          amount: input.amount ?? 0,
          sourceRef: input.sourceRef,
        },
      });
    } catch (error: any) {
      if (error?.code === 'P2002' && input.sourceRef) {
        return tx.affiliateFunnelEvent.findUnique({
          where: { sourceRef: input.sourceRef },
        });
      }
      throw error;
    }
  }

  private buildFunnelPulse(stats: {
    clicks: number;
    signups: number;
    conversions: number;
    totalEarned: number;
    totalPaid: number;
    pendingPayout: number;
  }) {
    const signupRate = stats.clicks
      ? Number(((stats.signups / stats.clicks) * 100).toFixed(2))
      : 0;
    const conversionRate = stats.signups
      ? Number(((stats.conversions / stats.signups) * 100).toFixed(2))
      : 0;
    const payoutRate = stats.totalEarned
      ? Number(((stats.totalPaid / stats.totalEarned) * 100).toFixed(2))
      : 0;

    return {
      clicks: stats.clicks,
      signups: stats.signups,
      conversions: stats.conversions,
      totalEarned: stats.totalEarned,
      totalPaid: stats.totalPaid,
      pendingPayout: stats.pendingPayout,
      signupRate,
      conversionRate,
      payoutRate,
    };
  }

  async getAffiliateStats(userId: string) {
    try {
      return await this.prisma.affiliate.upsert({
        where: { userId },
        create: { userId },
        update: {},
        include: {
          user: { select: { referralCode: true } },
        },
      }).then((record) => ({
        ...record,
        referralCode: record.user.referralCode,
      }));
    } catch (error: any) {
      // Concurrent first-load race: another request created the row first.
      if (error?.code === 'P2002') {
        const existing = await this.prisma.affiliate.findUnique({
          where: { userId },
          include: { user: { select: { referralCode: true } } },
        });
        if (existing) {
          return {
            ...existing,
            referralCode: existing.user.referralCode,
          };
        }
      }
      throw error;
    }
  }

  async getAffiliateDashboard(userId: string) {
    const affiliate = await this.getAffiliateStats(userId);

    const pendingPayout = Number(
      (affiliate.totalEarned - affiliate.totalPaid).toFixed(2),
    );

    const funnelPulse = this.buildFunnelPulse({
      clicks: affiliate.clickCount,
      signups: affiliate.signupCount,
      conversions: affiliate.conversionCount,
      totalEarned: affiliate.totalEarned,
      totalPaid: affiliate.totalPaid,
      pendingPayout,
    });

    return {
      referralCode: affiliate.user.referralCode,
      tier: affiliate.tier,
      commissionRate: affiliate.commissionRate,
      stats: {
        clicks: funnelPulse.clicks,
        signups: funnelPulse.signups,
        conversions: funnelPulse.conversions,
        conversionRate: funnelPulse.signupRate,
        totalEarned: funnelPulse.totalEarned,
        totalPaid: funnelPulse.totalPaid,
        pendingPayout: funnelPulse.pendingPayout,
        funnelPulse,
      },
    };
  }

  async trackClick(referralCode: string) {
    const user = await this.prisma.user.findUnique({
      where: { referralCode },
      include: { affiliateRecord: true },
    });

    if (!user || !user.affiliateRecord) return { success: false };

    await this.prisma.$transaction(async (tx) => {
      await tx.affiliate.update({
        where: { userId: user.id },
        data: { clickCount: { increment: 1 } },
      });
      await this.recordFunnelEvent(tx, {
        referrerId: user.id,
        eventType: 'CLICK',
        sourceRef: `click_${randomUUID()}`,
      });
    });

    return { success: true };
  }

  async processReferral(newUserId: string, referralCode: string) {
    const code = referralCode.trim();
    if (!code) return;

    const referrer = await this.prisma.user.findUnique({
      where: { referralCode: code },
    });

    if (!referrer || referrer.id === newUserId) return;

    await this.prisma.$transaction(async (tx) => {
      await tx.affiliate.upsert({
        where: { userId: referrer.id },
        create: { userId: referrer.id },
        update: {},
      });

      await tx.affiliate.update({
        where: { userId: referrer.id },
        data: { signupCount: { increment: 1 } },
      });

      await tx.affiliate.upsert({
        where: { userId: newUserId },
        create: {
          userId: newUserId,
          referrerId: referrer.id,
        },
        update: {
          referrerId: referrer.id,
        },
      });

      await this.recordFunnelEvent(tx, {
        referrerId: referrer.id,
        refereeId: newUserId,
        eventType: 'SIGNUP',
        sourceRef: `signup_${newUserId}`,
      });
    });
  }

  async processFirstDepositBonus(userId: string, amount: number) {
    if (amount < REFERRAL_MIN_DEPOSIT_INR) return;

    const affiliate = await this.prisma.affiliate.findUnique({
      where: { userId },
    });
    if (!affiliate?.referrerId) return;

    const existingBonus = await this.prisma.walletTransaction.findFirst({
      where: {
        userId,
        type: 'COMMISSION',
        reference: 'referral_first_deposit_bonus',
      },
    });
    if (existingBonus) return;

    const creditBoth = async (
      targetUserId: string,
      idempotencyKey: string,
      description: string,
      reference: string,
    ) => {
      const grouped = await this.prisma.walletTransaction.groupBy({
        by: ['direction'],
        where: { userId: targetUserId, status: 'CONFIRMED' },
        _sum: { amount: true },
      });
      const confirmedIn =
        grouped.find((e) => e.direction === 'IN')?._sum.amount ?? 0;
      const confirmedOut =
        grouped.find((e) => e.direction === 'OUT')?._sum.amount ?? 0;
      const balance = confirmedIn - confirmedOut;

      await this.prisma.walletTransaction.create({
        data: {
          userId: targetUserId,
          type: 'COMMISSION',
          direction: 'IN',
          amount: REFERRAL_DEPOSIT_BONUS_INR,
          status: 'CONFIRMED',
          balanceAfter: balance + REFERRAL_DEPOSIT_BONUS_INR,
          idempotencyKey,
          description,
          reference,
        },
      });
    };

    await creditBoth(
      userId,
      `ref_bonus_referee_${userId}`,
      'Referral welcome bonus — first deposit',
      'referral_first_deposit_bonus',
    );
    await creditBoth(
      affiliate.referrerId,
      `ref_bonus_referrer_${affiliate.referrerId}_${userId}`,
      'Referral reward — friend made first deposit',
      userId,
    );
  }

  async captureReferralCode(referralCode: string) {
    const user = await this.prisma.user.findUnique({
      where: { referralCode },
      select: { id: true },
    });

    if (!user) {
      return { valid: false };
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.affiliate.upsert({
        where: { userId: user.id },
        create: { userId: user.id, clickCount: 1 },
        update: { clickCount: { increment: 1 } },
      });

      await this.recordFunnelEvent(tx, {
        referrerId: user.id,
        eventType: 'CLICK',
        sourceRef: `click_${randomUUID()}`,
      });
    });

    return { valid: true };
  }

  async calculateCommission(userId: string, amount: number, sourceRef: string) {
    const affiliate = await this.prisma.affiliate.findUnique({
      where: { userId },
    });

    if (!affiliate || !affiliate.referrerId) return;

    const referrerAffiliate = await this.prisma.affiliate.findUnique({
      where: { userId: affiliate.referrerId },
    });
    const commissionRate = referrerAffiliate?.commissionRate ?? 0.3;

    const commission =
      Math.round(amount * commissionRate * 100) / 100;
    if (commission <= 0) return;

    const referrerId = affiliate.referrerId;
    const idempotencyKey = `commission_${referrerId}_${sourceRef}`;
    const conversionSourceRef = `conversion_${sourceRef}`;

    const existing = await this.prisma.walletTransaction.findUnique({
      where: { idempotencyKey },
    });
    if (existing) return;

    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`wallet:${referrerId}`}))`;

        const dup = await tx.walletTransaction.findUnique({
          where: { idempotencyKey },
        });
        if (dup) return;

        await tx.affiliate.update({
          where: { userId: referrerId },
          data: {
            totalEarned: { increment: commission },
            conversionCount: { increment: 1 },
          },
        });

        const grouped = await tx.walletTransaction.groupBy({
          by: ['direction'],
          where: { userId: referrerId, status: 'CONFIRMED' },
          _sum: { amount: true },
        });
        const confirmedIn =
          grouped.find((e) => e.direction === 'IN')?._sum.amount ?? 0;
        const confirmedOut =
          grouped.find((e) => e.direction === 'OUT')?._sum.amount ?? 0;
        const currentBalance = confirmedIn - confirmedOut;

        await tx.walletTransaction.create({
          data: {
            userId: referrerId,
            type: 'COMMISSION',
            direction: 'IN',
            amount: commission,
            status: 'CONFIRMED',
            balanceAfter: currentBalance + commission,
            idempotencyKey,
            description: `Affiliate commission from referral`,
            reference: userId,
          },
        });

        await this.recordFunnelEvent(tx, {
          referrerId,
          refereeId: userId,
          eventType: 'CONVERSION',
          amount: commission,
          sourceRef: conversionSourceRef,
        });
      });
    } catch (e: any) {
      if (e?.code === 'P2002') return;
      throw e;
    }

    await this.recalculateTier(referrerId);
  }

  private maskEmail(email: string) {
    const [local, domain] = email.split('@');
    if (!domain) return '***';
    const visible = local.slice(0, Math.min(2, local.length));
    return `${visible}***@${domain}`;
  }

  async getReferrals(referrerUserId: string) {
    const referred = await this.prisma.affiliate.findMany({
      where: { referrerId: referrerUserId },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            createdAt: true,
            subscriptionTier: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!referred.length) {
      return { total: 0, referrals: [] };
    }

    const refereeIds = referred.map((row) => row.userId);
    const conversions = await this.prisma.affiliateFunnelEvent.findMany({
      where: {
        referrerId: referrerUserId,
        refereeId: { in: refereeIds },
        eventType: 'CONVERSION',
      },
      select: { refereeId: true },
    });
    const convertedSet = new Set(
      conversions.map((event) => event.refereeId).filter(Boolean) as string[],
    );

    return {
      total: referred.length,
      referrals: referred.map((row) => ({
        userId: row.userId,
        fullName: row.user.fullName,
        emailMasked: this.maskEmail(row.user.email),
        joinedAt: row.createdAt.toISOString(),
        plan: row.user.subscriptionTier,
        converted: convertedSet.has(row.userId),
      })),
    };
  }

  private buildActivityBuckets(
    range: 'today' | 'week' | 'month' | 'year' | 'total',
    now = new Date(),
  ) {
    const buckets: { label: string; start: Date; end: Date }[] = [];

    if (range === 'today') {
      const dayStart = new Date(now);
      dayStart.setHours(0, 0, 0, 0);
      for (let hour = 0; hour < 24; hour++) {
        const start = new Date(dayStart);
        start.setHours(hour);
        const end = new Date(dayStart);
        end.setHours(hour + 1);
        const normalized = hour % 24;
        const label =
          normalized === 0
            ? '12 AM'
            : normalized < 12
              ? `${normalized} AM`
              : normalized === 12
                ? '12 PM'
                : `${normalized - 12} PM`;
        buckets.push({ label, start, end });
      }
      return buckets;
    }

    if (range === 'week') {
      const start = new Date(now);
      const weekday = start.getDay();
      const mondayOffset = weekday === 0 ? -6 : 1 - weekday;
      start.setHours(0, 0, 0, 0);
      start.setDate(start.getDate() + mondayOffset);
      for (let index = 0; index < 7; index++) {
        const bucketStart = new Date(start);
        bucketStart.setDate(start.getDate() + index);
        const bucketEnd = new Date(bucketStart);
        bucketEnd.setDate(bucketStart.getDate() + 1);
        buckets.push({
          label: bucketStart.toLocaleDateString('en-US', { weekday: 'short' }),
          start: bucketStart,
          end: bucketEnd,
        });
      }
      return buckets;
    }

    if (range === 'month') {
      const year = now.getFullYear();
      const month = now.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const weekCount = Math.ceil(daysInMonth / 7);
      for (let index = 0; index < weekCount; index++) {
        const bucketStart = new Date(year, month, index * 7 + 1);
        const bucketEnd = new Date(year, month, Math.min((index + 1) * 7 + 1, daysInMonth + 1));
        buckets.push({
          label: `Week ${index + 1}`,
          start: bucketStart,
          end: bucketEnd,
        });
      }
      return buckets;
    }

    if (range === 'year') {
      const year = now.getFullYear();
      for (let month = 0; month <= now.getMonth(); month++) {
        const start = new Date(year, month, 1);
        const end = new Date(year, month + 1, 1);
        buckets.push({
          label: start.toLocaleDateString('en-US', { month: 'short' }),
          start,
          end,
        });
      }
      return buckets;
    }

    for (let index = 11; index >= 0; index--) {
      const start = new Date(now.getFullYear(), now.getMonth() - index, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - index + 1, 1);
      buckets.push({
        label: start.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        start,
        end,
      });
    }
    return buckets;
  }

  async getActivityChart(
    referrerUserId: string,
    rangeInput?: string,
  ) {
    const range = (
      ['today', 'week', 'month', 'year', 'total'].includes(rangeInput ?? '')
        ? rangeInput
        : 'week'
    ) as 'today' | 'week' | 'month' | 'year' | 'total';

    const now = new Date();
    const buckets = this.buildActivityBuckets(range, now);
    const from = buckets[0]?.start ?? new Date(0);

    const events = await this.prisma.affiliateFunnelEvent.findMany({
      where: {
        referrerId: referrerUserId,
        createdAt: { gte: from, lte: now },
      },
      select: { eventType: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    const points = buckets.map((bucket) => ({
      label: bucket.label,
      clicks: 0,
      signups: 0,
      conversions: 0,
    }));

    for (const event of events) {
      const bucketIndex = buckets.findIndex(
        (bucket) => event.createdAt >= bucket.start && event.createdAt < bucket.end,
      );
      if (bucketIndex < 0) continue;
      if (event.eventType === 'CLICK') points[bucketIndex].clicks += 1;
      if (event.eventType === 'SIGNUP') points[bucketIndex].signups += 1;
      if (event.eventType === 'CONVERSION') points[bucketIndex].conversions += 1;
    }

    return { range, points };
  }

  async requestWithdrawal(userId: string, amount: number) {
    if (amount < 500) {
      throw new BadRequestException('Minimum withdrawal amount is ₹500');
    }

    const idempotencyKey = `aff_wd_${randomUUID()}`;

    const tx = await this.prisma.$transaction(async (prisma) => {
      await prisma.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`wallet:${userId}`}))`;

      const affiliate = await prisma.affiliate.findUnique({
        where: { userId },
      });

      if (!affiliate) {
        throw new NotFoundException('Affiliate record not found');
      }

      const pendingBalance = Number(
        (affiliate.totalEarned - affiliate.totalPaid).toFixed(2),
      );
      if (amount > pendingBalance) {
        throw new BadRequestException(
          `Insufficient affiliate balance. Available: ₹${pendingBalance.toFixed(2)}`,
        );
      }

      const grouped = await prisma.walletTransaction.groupBy({
        by: ['direction'],
        where: { userId, status: 'CONFIRMED' },
        _sum: { amount: true },
      });
      const confirmedIn =
        grouped.find((e) => e.direction === 'IN')?._sum.amount ?? 0;
      const confirmedOut =
        grouped.find((e) => e.direction === 'OUT')?._sum.amount ?? 0;
      const currentBalance = confirmedIn - confirmedOut;

      await prisma.affiliate.update({
        where: { userId },
        data: { totalPaid: { increment: amount } },
      });

      const walletTx = await prisma.walletTransaction.create({
        data: {
          userId,
          type: 'WITHDRAWAL',
          direction: 'OUT',
          amount,
          status: 'PENDING',
          balanceAfter: currentBalance - amount,
          idempotencyKey,
          description: 'Affiliate payout withdrawal request',
        },
      });

      await this.recordFunnelEvent(prisma, {
        referrerId: userId,
        eventType: 'PAYOUT',
        amount,
        sourceRef: `payout_${walletTx.id}`,
      });

      return walletTx;
    });

    return {
      transactionId: tx.id,
      amount,
      status: 'PENDING',
      estimatedArrival: '2-3 business days',
    };
  }

  async recalculateTier(userId: string) {
    const affiliate = await this.prisma.affiliate.findUnique({
      where: { userId },
    });

    if (!affiliate) return;

    let nextTier: AffiliateTier = 'STARTER';
    if (affiliate.totalEarned >= 10000) {
      nextTier = 'ELITE';
    } else if (affiliate.totalEarned >= 2500) {
      nextTier = 'PRO';
    }

    if (affiliate.tier !== nextTier) {
      await this.prisma.affiliate.update({
        where: { userId },
        data: {
          tier: nextTier,
          commissionRate:
            nextTier === 'ELITE' ? 0.4 : nextTier === 'PRO' ? 0.35 : 0.3,
        },
      });
    }
  }
}
