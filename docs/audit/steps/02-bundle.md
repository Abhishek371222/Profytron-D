# Step 2 — Bundle Analysis

**Evidence:** `docs/audit/data/bundle/chunk-sizes.json`, `docs/audit/data/bundle/client.html`, `docs/audit/data/bundle/build-log.txt`, `docs/audit/data/repo-inventory.json`  
**Build:** `ANALYZE=true pnpm --filter profytron build` — **BUILD_EXIT:0**, elapsed ~239s

## Measured totals (production webpack output)

| Metric | Value |
|--------|-------|
| Static JS files | 263 |
| Static JS total (uncompressed on disk) | **6857 KB (~6.7 MB)** |
| Static CSS total | **399 KB** (one dominant CSS chunk **379 KB**) |
| Largest JS chunk | `1312-*.js` **486.5 KB** |
| Framework chunk | `framework-*.js` **185.6 KB** |
| Main chunk | `main-*.js` **244.6 KB** |
| Dashboard layout chunk | `app/(dashboard)/layout-*.js` **93.8 KB** |
| Dashboard page chunk | `app/(dashboard)/dashboard/page-*.js` **78.0 KB** |
| Polyfills | **110 KB** |

## Largest dependencies (risk ranking)

| Dependency | Version | Files importing | Risk |
|------------|---------|-----------------|------|
| framer-motion | 11.18.2 | 100 | High — near-universal client import |
| three | 0.185.1 | auth earth + FloatingLines | High on `/login` |
| firebase | 12.15.0 | FCM / auth paths | High if eagerly loaded |
| recharts | 3.8.1 | 15 | Medium — partially dynamic-imported |
| reactflow | 11.11.4 | builder store types | Medium — likely underused |
| socket.io-client | 4.8.3 | 3 modules | Medium |
| @sentry/nextjs | 10.57.0 | instrumentation | Medium |
| posthog-js | 1.386.6 | provider | Medium |
| d3 | 7.9.0 | globe | Medium if full import |
| TradingView | CDN | markets | Runtime, not webpack |

## Dynamic imports already in place

Dashboard OverviewPerformance, markets TradingView chart, marketplace FeaturedRow/table, analytics equity chart, landing sections, LazyChatbotWidget, AuthGlobeWebGL, BrokerConnectModal.

## Tree-shaking / optimizePackageImports

Configured for lucide, recharts, framer-motion, TanStack Query, gsap, three, reactflow, socket.io-client, zustand, etc. Still insufficient to offset framer-motion breadth.

## Playwright transfer reality (dev server)

| Route | Resource transfer |
|-------|-------------------|
| `/` | **9081 KB** |
| `/login` | **8234 KB** |
| `/dashboard` (authed) | **8234 KB** |

Dev transfers are inflated vs production gzip, but confirm heavy client payloads.

## Recommended reductions (Phase 2 — do not implement now)

1. Gate framer-motion behind route-level dynamic import; replace trivial fades with CSS.
2. Keep three.js strictly on auth/marketing routes (already mostly true) — verify not pulled into dashboard shared layout.
3. Replace or lazy-split recharts; consider lightweight-charts for trading panes.
4. Audit firebase import graph — load FCM only after login.
5. Remove or isolate reactflow until strategy builder is real.
6. Split the **379 KB CSS** blob; purge unused Tailwind.
7. Prefer production `start` measurements for CI budgets (see Step 26).

## Analyzer artifacts

- `docs/audit/data/bundle/client.html`
- `docs/audit/data/bundle/nodejs.html`
- `docs/audit/data/bundle/edge.html`
