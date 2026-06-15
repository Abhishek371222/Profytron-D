type PerformanceRow = {
  date: Date;
  winRate: number;
  drawdown: number;
  maxDrawdown: number;
  sharpeRatio: number;
  totalTrades: number;
  winningTrades: number;
  netPnl: number;
  equityCurve: unknown;
};

type TradeRow = {
  id: string;
  symbol: string;
  direction: string;
  volume: number;
  openPrice: number;
  closePrice: number | null;
  profit: number | null;
  openedAt: Date;
  closedAt: Date | null;
  status: string;
};

const BASE_EQUITY = 100_000;
const MONTH_LABELS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

function round(value: number, precision = 2): number {
  return Number(value.toFixed(precision));
}

function mean(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function stdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const avg = mean(values);
  return Math.sqrt(mean(values.map((v) => (v - avg) ** 2)));
}

function computeSharpe(values: number[]): number {
  if (!values.length) return 0;
  const sd = stdDev(values);
  if (!sd) return 0;
  return (mean(values) / sd) * Math.sqrt(252);
}

function formatDuration(ms: number): string {
  if (ms < 60 * 60 * 1000) return `${round(ms / (60 * 1000), 0)}m`;
  if (ms < 24 * 60 * 60 * 1000) return `${round(ms / (60 * 60 * 1000), 1)}h`;
  return `${round(ms / (24 * 60 * 60 * 1000), 1)}d`;
}

function dailyReturnsFromPerformance(performance: PerformanceRow[]): number[] {
  if (performance.length < 2) return [];
  const returns: number[] = [];
  for (let i = 1; i < performance.length; i++) {
    const prev = performance[i - 1].netPnl;
    const curr = performance[i].netPnl;
    const base = Math.abs(prev) > 1 ? prev : BASE_EQUITY;
    returns.push(((curr - prev) / base) * 100);
  }
  return returns;
}

function buildEquityBalanceCurve(
  performance: PerformanceRow[],
  floatingPnl: number,
) {
  if (!performance.length) return [];

  let peak = BASE_EQUITY;
  return performance.map((row) => {
    const balance = BASE_EQUITY + row.netPnl;
    peak = Math.max(peak, balance);
    const equity = balance + floatingPnl;
    const drawdownPct =
      peak > 0 ? round(((peak - balance) / peak) * 100) : 0;
    return {
      date: row.date.toISOString().slice(0, 10),
      balance: round(balance),
      equity: round(equity),
      drawdownPct,
    };
  });
}

function buildMonthlyHeatmap(performance: PerformanceRow[]) {
  const byMonth = new Map<string, number>();
  for (let i = 1; i < performance.length; i++) {
    const prev = performance[i - 1];
    const curr = performance[i];
    const key = curr.date.toISOString().slice(0, 7);
    byMonth.set(key, (byMonth.get(key) ?? 0) + (curr.netPnl - prev.netPnl));
  }

  const entries = [...byMonth.entries()].sort(([a], [b]) => a.localeCompare(b));
  let rollingEquity = BASE_EQUITY;
  const months = entries.map(([month, pnl]) => {
    const base = rollingEquity <= 0 ? BASE_EQUITY : rollingEquity;
    const returnPct = (pnl / base) * 100;
    rollingEquity += pnl;
    const [year, mon] = month.split('-');
    const date = new Date(`${month}-01T00:00:00.000Z`);
    return {
      month,
      year: Number(year),
      monthIndex: Number(mon),
      name: date.toLocaleString('en-US', { month: 'short' }),
      pnl: round(pnl),
      returnPct: round(returnPct),
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
        MONTH_LABELS.map((name) => ({ name, val: 0, pnl: 0 })),
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
      .map(([year, yearMonths]) => ({ year, months: yearMonths })),
  };
}

function buildSymbolDistribution(trades: TradeRow[]) {
  const counts = new Map<string, number>();
  for (const trade of trades) {
    counts.set(trade.symbol, (counts.get(trade.symbol) ?? 0) + 1);
  }
  const total = trades.length || 1;
  const palette = [
    '#6366f1',
    '#10b981',
    '#f59e0b',
    '#f43f5e',
    '#22d3ee',
    '#a78bfa',
    '#fb7185',
    '#34d399',
  ];
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([symbol, count], index) => ({
      symbol,
      count,
      pct: round((count / total) * 100),
      color: palette[index % palette.length],
    }));
}

function tradeMetrics(trades: TradeRow[]) {
  const closed = trades.filter((t) => t.status === 'CLOSED' && t.closedAt);
  const pnl = closed.map((t) => t.profit ?? 0);
  const gains = pnl.filter((v) => v > 0);
  const losses = pnl.filter((v) => v < 0);
  const grossProfit = gains.reduce((s, v) => s + v, 0);
  const grossLossAbs = Math.abs(losses.reduce((s, v) => s + v, 0));
  const profitFactor =
    grossLossAbs > 0
      ? grossProfit / grossLossAbs
      : grossProfit > 0
        ? 99
        : 0;
  const avgWin = gains.length ? mean(gains) : 0;
  const avgLoss = losses.length ? mean(losses) : 0;
  const winRate = closed.length
    ? (gains.length / closed.length) * 100
    : 0;
  const plRatio =
    avgLoss !== 0 ? Math.abs(avgWin / avgLoss) : avgWin > 0 ? 99 : 0;

  const durations = closed
    .map((t) => {
      if (!t.closedAt) return 0;
      return t.closedAt.getTime() - t.openedAt.getTime();
    })
    .filter((v) => v > 0);
  const avgDurationMs = durations.length ? mean(durations) : 0;

  const maxVolume = closed.reduce((max, t) => Math.max(max, t.volume), 0);

  return {
    closedCount: closed.length,
    totalProfit: pnl.reduce((s, v) => s + v, 0),
    winRate,
    profitFactor,
    avgWin,
    avgLoss,
    plRatio,
    avgDurationMs,
    avgDurationLabel: avgDurationMs ? formatDuration(avgDurationMs) : '—',
    sharpeFromTrades: computeSharpe(pnl),
    maxVolume,
    expectancy: closed.length ? mean(pnl) : 0,
  };
}

export function buildStrategyAnalytics(input: {
  performance: PerformanceRow[];
  trades: TradeRow[];
  openTrades: TradeRow[];
  configJson: Record<string, unknown>;
  biasCheckJson: Record<string, unknown> | null;
  isVerified: boolean;
  verificationStatus: string;
  masterBrokerAccountId: string | null;
  createdAt: Date;
}) {
  const performance = [...input.performance].sort(
    (a, b) => a.date.getTime() - b.date.getTime(),
  );
  const floatingPnl = input.openTrades.reduce(
    (sum, t) => sum + (t.profit ?? 0),
    0,
  );

  const latestPerf = performance[performance.length - 1];
  const firstPerf = performance[0];
  const tradeStats = tradeMetrics(input.trades);

  const totalReturnPct = latestPerf
    ? round((latestPerf.netPnl / BASE_EQUITY) * 100)
    : tradeStats.closedCount
      ? round((tradeStats.totalProfit / BASE_EQUITY) * 100)
      : 0;

  const monthCount = Math.max(
    1,
    performance.length > 1
      ? Math.ceil(
          (latestPerf!.date.getTime() - firstPerf!.date.getTime()) /
            (30 * 24 * 60 * 60 * 1000),
        )
      : 1,
  );
  const monthlyReturnPct = round(totalReturnPct / monthCount);

  const dailyReturns = dailyReturnsFromPerformance(performance);
  const maxDrawdownPct = latestPerf
    ? round(latestPerf.maxDrawdown)
    : tradeStats.closedCount
      ? round(
          buildEquityBalanceCurve(performance, floatingPnl).reduce(
            (max, p) => Math.max(max, p.drawdownPct),
            0,
          ),
        )
      : 0;

  const sharpeRatio = latestPerf
    ? round(latestPerf.sharpeRatio)
    : tradeStats.closedCount
      ? round(tradeStats.sharpeFromTrades)
      : dailyReturns.length
        ? round(computeSharpe(dailyReturns))
        : 0;

  const winRate = tradeStats.closedCount
    ? round(tradeStats.winRate)
    : latestPerf
      ? round(latestPerf.winRate)
      : 0;

  const profitFactor = tradeStats.closedCount
    ? round(tradeStats.profitFactor)
    : 0;

  const totalProfit = latestPerf
    ? latestPerf.netPnl
    : tradeStats.totalProfit;
  const recoveryFactor =
    maxDrawdownPct > 0
      ? round(totalProfit / ((maxDrawdownPct / 100) * BASE_EQUITY))
      : totalProfit > 0
        ? 99
        : 0;

  const config = input.configJson ?? {};
  const bias = input.biasCheckJson ?? {};
  const minFromConfig = Number(
    config.minRecommendedCapital ?? config.minCapital ?? 0,
  );
  const maxVol = tradeStats.maxVolume || Number(config.defaultLotSize ?? 0.1);
  const computedMinCapital = round(
    Math.max(minFromConfig || 0, maxVol * 100_000 * 0.02),
  );

  const equityBalanceCurve = buildEquityBalanceCurve(performance, floatingPnl);
  const monthly = buildMonthlyHeatmap(performance);
  const symbolDistribution = buildSymbolDistribution(
    input.trades.length ? input.trades : [],
  );

  if (!symbolDistribution.length && Array.isArray(config.symbols)) {
    const symbols = config.symbols as string[];
    const palette = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#22d3ee'];
    symbols.forEach((symbol, index) => {
      symbolDistribution.push({
        symbol,
        count: 1,
        pct: round(100 / symbols.length),
        color: palette[index % palette.length],
      });
    });
  }

  return {
    core: {
      totalReturnPct,
      monthlyReturnPct,
      maxDrawdownPct,
      sharpeRatio,
      profitFactor,
      winRate,
    },
    advanced: {
      avgTradeDuration: tradeStats.avgDurationLabel,
      avgTradeDurationMs: round(tradeStats.avgDurationMs),
      profitLossRatio: round(tradeStats.plRatio),
      recoveryFactor,
      expectancy: round(tradeStats.expectancy),
      avgWin: round(tradeStats.avgWin),
      avgLoss: round(tradeStats.avgLoss),
      totalTrades: tradeStats.closedCount || latestPerf?.totalTrades || 0,
      floatingPnl: round(floatingPnl),
    },
    charts: {
      equityBalanceCurve,
      monthlyHeatmap: monthly.heatmap,
      monthlyReturns: monthly.months,
      symbolDistribution,
    },
    verification: {
      isVerified: input.isVerified,
      verificationStatus: input.verificationStatus,
      badgeLabel: input.isVerified ? 'Verified Track Record' : 'Pending Verification',
      backtestReportUrl:
        (config.backtestReportUrl as string) ||
        (config.pdfReportUrl as string) ||
        null,
      externalVerificationUrl:
        (config.myfxbookUrl as string) ||
        (config.metaApiVerificationUrl as string) ||
        (bias.verificationUrl as string) ||
        null,
      modelingQuality: (config.modelingQuality as string) || '99%',
      backtestPeriod: (config.backtestPeriod as string) || 'Multi-year historical',
      dataSource: input.masterBrokerAccountId
        ? 'MetaAPI Live Feed'
        : 'Strategy Performance Ledger',
      trackRecordSince: input.createdAt.toISOString().slice(0, 10),
    },
    recommendations: {
      minRecommendedCapital: computedMinCapital || 500,
      recommendedLeverage: (config.recommendedLeverage as string) || '1:100',
      leverageWarning:
        (config.leverageWarning as string) ||
        'Use at least 1:100 leverage to align with the operator bot risk model. Lower leverage may cause margin rejections on mirrored positions.',
      riskNote:
        (config.riskNote as string) ||
        'Capital below the minimum may trigger lot-size rounding and amplified drawdown relative to the master account.',
    },
    meta: {
      performanceDays: performance.length,
      hasLiveTrades: tradeStats.closedCount > 0,
      baseEquity: BASE_EQUITY,
    },
  };
}
