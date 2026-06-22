# Profytron — Launch Blockers (P0 / P1)

Audited commit `12ec8d6`. Items marked **FIXED (this session)** were corrected and the API rebuilt green. Items marked **OPEN** require a database connection, payment sandbox, or product decision and were intentionally not changed at the last minute to avoid unverified financial/DB edits.

---

## P0 — Critical (must resolve before launch)

```
Issue ID: BUILD-1
Title: API build ships a stale Prisma client (clean build fails)
Severity: P0
Area: Backend build/deploy
Evidence: `pnpm --filter api build` failed with 11 TS2339/TS2353 errors
  (emailLog/notificationPreference/notificationLog/Notification.category/isSeen)
  because `apps/api/package.json` build was `nest build` only (no prisma generate).
Reproduction: fresh `pnpm install` → `pnpm --filter api build`.
Impact: API container can fail to build/deploy, or run against a schema-mismatched client.
Root cause: `nest build` does not run `prisma generate`; postinstall generate can be stale.
Required correction: build = `prisma generate && nest build`.
Validation required: clean `pnpm --filter api build` (DONE — green).
Owner: Backend
Status: FIXED (this session)
Launch-blocking reason: backend cannot be reliably built/deployed.
```

> UPDATE (verified against the live production DB, read-only, 2026-06-22): the **production
> database already matches `schema.prisma`** — all tables/columns/enum values below exist in prod.
> DB-1 is therefore **downgraded to P2** (only affects fresh/DR environments built purely from
> migrations; mitigated by the extended supplement). HOWEVER this verification also surfaced a new
> **P0: DB-5** — the production `_prisma_migrations` table has the destructive `full_schema_sync`
> migration in a PENDING/failed state (see below).

```
Issue ID: DB-1
Title: Schema ↔ migration/supplement drift (fresh/DR environments only)
Severity: P2 (was P0; prod DB verified in sync)
Area: Database / migrations
Evidence: schema.prisma defines NotificationPreference (550), NotificationLog (570),
  EmailLog (1313), FeatureFlag (1038), ApiKey (1054), Notification.category/priority/icon/isSeen
  (534-541), enum SubscriptionStatus.PAUSED (80), BrokerName.MT4/MT5 (46-47) — none of which
  appear in any migration/CREATE TABLE or in safe-profytron-supplement.sql. Code uses them at
  runtime (notifications.service.ts:146/216/255/308/351, email.service.ts:328/367).
Reproduction: apply migrations + old supplement to a fresh DB → run app → "relation/column does not exist".
Impact: A fresh deploy / DR restore / staging produces a database that crashes core features
  (notifications, email logging, feature flags, API keys, copy subscription PAUSE).
Root cause: prod DB historically synced via `prisma db push`/manual SQL; migrations + supplement
  drifted from schema.prisma.
Required correction: (a) additive supplement extended in this session with the missing
  tables/columns/enum values (FIXED); (b) STILL REQUIRED: run `prisma migrate status` and
  `prisma db push` (no-data-loss) against a STAGING copy of production and diff; reconcile the
  migration history so it is authoritative for DR.
Validation required: `prisma migrate status` clean on staging; app boots and exercises
  notifications/email/feature-flags/api-keys against the synced DB.
Owner: DB/Backend
Status: PARTIALLY FIXED — supplement extended; live DB reconciliation OPEN
Launch-blocking reason: disaster recovery / fresh environments are broken; silent runtime crashes.
```

```
Issue ID: SEC-1
Title: Committed Supabase project URL + anon key in tracked test script
Severity: P0 (hygiene/exposure)
Area: Security / secrets
Evidence: `.tmp_supabase_sync_test.cjs:5-6` (git-tracked; `.gitignore` only had `*.tmp`, not `.tmp_*`).
Impact: Project ref + anon key exposed in repo/history. Anon key is public-by-design but should
  not be committed; exposure aids targeted abuse if RLS is weak.
Required correction: remove file + untrack + gitignore `.tmp_*` (FIXED); ROTATE the Supabase anon
  key and review RLS policies; purge from git history if repo is/*was* public.
Validation required: `git ls-files .tmp_*` empty; key rotated in Supabase dashboard.
Owner: Security
Status: FIXED in working tree (removed, untracked, gitignored); ROTATION + history purge OPEN
Launch-blocking reason: committed credential material.
```

```
Issue ID: DB-5
Title: Production migration history is in a broken/failed state (destructive migration PENDING)
Severity: P0 (deploy / disaster-recovery)
Area: Database / migrations
Evidence: Read-only query of prod `_prisma_migrations` (2026-06-22) shows
  `20260524130000_full_schema_sync` with finished_at = NULL (PENDING/failed) while LATER migrations
  (20260616xxx, 20260618xxx) are `done`. That migration's own README says "DO NOT RUN: destructive".
Reproduction: connect prod DB → SELECT migration_name, finished_at FROM "_prisma_migrations".
Impact: `prisma migrate deploy` against prod will refuse to proceed (failed migration present) or, if
  forced/resolved wrong, attempt destructive DROPs. The migrate-based deploy/DR path is unusable as-is.
Root cause: history diverged; prod was kept in sync via `db push`/`db:sync` instead of clean migrations.
Required correction: mark the failed row as APPLIED, not rolled-back. Prod already matches
  `schema.prisma` and every LATER migration is `done`, so the destructive SQL must never run.
  `--rolled-back` would tell Prisma to RE-RUN this migration on the next `migrate deploy` (its
  CREATE TYPE/DROP statements would then fail or wipe data) — do NOT use it here. Correct command,
  on a STAGING copy of prod first:
    `prisma migrate resolve --applied 20260524130000_full_schema_sync`
  Then verify `prisma migrate status` is clean and standardize deploys on `migrate deploy` + `db:sync`.
  Also neutralize the migration file for fresh/DR builds (guard its DROPs or replace with the additive
  supplement) so a from-scratch build never executes the destructive statements. Document in the runbook
  that the destructive migration must never be applied. (See LAUNCH_RUNBOOK.md "DB-5 recovery".)
Validation required: `prisma migrate status` clean on staging; a from-scratch DB build (migrations +
  db:sync) reproduces the prod schema exactly.
Owner: DB/Backend
Status: OPEN
Launch-blocking reason: no safe automated migration / disaster-recovery path.
```

```
Issue ID: AUTHZ-1
Title: IDOR — journal entries readable/writable across users; unpublished strategy config leak
Severity: P0
Area: Authorization
Evidence:
  - journal.controller.ts PATCH/POST :id passed only entryId; trading-journal.service.ts
    update/rate/analyze had no userId scope.
  - strategies.controller.ts GET /strategies/:id is @Public(); findById returned full strategy
    (incl. configJson) with no isPublished/owner gate.
  - notifications.service.ts markAsRead read back by id only after a scoped updateMany.
Impact: Any authenticated user could modify/read others' journal + linked trade P&L; anyone could
  read unpublished strategy logic by iterating IDs; notification read-back could return others' rows.
Required correction: enforce ownership (FIXED — journal scoped to userId + trade-ownership on create;
  strategy findById throws NotFound unless published or owner; notification read-back scoped by userId).
Validation required: negative tests (user A cannot mutate user B's entry; anon cannot read
  unpublished strategy). Build green (DONE).
Owner: Backend
Status: FIXED (this session)
Launch-blocking reason: cross-user data exposure/modification.
```

```
Issue ID: SVC-1
Title: Python AI & backtest services unauthenticated and bind 0.0.0.0
Severity: P0 (if reachable) / P1 (if strictly private network)
Area: Service-to-service security
Evidence: services/ai/main.py:47-79, services/backtest/main.py:18-48 — no auth; NestJS calls them
  with no auth header (ai.service.ts:98-107).
Impact: If AI_SERVICE_URL/BACKTEST_SERVICE_URL are reachable beyond the private network, anyone can
  invoke them (cost abuse, resource exhaustion, data exfiltration).
Required correction: put services on a private network only, OR add a shared-secret/mTLS header
  verified by the FastAPI apps and sent by NestJS. Confirm Render private networking.
Validation required: external curl to the service URL is rejected; internal call works.
Owner: Platform
Status: OPEN
Launch-blocking reason: unauthenticated internal services with external exposure risk.
```

```
Issue ID: FIN-1
Title: Marketplace Stripe checkout charges INR-denominated prices as USD
Severity: P0 (financial correctness)
Area: Payments / marketplace
Evidence: marketplace.service.ts:594-618 — amount read from listing.{monthly,annual,lifetime}Price
  (rupees) but Checkout currency = `STRIPE_CURRENCY || 'usd'`; wallet deposits correctly use 'inr'
  (wallet.service.ts:195).
Impact: ₹X charged as $X (≈83× overcharge) unless STRIPE_CURRENCY is set — severe mischarge.
Required correction: derive currency consistently with stored price units (set STRIPE_CURRENCY=inr
  or make currency a property of the listing/plan); add a test asserting currency+unit_amount.
Correction applied (this session): default currency changed from 'usd' → 'inr' in
  marketplace.service.ts:613 so it matches the INR-denominated stored prices and wallet deposits.
  `STRIPE_CURRENCY` still overrides if a different settlement currency is ever required.
Validation required: Stripe test-mode checkout shows correct currency/amount (needs payment sandbox).
Owner: Payments
Status: FIXED in code (this session); sandbox checkout verification still PENDING.
Launch-blocking reason: incorrect financial charges.
```

---

## P1 — High (normally block launch)

```
Issue ID: CFG-1  | Severity: P1 | Area: Deploy/Redis | Status: FIXED (this session)
Title: render.yaml defaulted production to in-memory Redis (REDIS_INMEMORY=true)
Evidence: render.yaml:59-60. Effect: BullMQ trade queue points at 127.0.0.1:6379 (jobs never run),
  Socket.IO scaling/JWT blacklist/locks broken, refresh rotation weakened (auth.service.ts:592-594).
Correction: default flipped to "false"; added GOOGLE_*/SUPABASE_*/TELEGRAM_WEBHOOK_SECRET keys.
Validation required: deploy with real REDIS_URL; confirm queue processes a trade job.
```

```
Issue ID: DEPLOY-1 | Severity: P1 | Area: Deploy | Status: OPEN
Title: No automated DB schema apply on deploy
Evidence: apps/api/Dockerfile:66 CMD `node dist/src/main`; render.yaml has no pre-deploy migrate;
  only railway.toml runs `prisma migrate deploy` (and uses wrong path dist/main + /v1/health).
Correction: add a release/pre-deploy step running `prisma migrate deploy` then `pnpm db:sync`
  (apply supplement), OR an entrypoint wrapper. Do NOT auto-migrate on every instance boot
  (multi-instance race) — use a single release phase.
Validation: deploy to staging applies schema before app starts.
```

```
Issue ID: NET-1 | Severity: P1 | Area: API | Status: FIXED (this session)
Title: Missing `trust proxy` → per-IP rate limiting collapses behind Render/nginx
Evidence: app.setup.ts had no trust proxy; throttler.guard.ts:45 uses req.ip.
Correction: app.getHttpAdapter().getInstance().set('trust proxy', 1).
Validation: rate limits keyed on real client IP behind proxy.
```

```
Issue ID: FIN-2 | Severity: P1 | Area: Payments | Status: FIXED in code (this session); sandbox replay verification PENDING
Title: Razorpay webhook has no event-level idempotency (Stripe does)
Evidence: payments.service.ts handleRazorpayEvent (502-627) vs Stripe Redis lock (401-411);
  activateSubscription (688-727) increments copiesCount/totalRevenue unconditionally.
Impact: webhook retry → inflated revenue/copies counters; possible duplicate side effects.
Correction: mirror the Stripe `redis.set(key,'NX',EX)` dedup keyed on Razorpay event id; make
  counter increments idempotent (key on payment id).
Correction applied (this session): added an NX Redis lock at the top of handleRazorpayEvent keyed on
  `razorpay:event:{eventType}:{entityId}` (EX 86400), returning `{ ok:true, duplicate:true }` on a
  repeat — same pattern as the Stripe handler. (Downstream payment writes are also idempotent via
  unique razorpayPaymentId; see FIN-3.)
Validation: replay same webhook twice → single effect (needs payment sandbox).
```

```
Issue ID: FIN-3 | Severity: P1 | Area: Payments | Status: FIXED in code (this session); sandbox race verification PENDING
Title: Platform subscription activation not atomic; P2002 uncaught on race
Evidence: payments.service.ts:1168-1236 — findFirst idempotency then separate
  payment.create / userSubscription.upsert / user.update outside one transaction.
Impact: paid-without-access if a step fails after payment row exists; concurrent verify+webhook race.
Correction: wrap in a single $transaction; treat unique-violation (P2002) as success/idempotent.
Correction applied (this session): the `payment.create` in activatePlatformSubscriptionFromPayment is
  now wrapped in try/catch — a P2002 on the unique `razorpayPaymentId` (the verify-vs-webhook race that
  slips past the prior findFirst check) returns early as idempotent success instead of bubbling a 500
  that triggers infinite Razorpay retries. (Full single-$transaction wrap of all writes remains a
  recommended follow-up but is no longer launch-blocking.)
```

```
Issue ID: FIN-4 | Severity: P1 | Area: Payments/affiliate | Status: OPEN
Title: Refunds do not reverse affiliate commission / first-deposit bonus; no Stripe refund handler
Evidence: payments.service.ts refund handler debits wallet only (595-602); commission credited at
  1246-1250 with no reversal; only Razorpay `refund.created` handled (no Stripe `charge.refunded`).
Impact: referrer bonuses/commission remain after refunds → ledger drift / abuse.
Correction: on refund, reverse associated commission/bonus idempotently; add Stripe refund handler.
```

```
Issue ID: FIN-5 | Severity: P1 | Area: Ledger | Status: OPEN
Title: All monetary columns stored as Float; some balances via read-modify-write
Evidence: schema.prisma WalletTransaction.amount/balanceAfter (452-459) Float; confirmDeposit
  (wallet.service.ts:244-251) reads then writes balance without advisory lock/event dedup.
Impact: rounding drift; wrong balanceAfter snapshots under concurrency.
Correction: migrate money to integer minor-units (or Decimal); add lock+event-dedup to confirmDeposit.
Note: large change — plan + test; not a last-minute edit.
```

```
Issue ID: AUTH-2 | Severity: P1 | Area: Auth | Status: FIXED (this session)
Title: Suspended users not re-checked on OAuth issue / refresh
Evidence: auth.service.ts issueSessionOrTwoFaChallenge (949-966) and refresh() lack isSuspended
  check (password login checks it at 415-420).
Impact: suspended user can still obtain/rotate tokens via OAuth/refresh (API JwtStrategy does block
  per-request, so impact is limited but inconsistent).
Correction: add suspension check to both paths.
Correction applied (this session): refresh() now throws ACCOUNT_SUSPENDED (FORBIDDEN) after loading the
  user; issueSessionOrTwoFaChallenge (Google/GitHub/Supabase/magic-link) re-queries isSuspended and
  blocks before issuing tokens or a 2FA challenge. Parity with password login. Covered by unit suite
  (50 passed). Validation: suspend a test account → OAuth login and refresh both rejected.
```

```
Issue ID: WEB-1 | Severity: P1 | Area: Frontend auth | Status: OPEN
Title: Client-readable cookies gate routes; hydrate() can show authed state with no token
Evidence: proxy.ts:78-109 (refresh_token/demo_access/user_role cookies, httpOnly:false at
  auth.controller.ts:88-95); useAuthStore.ts:104-108 sets isAuthenticated:true from persisted user.
Impact: cookie forgery exposes admin UI shell / skips onboarding (API still enforces JWT+RolesGuard,
  so no data leak); confusing authed-but-tokenless UI state.
Correction: server-verify admin via API, not user_role cookie; don't set isAuthenticated without a
  valid token/`/users/me` check; ensure NEXT_PUBLIC_ENABLE_MOCK_API is never true in prod.
```

```
Issue ID: WEB-2 | Severity: P1 | Area: Frontend auth | Status: FIXED (this session)
Title: Login & Register pages hard-crash (blank screen) when Supabase env is missing/misconfigured
Evidence: utils/supabase/client.ts:15 called `createBrowserClient(supabaseUrl, supabaseKey)` at
  module-eval time with empty strings when NEXT_PUBLIC_SUPABASE_URL/KEY are absent. `@supabase/ssr`
  throws ("URL and API key are required"), which Next escalates to an uncaught render error — taking down
  the ENTIRE /login and /register pages (no email/password form), not just social login. The code even
  logs "Social login will be disabled" but then created the client unconditionally, defeating its own
  fallback. Discovered via local Playwright run (7/19 specs failed with this root cause).
Impact: any environment where Supabase is unset/misconfigured loses the primary auth pages entirely.
Correction applied (this session): client.ts now exports `supabase: BrowserSupabaseClient | null`
  (null when env is absent, no throw). Call sites guarded: login/register social-login handlers show a
  toast and return; auth callback redirects to /login?error=auth_failed. Email/password auth unaffected.
Validation: full chromium Playwright suite now 19/19 green (was 12/19) with Supabase env intentionally
  unset; production web build passes (94 static pages).
```

```
Issue ID: WEB-3 | Severity: P2 | Area: Frontend UX | Status: FIXED (this session)
Title: Register submit button ignored form validity (enabled with empty/invalid input)
Evidence: register/page.tsx:240 `disabled={isLoading}` only, despite the form already running
  react-hook-form `mode: 'onChange'` + zodResolver (so `isValid` was computed but unused).
Correction applied (this session): button is now `disabled={isLoading || !isValid}`, matching the
  form's own onChange validation. Validated by the two previously-failing Playwright validation specs
  (now passing). Also corrected a stale E2E test that asserted `data-testid` attributes
  (`premium-plan`/`subscribe-button`) that never existed in the pricing markup.
```

```
Issue ID: DB-2 | Severity: P1 | Area: Database | Status: OPEN
Title: Unbounded findMany on growing tables; Payment/Invoice cascade-delete on user
Evidence: analytics.service.ts:181/596/687, marketplace.service.ts:346-356, admin.service.ts:120,
  support.service.ts:56; schema.prisma Payment/Invoice onDelete:Cascade (678-707).
Impact: memory/latency growth as data grows; financial records erased on user delete.
Correction: paginate/aggregate hot paths; change Payment/Invoice to Restrict or soft-delete.
```

```
Issue ID: DB-3 | Severity: P1 | Area: Migrations | Status: OPEN
Title: Destructive `20260524130000_full_schema_sync` migration is a landmine; large Trade index
  cannot use CONCURRENTLY
Evidence: migration README "DO NOT RUN: destructive"; DROP TABLE/NOT NULL adds (166-281);
  20260618120000 creates Trade indexes in-txn.
Correction: never run that migration on prod; apply big indexes via CREATE INDEX CONCURRENTLY in a
  maintenance window before launch traffic.
```

```
Issue ID: REDIS-1 | Severity: P1 | Area: Redis | Status: OPEN (by-design caveat)
Title: Copy/master-sync polling stops on Redis error; snapshots only in Redis
Evidence: redis.service.ts:204-223 (tryRenewableLock returns false on error vs comment), used by
  master-sync.service.ts:78-83 / copy-factory-position-sync.service.ts:75-86; snapshot in Redis
  (master-sync.service.ts:129-133).
Impact: copy trading halts during Redis blips; Redis flush can re-fan-out duplicate copy signals.
Correction: align lock fallback with intent; persist last-processed snapshot/idempotency in DB.
```

```
Issue ID: AUTHZ-2 | Severity: P1 | Area: Authorization | Status: OPEN
Title: Telegram account-link accepts arbitrary chatId without proof-of-control
Evidence: telegram.controller.ts:62-71 → telegram-bot.service.ts:251-273 (stores mapping in audit
  log, first-linker-wins).
Impact: attacker can bind a victim's Telegram chat id to their account (or vice versa).
Correction: require a bot-issued deep-link/one-time code handshake; persist mapping with a unique
  constraint on telegramChatId.
```

> P2/P3 items (JWT iss/aud, backtest look-ahead/divide-by-zero, OTP Redis fallback, CI non-blocking
> audits, uncaughtException keep-alive, unbounded crons, etc.) are catalogued in
> `PRODUCTION_READINESS_AUDIT.md` and are not, by themselves, launch-blocking.
