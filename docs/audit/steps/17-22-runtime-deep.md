# Steps 17–22 — Deep Runtime (Main Thread, Fiber, Scheduler, Pipeline, GPU, Event Loop)

## Step 17 — Main thread

| Route | Long tasks | Total long ms | Interpretation |
|-------|------------|---------------|----------------|
| `/` | 26 | 7127 | Script + hydration + motion |
| `/login` | 2 | 358 | Fewer tasks but **huge FCP** (GPU/asset bound) |
| Authed app routes | 1–2 | 200–270 | After load, quieter |

Flame charts: CDP Tracing summaries in `docs/audit/data/traces/`. Full Chrome DevTools `.json` export recommended for human flamechart viewing (binary size omitted from git).

Breakdown categories to attribute in Phase 2 UI: Parse/Compile/Evaluate, Hydrate, Layout, Paint, Recalculate Style, FunctionCall.

## Step 18 — React Fiber

Automated Top-50 component render ranking requires React DevTools Profiler export or `react-scan` overlay during interactive session.

**This run:** structural ranking by cost proxies:

1. `LandingPageClient` + motion sections  
2. `AuthGlobeWebGL` / earth scene  
3. `DashboardLayoutClient` + Sidebar/TopBar motion  
4. `OverviewPerformance` (recharts)  
5. `OverviewMarketWatch`  
6. `OverviewMetricCards`  
7. `TradingViewAdvancedChart` (markets)  
8. `connected-accounts/page` (1039 LOC client page)  
9. `alpha-coach/page`  
10. Marketplace tables  

**Top 50 full Profiler CSV: NOT MEASURED** — capture in Phase 2 interactive lab; instrumentation plan ready.

## Step 19 — Scheduler

- No widespread `startTransition` usage found in dashboard data hooks — updates treated as urgent.
- Suspense used for route loading UI, not for data.
- Concurrent features underutilized → expensive query result commits can contend with input.

## Step 20 — Browser rendering pipeline

Landing Lenis smooth-scroll + framer-motion → likely style/layout thrash (long tasks). Connected-accounts large DOM (heap 177MB). Prefer transform/opacity-only motion in Phase 2.

## Step 21 — GPU

| Surface | Assets / API | Signal |
|---------|--------------|--------|
| Auth earth | three + HDR/JPEG maps | Login FCP 8.5s |
| Marketplace globe JSON | 1.3MB points | Parse/CPU |
| TradingView | iframe/canvas | External |
| Confetti | canvas | Burst |

GPU memory/overdraw: **NOT MEASURED** headless.

## Step 22 — Event loop

**Browser:** long tasks on `/` as above.  
**Node API:** health path blocked ~1500ms on degraded queue probe; MetaApi+Prisma async mostly non-blocking but pollers compete for MetaApi quota. `perf_hooks.monitorEventLoopDelay` continuous capture: **NOT MEASURED** this run (short session).
