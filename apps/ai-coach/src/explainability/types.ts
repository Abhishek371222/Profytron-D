/**
 * AI Coach grounded explainability — Programs 1–6
 * Intent → Tools → Evidence → Template (no agents)
 */

export type CoachIntent =
  // Program 1 — Explainability / performance
  | 'performance_down_today'
  | 'performance_summarize_week'
  | 'performance_drawdown'
  | 'performance_best_strategy'
  | 'performance_worst_strategy'
  | 'performance_highest_risk'
  | 'performance_highest_profit'
  | 'trade_why_open'
  | 'trade_why_close'
  | 'trade_explain_position'
  // Program 2 — Portfolio Intelligence
  | 'portfolio_how_performing'
  | 'portfolio_whats_my_risk'
  | 'portfolio_trades_today'
  | 'portfolio_largest_loss'
  | 'portfolio_largest_gain'
  | 'portfolio_briefing'
  | 'portfolio_changed_since_yesterday'
  | 'portfolio_needs_attention'
  | 'portfolio_where_making_money'
  | 'portfolio_where_losing'
  // Program 3 — Strategy Intelligence
  | 'strategy_compare_all'
  | 'strategy_underperforming_why'
  | 'strategy_degraded'
  | 'strategy_improving'
  | 'strategy_session_performance'
  | 'strategy_losing_symbols'
  | 'strategy_holding_time'
  // Program 4 — Risk Intelligence
  | 'risk_exposure_summary'
  | 'risk_margin_health'
  | 'risk_concentration'
  | 'risk_heat'
  | 'risk_worst_case'
  | 'risk_by_symbol'
  | 'risk_by_strategy'
  // Program 5 — Performance Trends
  | 'trend_improving_or_declining'
  | 'trend_winrate_vs_avg_loss'
  | 'trend_volatility_change'
  // Program 6 — Personalized Advisory (never execution)
  | 'advisory_review_suggestion'
  | 'advisory_what_to_watch'
  | 'advisory_improve_consistency'
  | 'unknown';

export type ConfidenceLevel = 'High' | 'Medium' | 'Low';

export type ToolId =
  | 'analytics_portfolio'
  | 'analytics_risk'
  | 'analytics_strategy_comparison'
  | 'analytics_trades'
  | 'trading_history'
  | 'trading_open'
  | 'ai_explain_trade'
  | 'coaching_report';

export interface Citation {
  id: string;
  label: string;
  source: ToolId | 'session' | 'derived';
}

export interface EvidenceBundle {
  generatedAt: string;
  scopeNote: string;
  todayPnL?: number | null;
  weekPnL?: number | null;
  monthPnL?: number | null;
  periodReturnPct?: number | null;
  drawdownPct?: number | null;
  winRate?: number | null;
  avgWin?: number | null;
  avgLoss?: number | null;
  tradeCountToday?: number | null;
  tradeCountPeriod?: number | null;
  largestLoss?: { symbol?: string; pnl?: number; id?: string } | null;
  largestGain?: { symbol?: string; pnl?: number; id?: string } | null;
  bestStrategy?: { name?: string; pnl?: number; trades?: number } | null;
  worstStrategy?: { name?: string; pnl?: number; trades?: number } | null;
  strategies?: Array<{
    name: string;
    pnl: number;
    trades: number;
    winRate?: number | null;
    maxDrawdown?: number | null;
  }>;
  openCount?: number | null;
  riskSummary?: string | null;
  liveBalance?: number | null;
  liveEquity?: number | null;
  liveMargin?: number | null;
  liveFreeMargin?: number | null;
  liveCurrency?: string | null;
  syncError?: string | null;
  healthLabel?: 'Stable' | 'Needs attention' | 'Elevated risk' | 'Unknown';
  attentionFlags?: string[];
  equityChange1d?: number | null;
  concentrationNote?: string | null;
  marginHealthLabel?: 'Healthy' | 'Tight' | 'Unknown';
  heatNote?: string | null;
  worstCaseNote?: string | null;
  symbolRiskNote?: string | null;
  trendLabel?: 'Improving' | 'Declining' | 'Mixed / flat' | 'Unknown';
  volatilityNote?: string | null;
  advisoryHints?: string[];
  tradeExplanation?: {
    tradeId: string;
    summary?: string;
    confidenceScore?: number;
    available: boolean;
    knownFacts?: string[];
  } | null;
  toolErrors: Array<{ tool: ToolId; message: string }>;
  rawNotes: string[];
}

export interface ExplainabilityResult {
  intent: CoachIntent;
  confidence: ConfidenceLevel;
  citations: Citation[];
  evidence: EvidenceBundle;
  sections: {
    whatHappened: string;
    why: string;
    evidence: string;
    meaning: string;
    nextStep: string;
  };
  plainText: string;
  followUps: string[];
  toolsUsed: ToolId[];
}

export interface SessionMemory {
  selectedTradeId?: string | null;
  selectedStrategyId?: string | null;
  lastIntent?: CoachIntent | null;
}

export interface ToolFetchers {
  analyticsPortfolio?: (range: string) => Promise<unknown>;
  analyticsRisk?: (range: string) => Promise<unknown>;
  analyticsStrategyComparison?: (range: string) => Promise<unknown>;
  analyticsTrades?: (range: string) => Promise<unknown>;
  tradingHistory?: (params?: Record<string, unknown>) => Promise<unknown>;
  tradingOpen?: () => Promise<unknown>;
  explainTrade?: (tradeId: string) => Promise<unknown>;
  coachingReport?: () => Promise<unknown>;
}
