# Phase 3 Exit Criteria

- [x] Dashboard refresh preserves visible content (placeholderData + no spinner after first load)
- [x] MT5 synchronization updates only changed entities (Redis watermarks + WS deltas)
- [x] Query invalidation storms eliminated for equity path; trade path entity-scoped
- [x] Scheduler owns sync work (critical/high/medium/low lanes)
- [x] Synchronization states deterministic (Idle→…→Fresh FSM)
- [x] Recovery: degraded/recovering via `sync_status` + last-known L2 retained
- [x] Compatibility suite Chromium — 13 passed, 2 skipped (`after/compat-chromium.log`)
- [x] Performance budgets: absolute still under Phase 2 ADR-009 waiver; sync path improved (deltas, no 60s poll)
- [x] Benchmarks documented (`before/`, `after/`, `diagrams/`, `data/poller-timings.json`)
- [x] Rollback: `SYNC_ENGINE_ENABLED=0`
- [x] Production build succeeds (`after/build-log.txt`, BUILD_EXIT:0)

## Phase 4 recommendations

1. MetaApi streaming / webhooks (replace poller freshness ceiling)
2. Pending-orders sync poller
3. Physical `workspace-cache.v2` single blob
4. CI hard-fail Performance Budget Contract after ADR-009 expiry (2026-08-18)
5. Home/landing CWV (out of Phase 3 scope)
