import type {
  AnalyticsRange,
  GlobalIntelligence,
  LeaderboardResponse,
  MonthlyReturns,
  PortfolioAnalytics,
  RiskAnalytics,
  StrategyComparison,
  TradeAnalytics,
} from '@/lib/api/analytics';

const now = Date.now();

const RANGE_CONFIG: Record<AnalyticsRange, { points: number; multiplier: number; label: string }> = {
  '1d': { points: 12, multiplier: 0.08, label: 'H' },
  '1w': { points: 14, multiplier: 0.25, label: 'D' },
  '1m': { points: 20, multiplier: 0.5, label: 'W' },
  '3m': { points: 24, multiplier: 1, label: 'W' },
  '1y': { points: 30, multiplier: 2.1, label: 'M' },
  all: { points: 36, multiplier: 3.3, label: 'Q' },
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const scaleInt = (base: number, multiplier: number) => Math.round(base * multiplier);

const scaleFixed = (base: number, multiplier: number, decimals = 2) =>
  Number((base * (0.75 + multiplier * 0.45)).toFixed(decimals));

export const demoPortfolio = (range: AnalyticsRange): PortfolioAnalytics => ({
  range,
  totalProfit: scaleInt(24890, RANGE_CONFIG[range].multiplier),
  winRate: clamp(Math.round(59 + RANGE_CONFIG[range].multiplier * 3), 54, 71),
  totalTrades: scaleInt(412, RANGE_CONFIG[range].multiplier),
  sharpeRatio: scaleFixed(1.84, RANGE_CONFIG[range].multiplier),
  sortinoRatio: scaleFixed(2.47, RANGE_CONFIG[range].multiplier),
  profitFactor: scaleFixed(1.71, RANGE_CONFIG[range].multiplier),
  avgWin: scaleInt(329, RANGE_CONFIG[range].multiplier),
  avgLoss: -scaleInt(188, RANGE_CONFIG[range].multiplier),
  maxDrawdown: Number((clamp(8.6 - RANGE_CONFIG[range].multiplier * 0.9, 3.2, 11.4)).toFixed(1)),
  allTimeHigh: 100000 + scaleInt(31240, RANGE_CONFIG[range].multiplier),
  bestMonth: Number((clamp(7.4 + RANGE_CONFIG[range].multiplier * 0.9, 2.1, 16.5)).toFixed(1)),
  equityCurve: Array.from({ length: RANGE_CONFIG[range].points }).map((_, i) => ({
    date: `${RANGE_CONFIG[range].label}${i + 1}`,
    equity:
      100000 +
      Math.round(i * 620 * (0.8 + RANGE_CONFIG[range].multiplier * 0.3)) +
      Math.round(Math.sin(i / 2.3) * 2000 * (0.6 + RANGE_CONFIG[range].multiplier * 0.2)),
    drawdownPct: Math.max(0.3, Number((9 - i * 0.18 + (i % 6 === 0 ? 0.6 : 0)).toFixed(2))),
  })),
});

export const demoMonthlyReturns: MonthlyReturns = {
  months: [
    { month: 'Jan', year: 2026, monthIndex: 1, name: 'Jan', pnl: 3800, returnPct: 3.8 },
    { month: 'Feb', year: 2026, monthIndex: 2, name: 'Feb', pnl: 2100, returnPct: 2.1 },
    { month: 'Mar', year: 2026, monthIndex: 3, name: 'Mar', pnl: -900, returnPct: -0.9 },
    { month: 'Apr', year: 2026, monthIndex: 4, name: 'Apr', pnl: 4600, returnPct: 4.6 },
    { month: 'May', year: 2026, monthIndex: 5, name: 'May', pnl: 3100, returnPct: 3.1 },
    { month: 'Jun', year: 2026, monthIndex: 6, name: 'Jun', pnl: 4200, returnPct: 4.2 },
  ],
  heatmap: [
    {
      year: 2026,
      months: [
        { name: 'Jan', val: 3.8, pnl: 3800 },
        { name: 'Feb', val: 2.1, pnl: 2100 },
        { name: 'Mar', val: -0.9, pnl: -900 },
        { name: 'Apr', val: 4.6, pnl: 4600 },
      ],
    },
  ],
};

export const demoStrategy = (range: AnalyticsRange): StrategyComparison => ({
  range,
  strategies: [
    {
      id: 's1',
      name: 'Momentum Pulse',
      trades: scaleInt(110, RANGE_CONFIG[range].multiplier),
      winRate: clamp(Math.round(64 + RANGE_CONFIG[range].multiplier), 56, 74),
      netPnl: scaleInt(9410, RANGE_CONFIG[range].multiplier),
      avgPnl: scaleInt(85, RANGE_CONFIG[range].multiplier),
      sharpeRatio: scaleFixed(2.1, RANGE_CONFIG[range].multiplier),
      maxDrawdown: Number((clamp(6.2 - RANGE_CONFIG[range].multiplier * 0.5, 2.8, 9.5)).toFixed(1)),
    },
    {
      id: 's2',
      name: 'Mean Revert Pro',
      trades: scaleInt(148, RANGE_CONFIG[range].multiplier),
      winRate: clamp(Math.round(60 + RANGE_CONFIG[range].multiplier), 52, 69),
      netPnl: scaleInt(7280, RANGE_CONFIG[range].multiplier),
      avgPnl: scaleInt(49, RANGE_CONFIG[range].multiplier),
      sharpeRatio: scaleFixed(1.7, RANGE_CONFIG[range].multiplier),
      maxDrawdown: Number((clamp(7.3 - RANGE_CONFIG[range].multiplier * 0.45, 3.2, 10.1)).toFixed(1)),
    },
    {
      id: 's3',
      name: 'Breakout Matrix',
      trades: scaleInt(88, RANGE_CONFIG[range].multiplier),
      winRate: clamp(Math.round(57 + RANGE_CONFIG[range].multiplier), 49, 67),
      netPnl: scaleInt(5100, RANGE_CONFIG[range].multiplier),
      avgPnl: scaleInt(58, RANGE_CONFIG[range].multiplier),
      sharpeRatio: scaleFixed(1.5, RANGE_CONFIG[range].multiplier),
      maxDrawdown: Number((clamp(8.8 - RANGE_CONFIG[range].multiplier * 0.42, 3.9, 11.7)).toFixed(1)),
    },
    {
      id: 's4',
      name: 'Scalp Grid AI',
      trades: scaleInt(66, RANGE_CONFIG[range].multiplier),
      winRate: clamp(Math.round(68 + RANGE_CONFIG[range].multiplier), 60, 77),
      netPnl: scaleInt(6340, RANGE_CONFIG[range].multiplier),
      avgPnl: scaleInt(96, RANGE_CONFIG[range].multiplier),
      sharpeRatio: scaleFixed(2.4, RANGE_CONFIG[range].multiplier),
      maxDrawdown: Number((clamp(4.9 - RANGE_CONFIG[range].multiplier * 0.4, 2.1, 8.3)).toFixed(1)),
    },
  ],
  correlation: [
    [1, 0.34, 0.49, 0.2],
    [0.34, 1, 0.27, 0.18],
    [0.49, 0.27, 1, 0.22],
    [0.2, 0.18, 0.22, 1],
  ],
});

export const demoRisk = (range: AnalyticsRange): RiskAnalytics => ({
  range,
  var95: scaleInt(2460, RANGE_CONFIG[range].multiplier),
  maxConsecutiveLosses: clamp(Math.round(3 + RANGE_CONFIG[range].multiplier * 1.2), 2, 7),
  largestLoss: -scaleInt(1890, RANGE_CONFIG[range].multiplier),
  bestSingleWin: scaleInt(2540, RANGE_CONFIG[range].multiplier),
  avgRiskReward: scaleFixed(1.73, RANGE_CONFIG[range].multiplier),
  calmarRatio: scaleFixed(1.41, RANGE_CONFIG[range].multiplier),
  drawdownCurve: Array.from({ length: RANGE_CONFIG[range].points }).map((_, i) => ({
    time: i + 1,
    val: Math.max(0.3, Number((8.8 - i * 0.19 + (i % 5 === 0 ? 1 : 0)).toFixed(2))),
  })),
  heatmap: [],
});

export const demoTrades = (range: AnalyticsRange): TradeAnalytics => ({
  range,
  distribution: [
    { range: '< -2%', count: scaleInt(18, RANGE_CONFIG[range].multiplier) },
    { range: '-2% to -1%', count: scaleInt(36, RANGE_CONFIG[range].multiplier) },
    { range: '-1% to 0%', count: scaleInt(62, RANGE_CONFIG[range].multiplier) },
    { range: '0% to 1%', count: scaleInt(121, RANGE_CONFIG[range].multiplier) },
    { range: '1% to 2%', count: scaleInt(97, RANGE_CONFIG[range].multiplier) },
    { range: '> 2%', count: scaleInt(54, RANGE_CONFIG[range].multiplier) },
  ],
  duration: [
    { range: '<1h', count: scaleInt(90, RANGE_CONFIG[range].multiplier) },
    { range: '1-4h', count: scaleInt(153, RANGE_CONFIG[range].multiplier) },
    { range: '4-24h', count: scaleInt(111, RANGE_CONFIG[range].multiplier) },
    { range: '>24h', count: scaleInt(58, RANGE_CONFIG[range].multiplier) },
  ],
  symbolPerformance: [
    { symbol: 'BTCUSDT', pnl: scaleInt(11420, RANGE_CONFIG[range].multiplier), trades: scaleInt(142, RANGE_CONFIG[range].multiplier) },
    { symbol: 'ETHUSDT', pnl: scaleInt(7380, RANGE_CONFIG[range].multiplier), trades: scaleInt(118, RANGE_CONFIG[range].multiplier) },
    { symbol: 'SOLUSDT', pnl: scaleInt(3260, RANGE_CONFIG[range].multiplier), trades: scaleInt(72, RANGE_CONFIG[range].multiplier) },
    { symbol: 'NASDAQ', pnl: scaleInt(2830, RANGE_CONFIG[range].multiplier), trades: scaleInt(44, RANGE_CONFIG[range].multiplier) },
  ],
  winLoss: [
    { name: 'Wins', value: scaleInt(261, RANGE_CONFIG[range].multiplier) },
    { name: 'Losses', value: scaleInt(151, RANGE_CONFIG[range].multiplier) },
  ],
});

export const demoMonthlyReturnsByRange = (range: AnalyticsRange): MonthlyReturns => {
  const monthCountByRange: Record<AnalyticsRange, number> = {
    '1d': 1,
    '1w': 1,
    '1m': 2,
    '3m': 3,
    '1y': 6,
    all: demoMonthlyReturns.months.length,
  };

  const count = monthCountByRange[range];
  const months = demoMonthlyReturns.months.slice(-count).map((month) => ({
    ...month,
    pnl: scaleInt(month.pnl, 0.7 + RANGE_CONFIG[range].multiplier * 0.2),
    returnPct: Number((month.returnPct * (0.65 + RANGE_CONFIG[range].multiplier * 0.18)).toFixed(2)),
  }));

  return {
    months,
    heatmap: demoMonthlyReturns.heatmap,
  };
};

export const demoGlobal: GlobalIntelligence = {
  marketRegime: { label: 'Risk-On Rotation', confidence: 78 },
  sectorRotation: [
    { strategyId: 'Growth Tech', netPnl: 8240, sharpeRatio: 1.9, drawdown: 5.2, winRate: 64 },
    { strategyId: 'Energy Spread', netPnl: 4910, sharpeRatio: 1.5, drawdown: 6.8, winRate: 59 },
    { strategyId: 'FX Carry', netPnl: 3760, sharpeRatio: 1.3, drawdown: 7.1, winRate: 57 },
  ],
  macroEvents: [
    { event: 'US CPI cooled to 2.6%', impact: 'Bullish for growth assets', timestamp: new Date(now - 1000 * 60 * 60 * 9).toISOString() },
    { event: 'Fed minutes signaled pause', impact: 'Neutral to slightly bullish', timestamp: new Date(now - 1000 * 60 * 60 * 30).toISOString() },
    { event: 'Oil volatility spike', impact: 'Risk for cyclical positions', timestamp: new Date(now - 1000 * 60 * 60 * 48).toISOString() },
  ],
  leaderboard: [
    { rank: 1, userId: 'u1', username: 'quant_hawk', avatarUrl: null, totalPnl: 58320, totalTrades: 1260 },
    { rank: 2, userId: 'u2', username: 'alpha_archer', avatarUrl: null, totalPnl: 54210, totalTrades: 1094 },
    { rank: 3, userId: 'u3', username: 'vol_ninja', avatarUrl: null, totalPnl: 49880, totalTrades: 970 },
  ],
};

export const demoLeaderboard: LeaderboardResponse = {
  limit: 10,
  rows: [...demoGlobal.leaderboard],
};
