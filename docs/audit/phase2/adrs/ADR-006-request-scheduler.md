# ADR-006 Request Scheduler

- **Status:** Accepted
- **Date:** 2026-07-18
- **Owner:** Scheduler

## Why changed
Duplicate GETs and equal-priority background work competing with user actions.

## Alternatives considered
1. Ad-hoc debounce only — incomplete.
2. Priority lanes Critical→Idle + coalesce — accepted.

## Tradeoffs
+ Coordinated background work  
− Extra abstraction

## Rollback
Bypass `platform.scheduler()`; call invalidate directly.

## Files affected
- `apps/web/src/platform/scheduler/**`
