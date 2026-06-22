# Profytron — Launch Runbook

Companion to the existing `docs/RUNBOOK.md` (general ops) and `scripts/` (`db-backup.sh`,
`db-restore.sh`, `backup-verify.sh`, `rollback.sh`). This document is the **launch-day** procedure.
Do not launch until `LAUNCH_BLOCKERS.md` P0/P1 items are resolved or explicitly accepted.

---

## A. Before Deployment

1. **Backups**
   - Confirm Neon automated backups + PITR are enabled (provider dashboard).
   - Run `scripts/db-backup.sh` and `scripts/backup-verify.sh` against a staging restore. **Record the restore time** (you cannot claim DR readiness until a restore has actually succeeded).
2. **Environment verification (Render API)**
   - `NODE_ENV=production`, `DATABASE_URL`, `DIRECT_URL`, **`REDIS_URL` set and `REDIS_INMEMORY=false`**.
   - `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `AES_MASTER_KEY` (64 hex), `CORS_ORIGIN`, `FRONTEND_URL` (must be the `www` host).
   - `GOOGLE_CLIENT_ID/SECRET`, `SUPABASE_URL/ANON/SERVICE_ROLE`, `TELEGRAM_WEBHOOK_SECRET` (if those features are on).
   - `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `RAZORPAY_KEY_ID/SECRET`, **`STRIPE_CURRENCY`** (see FIN-1).
3. **Environment verification (Vercel web)**
   - `BACKEND_API_ORIGIN` / `NEXT_PUBLIC_BACKEND_URL` → Render API; `NEXT_PUBLIC_WS_URL` → API origin.
   - **`NEXT_PUBLIC_ENABLE_MOCK_API` is NOT set / false.** Supabase/Stripe publishable keys set.
4. **Schema reconciliation (critical — DB-1)**
   - On a **staging copy** of prod: `prisma migrate status`, then `pnpm db:sync` (applies `safe-profytron-supplement.sql`), then `prisma db push` dry-run/diff to confirm zero drift.
   - Verify notifications, email logging, feature flags, API keys, copy-subscription PAUSE all work.
4b. **Repair broken migration history (critical — DB-5; do BEFORE any `migrate deploy`)**
   - Symptom: `prisma migrate status` reports the migration `20260524130000_full_schema_sync` as **failed**
     (its `finished_at` is NULL in `_prisma_migrations` while later migrations are `done`). Any
     `prisma migrate deploy` will refuse to run until this is resolved.
   - Why `--applied` (not `--rolled-back`): prod already matches `schema.prisma`, this migration was never
     actually executed, and it is **destructive** (recreates enums + DROPs). `--rolled-back` would make
     Prisma re-attempt it on the next deploy (its `CREATE TYPE`s would error / its DROPs could wipe data).
     `--applied` records it as done and runs **no SQL**.
   - **Always rehearse on a fresh staging restore of prod first**, never directly on prod:
     ```bash
     # 1. Inspect the broken row (read-only)
     psql "$DIRECT_URL" -c "SELECT migration_name, started_at, finished_at, rolled_back_at \
       FROM \"_prisma_migrations\" ORDER BY started_at;"

     # 2. From apps/api, mark the failed migration as applied (NO destructive SQL runs)
     cd apps/api
     pnpm exec prisma migrate resolve --applied 20260524130000_full_schema_sync

     # 3. Confirm history is clean
     pnpm exec prisma migrate status        # expect: "Database schema is up to date!"

     # 4. Confirm zero schema drift against the Prisma schema
     pnpm exec prisma db push --skip-generate   # expect: "already in sync, no changes"
     ```
   - After staging passes all four steps, repeat steps 1–4 against prod during the maintenance window.
   - **Neutralize the file for fresh/DR builds:** because the from-scratch path runs every migration,
     guard or replace the destructive statements in
     `apps/api/prisma/migrations/20260524130000_full_schema_sync/migration.sql` (or rebuild fresh DBs via
     `prisma db push` + `pnpm db:sync` instead of replaying this migration) so a DR rebuild never executes
     the DROPs. Validation: a from-scratch DB (migrations + `db:sync`) reproduces the prod schema exactly.
5. **Secrets**
   - Confirm no `.env`/`.tmp_*` tracked: `git ls-files .env* .tmp_*` is empty. Rotate the leaked Supabase anon key (SEC-1).
6. **Build verification**
   - `pnpm install --frozen-lockfile` → `pnpm --filter api build` → `pnpm --filter profytron build` (clear `apps/web/.next` first to avoid stale-cache type errors). Both must be green.
7. **Smoke-test accounts** — prepare an isolated test user (and a second user for IDOR negative tests). Never use real customer accounts/funds.
8. **Rollback target** — note the current Render image/commit and Vercel deployment id to revert to.

## B. Deployment Order (backward-compatible)

1. **Database first** — run schema apply as a **single release step** (not per-instance boot):
   `prisma migrate deploy` then `pnpm db:sync`. Apply large indexes via `CREATE INDEX CONCURRENTLY` in advance (DB-3).
2. **API (Render)** — deploy; wait for `/health` to return 200 (it returns 503 while DB is degraded).
3. **AI service** then **Backtest service** — deploy on the private network with service auth (SVC-1).
4. **Frontend (Vercel)** — deploy last so the UI never calls endpoints the API doesn't have yet.
5. **Workers/cron** — run inside the API process today; confirm BullMQ connects to the real Redis.
6. **Post-deploy verification** — section D.

> Backward compatibility: deploy additive DB changes before code that needs them; deploy old-compatible
> API before the new frontend. Avoid removing columns/endpoints in the same release that stops using them.

## C. After Deployment — Verification

- `/health` 200; DB + Redis reported healthy.
- Auth smoke: email login, Google OAuth round-trip (correct `www` callback), logout invalidates session, protected route survives refresh.
- Core flows (test account): dashboard loads, create/open a strategy, start a backtest (isolated), wallet balance renders, empty states render.
- **IDOR negative tests:** user A cannot PATCH/read user B's journal entry; anon cannot GET an unpublished `/strategies/:id`.
- Payment: one Stripe + one Razorpay test transaction; **replay the webhook** and confirm no double-credit (FIN-2).
- Logs: no stack traces leaked to clients; error rate baseline normal; Sentry receiving events.

## D. Rollback

- **Independently revertable:** Vercel frontend (instant previous deployment), Render API (previous image).
- **Database:** additive supplement changes are non-destructive and safe to leave in place on rollback. **Never** run the destructive `20260524130000_full_schema_sync` migration. If a bad migration was applied, restore from PITR/backup (`scripts/db-restore.sh`) — coordinate downtime.
- **Duplicate jobs during rollback:** pause BullMQ producers (or scale API to 1 instance) before/while rolling back to avoid re-enqueuing copy/trade jobs; rely on jobId idempotency.
- **Post-rollback integrity:** reconcile wallet/affiliate ledgers (sum confirmed IN − OUT vs balances); verify no orphaned PENDING transactions.

## E. Incident Response — First Actions

| Incident | First action |
|---|---|
| Frontend down | Check Vercel status/deploy; roll back to previous Vercel deployment. |
| API down | Check Render logs + `/health`; if DB-degraded, check Neon; roll back image if deploy-related. |
| OAuth failing | Verify `FRONTEND_URL`=www, Google redirect URIs, `GOOGLE_*` env; check callback logs (no token in URL leaks). |
| DB outage | Confirm Neon status; API returns 503 by design; do not restart-loop; enable maintenance banner. |
| Redis outage | Trade queue/locks degrade; copy-sync pauses. Restore Redis; do NOT switch to in-memory in prod. |
| AI/Backtest outage | User sees safe failure; verify service auth/network; restart service. |
| Elevated 500s | Check Sentry top issue + correlation id; identify deploy; roll back. |
| Wallet inconsistency | Freeze affected withdrawals; reconcile ledger from transaction history; check webhook duplicates. |
| Cross-user access report | Identify endpoint; confirm ownership check; hotfix + rotate any exposed data; audit logs. |
| Exposed secret | Rotate immediately (Supabase/JWT/Stripe/Razorpay/AES); invalidate sessions if JWT secret. |
| Bad migration | Stop deploys; restore from PITR; never force the destructive sync migration. |
