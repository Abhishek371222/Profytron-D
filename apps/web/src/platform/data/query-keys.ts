/** Canonical query key registry — single source for dashboard/workspace keys. */
export const QueryKeys = {
  portfolio: (range: string) => ['portfolio', range] as const,
  openTrades: () => ['open-trades'] as const,
  tradeHistory: (scope = 'overview') => ['trade-history', scope] as const,
  dashboardRisk: () => ['dashboard-risk'] as const,
  myStrategies: () => ['my-strategies'] as const,
  brokerAccounts: () => ['broker-accounts'] as const,
  marketNews: (category: string) =>
    ['market-news', 'overview', category] as const,
  economicCalendar: () => ['economic-calendar', 'overview'] as const,
  syncStatus: () => ['mt5-sync-status'] as const,
} as const;

export type QueryKeysApi = typeof QueryKeys;
