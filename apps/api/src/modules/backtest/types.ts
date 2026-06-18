export interface OhlcCandle {
  datetime: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type IndicatorType =
  | 'SMA'
  | 'EMA'
  | 'RSI'
  | 'MACD'
  | 'BOLLINGER'
  | 'ATR'
  | 'ADX'
  | 'VWAP';

export interface IndicatorConfig {
  type: IndicatorType;
  period?: number;
  fastPeriod?: number;
  slowPeriod?: number;
  signalPeriod?: number;
  stdDevMultiplier?: number;
  source?: 'close' | 'open' | 'high' | 'low';
}

export type ComparatorType =
  | '>'
  | '<'
  | '>='
  | '<='
  | '=='
  | 'crossesAbove'
  | 'crossesBelow';

export interface Rule {
  left: string;
  comparator: ComparatorType;
  right: string | number;
}

export interface RuleGroup {
  op: 'AND' | 'OR';
  rules: Rule[];
}

export interface RiskConfig {
  slPct?: number;
  tpPct?: number;
  riskPerTradePct?: number;
}

export interface StrategyDefinition {
  version: 1;
  name: string;
  symbol: string;
  timeframe: string;
  indicators: Record<string, IndicatorConfig>;
  entryRules: RuleGroup;
  exitRules: RuleGroup;
  risk: RiskConfig;
  direction: 'LONG' | 'SHORT' | 'BOTH';
}

export interface SimulatedTrade {
  entryIdx: number;
  exitIdx: number;
  entryPrice: number;
  exitPrice: number;
  direction: 'LONG' | 'SHORT';
  pnlPct: number;
  pnlAbs: number;
}

export interface BacktestMetrics {
  totalTrades: number;
  winRate: number;
  netProfit: number;
  netProfitPct: number;
  maxDrawdown: number;
  maxDrawdownPct: number;
  profitFactor: number;
  sharpeRatio: number;
  recoveryFactor: number;
  expectancy: number;
  avgWin: number;
  avgLoss: number;
  // snake_case aliases kept for walk-forward / sensitivity scorer compatibility
  total_pnl: number;
  win_rate: number;
  max_drawdown: number;
  sharpe_ratio: number;
}

export interface BacktestEquityPoint {
  idx: number;
  datetime: string;
  equity: number;
  drawdown: number;
}

export interface BacktestResult {
  metrics: BacktestMetrics;
  trades: SimulatedTrade[];
  equityCurve: BacktestEquityPoint[];
  monthlyReturns: Record<string, number>;
  tradeDistribution: { bucket: string; count: number }[];
}
