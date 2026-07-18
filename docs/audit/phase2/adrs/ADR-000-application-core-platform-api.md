# ADR-000 Application Core + Platform API

- **Status:** Accepted
- **Date:** 2026-07-18
- **Owner:** Application Core / Platform

## Why changed

Phase 1 showed client-orchestrated fetching, duplicate caches, and shotgun invalidation. Features invented parallel global state (auth store + sticky account + session caches). We need a single Application Core and a public Platform API so internals can evolve without breaking features.

## Alternatives considered

1. Keep page-level `useQuery` orchestration and only memoize widgets — rejected (does not fix root causes).
2. Full RSC rewrite of dashboard — rejected for Phase 2 (live trading widgets must stay client; too risky).
3. **Application Core + `platform.*` public API** — accepted.

## Tradeoffs

+ Clear ownership, testable systems, safer refactors  
− Indirection and migration cost  
− Temporary dual paths during migration

## Rollback strategy

1. Set `NEXT_PUBLIC_PLATFORM_ENGINE=0` (hooks re-export legacy implementations).
2. Or revert `apps/web/src/platform` / `app-core` and restore `hooks/useDashboardData.ts` body.

## Files affected

- `apps/web/src/app-core/**`
- `apps/web/src/platform/**`
- `apps/web/src/hooks/useDashboardData.ts` (facade)
- `docs/audit/phase2/**`
