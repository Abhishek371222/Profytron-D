import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../auth/redis.service';
import { Cron, CronExpression } from '@nestjs/schedule';

/** Cache TTL in seconds */
const TTL_RISK_SCORE = 2 * 60; // 2 minutes — score is derived from closed trades
const TTL_RISK_METRICS = 2 * 60; // 2 minutes — same reasoning

/** Fallback risk response returned when calculation fails */
const RISK_SCORE_FALLBACK = 0;
const RISK_METRICS_FALLBACK = {
  totalTrades: 0,
  totalPnl: 0,
  winRate: 0,
  avgWin: 0,
  avgLoss: 0,
  profitFactor: 0,
};

@Injectable()
export class AiRiskService {
  private readonly logger = new Logger(AiRiskService.name);

  constructor(
    private prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

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
      this.logger.warn(
        `Daily loss limit exceeded for user ${userId}, stopping trades`,
      );
      return true;
    }

    return false;
  }

  @Cron(CronExpression.EVERY_HOUR)
  async monitorRiskPolicies() {
    try {
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
    } catch (error) {
      this.logger.warn(
        `Risk policy monitor skipped: ${(error as Error).message}`,
      );
    }
  }

  async computeRiskScore(userId: string): Promise<number> {
    const cacheKey = `ai-risk:score:${userId}`;
    const cached = await this.redis.get(cacheKey);
    if (cached !== null) {
      this.logger.debug(`Cache hit: risk score for user ${userId}`);
      return Number(cached);
    }

    try {
      const trades = await this.prisma.trade.findMany({
        where: { userId, status: 'CLOSED' },
        orderBy: { closedAt: 'desc' },
        take: 100,
        select: { profit: true, closedAt: true },
      });

      if (trades.length === 0) {
        await this.redis.set(cacheKey, '0', TTL_RISK_SCORE);
        return RISK_SCORE_FALLBACK;
      }

      let score = 0;

      // Win rate component (max 30 pts)
      const wins = trades.filter((t) => (t.profit ?? 0) > 0).length;
      const winRate = (wins / trades.length) * 100;
      if (winRate < 30) score += 30;
      else if (winRate < 45) score += 20;
      else if (winRate < 55) score += 10;

      // Max drawdown component (max 30 pts)
      let peakBalance = 10000;
      let runningBalance = 10000;
      let maxDrawdown = 0;
      for (const t of [...trades].reverse()) {
        runningBalance += t.profit ?? 0;
        if (runningBalance > peakBalance) peakBalance = runningBalance;
        const dd =
          peakBalance > 0
            ? ((peakBalance - runningBalance) / peakBalance) * 100
            : 0;
        maxDrawdown = Math.max(maxDrawdown, dd);
      }
      if (maxDrawdown > 30) score += 30;
      else if (maxDrawdown > 15) score += 20;
      else if (maxDrawdown > 5) score += 10;

      // Consecutive loss streak at head of history (max 25 pts)
      let streak = 0;
      for (const t of trades) {
        if ((t.profit ?? 0) < 0) streak++;
        else break;
      }
      if (streak >= 5) score += 25;
      else if (streak >= 3) score += 15;
      else if (streak >= 2) score += 5;

      // Overtrading check (max 15 pts) — avg trades/day
      if (trades.length >= 10) {
        const oldest = trades[trades.length - 1].closedAt ?? new Date();
        const newest = trades[0].closedAt ?? new Date();
        const days = Math.max(
          1,
          (newest.getTime() - oldest.getTime()) / 86_400_000,
        );
        const tpd = trades.length / days;
        if (tpd > 20) score += 15;
        else if (tpd > 10) score += 8;
      }

      const finalScore = Math.min(100, score);
      await this.redis.set(cacheKey, String(finalScore), TTL_RISK_SCORE);
      return finalScore;
    } catch (err: unknown) {
      this.logger.error(
        `Risk score calculation failed for user ${userId}: ${err instanceof Error ? err.message : String(err)}`,
      );
      return RISK_SCORE_FALLBACK;
    }
  }

  async getRiskMetrics(userId: string) {
    const cacheKey = `ai-risk:metrics:${userId}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      this.logger.debug(`Cache hit: risk metrics for user ${userId}`);
      return JSON.parse(cached);
    }

    try {
      const trades = await this.prisma.trade.findMany({
        where: { userId, status: 'CLOSED' },
      });

      const totalPnl = trades.reduce((sum, t) => sum + (t.profit || 0), 0);
      const winningTrades = trades.filter((t) => (t.profit || 0) > 0);
      const winRate =
        trades.length > 0 ? (winningTrades.length / trades.length) * 100 : 0;
      const avgWin =
        winningTrades.length > 0
          ? winningTrades.reduce((sum, t) => sum + (t.profit || 0), 0) /
            winningTrades.length
          : 0;
      const avgLoss =
        trades.length - winningTrades.length > 0
          ? trades
              .filter((t) => (t.profit || 0) < 0)
              .reduce((sum, t) => sum + Math.abs(t.profit || 0), 0) /
            (trades.length - winningTrades.length)
          : 0;

      const metrics = {
        totalTrades: trades.length,
        totalPnl,
        winRate,
        avgWin,
        avgLoss,
        profitFactor: avgLoss > 0 ? avgWin / avgLoss : 0,
      };

      await this.redis.set(cacheKey, JSON.stringify(metrics), TTL_RISK_METRICS);
      return metrics;
    } catch (err: unknown) {
      this.logger.error(
        `Risk metrics calculation failed for user ${userId}: ${err instanceof Error ? err.message : String(err)}`,
      );
      return RISK_METRICS_FALLBACK;
    }
  }

  async getDashboardRisk(userId: string) {
    const policy = await this.getRiskPolicy(userId);
    const dailyCap = policy?.maxDailyLossUsd ?? 10_000;
    const maxDrawdownPct = policy?.maxDrawdownPct ?? 15;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [todaysClosed, openTrades, score] = await Promise.all([
      this.prisma.trade.findMany({
        where: { userId, status: 'CLOSED', closedAt: { gte: today } },
        select: { profit: true },
      }),
      this.prisma.trade.findMany({
        where: { userId, status: 'OPEN' },
        select: { profit: true },
      }),
      this.computeRiskScore(userId),
    ]);

    const dailyLoss = todaysClosed
      .filter((t) => (t.profit ?? 0) < 0)
      .reduce((sum, t) => sum + Math.abs(t.profit ?? 0), 0);

    const openUnrealized = openTrades.reduce((sum, t) => sum + (t.profit ?? 0), 0);
    const dailyUsed = Math.max(0, dailyLoss + Math.min(0, openUnrealized) * -1);

    let peakBalance = 10_000;
    let running = 10_000;
    let currentDrawdown = 0;
    const allTrades = await this.prisma.trade.findMany({
      where: { userId, status: { in: ['OPEN', 'CLOSED'] } },
      orderBy: { openedAt: 'asc' },
      select: { profit: true },
    });
    for (const t of allTrades) {
      running += t.profit ?? 0;
      if (running > peakBalance) peakBalance = running;
      const dd = peakBalance > 0 ? ((peakBalance - running) / peakBalance) * 100 : 0;
      currentDrawdown = Math.max(currentDrawdown, dd);
    }

    const limitPct = Math.min(
      100,
      Math.max(
        (dailyUsed / dailyCap) * 100,
        (currentDrawdown / maxDrawdownPct) * 100,
      ),
    );

    return {
      riskScore: score,
      limitPct: Number(limitPct.toFixed(1)),
      dailyLossUsed: Number(dailyUsed.toFixed(2)),
      dailyLossCap: dailyCap,
      drawdownPct: Number(currentDrawdown.toFixed(1)),
      maxDrawdownPct,
      openPositions: openTrades.length,
    };
  }
}
