import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getSystemStats() {
    const [userCount, strategyCount, tradeCount, totalVolume] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.strategy.count(),
      this.prisma.trade.count(),
      this.prisma.walletTransaction.aggregate({
        _sum: { amount: true },
        where: { type: 'TRADING_PNL' }
      })
    ]);

    return {
      users: userCount,
      strategies: strategyCount,
      totalTrades: tradeCount,
      volume: totalVolume._sum.amount || 0,
      systemHealth: 'HEALTHY',
      lastUpdate: new Date()
    };
  }

  async getAllUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        fullName: true,
        subscriptionTier: true,
        createdAt: true
      }
    });
  }
}
