import { apiClient } from './client';

export type AnalyticsRange = '1d' | '1w' | '1m' | '3m' | '1y' | 'all';

const unwrap = <T>(payload: any): T => {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return payload.data as T;
  }
  return payload as T;
};

export interface PortfolioAnalytics {
  range: AnalyticsRange;
  totalProfit: number;
  winRate: number;
  totalTrades: number;
  sharpeRatio: number;
  sortinoRatio: number;
  profitFactor: number;
  avgWin: number;
  avgLoss: number;
  maxDrawdown: number;
  allTimeHigh: number;
  bestMonth: number;
  equityCurve: Array<{ date: string; equity: number; drawdownPct: number }>;
}

export interface MonthlyReturns {
  months: Array<{
    month: string;
    year: number;
    monthIndex: number;
    name: string;
    pnl: number;
    returnPct: number;
  }>;
  heatmap: Array<{
    year: number;
    months: Array<{ name: string; val: number; pnl: number }>;
  }>;
}

export interface StrategyComparison {
  range: AnalyticsRange;
  strategies: Array<{
    id: string;
    name: string;
    trades: number;
    winRate: number;
    netPnl: number;
    avgPnl: number;
    sharpeRatio: number;
    maxDrawdown: number;
  }>;
  correlation: number[][];
}

export interface RiskAnalytics {
  range: AnalyticsRange;
  var95: number;
  maxConsecutiveLosses: number;
  largestLoss: number;
  bestSingleWin: number;
  avgRiskReward: number;
  calmarRatio: number;
  drawdownCurve: Array<{ time: number; val: number }>;
  heatmap: Array<{ day: number; hour: number; value: number }>;
}

export interface TradeAnalytics {
  range: AnalyticsRange;
  distribution: Array<{ range: string; count: number }>;
  duration: Array<{ range: string; count: number }>;
  symbolPerformance: Array<{ symbol: string; pnl: number; trades: number }>;
  winLoss: Array<{ name: string; value: number }>;
}

export interface TradeExportResponse {
  range: AnalyticsRange;
  rows: Array<{
    id: string;
    symbol: string;
    direction: 'BUY' | 'SELL';
    volume: number;
    openPrice: number;
    closePrice: number | null;
    profit: number | null;
    status: 'OPEN' | 'CLOSED' | 'CANCELED';
    strategyName: string | null;
    openedAt: string;
    closedAt: string | null;
  }>;
}

export interface GlobalIntelligence {
  marketRegime: { label: string; confidence: number };
  sectorRotation: Array<{
    strategyId: string;
    netPnl: number;
    sharpeRatio: number;
    drawdown: number;
    winRate: number;
  }>;
  macroEvents: Array<{ event: string; impact: string; timestamp: string }>;
  leaderboard: Array<{
    rank: number;
    userId: string;
    username: string;
    avatarUrl: string | null;
    totalPnl: number;
    totalTrades: number;
  }>;
}

export interface LeaderboardResponse {
  rows: Array<{
    rank: number;
    userId: string;
    username: string;
    avatarUrl: string | null;
    totalPnl: number;
    totalTrades: number;
  }>;
  limit: number;
}

export const analyticsApi = {
  async getPortfolio(range: AnalyticsRange = '1m') {
    const res = await apiClient.get('/analytics/portfolio', { params: { range } });
    return unwrap<PortfolioAnalytics>(res.data);
  },

  async getMonthlyReturns() {
    const res = await apiClient.get('/analytics/monthly-returns');
    return unwrap<MonthlyReturns>(res.data);
  },

  async getStrategyComparison(range: AnalyticsRange = '3m') {
    const res = await apiClient.get('/analytics/strategy-comparison', { params: { range } });
    return unwrap<StrategyComparison>(res.data);
  },

  async getRisk(range: AnalyticsRange = '3m') {
    const res = await apiClient.get('/analytics/risk', { params: { range } });
    return unwrap<RiskAnalytics>(res.data);
  },

  async getTrades(range: AnalyticsRange = '3m') {
    const res = await apiClient.get('/analytics/trades', { params: { range } });
    return unwrap<TradeAnalytics>(res.data);
  },

  async getTradeExport(range: AnalyticsRange = '3m') {
    const res = await apiClient.get('/analytics/trades/export', { params: { range } });
    return unwrap<TradeExportResponse>(res.data);
  },

  async getGlobal() {
    const res = await apiClient.get('/analytics/global');
    return unwrap<GlobalIntelligence>(res.data);
  },

  async getLeaderboard(limit = 10) {
    const res = await apiClient.get('/analytics/leaderboard', { params: { limit } });
    return unwrap<LeaderboardResponse>(res.data);
  },
};
