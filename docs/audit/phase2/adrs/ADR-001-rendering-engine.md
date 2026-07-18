# ADR-001 Rendering Engine

- **Status:** Accepted
- **Date:** 2026-07-18
- **Owner:** Rendering

## Why changed
Phase 1: blank flashes / full remount risk on soft nav; Suspense fallbacks wipe content.

## Alternatives considered
1. Keep default Suspense only — rejected.
2. RenderBoundary keeping lastGood children — accepted.

## Tradeoffs
+ No white flash after first paint  
− Stale UI briefly on hard errors until recovery

## Rollback
Remove `RenderBoundary` wrap in `DashboardLayoutClient`.

## Files affected
- `apps/web/src/platform/rendering/index.ts`
- `apps/web/src/app/(dashboard)/DashboardLayoutClient.tsx`
