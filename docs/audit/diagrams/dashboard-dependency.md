# Dashboard dependency graph

```mermaid
flowchart TD
  auth[useAuthStore.sessionReady]
  acct[useAccountContext.brokerAccounts]
  rt[useDashboardRealtime.socket]
  feed[useLiveMarketFeed.quotes]

  auth --> hook[useDashboardData]
  acct --> hook
  rt -->|invalidate 400ms| hook
  feed --> watch[OverviewMarketWatch]

  hook --> portfolio[portfolio query 60s]
  hook --> open[open-trades query]
  hook --> hist[trade-history query]
  hook --> risk[dashboard-risk query]
  hook --> strat[my-strategies query]
  hook --> sticky[stickyAccount cache]

  portfolio --> cards[OverviewMetricCards]
  sticky --> cards
  portfolio --> chart[OverviewPerformance]
  open --> openUI[OverviewOpenPositions]
  hist --> recent[OverviewRecentTrades]
  risk --> health[OverviewAccountHealth]
  strat --> actions[OverviewQuickActions]
```

## Invalidation blast radius

Trade socket events → `invalidateAccountQueries` → typically portfolio + open trades + related account keys → MetricCards + tables + chart potentially all rerender together.
