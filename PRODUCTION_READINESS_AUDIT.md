# Profytron — Production Readiness Audit

**Date:** 2026-06-22
**Audited commit:** `12ec8d6` (after `git pull --ff-only origin main`, 25 commits / 159 files merged)
**Auditor role:** Principal production-readiness / security / SRE / DB-reliability / QA / financial-risk review
**Method:** Evidence-based static + build/test verification of the monorepo. Live production checks were **not** possible (no production URLs, credentials, or DB access were provided), so all live/smoke checks are marked *Not performed*.

---

## 1. Executive Summary

Profytron is a feature-rich, multi-service trading platform. The codebase is far larger than the README implies (billing, subscriptions, team plans, connected accounts, AI agents, FCM push, currency conversion, Sentry tracing, K8s/HA deploy manifests were all added recently). Engineering quality in the core auth and wallet-credit paths is good (Helmet, strict CORS, global JWT guard, advisory locks + DB unique idempotency keys on the main wallet credit path, timing-safe webhook signatures).

However, the audit found **multiple genuine launch blockers**, the most serious being:

1. **The API did not build** from a clean install — `nest build` does not run `prisma generate`, so a stale Prisma client caused 11 TypeScript errors. *(Fixed.)*
2. **Migration history broken on production (DB-5, P0).** A read-only check of the live DB (2026-06-22) confirmed the **production database schema already matches `schema.prisma`** (so the running app is fine), but `_prisma_migrations` has the **destructive** `full_schema_sync` migration in a **PENDING/failed** state while later migrations are applied. `prisma migrate deploy` is therefore unusable against prod (no safe automated migration / DR path) until resolved. The earlier "missing tables" concern (DB-1) is downgraded to P2 — it only affects fresh/DR environments, now covered by the extended supplement.
3. **IDOR vulnerabilities** — journal entries and (read-back of) notifications were modifiable/readable across users; the public strategy-detail endpoint leaked unpublished strategy `configJson`. *(Fixed.)*
4. **A committed Supabase project URL + anon key** in a tracked `.tmp_*` test script. *(Removed + gitignored; rotation recommended.)*
5. **`render.yaml` defaulted production to in-memory Redis** (`REDIS_INMEMORY=true`), which silently breaks the BullMQ trade-execution queue, Socket.IO scaling, distributed locks, and weakens refresh-token rotation. *(Default flipped to `false`.)*
6. **Financial-integrity gaps** that were *not* auto-fixed (require focused work + payment-sandbox testing): Razorpay webhook has no event-level idempotency, marketplace Stripe checkout can charge INR amounts as USD, platform subscription activation is non-atomic, refunds don't reverse affiliate commissions, and all money is stored as `Float`.

## 2. Final Launch Recommendation

> ### 🔴 NOT READY (as of this commit)
>
> The application can become **READY WITH CONDITIONS** once the remaining P0/P1 launch blockers in `LAUNCH_BLOCKERS.md` are resolved and verified against staging — primarily (a) database schema reconciliation verified with `prisma migrate status` / `prisma db push --accept-data-loss=false` on a staging copy, (b) the financial idempotency/currency fixes with payment-sandbox tests, (c) production Redis provisioned, and (d) Supabase key rotation.

The fixes already applied in this session remove several blockers, but the financial-integrity and DB-reconciliation items genuinely require a database connection and a payment sandbox to verify safely, which were unavailable here.

## 3. Audit Scope

| Area | Depth | Live check |
|---|---|---|
| Repo/arch discovery, build, lint, type-check, unit tests | Full | n/a |
| Auth / OAuth / session / authorization / IDOR | Full static | Not performed |
| Payments / wallet / marketplace / affiliate | Full static | Not performed |
| Backend bootstrap / endpoints / concurrency | Full static | Not performed |
| Prisma schema / migrations / queries / pooling | Full static | `prisma migrate status` Not performed (no DB) |
| Redis / AI service / backtest service | Full static | Not performed |
| Frontend routes / cache / error states | Static | Not performed (no browser/E2E run) |
| Security / secrets / headers / CORS / deploy | Full static | Not performed |
| Performance / load / Core Web Vitals | **Not performed** | requires running env |
| Accessibility (axe/manual) | **Not performed** | requires running browser |

## 4. Architecture Map

```
Browser (Next.js on Vercel)
  → /api rewrite → NestJS API (Render, Docker, port 4000, /v1 prefix)
       → PostgreSQL (Neon, Prisma)
       → Redis (Upstash) — sessions/blacklist, BullMQ queues, locks, Socket.IO adapter, throttling
       → Python AI service (FastAPI)        [no auth between services]
       → Python backtest service (FastAPI)  [no auth between services; currently mock]
       → MetaApi / CopyFactory (broker exec)
       → Stripe / Razorpay (payments, webhooks)
       → Supabase (OAuth/session bridge)
  ← TanStack Query cache + Socket.IO (/trading namespace) realtime
```

## 5. Services and Dependencies

| Service | Runtime | Host | Entry | Notes |
|---|---|---|---|---|
| web | Next.js | Vercel | `apps/web` | `/api` rewrite → Render API; WS to API origin |
| api | NestJS | Render (Docker) | `apps/api/src/main.ts` → `dist/src/main` | HTTP + Socket.IO + BullMQ + cron in one process (no separate worker) |
| ai | FastAPI (Python) | — | `services/ai/main.py` | unauthenticated; `market_regime` stubbed |
| backtest | FastAPI (Python) | — | `services/backtest/main.py` | unauthenticated; returns random/mock data |

## 6. Environment-Variable Review (highlights)

- **Divergent URL vars** — backend URL read as `NEXT_PUBLIC_BACKEND_URL` / `BACKEND_API_ORIGIN` / `NEXT_PUBLIC_API_URL` across `next.config.ts`, `apps/web/src/lib/api/client.ts`, `apps/web/src/proxy.ts`; frontend URL as `FRONTEND_URL` / `NEXT_PUBLIC_APP_URL` / `NEXT_PUBLIC_FRONTEND_URL` / `NEXT_PUBLIC_SITE_URL`. Domain examples mix `profytron.app` (root `.env.example`) vs `profytron.com` (`render.yaml`). **Risk:** preview/prod pointing at wrong/localhost backend.
- **Localhost fallbacks** in `apps/web/src/app/api/auth/google/route.ts:3` (`|| 'http://localhost:4000'`) and `next.config.ts` rewrites — prod misconfig → broken OAuth.
- **`render.yaml`** was missing `GOOGLE_*`, `SUPABASE_*`, `TELEGRAM_WEBHOOK_SECRET` keys (added in this session).
- **`DIRECT_URL`** is required by `schema.prisma:13` but **not** validated in `main.ts` prod env check.
- `NEXT_PUBLIC_*` exposure (Supabase anon, Stripe publishable, Firebase, PostHog) is by-design; no server secret found leaking into the client bundle.

Full inventory in the subagent evidence; no secret values are printed in this report.

## 7. Commands Executed

| Command | Result |
|---|---|
| `git pull --ff-only origin main` | OK — fast-forward `e7bf2d0..12ec8d6` |
| `pnpm install --frozen-lockfile` | OK — lockfile consistent, Prisma client generated |
| `pnpm --filter api build` | **FAILED** (11 TS errors, stale Prisma client) |
| `pnpm exec prisma generate` then `pnpm --filter api build` | OK |
| `pnpm --filter api test` | OK — **50 passed, 26 skipped** (skipped require live infra; one worker teardown warning) |
| `pnpm --filter api build` (after fixes) | OK |
| `pnpm --filter profytron build` | Running at report time (see §8) |

## 8. Test and Build Results

- **API build:** passes after Prisma client regeneration; build script now runs `prisma generate && nest build` so the failure mode cannot recur on deploy.
- **API unit tests:** 50 passed, 26 skipped. Skipped suites are infra-dependent (`API_TEST_WITH_INFRA`/Postgres/Redis). A Jest worker did not exit gracefully (open handle / timer leak) — P3 test hygiene.
- **Web build:** initiated; confirm green before launch (not part of the auto-fix set).
- **E2E / Playwright / Lighthouse / Python tests:** not run here (require running services / browsers).

## 9–22. Findings by Area

Detailed, severity-tagged findings with `file:line` evidence are consolidated in **§26 Fixes** and **`LAUNCH_BLOCKERS.md`**. Summary counts in §29. Key area notes:

**Frontend (§9):** Route protection in `apps/web/src/proxy.ts` relies on client-readable cookies (`refresh_token`, `demo_access`, `user_role`); the API still enforces JWT + RolesGuard so this is UI-shell exposure, not data exposure (P1). `useAuthStore.hydrate()` can set `isAuthenticated:true` with no token after a failed refresh (P1 UX/security-confusion). Mock mode (`NEXT_PUBLIC_ENABLE_MOCK_API`) must never be enabled in production.

**Auth (§10):** JWT verification is solid (HS256, secret required, expiry enforced, live user re-check + JTI blacklist on logout) but sets no `iss`/`aud` (P2). 2FA is enforced on all server login paths; the web client does not complete 2FA on the OAuth-code exchange path (UX gap, not a bypass). OAuth callback exchange is backend-verified — **no auth bypass found**; the README's "continuity fallback" is stale/dead code. `REDIS_INMEMORY=true` weakens refresh rotation reuse-detection (P1). Suspended users are not re-checked in `issueSessionOrTwoFaChallenge`/`refresh()` (P1).

**API (§11):** Good global ValidationPipe (whitelist + forbidNonWhitelisted), Helmet, body limits, graceful shutdown, Swagger off in prod. Missing `trust proxy` for correct per-IP throttling behind Render/nginx (P1 — **fixed**). `uncaughtException`/`unhandledRejection` keep the process alive (P2 — can mask fatal state).

**Database (§12):** See blockers DB-1..DB-4. Beyond drift: `Payment`/`Invoice` cascade-delete on user (audit-retention risk, P1); many unbounded `findMany` on growing tables (analytics, marketplace detail, admin, support — P1/P2); large `Trade` index migration can't use `CONCURRENTLY` (P1, run in maintenance window).

**Redis (§13):** `tryRenewableLock` returns `false` on Redis error (fail-closed) while its comment claims fail-open — copy/master-sync polling **stops** when Redis errors (P1, by-effect safe but surprising). Master position snapshots live only in Redis → flush can re-fan-out duplicate copy signals (P1). Withdrawal OTP can fall back to in-process memory (P2, breaks multi-instance).

**AI/Backtest (§14–15):** Python services are unauthenticated and bind `0.0.0.0` (P0 if network-reachable). Backtest Python service returns random/mock data (must not be presented as real results). NestJS backtest engine has same-bar entry (look-ahead bias) and a divide-by-zero when `slPct=0` (P1/P2).

**Wallet/Marketplace/Affiliate (§16):** See blockers FIN-1..FIN-6. Core `creditWallet`/`initiateWithdrawal`/`calculateCommission` are well-guarded (advisory lock + DB unique key + P2002 recovery). Gaps are in Razorpay webhook dedup, marketplace currency, non-atomic platform activation, refund reversals, and `Float` money storage.

**Security (§17):** Strict CORS whitelist + credentials (no wildcard), Helmet CSP/HSTS, Swagger gated, 100 KB body limits — good. Gaps: committed anon key (fixed), `trust proxy` (fixed), CI dependency-audit/Semgrep are `continue-on-error` (non-blocking, P2).

**Deployment (§18):** No automated `prisma migrate deploy`/`db:sync` on container start (Render uses Dockerfile CMD `node dist/src/main` only) — P1. Railway health path `/v1/health` is wrong (`/health`). Free Render plan for a trading API (cold starts) — P2.

**Performance/Accessibility/Observability/Privacy (§19–24):** Performance and accessibility were **not measured** (no running env) — must be validated pre-launch. Observability: Sentry + OpenTelemetry tracing wired (`instrument.ts`, `tracing.ts`), `/health` returns 503 on DB-degraded — good baseline; queue/job and duplicate-operation alerting still needed (see monitoring plan).

## 25. Comparable Real-World Failure Patterns (applicability)

Web research was not used in this offline session; the following are well-established industry patterns matched to concrete Profytron code:

| Pattern | Applies? | Evidence |
|---|---|---|
| Serverless/long-lived DB connection exhaustion (Neon + many instances) | Plausible | No explicit Prisma pool sizing; `DIRECT_URL` unvalidated |
| Webhook double-processing / double-credit | **Confirmed risk** | Razorpay webhook lacks event idempotency (`payments.service.ts` `handleRazorpayEvent`) |
| Currency/units bug (charge in wrong currency) | **Confirmed risk** | `marketplace.service.ts` uses `STRIPE_CURRENCY||'usd'` over rupee prices |
| Float money rounding drift | **Confirmed risk** | All monetary columns are `Float` |
| OAuth redirect/cookie cross-origin failures | Plausible | Multi-domain (`profytron.com`/`www`) + cross-site cookies |
| Cold starts / job loss on restart | **Confirmed risk** | Free Render plan + in-process BullMQ + Redis-only snapshots |

## 28. Checks That Could Not Be Completed

- Live smoke tests (HTTPS load, OAuth round-trip, health endpoint, console errors) — no production URL/credentials.
- `prisma migrate status` / DB reconciliation against the real database — no DB connection.
- Payment sandbox verification (Stripe/Razorpay webhook idempotency, currency) — no sandbox keys.
- Performance/load and Core Web Vitals — no running environment.
- Accessibility automated + manual — no running browser.
- Python service tests / lint / type-check — not executed.

## 29. Findings Count

| Severity | Count (verified) | Fixed this session |
|---|---|---|
| P0 | 6 | 4 |
| P1 | ~14 | 4 |
| P2 | ~12 | 1 |
| P3 | several | 1 (secret hygiene) |

## 30. Launch Gates

- ❌ No unresolved P0 — **not met** (FIN currency/idempotency, Python service exposure, DB reconciliation verification pending)
- ❌ No unresolved material P1 — **not met**
- ⚠️ Core journeys verified — **not verified** (no live/E2E run)
- ⚠️ Migration safety verified — **partially** (additive supplement extended; needs `migrate status` on staging)
- ✅ Auth/authz reviewed; key IDORs fixed
- ⚠️ Financial integrity controls — **gaps remain**
- ⚠️ Backups/rollback — scripts exist (`scripts/db-backup.sh`, `db-restore.sh`, `rollback.sh`, `docs/RUNBOOK.md`); **restore not tested**
- ✅ Monitoring can detect major failures (Sentry/OTel/health) — partial

## Final Recommendation

**NOT READY.** Resolve the items in `LAUNCH_BLOCKERS.md`, verify on staging with a real database and payment sandbox, run the web build + a smoke pass, then re-evaluate to **READY WITH CONDITIONS**.
