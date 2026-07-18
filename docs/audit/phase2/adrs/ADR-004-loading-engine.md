# ADR-004 Loading Engine

- **Status:** Accepted
- **Date:** 2026-07-18
- **Owner:** Loading / Data

## Why changed
Routine refreshes cleared cards (isPending without placeholder).

## Alternatives considered
1. Skeletons forever — rejected.
2. `placeholderData: previous` + `isInitialLoading` — accepted.

## Tradeoffs
+ Persistent UI  
− May briefly show stale numbers during reconcile

## Rollback
Remove `useWorkspaceQuery` wrapper; restore raw `useQuery`.

## Files affected
- `apps/web/src/platform/data/hooks/useWorkspaceQuery.ts`
