# DB-5: `20260524130000_full_schema_sync` (neutralized)

**Do not restore or re-run the original destructive SQL.**

## What happened

Prisma generated a full-schema sync against a legacy unrelated database. The
original `migration.sql` contained `DROP TABLE` / `DROP TYPE` for non-Profytron
tables. Running it against production would be catastrophic; it failed/PENDING
in migration history on some environments.

## Resolution

1. `migration.sql` is now a **no-op** (`SELECT 1`) so `prisma migrate deploy` is safe.
2. If an environment still shows this migration as **failed** or needs it marked
   without re-applying schema changes:

```bash
pnpm exec prisma migrate resolve --applied 20260524130000_full_schema_sync
```

3. Prefer incremental migrations + `pnpm db:sync` (`tools/apply-safe-schema-sync.mjs`)
   for any remaining drift.

## Deploy

`apps/api/docker-entrypoint.sh` runs `prisma migrate deploy` before serving
traffic and **fails closed** in production if migrate fails.
