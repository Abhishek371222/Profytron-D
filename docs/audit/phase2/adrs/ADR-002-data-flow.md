# ADR-002 Data Flow

- **Status:** Accepted
- **Date:** 2026-07-18
- **Owner:** Dashboard / Platform data

## Why changed
Pages orchestrated multiple APIs; caused waterfalls and coupling.

## Alternatives considered
1. Keep page-level useQuery — rejected.
2. `platform.data()` + `useDashboardModel` — accepted.

## Tradeoffs
+ Single query-key registry; persistent loading defaults  
− Migration of remaining pages still incremental

## Rollback
`hooks/useDashboardData.ts` can restore previous body; set `NEXT_PUBLIC_PLATFORM_ENGINE=0` docs.

## Files affected
- `apps/web/src/platform/data/**`
- `apps/web/src/platform/dashboard/useDashboardModel.ts`
- `apps/web/src/hooks/useDashboardData.ts`
