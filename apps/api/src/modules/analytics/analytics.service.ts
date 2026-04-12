import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

type RangeKey = '1d' | '1w' | '1m' | '3m' | '1y' | 'all';

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
  constructor(private prisma: PrismaService) {}

  private readonly baseEquity = 100_000;

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
    const idx = Math.max(0, Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length)));
    return sorted[idx] ?? 0;
  }

  private buildEquityCurve(trades: ClosedTradeRow[]) {
    const buckets = new Map<string, number>();
    for (const trade of trades) {
      if (!trade.closedAt) continue;
      const key = trade.closedAt.toISOString().slice(0, 10);
      buckets.set(key, (buckets.get(key) ?? 0) + (trade.profit ?? 0));
    }

    const dates = [...buckets.keys()].sort();
    let equity = this.baseEquity;
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

  private getDurationBucket(hours: number): string {
    if (hours < 1) return '<1H';
    if (hours < 4) return '1-4H';
    if (hours < 8) return '4-8H';
    if (hours < 24) return '8-24H';
    if (hours < 72) return '1-3D';
    return '>3D';
  }

  private async getClosedTrades(userId: string, range: RangeKey): Promise<ClosedTradeRow[]> {
    const start = this.rangeStart(range);
    return this.prisma.trade.findMany({
      where: {
        userId,
        status: 'CLOSED',
        closedAt: start ? { gte: start } : undefined,
      },
      orderBy: { closedAt: 'asc' },
      include: {
        strategy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    }) as unknown as Promise<ClosedTradeRow[]>;
  }

  async getPortfolioStats(userId: string, range: RangeKey = '1m') {
    const trades = await this.getClosedTrades(userId, range);

    if (trades.length === 0) {
      return {
        range,
        totalProfit: 0,
        winRate: 0,
        totalTrades: 0,
        sharpeRatio: 0,
        sortinoRatio: 0,
        profitFactor: 0,
        avgWin: 0,
        avgLoss: 0,
        maxDrawdown: 0,
        equityCurve: [],
        allTimeHigh: this.baseEquity,
        bestMonth: 0,
      };
    }

    const pnlSeries = trades.map((t) => t.profit ?? 0);
    const gains = pnlSeries.filter((v) => v > 0);
    const losses = pnlSeries.filter((v) => v < 0);
    const totalProfit = pnlSeries.reduce((sum, v) => sum + v, 0);
    const winningTrades = gains.length;
    const winRate = (winningTrades / trades.length) * 100;
    const grossProfit = gains.reduce((sum, v) => sum + v, 0);
    const grossLossAbs = Math.abs(losses.reduce((sum, v) => sum + v, 0));
    const profitFactor = grossLossAbs > 0 ? grossProfit / grossLossAbs : grossProfit > 0 ? 99 : 0;
    const avgWin = gains.length ? this.mean(gains) : 0;
    const avgLoss = losses.length ? this.mean(losses) : 0;
    const sharpe = this.computeSharpe(pnlSeries);
    const sortino = this.computeSortino(pnlSeries);

    const equityCurve = this.buildEquityCurve(trades);
    const maxDrawdown = equityCurve.reduce((max, point) => Math.max(max, point.drawdownPct), 0);
    const allTimeHigh = equityCurve.reduce((max, point) => Math.max(max, point.equity), this.baseEquity);

    const monthlyPnl = new Map<string, number>();
    for (const trade of trades) {
      if (!trade.closedAt) continue;
      const key = trade.closedAt.toISOString().slice(0, 7);
      monthlyPnl.set(key, (monthlyPnl.get(key) ?? 0) + (trade.profit ?? 0));
    }
    const bestMonth = [...monthlyPnl.values()].reduce((max, pnl) => Math.max(max, pnl), 0);

    return {
      range,
      totalProfit: this.round(totalProfit),
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
    };
  }

  async getMonthlyReturns(userId: string) {
    const trades = await this.getClosedTrades(userId, 'all');
    const monthly = new Map<string, number>();

    for (const trade of trades) {
      if (!trade.closedAt) continue;
      const month = trade.closedAt.toISOString().slice(0, 7);
      monthly.set(month, (monthly.get(month) ?? 0) + (trade.profit ?? 0));
    }

    const sortedMonths = [...monthly.keys()].sort();
    let rollingEquity = this.baseEquity;

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

    const byYear = new Map<number, Array<{ name: string; val: number; pnl: number }>>();
    for (const item of months) {
      if (!byYear.has(item.year)) {
        byYear.set(item.year, Array.from({ length: 12 }, (_, i) => ({
          name: new Date(Date.UTC(2024, i, 1)).toLocaleString('en-US', { month: 'short' }),
          val: 0,
          pnl: 0,
        })));
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
    const trades = await this.getClosedTrades(userId, range);
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
      );

      return {
        id,
        name: item.name,
        trades: pnl.length,
        winRate: this.round((wins.length / (pnl.length || 1)) * 100),
        netPnl: this.round(total),
        avgPnl: this.round(total / (pnl.length || 1)),
        sharpeRatio: this.round(this.computeSharpe(pnl)),
        maxDrawdown: this.round(curve.reduce((max, point) => Math.max(max, point.drawdownPct), 0)),
      };
    });

    strategies.sort((a, b) => b.netPnl - a.netPnl);

    return {
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
          const numerator = r.reduce((sum, v, idx) => sum + (v - rMean) * (c[idx]! - cMean), 0);
          const denominator =
            Math.sqrt(r.reduce((sum, v) => sum + (v - rMean) ** 2, 0)) *
            Math.sqrt(c.reduce((sum, v) => sum + (v - cMean) ** 2, 0));
          return denominator ? this.round(numerator / denominator, 3) : 0;
        }),
      ),
    };
  }

  async getRiskAnalytics(userId: string, range: RangeKey = '3m') {
    const trades = await this.getClosedTrades(userId, range);
    const pnl = trades.map((t) => t.profit ?? 0);
    const curve = this.buildEquityCurve(trades);

    const heatmapByDayHour = new Map<string, number>();
    for (const trade of trades) {
      const day = trade.openedAt.getUTCDay();
      const hour = trade.openedAt.getUTCHours();
      const key = `${day}-${hour}`;
      heatmapByDayHour.set(key, (heatmapByDayHour.get(key) ?? 0) + (trade.profit ?? 0));
    }

    const var95 = Math.abs(this.percentile(pnl, 5));

    return {
      range,
      var95: this.round(var95),
      maxConsecutiveLosses: this.computeMaxConsecutiveLosses(pnl),
      largestLoss: this.round(Math.min(0, ...pnl)),
      bestSingleWin: this.round(Math.max(0, ...pnl)),
      avgRiskReward: this.round(
        Math.abs(this.mean(pnl.filter((v) => v > 0)) / (this.mean(pnl.filter((v) => v < 0)) || -1)),
      ),
      calmarRatio: this.round(
        this.mean(pnl) / ((curve.reduce((max, p) => Math.max(max, p.drawdownPct), 0) || 1) / 100),
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
  }

  async getTradeAnalytics(userId: string, range: RangeKey = '3m') {
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
      const bucket = distribution.find((item) => value >= item.min && value < item.max);
      if (bucket) bucket.count += 1;
    }

    const durations = new Map<string, number>();
    for (const trade of trades) {
      if (!trade.closedAt) continue;
      const hours = (trade.closedAt.getTime() - trade.openedAt.getTime()) / (1000 * 60 * 60);
      const bucket = this.getDurationBucket(hours);
      durations.set(bucket, (durations.get(bucket) ?? 0) + 1);
    }

    const durationData = ['<1H', '1-4H', '4-8H', '8-24H', '1-3D', '>3D'].map((bucket) => ({
      range: bucket,
      count: durations.get(bucket) ?? 0,
    }));

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

    return {
      range,
      distribution: distribution.map(({ range: label, count }) => ({ range: label, count })),
      duration: durationData,
      symbolPerformance,
      winLoss: [
        { name: 'Wins', value: wins },
        { name: 'Losses', value: losses },
      ],
    };
  }

  async getGlobalIntelligence() {
    const [regime, leaderboard] = await Promise.all([
      this.prisma.strategyPerformance.groupBy({
        by: ['strategyId'],
        _avg: { sharpeRatio: true, drawdown: true, winRate: true },
        _sum: { netPnl: true },
        orderBy: { _sum: { netPnl: 'desc' } },
        take: 6,
      }),
      this.getLeaderboard(5),
    ]);

    return {
      marketRegime: {
        label: regime.length && (regime[0]?._avg.sharpeRatio ?? 0) > 1 ? 'TRENDING' : 'RANGING',
        confidence: this.round(
          Math.min(
            99,
            Math.max(55, ((regime[0]?._avg.winRate ?? 50) + (regime[0]?._avg.sharpeRatio ?? 0) * 15)),
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
      macroEvents: [
        {
          event: 'Fed Open Market Operation',
          impact: 'CRITICAL',
          timestamp: new Date().toISOString(),
        },
        {
          event: 'US CPI Release',
          impact: 'HIGH',
          timestamp: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
        },
      ],
      leaderboard: leaderboard.rows,
    };
  }

  async getLeaderboard(limit = 10) {
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

    return {
      rows,
      limit,
    };
  }
}

