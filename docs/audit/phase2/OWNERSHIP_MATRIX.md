# Ownership Matrix

| System | Owner path | May write | Must not write |
|--------|------------|-----------|----------------|
| Application Core | `apps/web/src/app-core/` | session, workspace, selectedAccount, permissions, featureFlags, workspace lifecycle | query caches, UI motion |
| Rendering | `platform/rendering` via `platform.render()` | boundaries, shell slots | API calls |
| Dashboard | `platform/dashboard` + feature pages | module selectors, invalidation channels | global auth, raw axios |
| Cache | `platform/cache` via `platform.cache()` | L0–L2 lifecycle | business decisions |
| Scheduler | `platform/scheduler` via `platform.scheduler()` | priorities, coalesce, prefetch | UI components |
| Animation | `platform/animation` via `platform.animation()` | motion permission, pause/resume | data fetching |
| Observability | `platform/metrics` via `platform.metrics()` | marks, long tasks | product state |
| MT5 sync bridge | `platform/mt5-sync` | setQueryData patches, syncStatus | MetaApi credentials |
| AI Coach | feature + coach-socket via lifecycle | coach UI state | dashboard query keys |
| Infrastructure | `lib/api`, `lib/realtime` | transport only | React state |

**Rule:** One writer per state domain. Conflicts elevate to Application Core or CacheEngine.
