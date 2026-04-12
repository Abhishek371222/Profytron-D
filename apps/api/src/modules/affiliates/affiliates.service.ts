import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
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
          referrerId: referrer.id 
        },
        update: {
          referrerId: referrer.id
        }
      })
    ]);
  }

  async calculateCommission(userId: string, amount: number) {
    const affiliate = await this.prisma.affiliate.findUnique({
      where: { userId },
    });

    if (!affiliate || !affiliate.referrerId) return;

    const commission = amount * (affiliate.commissionRate || 0.30);

    await this.prisma.affiliate.update({
      where: { userId: affiliate.referrerId },
      data: { 
        totalEarned: { increment: commission },
        conversionCount: { increment: 1 }
      },
    });
  }
}
