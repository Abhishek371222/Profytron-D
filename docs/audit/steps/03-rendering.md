# Step 3 — Rendering Audit

**Evidence:** `docs/audit/data/lighthouse/playwright-cwv.json`, `docs/audit/data/benchmarks/route-summary.json`, `docs/audit/data/traces/`

## Method

Playwright Chromium headless + PerformanceObserver (longtask, paint) + CDP Performance.getMetrics against **dev** Next server (`localhost:3000`) with live API. Auth routes seeded via Zustand persist key `profytron-auth` + `sessionStorage.profytron_access`.

## Measured route table

| Route | Wall (ms) | FCP (ms) | Long tasks | Long task ms | Transfer KB | Heap MB | CLS |
|-------|-----------|----------|------------|--------------|-------------|---------|-----|
| `/` | 9844 | **1432** | **26** | **7127** | 9081 | 157 | 0 |
| `/login` | 15493 | **8452** | 2 | 358 | 8234 | 123 | 0 |
| `/marketplace` | 8672 | 1532 | 2 | 454 | 8234 | 123 | 0 |
| `/pricing` | 9352 | 2440 | 1 | 265 | 7113 | 116 | 0 |
| `/dashboard` | 8447 | 252* | 1 | 255 | 8234 | 131 | 0 |
| `/analytics` | 7117 | 140* | 1 | 248 | 8234 | 123 | 0 |
| `/markets` | 7168 | 176* | 1 | 214 | 8234 | 123 | 0 |
| `/settings/profile` | 7042 | 128* | 1 | 204 | 8234 | 123 | 0 |
| `/alpha-coach` | 7628 | 132* | 2 | 266 | 8234 | 131 | 0 |
| `/strategies/builder` | 7711 | 164* | 1 | 207 | 8234 | 131 | 0 |
| `/connected-accounts` | 15737 | **2928** | 1 | 227 | 8234 | **177** | 0 |

\* Soft-navigation FCP after prior pages in same browser process — not cold-load comparable. Cold-load proxies: `/`, `/login`, `/marketplace`, `/connected-accounts`.

## Findings

1. **Landing page is main-thread heavy:** 26 long tasks / 7.1s total blocking work during load (Lenis + framer-motion + hero visuals).
2. **Login FCP 8.5s** driven by WebGL earth/three assets (`public/auth/earth/*` ~3.4MB textures+HDR).
3. **Almost no Server Components in product UI** → hydration must re-create entire dashboard tree client-side.
4. Suspense/loading.tsx exist for dashboard sections but data fetching is client React Query — streaming SSR data is unused.
5. CLS measured **0** in headless samples (good); still validate with real fonts/images in LHCI.
6. Hydration mismatches: **NOT MEASURED** in console systematically this run; Sentry `error.tsx` ready for capture.

## Server vs Client candidates

| Keep Client | Promote toward Server (Phase 2+) |
|-------------|-----------------------------------|
| Live equity/trades widgets | Marketing layouts already server |
| Charts (recharts/TradingView) | Static settings shells |
| Coach chat socket UI | Marketplace listing shells (SEO) |
| Auth globe | Docs/blog (partially done) |

## Streaming / Suspense

Route `loading.tsx` skeletons present; no RSC streaming of portfolio/trades. Waterfalls are **client fetch waterfalls**, not Suspense server waterfalls.
