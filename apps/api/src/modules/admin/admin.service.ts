import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRole, VerificationStatus } from '@prisma/client';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(private prisma: PrismaService) {}

  async getSystemStats() {
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const [
      userCount,
      newUsers,
      strategyCount,
      tradeCount,
      revenueData,
      mrrData,
      pendingVerifications,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      this.prisma.strategy.count({ where: { deletedAt: null } }),
      this.prisma.trade.count(),
      this.prisma.walletTransaction.aggregate({
        _sum: { amount: true },
        where: { 
          type: 'TRADING_PNL',
          status: 'CONFIRMED'
        },
      }),
      this.prisma.walletTransaction.aggregate({
        _sum: { amount: true },
        where: {
          type: 'SUBSCRIPTION_PAYMENT',
          status: 'CONFIRMED',
          createdAt: { gte: thirtyDaysAgo }
        }
      }),
      this.prisma.strategy.count({
        where: { verificationStatus: VerificationStatus.PENDING },
      }),
    ]);

    const totalVolume = revenueData._sum.amount || 0;
    const mrr = mrrData._sum.amount || 0;

    return {
      kpis: {
        totalUsers: userCount,
        userGrowth: ((newUsers / (userCount || 1)) * 100).toFixed(1) + '%',
        totalStrategies: strategyCount,
        totalTrades: tradeCount,
        totalVolume,
        mrr: mrr.toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
        pendingVerifications,
      },

      systemHealth: 'OPTIMAL',
      activeServices: {
        api: 'UP',
        ai_engine: 'UP',
        backtest_engine: 'UP',
        redis: 'CONNECTED',
      },
      lastUpdated: new Date().toISOString(),
    };
  }

  async getAllUsers() {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        subscriptionTier: true,
        isActive: true,
        isSuspended: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });
  }

  async updateUserStatus(userId: string, isSuspended: boolean) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    return this.prisma.user.update({
      where: { id: userId },
      data: { isSuspended },
    });
  }

  async updateUserRole(userId: string, role: UserRole) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    return this.prisma.user.update({
      where: { id: userId },
      data: { role },
    });
  }

  async getVerificationQueue() {
    return this.prisma.strategy.findMany({
      where: { verificationStatus: VerificationStatus.PENDING },
      include: {
        creator: { select: { fullName: true, email: true } },
      },
    });
  }

  async handleVerification(strategyId: string, approve: boolean, notes?: string) {
    const status = approve ? VerificationStatus.VERIFIED : VerificationStatus.UNVERIFIED;
    
    return this.prisma.strategy.update({
      where: { id: strategyId },
      data: { 
        verificationStatus: status,
        isVerified: approve,
      },
    });
  }
}

