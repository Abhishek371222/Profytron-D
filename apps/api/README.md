# Profytron API (NestJS)

Backend service for authentication, user management, trading, analytics, marketplace, payments, wallet, notifications, and websocket features.

## Stack

- NestJS 11
- Prisma ORM
- PostgreSQL
- Redis
- JWT + OAuth integration
- Stripe integration

## Run Locally

From repository root:

```bash
pnpm --filter api install
pnpm --filter api build
pnpm --filter api start:dev
```

Or using root shortcut:

```bash
pnpm dev:api
```

## Environment

Create API env file:

```bash
cp apps/api/.env.example apps/api/.env
```

Typical required variables include:

- `DATABASE_URL`
- `REDIS_HOST` / `REDIS_PORT`
- `JWT_*`
- `STRIPE_*`
- provider keys used by enabled modules

## Database

From root:

```bash
pnpm db:migrate
pnpm db:seed
pnpm db:studio
```

## Scripts

From root:

- `pnpm --filter api start:dev`
- `pnpm --filter api start:dev:trace`
- `pnpm --filter api build`
- `pnpm --filter api lint`
- `pnpm --filter api test`
- `pnpm --filter api test:cov`
- `pnpm --filter api test:e2e`

Set `API_TEST_WITH_INFRA=true` to enable the database- and Redis-backed API integration specs. Without that flag, the infra-heavy suites are skipped so the test command stays runnable on machines without Docker.

## Module Areas

- `src/modules/auth`
- `src/modules/users`
- `src/modules/trading`
- `src/modules/analytics`
- `src/modules/marketplace`
- `src/modules/payments`
- `src/modules/wallet`
- `src/modules/notifications`
- `src/modules/admin`

## Notes

- In local development, if Redis/PostgreSQL are down, some API endpoints and refresh flows will fail.
- Web app includes OAuth continuity fallback for local workflows when backend sync is unavailable.

## License

Private repository. Internal use only.
