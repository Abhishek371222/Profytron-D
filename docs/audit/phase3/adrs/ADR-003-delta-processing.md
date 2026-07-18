# ADR-003: Delta processing over invalidation

- **Status:** Accepted
- **Date:** 2026-07-18

## Decision

When a versioned WS delta arrives, apply via `setQueryData` + Platform Cache L2. Do **not** invalidate equity/broker-accounts/open-trades for that path.

HTTP invalidate is fallback for trade_* without delta, scoped per entity and scheduled (medium/low for history/risk).

## Rollback

`SYNC_ENGINE_ENABLED=0` on API + re-enable `refetchInterval` on dashboard queries.
