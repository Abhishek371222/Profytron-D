import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AffiliateTier } from '@prisma/client';
import { randomUUID } from 'crypto';

@Injectable()
export class AffiliatesService {
  constructor(private prisma: PrismaService) {}

  async getAffiliateStats(userId: string) {
    const affiliate = await this.prisma.affiliate.findUnique({
      where: { userId },
      include: {
        user: { select: { referralCode: true } },
      },
    });

    if (!affiliate) {
      // Create affiliate record if not exists
      return this.prisma.affiliate.create({
        data: { userId },
        include: { user: { select: { referralCode: true } } },
      });
    }

    return affiliate;
  }

  async getAffiliateDashboard(userId: string) {
    const affiliate = await this.getAffiliateStats(userId);

    const conversionRate = affiliate.clickCount
      ? Number(
          ((affiliate.signupCount / affiliate.clickCount) * 100).toFixed(2),
        )
      : 0;

    return {
      referralCode: affiliate.user.referralCode,
      tier: affiliate.tier,
      commissionRate: affiliate.commissionRate,
      stats: {
        clicks: affiliate.clickCount,
        signups: affiliate.signupCount,
        conversions: affiliate.conversionCount,
        conversionRate,
        totalEarned: affiliate.totalEarned,
        totalPaid: affiliate.totalPaid,
        pendingPayout: Number(
          (affiliate.totalEarned - affiliate.totalPaid).toFixed(2),
        ),
      },
    };
  }

  async trackClick(referralCode: string) {
    const user = await this.prisma.user.findUnique({
      where: { referralCode },
      include: { affiliateRecord: true },
    });

    if (!user || !user.affiliateRecord) return { success: false };

    await this.prisma.affiliate.update({
      where: { userId: user.id },
      data: { clickCount: { increment: 1 } },
    });

    return { success: true };
  }

  async processReferral(newUserId: string, referralCode: string) {
    const referrer = await this.prisma.user.findUnique({
      where: { referralCode },
    });

    if (!referrer) return;

    await this.prisma.$transaction([
      this.prisma.affiliate.update({
        where: { userId: referrer.id },
        data: { signupCount: { increment: 1 } },
      }),
      this.prisma.affiliate.upsert({
        where: { userId: newUserId },
        create: {
          userId: newUserId,
          referrerId: referrer.id,
        },
        update: {
          referrerId: referrer.id,
        },
      }),
    ]);
  }

  async captureReferralCode(referralCode: string) {
    const user = await this.prisma.user.findUnique({
      where: { referralCode },
      select: { id: true },
    });

    if (!user) {
      return { valid: false };
    }

    await this.prisma.affiliate.upsert({
      where: { userId: user.id },
      create: { userId: user.id },
      update: { clickCount: { increment: 1 } },
    });

    return { valid: true };
  }

  async calculateCommission(userId: string, amount: number) {
    const affiliate = await this.prisma.affiliate.findUnique({
      where: { userId },
    });

    if (!affiliate || !affiliate.referrerId) return;

    const commission = Math.round(amount * (affiliate.commissionRate || 0.3) * 100) / 100;
    if (commission <= 0) return;

    const idempotencyKey = `commission_${userId}_${randomUUID()}`;

    await this.prisma.$transaction(async (tx) => {
      await tx.affiliate.update({
        where: { userId: affiliate.referrerId! },
        data: {
          totalEarned: { increment: commission },
          conversionCount: { increment: 1 },
        },
      });

      // Create auditable wallet credit for the commission
      const grouped = await tx.walletTransaction.groupBy({
        by: ['direction'],
        where: { userId: affiliate.referrerId!, status: 'CONFIRMED' },
        _sum: { amount: true },
      });
      const confirmedIn = grouped.find((e) => e.direction === 'IN')?._sum.amount ?? 0;
      const confirmedOut = grouped.find((e) => e.direction === 'OUT')?._sum.amount ?? 0;
      const currentBalance = confirmedIn - confirmedOut;

      await tx.walletTransaction.create({
        data: {
          userId: affiliate.referrerId!,
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
    });

    await this.recalculateTier(affiliate.referrerId);
  }

  async requestWithdrawal(userId: string, amount: number) {
    if (amount < 500) {
      throw new BadRequestException('Minimum withdrawal amount is ₹500');
    }

    const affiliate = await this.prisma.affiliate.findUnique({
      where: { userId },
    });

    if (!affiliate) {
      throw new NotFoundException('Affiliate record not found');
    }

    const pendingBalance = Number((affiliate.totalEarned - affiliate.totalPaid).toFixed(2));
    if (amount > pendingBalance) {
      throw new BadRequestException(
        `Insufficient affiliate balance. Available: ₹${pendingBalance.toFixed(2)}`,
      );
    }

    // Record withdrawal request as a pending wallet outflow
    const idempotencyKey = `aff_wd_${randomUUID()}`;
    const grouped = await this.prisma.walletTransaction.groupBy({
      by: ['direction'],
      where: { userId, status: 'CONFIRMED' },
      _sum: { amount: true },
    });
    const confirmedIn = grouped.find((e) => e.direction === 'IN')?._sum.amount ?? 0;
    const confirmedOut = grouped.find((e) => e.direction === 'OUT')?._sum.amount ?? 0;
    const currentBalance = confirmedIn - confirmedOut;

    const [tx] = await this.prisma.$transaction([
      this.prisma.walletTransaction.create({
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
      }),
      this.prisma.affiliate.update({
        where: { userId },
        data: { totalPaid: { increment: amount } },
      }),
    ]);

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
