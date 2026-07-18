# Phase 4 Implementation Summary

## Shipped

1. **Rendering Engine** — RenderSlot, RenderScheduler, useRenderVisible, budgets, render graph (`platform/rendering/`)
2. **Dashboard isolation** — DashboardClock, memo modules, quotes localized, RenderSlots
3. **Chart isolation** — PerformanceChartSlot + viewport pause
4. **Below-fold pause** — ViewportModule for news/calendar
5. **Observability** — Profiler commit marks, longtask/FPS sampler when `NEXT_PUBLIC_PLATFORM_METRICS=1`
6. **Budgets** — RENDER_CONTRACT.json + ADR-001 waiver

## Rollback

`NEXT_PUBLIC_RENDER_ENGINE=0` — page falls back to direct Overview imports / no viewport pause.

## Remaining / Phase 5

- Motion Engine (premium animations) — Phase 5
- Three.js / 3D — Phase 6
- Hard CI budget fail after 2026-08-18
- Landing CWV (still out of Phase 4 scope)
- Virtualization only if future list profiling exceeds 50ms
