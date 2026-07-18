# Phase 2 Implementation Summary

## What shipped

1. **Application Core** (`apps/web/src/app-core/`) — session, workspace, permissions, feature flags facades.
2. **Platform public API** (`apps/web/src/platform/index.ts`) — `render`, `cache`, `scheduler`, `metrics`, `animation`, `data`, `lifecycle`, `mt5`, `loading`.
3. **CacheEngine** — unified hydrate/persist over existing L2 stores.
4. **useWorkspaceQuery** — `placeholderData` + `isInitialLoading` / `isRefreshing` (no blank refresh).
5. **Dashboard model** — moved to `platform/dashboard/useDashboardModel`; hooks re-export for compatibility.
6. **Targeted MT5/realtime invalidation** — event→key map; equity patches via High-priority scheduler.
7. **RequestScheduler** — Critical→Idle lanes + coalesce + debounce channels.
8. **RenderBoundary** — keeps last good children in dashboard layout.
9. **Wallet** — shared trading socket (no ad-hoc `io()`).
10. **Lifecycle ownership** — sockets/intervals registered and disposed.
11. **Animation foundation** — reduced-motion + visibility helpers.
12. **Health probe** — Redis/queue timeout 300ms (fail-fast).
13. **Governance** — ADRs 000–009, budget contract (+ ADR-009 waiver), ownership matrix, shared state rules, recovery playbooks, compat suite, eslint restricted imports.

## Migration notes

- Prefer `import { platform } from '@/platform'` and `import { useAppSession, useWorkspace } from '@/app-core'`.
- Legacy: `@/hooks/useDashboardData` and `@/hooks/useDashboardRealtime` remain thin facades.
- Rollback: restore pre-Phase-2 hook bodies or revert `platform/` + `app-core/` commits; Nest health timeouts can be reverted independently.

## Performance comparison

| Metric | Phase 1 baseline | Phase 2 intent |
|--------|------------------|----------------|
| Dashboard blank on refresh | Possible | Eliminated via placeholderData |
| Equity invalidation blast | 11 query roots | Targeted keys + setQueryData path |
| Duplicate wallet socket | Yes | Shared singleton |
| `/health` timeout floor | ~1500ms | ~300ms probe |
| Budget contract | Defined | Absolute budgets waived → 2026-08-18 (ADR-009); exit = no regression vs `before/` |

After-metrics: see `docs/audit/phase2/after/` (`comparison.json`).

## Remaining debt / Phase 3+

- Physical unify of L2 into single `workspace-cache.v2` blob.
- MetaApi streaming / webhooks.
- CI hard-fail on Performance Budget Contract (after waiver expiry).
- Landing/home CWV (multi-second long tasks remain).
- Full 1h memory growth lab vs contract.
