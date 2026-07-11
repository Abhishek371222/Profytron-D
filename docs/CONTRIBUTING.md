# Contributing

## Setup

1. Install Node.js 20+ and pnpm 10+.
2. From the repo root: `pnpm install`
3. Copy env templates:
   - `cp apps/web/.env.example apps/web/.env.local`
   - `cp apps/api/.env.example apps/api/.env`
4. Prepare DB: `pnpm db:migrate` then `pnpm db:seed`
5. Run core stack: `pnpm dev:all`

## Workspace rules

- Package manager is **pnpm** only (`pnpm-lock.yaml`). Do not commit `package-lock.json`.
- Prefer feature folders under `apps/web/src` and Nest modules under `apps/api/src/modules`.
- Do not commit secrets. Use local env files and the platform secret store.

## Checks before opening a PR

```bash
pnpm --filter profytron lint
pnpm --filter profytron exec tsc --noEmit
pnpm --filter api lint
pnpm --filter api exec tsc --noEmit -p tsconfig.build.json
pnpm --filter api test --passWithNoTests
```

Optional full build:

```bash
pnpm build
```

## Code style

- Format: `pnpm format` (Prettier for `ts`/`tsx`/`md`)
- Match existing patterns in the file you touch
- Keep UI, APIs, auth, trading, and payments behavior unchanged unless the PR is explicitly a product change

## Docs

Living docs:

- [README.md](../README.md) — quick start
- [ARCHITECTURE.md](./ARCHITECTURE.md) — system layout
- [DEPLOYMENT.md](./DEPLOYMENT.md) / [RUNBOOK.md](./RUNBOOK.md) — ops
- [API_REFERENCE.md](./API_REFERENCE.md) — API entry points
