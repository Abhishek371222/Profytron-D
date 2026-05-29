# Profytron Monorepo

Profytron is a multi-service trading platform built as a Turborepo monorepo.
It includes a Next.js web app, a NestJS API, Python microservices for AI and backtesting, and shared TypeScript packages.

## Overview

- Product focus: strategy orchestration, analytics, marketplace, wallet, and affiliate workflows.
- Frontend: Next.js + React + TanStack Query + Tailwind.
- API: NestJS + Prisma + PostgreSQL + Redis + JWT/OAuth.
- Services: Python AI and backtest workers.
- Tooling: pnpm workspaces + turbo + ESLint + TypeScript.

## Repository Layout

```text
.
|-- apps/
|   |-- web/          # Next.js frontend
|   `-- api/          # NestJS backend
|-- services/
|   |-- ai/           # Python AI service
|   `-- backtest/     # Python backtesting service
|-- packages/
|   `-- types/        # Shared TypeScript types
|-- deploy/           # Deployment reverse-proxy configs
|-- supabase/         # Supabase local/deploy config
|-- tools/            # Local diagnostics and supervisor scripts
`-- docker-compose.yml
```

## Prerequisites

- Node.js 20+
- pnpm 10+
- Python 3.10+
- PostgreSQL (local or container)
- Redis (local or container)

Optional:
- Docker / Docker Compose

## Quick Start

### 1) Install dependencies

```bash
pnpm install
```

### 2) Configure environments

Create local env files from templates and fill credentials:

```bash
cp apps/web/.env.example apps/web/.env.local
cp apps/api/.env.example apps/api/.env
```

Minimum expected web envs:

- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_BACKEND_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 3) Prepare database

```bash
pnpm db:migrate
pnpm db:seed
```

### 4) Run services

Core (web + API):

```bash
pnpm dev:all
```

Full stack (web + API + AI + backtest):

```bash
pnpm dev:full
```

## Common Commands

| Command | Purpose |
|---|---|
| `pnpm dev:web` | Run frontend only |
| `pnpm dev:api` | Run Nest API in watch mode |
| `pnpm dev:api:stable` | API dev with supervisor restart strategy |
| `pnpm build` | Build all packages via turbo |
| `pnpm lint` | Run lint across workspace |
| `pnpm format` | Format TypeScript/Markdown files |
| `pnpm db:migrate` | Apply Prisma migrations |
| `pnpm db:seed` | Seed database |
| `pnpm db:studio` | Open Prisma Studio |

## Testing

API tests:

```bash
pnpm --filter api test
pnpm --filter api test:cov
pnpm --filter api test:e2e
```

Set `API_TEST_WITH_INFRA=true` to run the database-backed API suites against real PostgreSQL and Redis.

Web tests (Playwright/config available in app):

```bash
pnpm --filter profytron lint
pnpm --filter profytron build
```

Additional testing docs exist at:

- `TESTING_README.md`
- `DEMO_DATA_VERIFICATION.md`
- `security-tests/`
- `performance-tests/`

## OAuth Notes

Google/Supabase OAuth is configured in the web app callback flow.
If local API is unavailable, the callback includes a fallback continuity mode so social login can still continue locally.
See:

- `OAUTH_SETUP_GUIDE.md`
- `GOOGLE_OAUTH_TROUBLESHOOTING.md`
- `apps/web/src/app/(public)/auth/callback/page.tsx`

## Troubleshooting

### API connection refused (`localhost:4000`)

Symptoms:
- frontend proxy errors
- `ECONNREFUSED` in terminal

Checklist:
1. Start API: `pnpm dev:api`
2. Confirm PostgreSQL is reachable.
3. Confirm Redis is reachable.
4. Re-run migrations: `pnpm db:migrate`

### Lint/build passes but browser shows stale behavior

Restart dev server cleanly:

```bash
# stop running node processes only if needed
pnpm --filter profytron dev
```

Then hard refresh browser.

## Deployment

Deployment and infra references:

- `DEPLOYMENT_CHECKLIST.md`
- `DOMAIN_DEPLOYMENT_GUIDE.md`
- `deploy/nginx.conf`
- `deploy/Caddyfile`

## Security

- Keep secrets in local env files and secret managers only.
- Do not commit private credentials.
- `local-secrets/` is for local-only usage and should remain private.

## License

Private repository. Internal use only unless explicitly relicensed by owners.
