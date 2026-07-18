# ADR-005 Dashboard Modules

- **Status:** Accepted
- **Date:** 2026-07-18
- **Owner:** Dashboard

## Why changed
Equity updates invalidated entire ACCOUNT_QUERY_KEYS set → dashboard-wide rerenders.

## Alternatives considered
1. Keep shotgun invalidate — rejected.
2. Targeted event→key map + equity setQueryData path — accepted.

## Tradeoffs
+ Isolated updates  
− Must keep event map complete for new WS events

## Rollback
Restore `invalidateAccountQueries` in realtime hook.

## Files affected
- `apps/web/src/platform/mt5-sync/index.ts`
- `apps/web/src/platform/dashboard/useDashboardRealtime.ts`
- `apps/web/src/platform/dashboard/modules/**`
