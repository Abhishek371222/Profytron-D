import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../auth/redis.service';

const LEADERBOARD_TTL = 300; // 5 minutes

@Injectable()
export class LeaderboardService {
  private readonly logger = new Logger(LeaderboardService.name);

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async getMonthly(limit = 50): Promise<{ period: string; entries: any[] }> {
    const cacheKey = `cache:leaderboard:monthly:${limit}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const period = this.currentMonthPeriod();
    const entries = await this.prisma.leaderboardEntry.findMany({
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

    if (!entries.length) {
      await this.recalculate();
      return this.getMonthly(limit);
    }

    const result = { period, entries };
    await this.redis.set(cacheKey, JSON.stringify(result), LEADERBOARD_TTL);
    return result;
  }

  async getAllTime(limit = 50): Promise<{ period: string; entries: any[] }> {
    const cacheKey = `cache:leaderboard:all:${limit}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const entries = await this.prisma.leaderboardEntry.findMany({
      where: { period: 'all' },
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

    if (!entries.length) {
      await this.recalculate();
      return this.getAllTime(limit);
    }

    const result = { period: 'all', entries };
    await this.redis.set(cacheKey, JSON.stringify(result), LEADERBOARD_TTL);
    return result;
  }

  async getTopStrategies(limit = 20) {
    return this.redis.cached(
      `cache:leaderboard:strategies:${limit}`,
      LEADERBOARD_TTL,
      () => this.computeTopStrategies(limit),
    );
  }

  private async computeTopStrategies(limit = 20) {
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
      orderBy: { totalRevenue: 'desc' },
      take: limit,
    });

    return strategies.map((s) => ({
      id: s.id,
      name: s.name,
      category: s.category,
      riskLevel: s.riskLevel,
      creator: s.creator,
      subscribers: s._count.subscriptions,
      latestPerformance: s.performance[0] ?? null,
      monthlyPrice: s.monthlyPrice,
    }));
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
        this.redis.del('cache:leaderboard:monthly:50'),
        this.redis.del('cache:leaderboard:all:50'),
      ]);
      this.logger.log('Leaderboard rankings updated');
    } catch (error) {
      this.logger.warn(
        `Leaderboard recalculation skipped: ${(error as Error).message}`,
      );
    }
  }

  private async recalculatePeriod(period: string, since: Date | undefined) {
    const where: any = { status: 'CLOSED' };
    if (since) where.closedAt = { gte: since };

    const raw = await this.prisma.trade.groupBy({
      by: ['userId'],
      where,
      _count: { id: true },
      _sum: { profit: true },
      _avg: { profit: true },
    });

    // Compute win rate per user
    const userIds = raw.map((r) => r.userId);
    const wins = await this.prisma.trade.groupBy({
      by: ['userId'],
      where: { ...where, userId: { in: userIds }, profit: { gt: 0 } },
      _count: { id: true },
    });
    const winsMap = new Map(wins.map((w) => [w.userId, w._count.id]));

    // Score and rank
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
    // Replace N individual upserts with 2 queries (delete + createMany) inside one transaction.
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

  private currentMonthPeriod(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }

  private monthStart(): Date {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  }
}
