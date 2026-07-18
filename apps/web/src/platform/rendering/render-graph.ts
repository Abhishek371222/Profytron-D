/** Declared dashboard render dependency graph — equity must not edge into Chart. */
export const DASHBOARD_RENDER_GRAPH = {
  equity_L2_patch: ['MetricsModule'],
  open_trades_query: ['OpenTradesModule', 'RecentTradesModule'],
  portfolio_query: ['PerformanceChartSlot'],
  risk_query: ['RiskModule'],
  quotes_local: ['MarketWatchModule', 'OpenTradesModule'],
  news_query: ['NewsModule'],
  calendar_query: ['CalendarModule'],
  clock: ['DashboardClock'],
} as const;

export type RenderGraph = typeof DASHBOARD_RENDER_GRAPH;
