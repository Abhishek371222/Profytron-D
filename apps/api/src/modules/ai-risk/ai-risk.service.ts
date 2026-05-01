import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class AiRiskService {
  private readonly logger = new Logger(AiRiskService.name);

  constructor(private prisma: PrismaService) {}

  async createRiskPolicy(userId: string, policy: any) {
    return this.prisma.aiRiskPolicy.upsert({
      where: { userId },
      create: { userId, ...policy },
      update: policy,
    });
  }

  async getRiskPolicy(userId: string) {
    return this.prisma.aiRiskPolicy.findUnique({ where: { userId } });
  }

  async checkDailyLossLimit(userId: string): Promise<boolean> {
    const policy = await this.getRiskPolicy(userId);
    if (!policy?.maxDailyLossUsd) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todaysTrades = await this.prisma.trade.findMany({
      where: {
        userId,
        status: 'CLOSED',
        closedAt: { gte: today },
      },
    });

    const totalLoss = todaysTrades
      .filter((t) => (t.profit || 0) < 0)
      .reduce((sum, t) => sum + Math.abs(t.profit || 0), 0);

    return totalLoss >= policy.maxDailyLossUsd;
  }

  async checkDrawdownLimit(userId: string): Promise<boolean> {
    const policy = await this.getRiskPolicy(userId);
    if (!policy?.maxDrawdownPct) return false;

    const trades = await this.prisma.trade.findMany({
      where: { userId, status: { in: ['OPEN', 'CLOSED'] } },
      orderBy: { openedAt: 'asc' },
    });

    let peakBalance = 0;
    let maxDrawdown = 0;

    for (const trade of trades) {
      const balance = (trade.profit || 0) + 10000;
      if (balance > peakBalance) {
        peakBalance = balance;
      }
      const drawdown = ((peakBalance - balance) / peakBalance) * 100;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    }

    return maxDrawdown >= policy.maxDrawdownPct;
  }

  async stopTradingIfNeeded(userId: string): Promise<boolean> {
    const policy = await this.getRiskPolicy(userId);
    if (!policy?.autoStopAfterLoss) return false;

    const exceeded = await this.checkDailyLossLimit(userId);
    if (exceeded) {
      this.logger.warn(`Daily loss limit exceeded for user ${userId}, stopping trades`);
      return true;
    }

    return false;
  }

  @Cron(CronExpression.EVERY_HOUR)
  async monitorRiskPolicies() {
    const policies = await this.prisma.aiRiskPolicy.findMany({
      where: {
        OR: [{ autoStopAfterLoss: true }, { maxDrawdownPct: { not: null } }],
      },
    });

    for (const policy of policies) {
      const shouldStop = await this.stopTradingIfNeeded(policy.userId);
      if (shouldStop) {
        await this.prisma.auditLog.create({
          data: {
            eventType: 'RISK_LIMIT_TRIGGERED',
            userId: policy.userId,
            detailsJson: { policyId: policy.id },
            triggeredBy: 'SYSTEM',
          },
        });
      }
    }
  }

  async getRiskMetrics(userId: string) {
    const trades = await this.prisma.trade.findMany({
      where: { userId, status: 'CLOSED' },
    });

    const totalPnl = trades.reduce((sum, t) => sum + (t.profit || 0), 0);
    const winningTrades = trades.filter((t) => (t.profit || 0) > 0);
    const winRate = trades.length > 0 ? (winningTrades.length / trades.length) * 100 : 0;
    const avgWin = winningTrades.length > 0 ? winningTrades.reduce((sum, t) => sum + (t.profit || 0), 0) / winningTrades.length : 0;
    const avgLoss = trades.length - winningTrades.length > 0 ? trades.filter((t) => (t.profit || 0) < 0).reduce((sum, t) => sum + Math.abs(t.profit || 0), 0) / (trades.length - winningTrades.length) : 0;

    return {
      totalTrades: trades.length,
      totalPnl,
      winRate,
      avgWin,
      avgLoss,
      profitFactor: avgLoss > 0 ? avgWin / avgLoss : 0,
    };
  }
}
