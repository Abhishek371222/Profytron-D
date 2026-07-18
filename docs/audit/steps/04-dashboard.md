# Step 4 — Dashboard Audit

**Evidence:** `useDashboardData.ts`, `useDashboardRealtime.ts`, Overview widgets, Playwright `/dashboard` sample

## Widget inventory

| Widget | File | Primary data |
|--------|------|--------------|
| Metric cards (Balance/Equity/Margin/PnL) | `OverviewMetricCards.tsx` | stickyAccount + portfolio |
| Open positions | `OverviewOpenPositions.tsx` | `open-trades` query |
| Recent/closed trades | `OverviewRecentTrades.tsx` | `trade-history` query |
| Performance chart | `OverviewPerformance.tsx` (dynamic, recharts) | `portfolio` query |
| Market watch | `OverviewMarketWatch.tsx` | `useLiveMarketFeed` |
| Account health | `OverviewAccountHealth.tsx` | `dashboard-risk` |
| Economic calendar | `OverviewEconomicCalendar.tsx` | analytics macro |
| Market news | `OverviewMarketNews.tsx` | market API |
| Quick actions | `OverviewQuickActions.tsx` | local |

## Data dependencies (single hook fan-out)

`useDashboardData` enables **in parallel** (when `sessionReady && hasBrokerAccount`):

1. `portfolio` — analyticsApi, stale/refetch **60s**
2. `open-trades` — tradingApi, 60s + refetchOnWindowFocus
3. `my-strategies` — strategiesApi
4. `dashboard-risk` — riskApi, 60s
5. `trade-history` — tradingApi limit 12, 60s
6. `useLiveMarketFeed` — REST + socket `price_update`
7. `useAccountContext` / broker accounts
8. `useDashboardRealtime` — socket → debounced (400ms) query invalidation

Plus sessionStorage/local caches: `hydrateDashboardCache`, `overview-account-cache` (sticky equity paint before network).

## Rerender heat map (structural — Profiler counts for Phase 2 instrumentation)

```
useAuthStore.sessionReady ──┐
useAccountContext ──────────┼─► useDashboardData ──► DashboardPage
useLiveMarketFeed(quotes) ──┤         │
socket invalidate (400ms) ──┘         ├─► OverviewMetricCards  (balance/equity)
                                      ├─► OverviewOpenPositions
                                      ├─► OverviewRecentTrades
                                      ├─► OverviewPerformance (heavy recharts)
                                      ├─► OverviewMarketWatch (high frequency quotes)
                                      ├─► OverviewAccountHealth
                                      └─► calendar/news/actions
```

**High frequency:** MarketWatch (socket quotes), MetricCards when stickyAccount updates.  
**Medium:** Open/Recent trades on invalidate.  
**Lower:** Chart (range changes + 60s poll).

## Memoization / derived state

- `liveAccountSnapshot` / `portfolioLiveSnapshot` via `useMemo` — good.
- Sticky account state can cause extra paints when portfolio + broker both update.
- Invalidation calls `invalidateAccountQueries` on many trade events → broad refetch storms possible.

## Why cards feel slow (evidence-backed)

1. Cards wait on `sessionReady` settle after auth.
2. Broker accounts API p50 **~520ms** (Neon RTT).
3. Portfolio cold path p50 can hit **~1350ms** before Redis cache warms (then ~10ms).
4. MetaApi account-information when live: **~690–1780ms** (adapter 30s equity cache helps subsequent).
5. Frontend still hydrates large client bundle before widgets commit.

## Prop drilling / context

No heavy React Context on dashboard; Zustand selectors + React Query. Risk is **query key invalidation breadth**, not context.
