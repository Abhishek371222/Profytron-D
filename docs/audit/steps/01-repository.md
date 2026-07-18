# Step 1 — Repository Audit

**Evidence:** `docs/audit/data/repo-inventory.json`, package manifests, source inspection  
**Date:** 2026-07-18  
**Stack status:** Live local — Neon Postgres + Upstash Redis + MetaApi (london) + web:3000 + api:4000 + ai:8000 + backtest:8001

## Folder structure

```
apps/web          Next.js 16.2.2 + React 19.2.4 (App Router, webpack)
apps/api          NestJS 11 + Prisma 5.22 + Bull + socket.io
services/ai       FastAPI AI engine (Hugging Face / OpenRouter)
services/backtest FastAPI backtest/Monte Carlo
docs/             Architecture + runbooks
deploy/           nginx, Caddy, k8s, compose
performance-tests k6 scripts (k6 binary NOT installed locally this run)
supabase/         local/deploy config
tools/            diagnostics + this audit harness (tools/audit/)
```

## Framework versions

| Layer | Version |
|-------|---------|
| Next.js | 16.2.2 |
| React / React DOM | 19.2.4 |
| NestJS | ^11.0.1 |
| Prisma | 5.22.0 |
| pnpm | 10.33.0 |
| Node | 20.20.2 |
| Turbo | latest |

## Rendering strategy

- Entire `(dashboard)/*` tree is **`'use client'`** (65/76 pages client).
- Only 11 server pages (marketing shells, login wrapper, auth callback, brokers/blog metadata).
- `(dashboard)/layout.tsx` is Server Component with `dynamic = 'force-dynamic'`, wrapping `DashboardLayoutClient`.
- No Server Actions (`'use server'` absent).
- React Compiler enabled (`reactCompiler: true`).
- Production `output: "standalone"` (non-Vercel).

## State management

- **TanStack Query v5** — server state (60s default stale in QueryProvider; dashboard widgets use 60s poll).
- **Zustand v5** — `useAuthStore` (persist `profytron-auth`), `useUIStore`, `useTutorialStore`, `useWorkspaceBootstrapStore`, `useBuilderStore`.
- No Redux. Minimal React Context (Radix internals only).

## API architecture

- Dual path: Next Route Handlers (29, `runtime=nodejs`, `force-dynamic`) for broker/trading/market/analytics hot paths + catch-all rewrite `/api/:path*` → Nest `/v1/:path*`.
- Nest global prefix `/v1`, gzip compression (1KB), helmet, JWT + throttler guards, TransformInterceptor envelope.

## Authentication

- JWT access token + refresh; Redis blacklist; Supabase/Firebase/Google OAuth paths.
- Session settle gate: `sessionReady` delays dashboard queries after login to avoid first-request 401 flash.

## Database

- Neon Postgres via Prisma (`DATABASE_URL` pooled, `DIRECT_URL` direct).
- Live counts at audit: **7 users** (6 existing + 1 audit demo), **4 BrokerAccount**, **151 Trade**, EquitySnapshots present.

## MetaApi / MT5

- **No `metaapi.cloud-sdk`** — REST via axios in `metatrader.adapter.ts` + `metaapi.cloud-copyfactory-sdk`.
- All I/O is **REST polling** (not webhooks/streaming).
- Live accounts: 2 DEPLOYED+CONNECTED in **london** region.

## AI Coach

- Nest `coach` module + socket `/coach` + Python FastAPI `services/ai`.

## WebSockets

- Nest gateways `/trading` and `/coach` with Redis adapter.
- Web: shared singletons `trading-socket.ts`, `coach-socket.ts`; **wallet page opens ad-hoc `io()`**.

## Background jobs / queues

- Bull queues: `trade_execution`, DLQ, `copyfactory_sync`, `withdrawal-processing`, `notifications_dispatch`, `agent_workforce`.
- Pollers: master sync ~3s, bot sync ~8s, CopyFactory ~5s, account history ~60s, market price broadcast 8s.
- Health reported `queue: degraded` during audit (Redis Bull ping path).

## Caching

- Redis (ioredis) cache-aside + locks; in-memory MetaApi equity TTL **30s**; analytics Redis TTLs 30s–2m; marketplace/strategies/leaderboard caches.

## Design system / libraries

- Tailwind v4 + base-ui/shadcn (`base-nova`), lucide-react.
- Animation: framer-motion (**100 files**), gsap (1), lenis (landing), three.js (auth earth), canvas-confetti.
- Charts: recharts (**15 files**), TradingView CDN embed, d3 globe JSON.

## Feature flags / env

- `feature-flags` Nest module; `AGENTS_ENABLED`, `EXECUTION_MODE`, `METAAPI_*`, `NEXT_PUBLIC_ENABLE_MOCK_API`, optional Datadog/Sentry/OTEL.

## Circular dependencies (madge)

1. copy-factory → provisioning → notifications → trading  
2–3. `api/client.ts` ↔ `useAuthStore` ↔ `auth.ts`
