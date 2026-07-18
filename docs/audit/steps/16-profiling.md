# Step 16 — Performance Profiling Benchmarks

**Evidence:** `docs/audit/data/lighthouse/playwright-cwv.json`, `docs/audit/data/benchmarks/route-summary.json`, API timings, MetaApi timings

## Scenario matrix (this run)

| Scenario | Method | Key result |
|----------|--------|------------|
| Cold load `/` | Playwright | FCP 1432 ms; long tasks 7127 ms; 9.0 MB transfer; heap 157 MB |
| Cold load `/login` | Playwright | FCP 8452 ms; heap 123 MB |
| Warm/public marketplace | Playwright | FCP 1532 ms |
| Dashboard load (authed seed) | Playwright | wall 8447 ms; heap 131 MB |
| Analytics / markets / settings / coach / builder | Playwright | wall 7.0–7.7 s; FCP soft-nav low |
| Connected accounts | Playwright | wall 15.7 s; FCP 2928 ms; heap **177 MB** |
| Dashboard refresh | API+MetaApi | MetaApi equity 0.7–1.8 s; RQ poll 60 s; equity cache 30 s |
| Login API | curl | demo user success; token issued |
| Logout | code path | `POST /auth/logout` + store clear — timing NOT MEASURED in browser |
| Health | curl | ~1505 ms |

## FPS / GPU

Headless Chromium does not yield reliable FPS/GPU counters. **FPS/GPU: NOT MEASURED** in headless; use DevTools Performance on a labeled GPU machine for Phase 2 validation. Trace event name histograms saved under `docs/audit/data/traces/*-trace-summary.json` where CDP Tracing succeeded.

## Main thread

Landing page dominates: script evaluation + hydration + animation long tasks. Login dominated by asset decode/WebGL setup (inferred from FCP + asset inventory).

## Interaction latency

INP not captured via web-vitals beacon this run (`NEXT_PUBLIC_VITALS_ENDPOINT` not wired into running dev server). Long-task totals on `/` imply high interaction risk during first 8–10 s.
