# Contributing

See [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) for setup, workspace rules, and PR checks.

Quick start:

```bash
pnpm install
cp apps/web/.env.example apps/web/.env.local
cp apps/api/.env.example apps/api/.env
pnpm db:migrate && pnpm db:seed
pnpm dev:all
```
