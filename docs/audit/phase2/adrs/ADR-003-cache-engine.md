# ADR-003 Cache Engine

- **Status:** Accepted
- **Date:** 2026-07-18
- **Owner:** Cache

## Why changed
Duplicate L2 writers (dashboard-cache + overview-account-cache).

## Alternatives considered
1. Delete one cache — too risky mid-flight.
2. Facade `platform.cache()` over both — accepted (unify ownership first).

## Tradeoffs
+ One API for hydrate/persist  
− Physical storage keys still dual until v2 blob migration completes

## Rollback
Call sites revert to direct `dashboard-cache` / `overview-account-cache` imports.

## Files affected
- `apps/web/src/platform/cache/**`
