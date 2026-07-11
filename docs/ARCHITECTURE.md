# Architecture

Profytron is a pnpm + Turborepo monorepo for a multi-service trading platform.

## Runtime topology

```text
Browser (Next.js apps/web)
  ├── App Router pages + BFF /api routes
  └── Socket.IO client → Nest trading gateway
            │
       NestJS apps/api
            ├── Prisma → PostgreSQL
            ├── Bull → Redis queues (trade, copyfactory, notifications, wallet, agents)
            ├── Modules: auth, trading, copy*, marketplace, wallet, payments, AI, …
            └── Optional HTTP → services/ai :8000, services/backtest :8001
```

## Packages

| Path | Role |
|------|------|
| `apps/web` | Next.js frontend (`profytron`) |
| `apps/api` | NestJS API (`api`) |
| `services/ai` | Python FastAPI AI proxy |
| `services/backtest` | Python FastAPI backtest worker |
| `packages/types` | Shared TypeScript enums/interfaces (`@profytron/types`) |

## Frontend (`apps/web`)

- App Router under `src/app/` (marketing, auth, dashboard, admin)
- Feature UI under `src/components/`
- Client data: TanStack Query, Zustand, Socket.IO
- Styling: Tailwind CSS 4
- BFF routes under `src/app/api/` for broker/trading/analytics proxies where needed

## Backend (`apps/api`)

- NestJS modules under `src/modules/`
- Prisma schema + migrations in `apps/api/prisma/`
- Redis for cache, rate limits, Socket.IO adapter, and Bull queues
- WebSocket gateway in `modules/trading`
- Non-production Swagger at `/api/docs`

## Copy trading

See [COPY_TRADING_ARCHITECTURE.md](./COPY_TRADING_ARCHITECTURE.md) for queue topology, scaling, and failure handling.

## Infra assets

| Path | Role |
|------|------|
| `deploy/` | Nginx, Caddy, Redis, Compose, ECS, Kubernetes manifests |
| `scripts/` | DB backup/restore/verify and rollback helpers |
| `tools/` | Local API supervisor and schema sync helpers |
| `supabase/` | Local Supabase config |
| `.github/workflows/` | CI (test, security, lighthouse) and optional deploy |
