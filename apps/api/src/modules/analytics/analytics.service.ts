import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../auth/redis.service';
import { WalletService } from '../wallet/wallet.service';
import { computeReturnPct } from '../../common/utils/account-performance.util';

type RangeKey = '1d' | '1w' | '1m' | '3m' | '1y' | 'all';

const TTL_ANALYTICS = 2 * 60;
const TTL_LEADERBOARD = 60;

interface ClosedTradeRow {
  id: string;
  userId: string;
  strategyId: string | null;
  symbol: string;
  direction: 'LONG' | 'SHORT';
  volume: number;
  openPrice: number;
  closePrice: number | null;
  stopLoss: number | null;
  takeProfit: number | null;
  profit: number | null;
  openedAt: Date;
  closedAt: Date | null;
  strategy?: { id: string; name: string } | null;
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    private prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly walletService: WalletService,
  ) {}

  private async getDefaultBrokerAccount(userId: string) {
    return this.prisma.brokerAccount.findFirst({
      where: { userId, isDefault: true, isActive: true },
      select: { id: true, initialEquity: true },
    });
  }

  private async getDefaultBrokerAccountId(
    userId: string,
  ): Promise<string | null> {
    const account = await this.getDefaultBrokerAccount(userId);
    return account?.id ?? null;
  }

  private async resolveEquityBase(userId: string): Promise<number> {
    const defaultAccount = await this.getDefaultBrokerAccount(userId);
    if (
      defaultAccount?.initialEquity != null &&
      defaultAccount.initialEquity > 0
    ) {
      return defaultAccount.initialEquity;
    }
    const wallet = await this.walletService.getBalance(userId);
    if (wallet.total > 0) return wallet.total;
    return 0;
  }

  private async latestSnapshotMeta(userId: string) {
    const accountId = await this.getDefaultBrokerAccountId(userId);
    if (!accountId) return { source: 'database' };
    const db = this.prisma as any;
    const latest = await db.accountLatestSnapshot.findUnique({
      where: { brokerAccountId: accountId },
      include: { snapshot: true },
    });
    const snapshot =
      latest?.snapshot ??
      (await db.accountSnapshot.findFirst({
        where: { brokerAccountId: accountId },
        orderBy: { capturedAt: 'desc' },
      }));
    if (!snapshot) return { source: 'database', brokerAccountId: accountId };
    return {
      source: 'database',
      brokerAccountId: accountId,
      liveBalance: snapshot.balance,
      liveEquity: snapshot.equity,
      liveMargin: snapshot.margin,
      liveFreeMargin: snapshot.freeMargin,
      liveCurrency: snapshot.currency,
      lastSyncedAt: snapshot.capturedAt,
      lastSuccessfulSync: snapshot.lastSuccessfulSync ?? snapshot.capturedAt,
      syncDuration: snapshot.syncDurationMs,
      syncStatus: snapshot.syncStatus,
      metaApiLatency: snapshot.metaApiLatencyMs,
      apiVersion: snapshot.apiVersion,
    };
  }

  private rangeStart(range: RangeKey): Date | null {
    const now = new Date();
    switch (range) {
      case '1d':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case '1w':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '1m':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case '3m':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      case '1y':
        return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      default:
        return null;
    }
  }

  private round(value: number, precision = 2): number {
    return Number(value.toFixed(precision));
  }

  private mean(values: number[]): number {
    if (!values.length) return 0;
    return values.reduce((sum, v) => sum + v, 0) / values.length;
  }

  private stdDev(values: number[]): number {
    if (values.length < 2) return 0;
    const avg = this.mean(values);
    const variance = this.mean(values.map((v) => (v - avg) ** 2));
    return Math.sqrt(variance);
  }

  private percentile(values: number[], p: number): number {
    if (!values.length) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const idx = Math.max(
      0,
      Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length)),
    );
    return sorted[idx] ?? 0;
  }

  private buildEquityCurve(trades: ClosedTradeRow[], baseEquity: number) {
    const buckets = new Map<string, number>();
    for (const trade of trades) {
      if (!trade.closedAt) continue;
      const key = trade.closedAt.toISOString().slice(0, 10);
      buckets.set(key, (buckets.get(key) ?? 0) + (trade.profit ?? 0));
    }

    const dates = [...buckets.keys()].sort();
    let equity = baseEquity;
    let peak = equity;

    return dates.map((date) => {
      equity += buckets.get(date) ?? 0;
      peak = Math.max(peak, equity);
      const drawdownPct = peak > 0 ? ((peak - equity) / peak) * 100 : 0;
      return {
        date,
        equity: this.round(equity),
        drawdownPct: this.round(drawdownPct),
      };
    });
  }

  private computeSharpe(values: number[]): number {
    if (!values.length) return 0;
    const avg = this.mean(values);
    const sd = this.stdDev(values);
    if (!sd) return 0;
    return (avg / sd) * Math.sqrt(252);
  }

  private computeSortino(values: number[]): number {
    if (!values.length) return 0;
    const avg = this.mean(values);
    const downside = values.filter((v) => v < 0);
    const downsideSd = this.stdDev(downside.length ? downside : [0]);
    if (!downsideSd) return 0;
    return (avg / downsideSd) * Math.sqrt(252);
  }

  private computeMaxConsecutiveLosses(values: number[]): number {
    let maxLosses = 0;
    let currentLosses = 0;
    for (const value of values) {
      if (value < 0) {
        currentLosses += 1;
        maxLosses = Math.max(maxLosses, currentLosses);
      } else {
        currentLosses = 0;
      }
    }
    return maxLosses;
  }

  private computeMaxConsecutiveWins(values: number[]): number {
    let maxWins = 0;
    let currentWins = 0;
    for (const value of values) {
      if (value > 0) {
        currentWins += 1;
        maxWins = Math.max(maxWins, currentWins);
      } else {
        currentWins = 0;
      }
    }
    return maxWins;
  }

  private dailyReturnPctSeries(
    curve: { equity: number }[],
  ): number[] {
    const returns: number[] = [];
    for (let i = 1; i < curve.length; i++) {
      const prev = curve[i - 1].equity;
      const cur = curve[i].equity;
      if (prev > 0) returns.push(((cur - prev) / prev) * 100);
    }
    return returns;
  }

  private downsideDeviation(values: number[]): number {
    const downside = values.filter((v) => v < 0).map((v) => v * v);
    if (!downside.length) return 0;
    return Math.sqrt(this.mean(downside));
  }

  /** UTC-hour session bands — a standard approximation, not exact exchange hours. */
  private sessionForHour(hour: number): 'Asia' | 'London' | 'New York' {
    if (hour >= 0 && hour < 8) return 'Asia';
    if (hour >= 8 && hour < 16) return 'London';
    return 'New York';
  }

  private getDurationBucket(hours: number): string {
    if (hours < 1) return '<1H';
    if (hours < 4) return '1-4H';
    if (hours < 8) return '4-8H';
    if (hours < 24) return '8-24H';
    if (hours < 72) return '1-3D';
    return '>3D';
  }

  private async getClosedTrades(
    userId: string,
    range: RangeKey,
  ): Promise<ClosedTradeRow[]> {
    const start = this.rangeStart(range);
    const defaultAccount = await this.getDefaultBrokerAccount(userId);
    return this.prisma.trade.findMany({
      where: {
        userId,
        status: 'CLOSED',
        closedAt: start ? { gte: start } : undefined,
        ...(defaultAccount?.id ? { brokerAccountId: defaultAccount.id } : {}),
      },
      orderBy: { closedAt: 'asc' },
      select: {
        id: true,
        userId: true,
        strategyId: true,
        symbol: true,
        direction: true,
        volume: true,
        openPrice: true,
        closePrice: true,
        stopLoss: true,
        takeProfit: true,
        profit: true,
        commission: true,
        swap: true,
        openedAt: true,
        closedAt: true,
        strategy: { select: { id: true, name: true } },
      },
    }) as unknown as Promise<ClosedTradeRow[]>;
  }

  async getPortfolioStats(userId: string, range: RangeKey = '1m') {
    const cacheKey = `analytics:portfolio:${userId}:${range}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      this.logger.debug(`Cache hit: portfolio stats ${userId}/${range}`);
      return JSON.parse(cached);
    }

    const [trades, baseEquity, snapshotMeta] = await Promise.all([
      this.getClosedTrades(userId, range),
      this.resolveEquityBase(userId),
      this.latestSnapshotMeta(userId),
    ]);

    if (trades.length === 0) {
      const start = this.rangeStart(range);
      const accountId = await this.getDefaultBrokerAccountId(userId);
      const snaps = accountId
        ? await this.prisma.equitySnapshot.findMany({
            where: {
              brokerAccountId: accountId,
              ...(start ? { capturedAt: { gte: start } } : {}),
            },
            orderBy: { capturedAt: 'asc' },
            select: { capturedAt: true, equity: true },
            take: 500,
          })
        : [];

      const liveEquity = Number(
        (snapshotMeta as any)?.liveEquity ??
          snaps[snaps.length - 1]?.equity ??
          baseEquity,
      );
      const equityCurve =
        snaps.length >= 1
          ? snaps.map((s) => ({
              date: s.capturedAt.toISOString(),
              equity: this.round(Number(s.equity)),
              drawdownPct: 0,
            }))
          : baseEquity > 0 && liveEquity > 0
            ? [
                {
                  date: (
                    start ?? new Date(Date.now() - 30 * 86400000)
                  ).toISOString(),
                  equity: this.round(baseEquity),
                  drawdownPct: 0,
                },
                {
                  date: new Date().toISOString(),
                  equity: this.round(liveEquity),
                  drawdownPct: 0,
                },
              ]
            : [];

      if (equityCurve.length === 1 && liveEquity > 0) {
        equityCurve.push({
          date: new Date().toISOString(),
          equity: this.round(liveEquity),
          drawdownPct: 0,
        });
      }

      const emptyStats = {
        range,
        totalProfit: this.round(liveEquity - baseEquity),
        totalReturnPct: computeReturnPct(liveEquity, baseEquity),
        winRate: 0,
        totalTrades: 0,
        sharpeRatio: 0,
        sortinoRatio: 0,
        profitFactor: 0,
        avgWin: 0,
        avgLoss: 0,
        maxDrawdown: 0,
        equityCurve,
        allTimeHigh: this.round(Math.max(baseEquity, liveEquity)),
        bestMonth: 0,
        equityBase: this.round(baseEquity),
        depositBase: this.round(baseEquity),
        ...snapshotMeta,
      };
      await this.redis.set(cacheKey, JSON.stringify(emptyStats), TTL_ANALYTICS);
      return emptyStats;
    }

    const pnlSeries = trades.map((t) => t.profit ?? 0);
    const gains = pnlSeries.filter((v) => v > 0);
    const losses = pnlSeries.filter((v) => v < 0);
    const totalProfit = pnlSeries.reduce((sum, v) => sum + v, 0);
    const winningTrades = gains.length;
    const winRate = (winningTrades / trades.length) * 100;
    const grossProfit = gains.reduce((sum, v) => sum + v, 0);
    const grossLossAbs = Math.abs(losses.reduce((sum, v) => sum + v, 0));
    const profitFactor =
      grossLossAbs > 0 ? grossProfit / grossLossAbs : grossProfit > 0 ? 99 : 0;
    const avgWin = gains.length ? this.mean(gains) : 0;
    const avgLoss = losses.length ? this.mean(losses) : 0;
    const sharpe = this.computeSharpe(pnlSeries);
    const sortino = this.computeSortino(pnlSeries);

    const equityCurve = this.buildEquityCurve(trades, baseEquity);
    const maxDrawdown = equityCurve.reduce(
      (max, point) => Math.max(max, point.drawdownPct),
      0,
    );
    const allTimeHigh = equityCurve.reduce(
      (max, point) => Math.max(max, point.equity),
      baseEquity,
    );

    const monthlyPnl = new Map<string, number>();
    for (const trade of trades) {
      if (!trade.closedAt) continue;
      const key = trade.closedAt.toISOString().slice(0, 7);
      monthlyPnl.set(key, (monthlyPnl.get(key) ?? 0) + (trade.profit ?? 0));
    }
    const bestMonth = [...monthlyPnl.values()].reduce(
      (max, pnl) => Math.max(max, pnl),
      0,
    );

    const currentEquity =
      equityCurve.length > 0
        ? equityCurve[equityCurve.length - 1].equity
        : baseEquity + totalProfit;

    const stats = {
      range,
      totalProfit: this.round(totalProfit),
      totalReturnPct: computeReturnPct(currentEquity, baseEquity),
      winRate: this.round(winRate),
      totalTrades: trades.length,
      sharpeRatio: this.round(sharpe),
      sortinoRatio: this.round(sortino),
      profitFactor: this.round(profitFactor),
      avgWin: this.round(avgWin),
      avgLoss: this.round(avgLoss),
      maxDrawdown: this.round(maxDrawdown),
      allTimeHigh: this.round(allTimeHigh),
      bestMonth: this.round(bestMonth),
      equityCurve,
      equityBase: this.round(baseEquity),
      depositBase: this.round(baseEquity),
      ...snapshotMeta,
    };

    await this.redis.set(cacheKey, JSON.stringify(stats), TTL_ANALYTICS);
    return stats;
  }

  async getMonthlyReturns(userId: string) {
    const [trades, baseEquity] = await Promise.all([
      this.getClosedTrades(userId, 'all'),
      this.resolveEquityBase(userId),
    ]);
    const monthly = new Map<string, number>();

    for (const trade of trades) {
      if (!trade.closedAt) continue;
      const month = trade.closedAt.toISOString().slice(0, 7);
      monthly.set(month, (monthly.get(month) ?? 0) + (trade.profit ?? 0));
    }

    const sortedMonths = [...monthly.keys()].sort();
    let rollingEquity = baseEquity;

    const months = sortedMonths.map((month) => {
      const pnl = monthly.get(month) ?? 0;
      const base = rollingEquity <= 0 ? 1 : rollingEquity;
      const returnPct = (pnl / base) * 100;
      rollingEquity += pnl;
      const [year, mon] = month.split('-');
      const date = new Date(`${month}-01T00:00:00.000Z`);
      return {
        month,
        year: Number(year),
        monthIndex: Number(mon),
        name: date.toLocaleString('en-US', { month: 'short' }),
        pnl: this.round(pnl),
        returnPct: this.round(returnPct),
      };
    });

    const byYear = new Map<
      number,
      Array<{ name: string; val: number; pnl: number }>
    >();
    for (const item of months) {
      if (!byYear.has(item.year)) {
        byYear.set(
          item.year,
          Array.from({ length: 12 }, (_, i) => ({
            name: new Date(Date.UTC(2024, i, 1)).toLocaleString('en-US', {
              month: 'short',
            }),
            val: 0,
            pnl: 0,
          })),
        );
      }
      const list = byYear.get(item.year)!;
      list[item.monthIndex - 1] = {
        name: item.name,
        val: item.returnPct,
        pnl: item.pnl,
      };
    }

    return {
      months,
      heatmap: [...byYear.entries()]
        .sort(([a], [b]) => a - b)
        .map(([year, yearMonths]) => ({
          year,
          months: yearMonths,
        })),
    };
  }

  async getStrategyComparison(userId: string, range: RangeKey = '3m') {
    const cacheKey = `analytics:strategy-comparison:${userId}:${range}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      this.logger.debug(`Cache hit: strategy comparison ${userId}/${range}`);
      return JSON.parse(cached);
    }

    const [trades, baseEquity] = await Promise.all([
      this.getClosedTrades(userId, range),
      this.resolveEquityBase(userId),
    ]);
    const groups = new Map<string, { name: string; pnl: number[] }>();

    for (const trade of trades) {
      const key = trade.strategyId ?? 'manual';
      const name = trade.strategy?.name ?? 'Manual Trades';
      if (!groups.has(key)) {
        groups.set(key, { name, pnl: [] });
      }
      groups.get(key)!.pnl.push(trade.profit ?? 0);
    }

    const strategies = [...groups.entries()].map(([id, item]) => {
      const pnl = item.pnl;
      const wins = pnl.filter((v) => v > 0);
      const total = pnl.reduce((s, v) => s + v, 0);
      const curve = this.buildEquityCurve(
        trades.filter((t) => (t.strategyId ?? 'manual') === id),
        baseEquity,
      );

      return {
        id,
        name: item.name,
        trades: pnl.length,
        winRate: this.round((wins.length / (pnl.length || 1)) * 100),
        netPnl: this.round(total),
        avgPnl: this.round(total / (pnl.length || 1)),
        sharpeRatio: this.round(this.computeSharpe(pnl)),
        maxDrawdown: this.round(
          curve.reduce((max, point) => Math.max(max, point.drawdownPct), 0),
        ),
      };
    });

    strategies.sort((a, b) => b.netPnl - a.netPnl);

    const comparison = {
      range,
      strategies,
      correlation: strategies.map((row) =>
        strategies.map((col) => {
          if (row.id === col.id) return 1;
          const rowSeries = groups.get(row.id)?.pnl ?? [];
          const colSeries = groups.get(col.id)?.pnl ?? [];
          const length = Math.min(rowSeries.length, colSeries.length);
          if (length < 3) return 0;
          const r = rowSeries.slice(0, length);
          const c = colSeries.slice(0, length);
          const rMean = this.mean(r);
          const cMean = this.mean(c);
          const numerator = r.reduce(
            (sum, v, idx) => sum + (v - rMean) * (c[idx] - cMean),
            0,
          );
          const denominator =
            Math.sqrt(r.reduce((sum, v) => sum + (v - rMean) ** 2, 0)) *
            Math.sqrt(c.reduce((sum, v) => sum + (v - cMean) ** 2, 0));
          return denominator ? this.round(numerator / denominator, 3) : 0;
        }),
      ),
    };

    await this.redis.set(cacheKey, JSON.stringify(comparison), TTL_ANALYTICS);
    return comparison;
  }

  async getRiskAnalytics(userId: string, range: RangeKey = '3m') {
    const cacheKey = `analytics:risk:${userId}:${range}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      this.logger.debug(`Cache hit: risk analytics ${userId}/${range}`);
      return JSON.parse(cached);
    }

    const [trades, baseEquity] = await Promise.all([
      this.getClosedTrades(userId, range),
      this.resolveEquityBase(userId),
    ]);
    const pnl = trades.map((t) => t.profit ?? 0);
    const curve = this.buildEquityCurve(trades, baseEquity);

    const heatmapByDayHour = new Map<string, number>();
    for (const trade of trades) {
      const day = trade.openedAt.getUTCDay();
      const hour = trade.openedAt.getUTCHours();
      const key = `${day}-${hour}`;
      heatmapByDayHour.set(
        key,
        (heatmapByDayHour.get(key) ?? 0) + (trade.profit ?? 0),
      );
    }

    const var95 = Math.abs(this.percentile(pnl, 5));

    const riskAnalytics = {
      range,
      var95: this.round(var95),
      maxConsecutiveLosses: this.computeMaxConsecutiveLosses(pnl),
      largestLoss: this.round(Math.min(0, ...pnl)),
      bestSingleWin: this.round(Math.max(0, ...pnl)),
      avgRiskReward: this.round(
        Math.abs(
          this.mean(pnl.filter((v) => v > 0)) /
            (this.mean(pnl.filter((v) => v < 0)) || -1),
        ),
      ),
      calmarRatio: this.round(
        this.mean(pnl) /
          ((curve.reduce((max, p) => Math.max(max, p.drawdownPct), 0) || 1) /
            100),
      ),
      drawdownCurve: curve.map((point, idx) => ({
        time: idx + 1,
        val: this.round(-point.drawdownPct),
      })),
      heatmap: [...heatmapByDayHour.entries()].map(([key, val]) => {
        const [day, hour] = key.split('-').map(Number);
        return {
          day,
          hour,
          value: this.round(val),
        };
      }),
    };

    await this.redis.set(
      cacheKey,
      JSON.stringify(riskAnalytics),
      TTL_ANALYTICS,
    );
    return riskAnalytics;
  }

  async getAdvancedMetrics(userId: string, range: RangeKey = '3m') {
    const cacheKey = `analytics:advanced:${userId}:${range}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      this.logger.debug(`Cache hit: advanced metrics ${userId}/${range}`);
      return JSON.parse(cached);
    }

    const [trades, baseEquity] = await Promise.all([
      this.getClosedTrades(userId, range),
      this.resolveEquityBase(userId),
    ]);
    const pnl = trades.map((t) => t.profit ?? 0);
    const wins = pnl.filter((v) => v > 0);
    const losses = pnl.filter((v) => v < 0);

    const curve = this.buildEquityCurve(trades, baseEquity);
    const dailyReturns = this.dailyReturnPctSeries(curve);
    const meanDaily = this.mean(dailyReturns);
    const stdDaily = this.stdDev(dailyReturns);
    const downsideDaily = this.downsideDeviation(dailyReturns);
    const annualizer = Math.sqrt(252);

    const holdingHours = trades
      .filter((t) => t.closedAt)
      .map(
        (t) =>
          (t.closedAt!.getTime() - t.openedAt.getTime()) / (1000 * 60 * 60),
      );

    const rMultiples = trades
      .filter((t) => t.stopLoss != null && t.profit != null)
      .map((t) => {
        const riskPerUnit = Math.abs(t.openPrice - (t.stopLoss as number));
        const risk = riskPerUnit * t.volume;
        return risk > 0 ? (t.profit as number) / risk : null;
      })
      .filter((v): v is number => v != null);

    const sessionMap = new Map<
      string,
      { pnl: number; wins: number; trades: number }
    >();
    for (const trade of trades) {
      const session = this.sessionForHour(trade.openedAt.getUTCHours());
      const row = sessionMap.get(session) ?? { pnl: 0, wins: 0, trades: 0 };
      row.pnl += trade.profit ?? 0;
      row.trades += 1;
      if ((trade.profit ?? 0) > 0) row.wins += 1;
      sessionMap.set(session, row);
    }
    const sessionPerformance = ['Asia', 'London', 'New York'].map((name) => {
      const row = sessionMap.get(name) ?? { pnl: 0, wins: 0, trades: 0 };
      return {
        session: name,
        pnl: this.round(row.pnl),
        trades: row.trades,
        winRatePct: row.trades > 0 ? this.round((row.wins / row.trades) * 100) : 0,
      };
    });

    const dowMap = new Map<number, { pnl: number; trades: number }>();
    for (const trade of trades) {
      const dow = trade.openedAt.getUTCDay();
      const row = dowMap.get(dow) ?? { pnl: 0, trades: 0 };
      row.pnl += trade.profit ?? 0;
      row.trades += 1;
      dowMap.set(dow, row);
    }
    const dayOfWeekPerformance = [
      'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
    ].map((name, idx) => {
      const row = dowMap.get(idx) ?? { pnl: 0, trades: 0 };
      return { day: name, pnl: this.round(row.pnl), trades: row.trades };
    });

    const advancedMetrics = {
      range,
      sharpeRatio: this.round(
        stdDaily > 0 ? (meanDaily / stdDaily) * annualizer : 0,
      ),
      sortinoRatio: this.round(
        downsideDaily > 0 ? (meanDaily / downsideDaily) * annualizer : 0,
      ),
      maxConsecutiveWins: this.computeMaxConsecutiveWins(pnl),
      maxConsecutiveLosses: this.computeMaxConsecutiveLosses(pnl),
      avgWin: this.round(this.mean(wins)),
      avgLoss: this.round(this.mean(losses)),
      largestWin: this.round(wins.length ? Math.max(...wins) : 0),
      largestLoss: this.round(losses.length ? Math.min(...losses) : 0),
      avgHoldingTimeHours: this.round(this.mean(holdingHours)),
      avgRMultiple: this.round(this.mean(rMultiples), 2),
      rMultipleSampleSize: rMultiples.length,
      sessionPerformance,
      dayOfWeekPerformance,
      sampleSize: trades.length,
    };

    await this.redis.set(
      cacheKey,
      JSON.stringify(advancedMetrics),
      TTL_ANALYTICS,
    );
    return advancedMetrics;
  }

  async getTradeAnalytics(userId: string, range: RangeKey = '3m') {
    const cacheKey = `analytics:trades:${userId}:${range}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      this.logger.debug(`Cache hit: trade analytics ${userId}/${range}`);
      return JSON.parse(cached);
    }

    const trades = await this.getClosedTrades(userId, range);
    const pnl = trades.map((t) => t.profit ?? 0);

    const distribution = [
      { range: '< -5k', min: Number.NEGATIVE_INFINITY, max: -5000, count: 0 },
      { range: '-5k to -2k', min: -5000, max: -2000, count: 0 },
      { range: '-2k to 0', min: -2000, max: 0, count: 0 },
      { range: '0 to 2k', min: 0, max: 2000, count: 0 },
      { range: '2k to 5k', min: 2000, max: 5000, count: 0 },
      { range: '> 5k', min: 5000, max: Number.POSITIVE_INFINITY, count: 0 },
    ];

    for (const value of pnl) {
      const bucket = distribution.find(
        (item) => value >= item.min && value < item.max,
      );
      if (bucket) bucket.count += 1;
    }

    const durations = new Map<string, number>();
    for (const trade of trades) {
      if (!trade.closedAt) continue;
      const hours =
        (trade.closedAt.getTime() - trade.openedAt.getTime()) /
        (1000 * 60 * 60);
      const bucket = this.getDurationBucket(hours);
      durations.set(bucket, (durations.get(bucket) ?? 0) + 1);
    }

    const durationData = ['<1H', '1-4H', '4-8H', '8-24H', '1-3D', '>3D'].map(
      (bucket) => ({
        range: bucket,
        count: durations.get(bucket) ?? 0,
      }),
    );

    const bySymbol = new Map<string, { pnl: number; trades: number }>();
    for (const trade of trades) {
      const symbol = trade.symbol;
      const row = bySymbol.get(symbol) ?? { pnl: 0, trades: 0 };
      row.pnl += trade.profit ?? 0;
      row.trades += 1;
      bySymbol.set(symbol, row);
    }

    const symbolPerformance = [...bySymbol.entries()]
      .map(([symbol, row]) => ({
        symbol,
        pnl: this.round(row.pnl),
        trades: row.trades,
      }))
      .sort((a, b) => b.pnl - a.pnl)
      .slice(0, 12);

    const wins = pnl.filter((v) => v > 0).length;
    const losses = pnl.filter((v) => v <= 0).length;

    const tradeAnalytics = {
      range,
      distribution: distribution.map(({ range: label, count }) => ({
        range: label,
        count,
      })),
      duration: durationData,
      symbolPerformance,
      winLoss: [
        { name: 'Wins', value: wins },
        { name: 'Losses', value: losses },
      ],
    };

    await this.redis.set(
      cacheKey,
      JSON.stringify(tradeAnalytics),
      TTL_ANALYTICS,
    );
    return tradeAnalytics;
  }

  async getTradeExport(userId: string, range: RangeKey = '3m') {
    const cacheKey = `analytics:trade-export:${userId}:${range}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      this.logger.debug(`Cache hit: trade export ${userId}/${range}`);
      return JSON.parse(cached);
    }

    const start = this.rangeStart(range);
    const trades = await this.prisma.trade.findMany({
      where: {
        userId,
        openedAt: start ? { gte: start } : undefined,
      },
      orderBy: {
        openedAt: 'desc',
      },
      select: {
        id: true,
        symbol: true,
        direction: true,
        volume: true,
        openPrice: true,
        closePrice: true,
        requestedPrice: true,
        fillPrice: true,
        slippageBps: true,
        executionLatencyMs: true,
        executionMode: true,
        profit: true,
        commission: true,
        swap: true,
        status: true,
        openedAt: true,
        closedAt: true,
        strategy: { select: { name: true } },
      },
    });

    const result = {
      range,
      rows: trades.map((trade) => ({
        id: trade.id,
        symbol: trade.symbol,
        direction: trade.direction,
        volume: trade.volume,
        openPrice: trade.openPrice,
        closePrice: trade.closePrice,
        requestedPrice: trade.requestedPrice,
        fillPrice: trade.fillPrice,
        slippageBps: trade.slippageBps,
        executionLatencyMs: trade.executionLatencyMs,
        executionMode: trade.executionMode,
        profit: trade.profit,
        commission: trade.commission,
        swap: trade.swap,
        status: trade.status,
        strategyName: trade.strategy?.name ?? null,
        openedAt: trade.openedAt,
        closedAt: trade.closedAt,
      })),
    };

    await this.redis.set(cacheKey, JSON.stringify(result), TTL_ANALYTICS);
    return result;
  }

  async getExecutionMetrics(userId: string, range: RangeKey = '3m') {
    const cacheKey = `analytics:execution-metrics:${userId}:${range}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      this.logger.debug(`Cache hit: execution metrics ${userId}/${range}`);
      return JSON.parse(cached);
    }

    const start = this.rangeStart(range);
    const trades = await this.prisma.trade.findMany({
      where: {
        userId,
        openedAt: start ? { gte: start } : undefined,
      },
      orderBy: { openedAt: 'desc' },
      select: {
        executionLatencyMs: true,
        slippageBps: true,
        fillPrice: true,
        requestedPrice: true,
        openPrice: true,
        symbol: true,
        status: true,
        openedAt: true,
      },
    });

    const latencies = trades
      .map((trade) => trade.executionLatencyMs ?? 0)
      .filter((value) => value > 0);
    const slippages = trades.map((trade) => trade.slippageBps ?? 0);

    const result = {
      range,
      averageLatencyMs: this.round(this.mean(latencies)),
      p95LatencyMs: this.round(this.percentile(latencies, 95)),
      averageSlippageBps: this.round(this.mean(slippages), 4),
      maxSlippageBps: this.round(Math.max(0, ...slippages), 4),
      sampleSize: trades.length,
      recentExecutions: trades.slice(0, 12).map((trade) => ({
        symbol: trade.symbol,
        status: trade.status,
        openedAt: trade.openedAt,
        latencyMs: trade.executionLatencyMs,
        slippageBps: trade.slippageBps,
        requestedPrice: trade.requestedPrice,
        fillPrice: trade.fillPrice ?? trade.openPrice,
      })),
    };

    await this.redis.set(cacheKey, JSON.stringify(result), TTL_ANALYTICS);
    return result;
  }

  async getTaxReport(userId: string, year: number) {
    const start = new Date(Date.UTC(year, 0, 1));
    const end = new Date(Date.UTC(year + 1, 0, 1));

    const [trades, walletTransactions] = await Promise.all([
      this.prisma.trade.findMany({
        where: {
          userId,
          closedAt: {
            gte: start,
            lt: end,
          },
        },
        orderBy: { closedAt: 'desc' },
        select: {
          id: true,
          symbol: true,
          direction: true,
          profit: true,
          commission: true,
          swap: true,
          requestedPrice: true,
          fillPrice: true,
          slippageBps: true,
          executionLatencyMs: true,
          openedAt: true,
          closedAt: true,
        },
      }),
      this.prisma.walletTransaction.findMany({
        where: {
          userId,
          createdAt: {
            gte: start,
            lt: end,
          },
        },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          type: true,
          direction: true,
          amount: true,
          status: true,
          createdAt: true,
          description: true,
        },
      }),
    ]);

    const realizedPnl = trades.reduce(
      (sum, trade) => sum + (trade.profit ?? 0),
      0,
    );
    const totalCommissions = trades.reduce(
      (sum, trade) => sum + (trade.commission ?? 0),
      0,
    );
    const totalSwap = trades.reduce((sum, trade) => sum + (trade.swap ?? 0), 0);
    const netTradingResult = realizedPnl - totalCommissions - totalSwap;

    return {
      year,
      period: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
      summary: {
        closedTrades: trades.length,
        realizedPnl: this.round(realizedPnl),
        commissions: this.round(totalCommissions),
        swap: this.round(totalSwap),
        netTradingResult: this.round(netTradingResult),
        walletMovements: walletTransactions.length,
      },
      trades: trades.map((trade) => ({
        ...trade,
        profit: this.round(trade.profit ?? 0),
        commission: this.round(trade.commission ?? 0),
        swap: this.round(trade.swap ?? 0),
      })),
      walletTransactions,
    };
  }

  private async fetchMacroEvents(): Promise<any[]> {
    const cacheKey = 'analytics:macro-events';
    const TTL_MACRO = 60 * 60;

    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const apiKey = process.env.TWELVE_DATA_API_KEY;
    if (!apiKey) return [];

    try {
      const now = new Date();
      const from = now.toISOString().split('T')[0];
      const to = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

      const response = await axios.get(
        'https://api.twelvedata.com/economic_calendar',
        {
          params: {
            apikey: apiKey,
            start_date: from,
            end_date: to,
            importance: 'high,medium',
          },
          timeout: 8000,
        },
      );

      const events = (response.data?.result || [])
        .slice(0, 10)
        .map((e: any) => ({
          date: e.date,
          country: e.country,
          event: e.event,
          impact: e.importance,
          actual: e.actual ?? null,
          forecast: e.forecast ?? null,
          previous: e.previous ?? null,
          currency: e.currency ?? null,
        }));

      await this.redis.set(cacheKey, JSON.stringify(events), TTL_MACRO);
      return events;
    } catch (err: any) {
      this.logger.warn(`Failed to fetch economic calendar: ${err.message}`);
      return [];
    }
  }

  async getGlobalIntelligence() {
    const [regime, leaderboard, macroEvents] = await Promise.all([
      this.prisma.strategyPerformance.groupBy({
        by: ['strategyId'],
        _avg: { sharpeRatio: true, drawdown: true, winRate: true },
        _sum: { netPnl: true },
        orderBy: { _sum: { netPnl: 'desc' } },
        take: 6,
      }),
      this.getLeaderboard(5),
      this.fetchMacroEvents(),
    ]);

    return {
      marketRegime: {
        label:
          regime.length && (regime[0]?._avg.sharpeRatio ?? 0) > 1
            ? 'TRENDING'
            : 'RANGING',
        confidence: this.round(
          Math.min(
            99,
            Math.max(
              55,
              (regime[0]?._avg.winRate ?? 50) +
                (regime[0]?._avg.sharpeRatio ?? 0) * 15,
            ),
          ),
        ),
      },
      sectorRotation: regime.map((item) => ({
        strategyId: item.strategyId,
        netPnl: this.round(item._sum.netPnl ?? 0),
        sharpeRatio: this.round(item._avg.sharpeRatio ?? 0),
        drawdown: this.round(item._avg.drawdown ?? 0),
        winRate: this.round(item._avg.winRate ?? 0),
      })),
      macroEvents,
      leaderboard: leaderboard.rows,
    };
  }

  async getLeaderboard(limit = 10) {
    const cacheKey = `analytics:leaderboard:${limit}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      this.logger.debug(`Cache hit: leaderboard limit=${limit}`);
      return JSON.parse(cached);
    }

    const grouped = await this.prisma.trade.groupBy({
      by: ['userId'],
      where: { status: 'CLOSED' },
      _sum: { profit: true },
      _count: { id: true },
      orderBy: { _sum: { profit: 'desc' } },
      take: limit,
    });

    const userIds = grouped.map((row) => row.userId);
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, username: true, fullName: true, avatarUrl: true },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    const rows = grouped.map((row, idx) => {
      const user = userMap.get(row.userId);
      return {
        rank: idx + 1,
        userId: row.userId,
        username: user?.username ?? user?.fullName ?? `Trader-${idx + 1}`,
        avatarUrl: user?.avatarUrl ?? null,
        totalPnl: this.round(row._sum.profit ?? 0),
        totalTrades: row._count.id,
      };
    });

    const leaderboard = {
      rows,
      limit,
    };

    await this.redis.set(
      cacheKey,
      JSON.stringify(leaderboard),
      TTL_LEADERBOARD,
    );
    return leaderboard;
  }
}
