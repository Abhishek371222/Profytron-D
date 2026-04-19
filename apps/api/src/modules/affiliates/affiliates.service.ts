import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AffiliateTier } from '@prisma/client';

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

    const commission = amount * (affiliate.commissionRate || 0.3);

    await this.prisma.affiliate.update({
      where: { userId: affiliate.referrerId },
      data: {
        totalEarned: { increment: commission },
        conversionCount: { increment: 1 },
      },
    });

    await this.recalculateTier(affiliate.referrerId);
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
