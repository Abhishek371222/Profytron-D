# Production Status (GCP Cloud Run)

Live snapshot as of 2026-07-25. Project: `gen-lang-client-0497144011`, region `asia-south1` unless noted. Full audit trail: `docs/audits/`.

**Database:** Production = Cloud SQL `profytron-postgres`. Local development = Neon or Docker Postgres (`docs/LOCAL_DATABASE.md`). Do not confuse the two.

## 1. Cloud Run Services

| Service | Purpose | URL | Health endpoint |
|---|---|---|---|
| `api` | NestJS backend — auth, trading, payments, WebSocket, BullMQ workers | https://api-y4zmug7lwa-el.a.run.app (also `api-919913292233.asia-south1.run.app`) | `/live`, `/ready`, `/health` (and `/v1/*` aliases) |
| `web` | Next.js frontend, served publicly at www.profytron.com | https://web-y4zmug7lwa-el.a.run.app | `/status`, `/` |
| `ai` | AI/coach service | https://ai-y4zmug7lwa-el.a.run.app | `/health` |
| `backtest` | Backtesting service | https://backtest-y4zmug7lwa-el.a.run.app | `/health` |

`www.profytron.com` is the canonical public domain and routes to `web`, which calls `api` directly from the browser.

## 2. Production Health

**`api` startup probe (current):**
```yaml
startupProbe:
  httpGet:
    path: /ready
    port: 8080
  initialDelaySeconds: 30
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 6
```

**Health endpoints (`api`):**
| Path | Checks |
|---|---|
| `/live` | Process is up. No dependencies. |
| `/ready` | Database (Postgres via Prisma) reachable. |
| `/health` | Database, Redis, BullMQ queue, WebSocket gateway. Returns 503 if DB is down. |

**Current status (2026-07-23):** `api` revision `api-00080-z2s`, **100% traffic**, min-instances=1, max-instances=10. `/live` `/ready` `/health` all **HTTP 200**. Ready:True. No ERROR-severity logs in the last 6h verification window. Current revision became Ready at ~2026-07-23T10:32:06Z (containers healthy in ~30s).

## 2b. Uptime monitoring

| Field | Value |
|---|---|
| Platform | Google Cloud Monitoring (uptime check) |
| Display name | `api-health` |
| Resource | `projects/gen-lang-client-0497144011/uptimeCheckConfigs/api-health-4WLgxIN2gY8` |
| Host | `api-y4zmug7lwa-el.a.run.app` |
| Path | `GET /health` |
| Interval | 60s (1 minute) |
| Timeout | 10s |
| Expected | HTTP 200 |
| SSL | validated |
| Created | 2026-07-23 (no prior uptime check existed) |

**Note:** Continuous multi-hour health charts will accumulate from this monitor going forward. Do not treat the monitor creation time as fabricated historical uptime.

## 3. Environment Summary

**Secret categories** (names in Secret Manager, no values — ~103 secrets total):
- App runtime config (NODE_ENV, ports, CORS, frontend URLs)
- Database (`DATABASE_URL`, `DIRECT_URL`, Cloud SQL passwords)
- Auth/identity (JWT secrets, AES key, Google/GitHub OAuth, Firebase ×2 configs)
- Trading/broker (MetaAPI, admin MT5, master broker/copy-strategy config)
- Payments (Stripe, Razorpay)
- AI providers (OpenAI, OpenRouter, Gemini, HuggingFace, Bedrock)
- Market data (Alpha Vantage, Finnhub, Twelve Data)
- Infra/observability (Redis/Upstash, Sentry, Resend, Telegram)
- Supabase (URL, anon key, service role key)
- Web-only `NEXT_PUBLIC_*` (client-exposed by design)

**Boot-required env vars (`api`, names only):**
`DATABASE_URL`, `DIRECT_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `AES_MASTER_KEY`, `NODE_ENV`, `API_HOST`, `API_PORT`, `REDIS_URL` (or Upstash equivalent) — plus in production: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `CORS_ORIGIN`, `FRONTEND_URL`. Missing/invalid values cause the process to exit at startup (`validateEnv()` in `apps/api/src/main.ts`).

## 4. Sprint Changes (2026-07-21 → 2026-07-22)

**What changed:**
- `api` Cloud Run `startupProbe` switched from `tcpSocket` to `httpGet /ready`, with `initialDelaySeconds: 30`, `periodSeconds: 10`, `timeoutSeconds: 5`, `failureThreshold: 6` (previously `failureThreshold: 1`, no initial delay). No application code, Dockerfile, IAM, secrets, or other Cloud Run settings were touched.

**What was verified:**
- `min-instances=1` on `api` was already correctly configured before this sprint — no redeploy was needed for that requirement.
- The commit deployed to production was confirmed to be legitimate (traced via Cloud Build's git-source resolution to `origin/main`, not a history rewrite).
- Post-change: new revision reached Ready in 38.2s, probe succeeded on first attempt after the 30s delay, `/live` `/ready` `/health` all 200, zero startup probe failures, zero new error logs, old revision remained serving until the new one was confirmed healthy.

## 5. Sprint note (2026-07-23) — uptime ping

**What changed:** Created Cloud Monitoring uptime check `api-health` → `https://api-y4zmug7lwa-el.a.run.app/health` every 60s (timeout 10s, expect 200). No application/redeploy changes.

**What was verified:** Health endpoints 200; revision `api-00080-z2s` at 100%; no ERROR logs in 6h window; no prior uptime check (count was 0).

**Remaining:** Optional alert policy / notification channel for consecutive uptime failures (avoid spam). Multi-hour continuous evidence on the *current* revision is accumulating via the new monitor — not yet a completed multi-hour history at verification time.

## 6. Sprint note (2026-07-23) — Day 4 Cloud SQL + secret plan

**What changed:** Unused Cloud SQL instance `profytron` set to activation policy **NEVER** (state **STOPPED**). Production instance `profytron-postgres` was not modified. Secret rotation was **planned only** (no rotations).

**What was verified:** No Cloud Run / scheduler / Cloud Build instance dependency on public `profytron`; prod API still on private `10.88.0.3`; post-stop `/live` `/ready` `/health` = 200; www + web = 200; Cloud Run services Ready.

**Docs:** `docs/audits/day4-cloudsql-and-secret-rotation-2026-07-23.md`, `docs/audits/secret-rotation-plan-2026-07-23.md`.

**Remaining (out of Day 4):** optional observation window then delete stopped instance; enable PITR/HA on prod (separate approval); execute secret rotations per plan (separate approval); web VPC for private SQL (known gap, not Day 4).

## 7. Sprint note (2026-07-25) — Day 5 Sentry / OTP / email DNS

**What changed:** None in production.

**Verified:**
- API Sentry: `SENTRY_DSN` in SM + Cloud Run + `instrument.ts` + `SentryInterceptor` → **fully configured**.
- `EXPOSE_DEV_OTP`: absent in SM / Cloud Run / local `.env` → production cannot expose OTPs (flag must equal `true`).
- Email DNS checklist started: Resend + `no-reply@profytron.com`; DKIM + DMARC present; **SPF apex missing**.

**Docs:** `docs/audits/day5-sentry-otp-spf-2026-07-25.md`.

## 8. Sprint note (2026-07-25) — Day 6 email DNS + OTP

**What changed:** No DNS or infrastructure changes (Resend domain already verified).

**Verified:**
- Resend domain `profytron.com` = **verified** (DKIM + SPF TXT/MX on `send` subdomain all verified).
- DMARC present (`p=quarantine`).
- OTP E2E: production register → Resend **`delivered`** to `abhiaj371+day6otp…@gmail.com`.

**Docs:** `docs/audits/day6-email-dns-otp-2026-07-25.md`.

## 9. Sprint note (2026-07-28) — Day 7 formal live OTP UAT

**What changed:** None in production. `ALLOW_LIVE_EMAIL_OTP` audited — it only gates the local `product-audit:journeys` script and is not read by `apps/api`/`apps/web`; no production config change needed.

**Verified:** Full production OTP flow (`register` → live Resend email → operator-retrieved OTP → `verify-email` → `login`) executed end-to-end against `https://api-y4zmug7lwa-el.a.run.app`. All steps passed, zero ERROR-severity logs introduced, `/live` `/ready` `/health` remained 200 throughout.

**Docs:** `docs/tracks/D-launch-readiness/evidence/D7_OTP_UAT_20260728.md`.

## 10. Sprint note (2026-08-01) — Day 12 stabilization + uptime alert audit

**What changed (production code + config, deployed):**
- Fixed `ADMIN_MT5_SERVER` Secret Manager value (`"Bitrage Capital Markets"` → `"BitrageCapitalMarkets-Server"`, matching MetaAPI's canonical server string) so `findExistingAccount()` can reuse the already-deployed master account instead of attempting a redundant re-provision (root-caused during Day 9's MetaAPI UAT, fix deferred then, applied now). Secret version 2.
- `apps/api/src/modules/trading/bot-trade-sync.service.ts`: chronically-failing accounts (10+ consecutive sync failures) now back off to a 10-minute retry cadence instead of the previous unbounded ~12s retry, preventing one broken account from consuming the shared MetaAPI rate-limit budget indefinitely. Commit `cf50a65`.
- Added `COOKIE_SECURE=true` (new secret, wired into `cloudbuild-api.yaml`) so session cookies (`refresh_token`, `user_role`, `onboarding_completed`) get the `Secure` flag on every login, independent of `NODE_ENV`. Commit `c8945dc`.

**Verified:**
- Both `bot-trade-sync` fix and `COOKIE_SECURE` fix confirmed live and working via direct log/response evidence (not just deploy success) — see `docs/audits/day12-stabilization-uptime-2026-08-01.md`.
- Full backend test suite: 19/19 suites, 115/115 executed tests pass before each deploy.
- Zero regressions across Platform Trial, AI Coach, Coach Insights, broker accounts, health endpoints.

**New finding, not yet fixed (deliberately parked — see report for why):** `NODE_ENV=development` on the live `api` service. Beyond the cookie issue (fixed above via `COOKIE_SECURE`), this also currently: exposes Swagger docs UI at `/api/docs` (live-confirmed, HTTP 200), disables the HSTS header (live-confirmed absent), disables CSP `upgrade-insecure-requests`, and skips 500-response error-message sanitization. Full `NODE_ENV=production` flip has a wide blast radius (15+ call sites) and needs its own dedicated verification pass.

**New finding, not yet fixed (parked, low severity):** logout's cookie-clearing code checks only `NODE_ENV` (not `COOKIE_SECURE`), so it now omits `Secure` on the clearing `Set-Cookie` while login's now includes it. Verified this does **not** currently cause a functional bug (HTTPS-only traffic means browsers still accept the clear per RFC 6265bis's "Leave Secure Cookies Alone" rule) but is an inconsistency worth aligning later.

**Uptime monitoring gap (verified, not fixed — infra decision, not a code bug):** the `api-health` Cloud Monitoring uptime check is real and running, but **zero alert policies and zero notification channels exist** — a sustained outage would be silently logged with no one notified. Better Stack was never actually configured (still an unchecked item in `D8_SUPPORT.md`).

**Docs:** `docs/audits/day12-stabilization-uptime-2026-08-01.md`.
