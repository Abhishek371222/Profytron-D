import { Test, TestingModule } from '@nestjs/testing';
import {
  LeaderboardService,
  STRATEGY_BASE_EQUITY,
} from './leaderboard.service';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../auth/redis.service';

describe('LeaderboardService', () => {
  let service: LeaderboardService;
  let prisma: {
    leaderboardEntry: {
      findMany: jest.Mock;
      deleteMany: jest.Mock;
      createMany: jest.Mock;
      findUnique: jest.Mock;
    };
    trade: { groupBy: jest.Mock };
    strategy: { findMany: jest.Mock };
    $transaction: jest.Mock;
  };
  let redis: {
    get: jest.Mock;
    set: jest.Mock;
    del: jest.Mock;
    delPrefix: jest.Mock;
    cached: jest.Mock;
  };

  const userSelect = {
    id: 'u1',
    fullName: 'Alice',
    username: 'alice',
    avatarUrl: null,
    country: null,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    prisma = {
      leaderboardEntry: {
        findMany: jest.fn().mockResolvedValue([]),
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
        createMany: jest.fn().mockResolvedValue({ count: 0 }),
        findUnique: jest.fn(),
      },
      trade: {
        groupBy: jest.fn().mockResolvedValue([]),
      },
      strategy: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      $transaction: jest.fn(async (ops: unknown) => ops),
    };

    redis = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(undefined),
      del: jest.fn().mockResolvedValue(undefined),
      delPrefix: jest.fn().mockResolvedValue(undefined),
      cached: jest.fn(
        async (_key: string, _ttl: number, producer: () => Promise<unknown>) =>
          producer(),
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeaderboardService,
        { provide: PrismaService, useValue: prisma },
        { provide: RedisService, useValue: redis },
      ],
    }).compile();

    service = module.get(LeaderboardService);
  });

  describe('limit clamping', () => {
    it('normalizes invalid limits to the fallback within 1–100', () => {
      expect(service.clampLimit(Number.NaN, 50)).toBe(50);
      expect(service.clampLimit(0, 50)).toBe(50);
      expect(service.clampLimit(-5, 20)).toBe(20);
      expect(service.clampLimit(1000, 50)).toBe(100);
      expect(service.clampLimit(25, 50)).toBe(25);
    });
  });

  describe('Monthly / All Time', () => {
    it('returns cached Monthly data without querying the database', async () => {
      const cached = {
        period: '2099-01',
        entries: [{ id: 'e1', rank: 1, user: userSelect }],
      };
      redis.get.mockResolvedValue(JSON.stringify(cached));

      const result = await service.getMonthly(50);

      expect(result).toEqual(cached);
      expect(prisma.leaderboardEntry.findMany).not.toHaveBeenCalled();
      expect(prisma.trade.groupBy).not.toHaveBeenCalled();
    });

    it('returns cached All Time data without querying the database', async () => {
      const cached = {
        period: 'all',
        entries: [{ id: 'e2', rank: 1, user: userSelect }],
      };
      redis.get.mockResolvedValue(JSON.stringify(cached));

      const result = await service.getAllTime(50);

      expect(result).toEqual(cached);
      expect(prisma.leaderboardEntry.findMany).not.toHaveBeenCalled();
    });

    it('returns existing database entries without recalculation', async () => {
      const entries = [
        {
          id: 'e1',
          userId: 'u1',
          period: service.currentMonthPeriod(),
          rank: 1,
          winRate: 60,
          totalPnl: 100,
          totalTrades: 10,
          user: userSelect,
        },
      ];
      prisma.leaderboardEntry.findMany.mockResolvedValue(entries);

      const result = await service.getMonthly(50);

      expect(result.entries).toEqual(entries);
      expect(result.period).toBe(service.currentMonthPeriod());
      expect(prisma.trade.groupBy).not.toHaveBeenCalled();
      expect(prisma.$transaction).not.toHaveBeenCalled();
      expect(redis.set).toHaveBeenCalled();
    });

    it('triggers at most one Monthly recalculation when empty, then returns []', async () => {
      prisma.leaderboardEntry.findMany.mockResolvedValue([]);
      const recalculateSpy = jest
        .spyOn(service, 'recalculatePeriod')
        .mockResolvedValue(undefined as never);

      const result = await service.getMonthly(50);

      expect(recalculateSpy).toHaveBeenCalledTimes(1);
      expect(recalculateSpy).toHaveBeenCalledWith(
        service.currentMonthPeriod(),
        expect.any(Date),
      );
      expect(result).toEqual({
        period: service.currentMonthPeriod(),
        entries: [],
      });
      expect(prisma.leaderboardEntry.findMany).toHaveBeenCalledTimes(2);
    });

    it('triggers at most one All Time recalculation when empty, then returns []', async () => {
      prisma.leaderboardEntry.findMany.mockResolvedValue([]);
      const recalculateSpy = jest
        .spyOn(service, 'recalculatePeriod')
        .mockResolvedValue(undefined as never);

      const result = await service.getAllTime(50);

      expect(recalculateSpy).toHaveBeenCalledTimes(1);
      expect(recalculateSpy).toHaveBeenCalledWith('all', undefined);
      expect(result).toEqual({ period: 'all', entries: [] });
      expect(prisma.leaderboardEntry.findMany).toHaveBeenCalledTimes(2);
    });

    it('does not recurse when recalculation fails', async () => {
      prisma.leaderboardEntry.findMany.mockResolvedValue([]);
      const recalculateSpy = jest
        .spyOn(service, 'recalculatePeriod')
        .mockRejectedValue(new Error('db down'));

      const result = await service.getMonthly(10);

      expect(recalculateSpy).toHaveBeenCalledTimes(1);
      expect(result.entries).toEqual([]);
      expect(result.period).toBe(service.currentMonthPeriod());
    });

    it('uses the current-month period for Monthly', async () => {
      prisma.leaderboardEntry.findMany.mockResolvedValue([
        { id: 'e1', rank: 1, user: userSelect },
      ]);

      const result = await service.getMonthly(50);

      expect(result.period).toMatch(/^\d{4}-\d{2}$/);
      expect(result.period).toBe(service.currentMonthPeriod());
      expect(prisma.leaderboardEntry.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { period: service.currentMonthPeriod() },
        }),
      );
    });

    it('uses the all period for All Time', async () => {
      prisma.leaderboardEntry.findMany.mockResolvedValue([
        { id: 'e1', rank: 1, user: userSelect },
      ]);

      const result = await service.getAllTime(50);

      expect(result.period).toBe('all');
      expect(prisma.leaderboardEntry.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { period: 'all' } }),
      );
    });
  });

  describe('Top Strategies', () => {
    function strategyFixture(overrides: Record<string, unknown>) {
      return {
        id: 's-default',
        name: 'Default',
        category: 'FOREX',
        riskLevel: 'MEDIUM',
        monthlyPrice: 49,
        totalRevenue: 9999,
        creator: {
          id: 'c1',
          fullName: 'Creator',
          username: 'creator',
          avatarUrl: null,
        },
        performance: [],
        _count: { subscriptions: 1 },
        ...overrides,
      };
    }

    it('ranks by profitRate descending and applies limit after sorting', async () => {
      prisma.strategy.findMany.mockResolvedValue([
        strategyFixture({
          id: 'c',
          name: 'Gamma',
          totalRevenue: 100000,
          performance: [
            {
              winRate: 90,
              netPnl: -2500,
              sharpeRatio: 0.1,
              totalTrades: 10,
              winningTrades: 9,
              date: new Date('2026-01-01'),
            },
          ],
          _count: { subscriptions: 99 },
        }),
        strategyFixture({
          id: 'a',
          name: 'Alpha',
          totalRevenue: 10,
          performance: [
            {
              winRate: 40,
              netPnl: 18000,
              sharpeRatio: 1.2,
              totalTrades: 20,
              winningTrades: 8,
              date: new Date('2026-01-02'),
            },
          ],
          _count: { subscriptions: 2 },
        }),
        strategyFixture({
          id: 'b',
          name: 'Beta',
          totalRevenue: 50000,
          performance: [
            {
              winRate: 55,
              netPnl: 4000,
              sharpeRatio: 0.8,
              totalTrades: 15,
              winningTrades: 8,
              date: new Date('2026-01-03'),
            },
          ],
          _count: { subscriptions: 5 },
        }),
      ]);

      const result = await service.getTopStrategies(2);

      expect(prisma.strategy.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isPublished: true, isVerified: true, deletedAt: null },
        }),
      );
      const findArgs = prisma.strategy.findMany.mock.calls[0][0];
      expect(findArgs.take).toBeUndefined();
      expect(findArgs.orderBy).toBeUndefined();

      expect(result).toHaveLength(2);
      expect(result.map((s: { id: string }) => s.id)).toEqual(['a', 'b']);
      expect(result[0].profitRate).toBe(18);
      expect(result[1].profitRate).toBe(4);
      expect(result[0].profitRate).not.toBe(
        result[0].latestPerformance!.winRate,
      );
    });

    it('computes positive, zero, and negative profit rates from netPnl', () => {
      expect(service.profitRateFromNetPnl(18000)).toBe(18);
      expect(service.profitRateFromNetPnl(4000)).toBe(4);
      expect(service.profitRateFromNetPnl(-2500)).toBe(-2.5);
      expect(service.profitRateFromNetPnl(0)).toBe(0);
      expect(STRATEGY_BASE_EQUITY).toBe(100_000);
    });

    it('returns profitRate 0 when a strategy has no performance or trades', async () => {
      prisma.strategy.findMany.mockResolvedValue([
        strategyFixture({ id: 'empty', name: 'Empty', performance: [] }),
      ]);
      prisma.trade.groupBy.mockResolvedValue([]);

      const result = await service.getTopStrategies(10);

      expect(result).toHaveLength(1);
      expect(result[0].profitRate).toBe(0);
      expect(result[0].latestPerformance).toBeNull();
    });

    it('falls back to closed-trade profit when performance is missing', async () => {
      prisma.strategy.findMany.mockResolvedValue([
        strategyFixture({
          id: 'trade-only',
          name: 'Trade Only',
          performance: [],
        }),
      ]);
      prisma.trade.groupBy.mockResolvedValue([
        {
          strategyId: 'trade-only',
          _sum: { profit: 6250 },
          _count: { id: 3 },
        },
      ]);

      const result = await service.getTopStrategies(5);

      expect(result[0].profitRate).toBe(6.25);
    });

    it('uses deterministic tie-breakers', async () => {
      prisma.strategy.findMany.mockResolvedValue([
        strategyFixture({
          id: 'z',
          name: 'Zulu',
          performance: [
            {
              winRate: 50,
              netPnl: 5000,
              sharpeRatio: 1,
              totalTrades: 5,
              winningTrades: 2,
              date: new Date(),
            },
          ],
          _count: { subscriptions: 3 },
        }),
        strategyFixture({
          id: 'a',
          name: 'Alpha',
          performance: [
            {
              winRate: 50,
              netPnl: 5000,
              sharpeRatio: 1,
              totalTrades: 5,
              winningTrades: 2,
              date: new Date(),
            },
          ],
          _count: { subscriptions: 3 },
        }),
      ]);

      const result = await service.getTopStrategies(10);

      expect(result.map((s: { id: string }) => s.id)).toEqual(['a', 'z']);
    });

    it('only queries published, verified, non-deleted strategies', async () => {
      await service.getTopStrategies(10);
      expect(prisma.strategy.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isPublished: true, isVerified: true, deletedAt: null },
        }),
      );
    });

    it('uses the v2 strategies cache key so old Win Rate caches cannot supply the response', async () => {
      await service.getTopStrategies(20);
      expect(redis.cached).toHaveBeenCalledWith(
        'cache:leaderboard:strategies:v2:20',
        expect.any(Number),
        expect.any(Function),
      );
    });

    it('clamps oversized strategy limits before caching', async () => {
      await service.getTopStrategies(500);
      expect(redis.cached).toHaveBeenCalledWith(
        'cache:leaderboard:strategies:v2:100',
        expect.any(Number),
        expect.any(Function),
      );
    });
  });
});
