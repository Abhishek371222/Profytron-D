# ADR-007 MT5 State Pipeline

- **Status:** Accepted
- **Date:** 2026-07-18
- **Owner:** MT5 sync bridge

## Why changed
UI waited on MetaApi RTT perception; components tied to network timing.

## Alternatives considered
1. MetaApi streaming SDK now — deferred (Phase 3+).
2. State-first: L2 paint + WS equity patches + degraded status — accepted.

## Tradeoffs
+ UI never blocks on MetaApi  
− Freshness still poller-bound until streaming

## Rollback
Remove `applyEquityPatch`; restore full invalidation on account_equity.

## Files affected
- `apps/web/src/platform/mt5-sync/index.ts`
- `docs/audit/phase2/recovery.md`
