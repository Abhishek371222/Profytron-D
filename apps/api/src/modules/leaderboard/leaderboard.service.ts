import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../auth/redis.service';

const LEADERBOARD_TTL = 300;
export const STRATEGY_BASE_EQUITY = 100_000;
const STRATEGIES_CACHE_PREFIX = 'cache:leaderboard:strategies:v2:';

@Injectable()
export class LeaderboardService {
  private readonly logger = new Logger(LeaderboardService.name);

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  clampLimit(limit: number, fallback: number): number {
    const n = Number.isFinite(limit) ? Math.trunc(limit) : fallback;
    if (!Number.isFinite(n) || n < 1) return fallback;
    return Math.min(100, n);
  }

  async getMonthly(limit = 50): Promise<{ period: string; entries: any[] }> {
    const safeLimit = this.clampLimit(limit, 50);
    const period = this.currentMonthPeriod();
    return this.getPeriodLeaderboard(
      period,
      this.monthStart(),
      safeLimit,
      `cache:leaderboard:monthly:${safeLimit}`,
    );
  }

  async getAllTime(limit = 50): Promise<{ period: string; entries: any[] }> {
    const safeLimit = this.clampLimit(limit, 50);
    return this.getPeriodLeaderboard(
      'all',
      undefined,
      safeLimit,
      `cache:leaderboard:all:${safeLimit}`,
    );
  }

  async getTopStrategies(limit = 20) {
    const safeLimit = this.clampLimit(limit, 20);
    return this.redis.cached(
      `${STRATEGIES_CACHE_PREFIX}${safeLimit}`,
      LEADERBOARD_TTL,
      () => this.computeTopStrategies(safeLimit),
    );
  }

  async getUserRank(userId: string) {
    const [monthly, allTime] = await Promise.all([
      this.prisma.leaderboardEntry.findUnique({
        where: { userId_period: { userId, period: this.currentMonthPeriod() } },
      }),
      this.prisma.leaderboardEntry.findUnique({
        where: { userId_period: { userId, period: 'all' } },
      }),
    ]);
    return { monthly, allTime };
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async recalculate() {
    try {
      this.logger.log('Recalculating leaderboard rankings...');
      await this.recalculatePeriod(
        this.currentMonthPeriod(),
        this.monthStart(),
      );
      await this.recalculatePeriod('all', undefined);
      await Promise.all([
        this.redis.delPrefix('cache:leaderboard:monthly:'),
        this.redis.delPrefix('cache:leaderboard:all:'),
        this.redis.delPrefix(STRATEGIES_CACHE_PREFIX),
      ]);
      this.logger.log('Leaderboard rankings updated');
    } catch (error) {
      this.logger.warn(
        `Leaderboard recalculation skipped: ${(error as Error).message}`,
      );
    }
  }

  private async getPeriodLeaderboard(
    period: string,
    since: Date | undefined,
    limit: number,
    cacheKey: string,
  ): Promise<{ period: string; entries: any[] }> {
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    let entries = await this.findEntries(period, limit);

    if (!entries.length) {
      try {
        await this.recalculatePeriod(period, since);
        await this.redis.delPrefix(
          period === 'all'
            ? 'cache:leaderboard:all:'
            : 'cache:leaderboard:monthly:',
        );
      } catch (error) {
        this.logger.warn(
          `Leaderboard recalculation failed for period=${period}: ${(error as Error).message}`,
        );
      }
      entries = await this.findEntries(period, limit);
    }

    const result = { period, entries };
    await this.redis.set(cacheKey, JSON.stringify(result), LEADERBOARD_TTL);
    return result;
  }

  private async findEntries(period: string, limit: number) {
    return this.prisma.leaderboardEntry.findMany({
      where: { period },
      orderBy: { rank: 'asc' },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            username: true,
            avatarUrl: true,
            country: true,
          },
        },
      },
    });
  }

  profitRateFromNetPnl(netPnl: number): number {
    const rate = (netPnl / STRATEGY_BASE_EQUITY) * 100;
    if (!Number.isFinite(rate)) return 0;
    return Number(rate.toFixed(2));
  }

  private async computeTopStrategies(limit: number) {
    const strategies = await this.prisma.strategy.findMany({
      where: { isPublished: true, isVerified: true, deletedAt: null },
      include: {
        creator: {
          select: { id: true, fullName: true, username: true, avatarUrl: true },
        },
        performance: {
          orderBy: { date: 'desc' },
          take: 1,
        },
        _count: { select: { subscriptions: true } },
      },
    });

    const withoutPerfIds = strategies
      .filter((s) => !s.performance[0])
      .map((s) => s.id);

    const tradeNetByStrategy = new Map<string, number>();
    if (withoutPerfIds.length) {
      const trades = await this.prisma.trade.groupBy({
        by: ['strategyId'],
        where: {
          strategyId: { in: withoutPerfIds },
          status: 'CLOSED',
        },
        _sum: { profit: true },
        _count: { id: true },
      });
      for (const row of trades) {
        if (!row.strategyId || row._count.id === 0) continue;
        tradeNetByStrategy.set(row.strategyId, row._sum.profit ?? 0);
      }
    }

    const ranked = strategies.map((s) => {
      const latest = s.performance[0] ?? null;
      let netPnl: number | null = null;
      if (latest) {
        netPnl = latest.netPnl;
      } else if (tradeNetByStrategy.has(s.id)) {
        netPnl = tradeNetByStrategy.get(s.id)!;
      }

      const profitRate = netPnl != null ? this.profitRateFromNetPnl(netPnl) : 0;

      return {
        id: s.id,
        name: s.name,
        category: s.category,
        riskLevel: s.riskLevel,
        creator: s.creator,
        subscribers: s._count.subscriptions,
        latestPerformance: latest
          ? {
              winRate: latest.winRate,
              netPnl: latest.netPnl,
              sharpeRatio: latest.sharpeRatio,
              totalTrades: latest.totalTrades,
              winningTrades: latest.winningTrades,
            }
          : null,
        monthlyPrice: s.monthlyPrice,
        profitRate,
        _sortNetPnl: netPnl ?? 0,
      };
    });

    ranked.sort((a, b) => {
      if (b.profitRate !== a.profitRate) return b.profitRate - a.profitRate;
      if (b._sortNetPnl !== a._sortNetPnl) return b._sortNetPnl - a._sortNetPnl;
      if (b.subscribers !== a.subscribers) return b.subscribers - a.subscribers;
      const nameCmp = a.name.localeCompare(b.name);
      if (nameCmp !== 0) return nameCmp;
      return a.id.localeCompare(b.id);
    });

    return ranked.slice(0, limit).map(({ _sortNetPnl: _, ...rest }) => rest);
  }

  async recalculatePeriod(period: string, since: Date | undefined) {
    const where: any = { status: 'CLOSED' };
    if (since) where.closedAt = { gte: since };

    const raw = await this.prisma.trade.groupBy({
      by: ['userId'],
      where,
      _count: { id: true },
      _sum: { profit: true },
      _avg: { profit: true },
    });

    const userIds = raw.map((r) => r.userId);
    const wins =
      userIds.length === 0
        ? []
        : await this.prisma.trade.groupBy({
            by: ['userId'],
            where: { ...where, userId: { in: userIds }, profit: { gt: 0 } },
            _count: { id: true },
          });
    const winsMap = new Map(wins.map((w) => [w.userId, w._count.id]));

    const scored = raw
      .map((r) => {
        const total = r._count.id;
        const winCount = winsMap.get(r.userId) ?? 0;
        const winRate = total > 0 ? (winCount / total) * 100 : 0;
        const totalPnl = r._sum.profit ?? 0;
        const score = winRate * 0.4 + Math.min(totalPnl / 100, 60);
        return {
          userId: r.userId,
          winRate,
          totalPnl,
          totalTrades: total,
          score,
        };
      })
      .sort((a, b) => b.score - a.score);

    const now = new Date();
    await this.prisma.$transaction([
      this.prisma.leaderboardEntry.deleteMany({ where: { period } }),
      this.prisma.leaderboardEntry.createMany({
        data: scored.map((entry, idx) => ({
          userId: entry.userId,
          period,
          rank: idx + 1,
          winRate: entry.winRate,
          totalPnl: entry.totalPnl,
          totalTrades: entry.totalTrades,
          updatedAt: now,
        })),
      }),
    ]);
  }

  currentMonthPeriod(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }

  private monthStart(): Date {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  }
}
