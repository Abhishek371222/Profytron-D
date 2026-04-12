import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getPortfolioStats(userId: string) {
    const trades = await this.prisma.trade.findMany({
      where: { userId, status: 'CLOSED' },
      orderBy: { closedAt: 'asc' },
    });

    if (trades.length === 0) {
      return {
        totalProfit: 0,
        winRate: 0,
        totalTrades: 0,
        sharpeRatio: 0,
        maxDrawdown: 0,
        equityCurve: [],
        monthlyReturns: {},
      };
    }

    let balance = 0;
    let maxBalance = 0;
    let maxDD = 0;
    const returns: number[] = [];

    const equityCurve = trades.map((t) => {
      const profit = t.profit || 0;
      balance += profit;
      returns.push(profit);
      
      if (balance > maxBalance) maxBalance = balance;
      const dd = maxBalance === 0 ? 0 : (maxBalance - balance) / maxBalance;
      if (dd > maxDD) maxDD = dd;

      return {
        date: t.closedAt,
        balance,
      };
    });

    const winningTrades = trades.filter((t) => (t.profit || 0) > 0).length;
    const winRate = (winningTrades / trades.length) * 100;

    // Simplified Sharpe Ratio (assuming risk-free 0 for demo)
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const stdDev = Math.sqrt(
      returns.map((x) => Math.pow(x - avgReturn, 2)).reduce((a, b) => a + b, 0) / returns.length,
    );
    const sharpe = stdDev === 0 ? 0 : (avgReturn / stdDev) * Math.sqrt(252); // Annualized

    // Monthly returns aggregation
    const monthlyReturns: Record<string, number> = {};
    trades.forEach((t) => {
      if (t.closedAt) {
        const month = t.closedAt.toISOString().slice(0, 7);
        monthlyReturns[month] = (monthlyReturns[month] || 0) + (t.profit || 0);
      }
    });

    return {
      totalProfit: balance,
      winRate: parseFloat(winRate.toFixed(2)),
      totalTrades: trades.length,
      sharpeRatio: parseFloat(sharpe.toFixed(2)),
      maxDrawdown: parseFloat((maxDD * 100).toFixed(2)),
      equityCurve,
      monthlyReturns,
    };
  }

  async getHeatmap(userId: string) {
    const trades = await this.prisma.trade.findMany({
      where: { userId },
      select: { openedAt: true, profit: true },
    });

    const heatmap: Record<string, number> = {};
    trades.forEach((t) => {
      const day = t.openedAt.getDay(); // 0-6
      const hour = t.openedAt.getHours(); // 0-23
      const key = `${day}-${hour}`;
      heatmap[key] = (heatmap[key] || 0) + (t.profit || 0);
    });

    return heatmap;
  }
}

