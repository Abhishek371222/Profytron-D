# Profytron — Performance Audit

> Grounded in the actual codebase (not generic advice). Each item: **Problem → Root cause → Location → Impact → Fix → Expected improvement.** Status reflects what's already done vs. outstanding.

## Executive summary

The platform is **already substantially optimized at the config/build layer**. `apps/web/next.config.ts` ships `output: 'standalone'`, React Compiler, gzip, `optimizePackageImports` for every heavy lib, AVIF/WebP image formats, `removeConsole` in prod, immutable 1-year asset caching, and a full CSP. There are **zero raw `<img>` tags** (all images use `next/image`), and recharts/reactflow are **route-split** by the App Router so they never enter the homepage bundle.

The genuinely outstanding work is: (1) trimming dead fonts [**DONE this pass**], (2) reducing the client-component ratio on static marketing pages, (3) backend DB/Redis/API latency work, and (4) infra (PgBouncer, CDN, load testing, Grafana) which is a deployment-environment track, not a code change.

---

## ✅ Already in place (verified)

| Area | Evidence |
|------|----------|
| Build output | `output: 'standalone'` — minimal runtime image |
| React Compiler | `reactCompiler: true` — auto-memoization |
| Tree-shaking | `experimental.optimizePackageImports` covers lucide, recharts, framer-motion, reactflow, gsap, lenis, date-fns, socket.io-client, react-query, sonner |
| Images | `formats: ['image/avif','image/webp']`, `minimumCacheTTL: 86400`; **0 raw `<img>`** in `apps/web/src` |
| Compression | `compress: true` (gzip) |
| Console strip | `compiler.removeConsole` in production |
| Asset caching | `Cache-Control: public, max-age=31536000, immutable` for js/css/woff2/images |
| Code splitting | recharts & reactflow imported only inside `(dashboard)` routes → not in landing bundle |
| Observability | `@sentry/nextjs` wired (`withSentryConfig`, behind `SENTRY_DSN`) |
| Security headers | Full CSP, HSTS, COOP/CORP, nosniff, frame-deny |

---

## 🔧 Fixed in this pass

### F1 — Two dead font families on the critical path
- **Problem:** 4 Google font families downloaded on every page (`Inter`, `Geist`, `Plus_Jakarta_Sans`, `JetBrains_Mono`).
- **Root cause:** `Plus_Jakarta_Sans` (`--font-jakarta`) had **zero references** anywhere in the app. `Inter` was only a CSS fallback *behind* Geist, which always loads via `next/font` — so Inter never actually renders.
- **Location:** `apps/web/src/app/layout.tsx`, `apps/web/src/styles/globals.css`.
- **Impact:** ~2 extra font payloads + extra `next/font` CSS vars on the render-blocking path of **every** route. Hurts FCP/LCP, especially mobile.
- **Fix:** Removed `Inter` and `Plus_Jakarta_Sans` imports/instances; kept `Geist` (sans) + `JetBrains_Mono` (mono, `preload:false`). Updated `--font-sans`/`--font-heading` fallback chains to `Geist → system-ui`.
- **Expected improvement:** ~30–40% fewer font bytes; one fewer render-blocking dependency; measurable FCP win on cold loads.

---

## 🟡 Outstanding — Frontend (prioritized, code-level)

### P1 — High client-component ratio (183 / 252 components are `"use client"`)
- **Problem:** ~73% of components ship as client components, inflating hydration JS.
- **Root cause:** Marketing/static sections (`components/home/*`, legal pages, `docs`, `about`, `pricing`) are `"use client"` mostly to use `framer-motion`. Animation-only usage doesn't require the *whole* section to be a client component.
- **Location:** `apps/web/src/components/home/*`, `apps/web/src/app/(about|pricing|docs|terms|privacy|...)`.
- **Impact:** Larger landing hydration bundle → higher TBT/INP on first load.
- **Fix:** Keep page shells as Server Components; isolate motion into small client leaf components (e.g. a `<Reveal>` wrapper) so static copy/markup stays server-rendered. Target the landing route first.
- **Expected improvement:** Smaller homepage JS, lower TBT; supports the "Homepage JS < 150KB" goal.

### P2 — Verify `next/dynamic` coverage for the heaviest leaf widgets
- **Problem:** Only 8 `next/dynamic` usages.
- **Root cause:** Route-splitting already keeps recharts/reactflow off the landing page, but within a route the chart/builder still loads eagerly.
- **Location:** `(dashboard)/analytics/*`, `(dashboard)/strategies/builder`, `components/charts/LiveCandlesChart.tsx`.
- **Impact:** Slower first paint of heavy dashboard routes.
- **Fix:** `dynamic(() => import(...), { ssr:false, loading: <Skeleton/> })` for `LiveCandlesChart`, the ReactFlow builder canvas, and analytics chart panels (skeletons already exist in `components/skeletons/`).
- **Expected improvement:** Faster route-level FCP; chart cost deferred to when visible.

### P3 — Bundle analysis not wired
- **Problem:** No `@next/bundle-analyzer` to track regressions.
- **Fix:** Add analyzer behind `ANALYZE=true`; gate homepage JS budget in CI.
- **Expected improvement:** Prevents future bloat; quantifies P1/P2.

---

## 🟠 Outstanding — Backend / API (`apps/api`)

### B1 — Confirm hot-path DB indexes
- **Target:** queries < 50ms. Verify composite indexes on `Trade(userId, openedAt)`, `Trade(strategyId, openedAt)`, `BrokerAccount(userId)`, copy `(masterId)/(followerId)`, `Notification(userId, isRead)`, `AuditLog(userId, createdAt)`.
- **Fix:** Add missing `@@index` in `schema.prisma` + additive migration; `EXPLAIN ANALYZE` the dashboard/analytics aggregates.

### B2 — N+1 and parallelization
- **Fix:** Audit per-loop awaits in copy-factory / analytics builders; replace sequential `await` with `Promise.all`; ensure Prisma `include`/`select` instead of follow-up queries.

### B3 — Redis cache coverage
- **Target:** >90% hit ratio. Analytics already cache via Redis — extend to marketplace listings, leaderboards, user profiles, market snapshots with short TTL + stampede protection.

### B4 — Response compression + aggregation
- **Fix:** Enable Brotli/gzip at the API edge; add aggregated dashboard endpoint to collapse multiple client calls into one.

---

## 🔵 Outstanding — Infrastructure (deployment track, not a code patch)

These require the hosting/infra environment and can't be applied from the repo alone:

- **Connection pooling:** PgBouncer / Prisma Data Proxy in front of PostgreSQL.
- **CDN:** Cloudflare / Vercel Edge for static assets, fonts, public data (asset caching headers already set).
- **WebSocket scale:** event batching + delta updates on `TradingGateway` (the gateway exists; batching is the enhancement).
- **Load testing:** k6/Artillery scripts for 100→10k concurrent (dashboard, copy-trading, marketplace, analytics flows).
- **Metrics:** OpenTelemetry → Prometheus → Grafana (Sentry already covers errors/traces).
- **Memory-leak watch:** audit `setInterval`/socket/listener cleanup in long-lived services + chart components; 24h soak test.

---

## Suggested sequencing

1. **F1 fonts** ✅ (done)
2. **P2 dynamic charts** + **P3 analyzer** (low risk, measurable)
3. **P1 server-component conversion** of landing (bigger, high payoff for Lighthouse)
4. **B1 indexes** + **B3 cache** (backend latency)
5. **Infra track** (PgBouncer, CDN, k6, Grafana) at deploy time
