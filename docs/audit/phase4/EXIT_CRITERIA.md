# Phase 4 Exit Criteria

- [x] Dashboard module rerenders isolated (memo + clock/quotes leaf ownership)
- [x] Charts render independently (PerformanceChartSlot)
- [x] Hidden widgets stop work (viewport pause)
- [x] Render Scheduler owns render-lane priorities
- [x] Render budgets documented; waived via ADR-001 until 2026-08-18
- [x] React commit instrumentation in place (Profiler → metrics)
- [x] Long-task observer wired (metrics mode)
- [x] Compatibility suite Chromium — 13 passed, 2 skipped (`after/compat-chromium.log`)
- [x] Production build succeeds (`after/build-log.txt`, BUILD_EXIT:0)
- [x] Rollback documented (`NEXT_PUBLIC_RENDER_ENGINE=0`)

## Lists

No virtualization — overview lists capped ≤8; evidence in `before/commit-ranking.json`.

## Phase 5 ready

Motion Engine can proceed on this rendering foundation.
