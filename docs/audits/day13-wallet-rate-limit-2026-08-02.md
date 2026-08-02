# Day 13 — Wallet Smoke Test + Login/Register Rate-Limit UAT (Production)

**Date:** 2026-08-02  
**Scope:** Production read-mostly UAT only. No code changes. No deploys. No commits/pushes.  
**Project:** `gen-lang-client-0497144011` · region `asia-south1`  
**API base:** `https://api-y4zmug7lwa-el.a.run.app`

---

## Executive Summary

Production API was healthy throughout (`/live`, `/ready`, `/health` all **HTTP 200**, full dependency stack `ok`). **Login and register Nest `@Throttle` rate limits work as coded (5 / 60s per IP)** and return **HTTP 429** with **`Retry-After: 60`**. **Unauthenticated wallet access is correctly denied (401).**  

**Authenticated wallet balance/history/pagination/websocket/IDOR-with-JWT were NOT VERIFIED live** — no production operator credentials were available in this environment. Wallet ownership isolation and negative-balance guards are **code-verified only**.

Two security findings are **live- or code-confirmed**:

1. **User enumeration on login** (live) — unknown emails return a distinct message/`USER_NOT_FOUND` code.
2. **Open public registration** (live) — full-shape `POST /v1/auth/register` returned **201** for a random `@example.invalid` address; `BETA_ALLOWLIST_EMAILS` appears unset/empty in effect.

A third finding is **code-only**: authenticated requests raise throttler limits to **1000** via `AppThrottlerGuard`, which **overrides** stricter method `@Throttle` values on wallet mutation endpoints.

**Final verdict:** ⚠️ **PASSED WITH OBSERVATIONS** (rate-limit + unauth wallet strong; authenticated wallet incomplete; security findings open — no fix applied pending approval).

---

## Environment

| Item | Evidence |
| --- | --- |
| Git branch | `main` (tracks `origin/main`) |
| Local HEAD | `c13eedbd4931607f43c97a150832c973a9c7280d` — `docs: add Day 12 stabilization and Day 12B monitoring reports` |
| Working tree | Clean for tracked sources relative to `main`; many untracked build artifacts (`apps/api/dist`, `apps/web/.next`) present locally — **not** used as production evidence |
| Cloud Run service | `api` |
| Ready revision | **`api-00091-26g`** (100% traffic) |
| Revision Ready | `True` (config + routes Ready `2026-08-02T16:30:35Z`) |
| Image digest | `asia-south1-docker.pkg.dev/gen-lang-client-0497144011/profytron/api@sha256:e98f90dde101d4956859adcadf445cbcf8cbef26d0bc1d1f2517a8e203567ed0` |
| Live `gitSha` (process) | **`3e90f54`** (from `/live` and `/health`) — note: differs from local docs-only HEAD `c13eedb` |
| MASTER_CONTEXT.md | **Not present** in repo |
| PROJECT_STATUS.md | Present (`docs/PROJECT_STATUS.md`) — engineering foundation frozen; Track D continuous |

### Phase 0 — Safety (live)

| Probe | HTTP | App status | Latency (client, first sample) |
| --- | --- | --- | --- |
| `GET /live` | 200 | `ok` | 634 ms (cold-ish first) |
| `GET /ready` | 200 | `ok`, `database: connected`, `redis: skipped` | 116 ms |
| `GET /health` | 200 | `ok`, DB/Redis/queue/websocket healthy, `metaApi: configured` | 118 ms |
| `GET /v1/health` | 200 | same payload family | 94 ms |

**Abort criterion:** not met — production was healthy; UAT proceeded.

---

## Wallet Results

### Endpoints inspected (code)

Controller: `apps/api/src/modules/wallet/wallet.controller.ts`  
Service: `apps/api/src/modules/wallet/wallet.service.ts`  
UI: `apps/web/src/app/(dashboard)/wallet/page.tsx`, `loading.tsx` → `WalletSkeleton`

| Route | Auth | Live result |
| --- | --- | --- |
| `GET /v1/wallet/balance` | JWT | **401** without token; **401** with garbage JWT |
| `GET /v1/wallet/transactions` | JWT | **401** without token |
| `GET /v1/wallet/transaction/:id` | JWT | **401** without token |
| `GET /v1/wallet/billing/:billingId` | JWT | **401** without token |
| `GET /v1/wallet/statement/:year/:month` | JWT | **401** without token |
| Mutations (deposit/withdraw/OTP) | JWT + `@Throttle` | **NOT VERIFIED** live (mutating; no auth session) |

### Unauthenticated access (live)

Representative balance response (curl):

```json
{
  "success": false,
  "statusCode": 401,
  "error": "Unauthorized",
  "code": "ERROR",
  "path": "/v1/wallet/balance"
}
```

- No stack traces / Prisma strings in body (**observed**).
- No access/refresh tokens in body (**observed**).
- Client-measured unauth balance samples: **70–101 ms** (n=5, avg ~85 ms).  
- Cloud Run request latencies for wallet unauth GETs this window: ~**5–15 ms** (server-side `httpRequest.latency`).

### Authenticated access / balance / history / empty wallet / loading / error / pagination

| Check | Status | Evidence |
| --- | --- | --- |
| Wallet endpoint reachable | **PASS** | 401 (auth gate) not 404/5xx |
| Authenticated access works | **NOT VERIFIED** | No production JWT/session available |
| Balance loads | **NOT VERIFIED** | requires JWT |
| Transaction history loads | **NOT VERIFIED** | requires JWT |
| Empty wallet behaviour | **NOT VERIFIED** live; code: `getBalance` returns sums that may be 0 |
| Loading state | **CODE-ONLY** | `loading.tsx` → `WalletSkeleton`; page uses React Query `isLoading` |
| Error state | **CODE-ONLY** | `balanceQuery.isError` + `DashErrorState` |
| Pagination | **CODE-ONLY** | cursor pagination: `limit` default 20, `nextCursor` from `createdAt` (`getTransactions`) |
| WebSocket updates | **CODE-ONLY** | UI subscribes to `transaction_update` via trading socket and invalidates wallet queries — **not exercised live** |
| Server errors during smoke | **PASS** for unauth probes | 401 only; no 5xx observed on wallet paths this session |

### Cloud Run logs during wallet probes

Wallet path logs (freshness ~1h, this session’s unauth GETs): all **401**, server latency ~0.005–0.015s. **No 5xx** on wallet URLs in that sample.

---

## Wallet Security

| Check | Status | Evidence |
| --- | --- | --- |
| User cannot read another wallet | **CODE-VERIFIED / LIVE partial** | All balance/tx queries scope by `req.user.id`. `getTransactionDetail(userId, id)` uses `findFirst({ where: { id, userId } })` → 404 if not owned. `getTransactionByBillingId` returns **403 Forbidden** if `tx.userId !== opts.userId`. **Cross-user IDOR not live-tested** (needs two JWT sessions). |
| IDOR attempts (unauthenticated) | **PASS** | Fake UUID / billing IDs and statement path → **401** before handler data access |
| Negative balance impossible | **CODE-VERIFIED** | Withdrawal/admin force withdraw: advisory lock + `if (amount > available) BadRequest`; deposit DTO `@IsPositive`; withdraw `@Min(500)`. **NOT live-attempted** (destructive/mutating). |
| Unauthorized status | **PASS** | 401 for missing/invalid bearer |
| JWT validation | **CODE-VERIFIED + unauth live** | `JwtStrategy`: blacklist jti, load user state, reject if `!isActive \|\| isSuspended \|\| deletedAt`. Bad JWT → 401 live. **Valid JWT positive path NOT VERIFIED**. |
| Deleted / suspended users blocked | **CODE-VERIFIED** | JWT strategy + `auth.service` login branches (`Account suspended` / deleted message). **NOT live-tested** (no such account fixtures). |

**Unauth wallet smoke did not create deposits, withdrawals, or OTPs.**

---

## Login Results

### Code limits

| Layer | Config | File |
| --- | --- | --- |
| Nest throttle (route) | `@Throttle({ ttl: 60000, limit: 5 })` on `POST /auth/login` | `auth.controller.ts` |
| App fail counter | `MAX_ATTEMPTS = 5`, `LOCKOUT_SECONDS = 15 * 60` keyed by email | `auth.service.ts` `login()` |
| Tracker | IP `ip:…` for anonymous; user id for authenticated | `throttler.guard.ts` |

### Live measurements (clean window after cooldown)

Wrong password against nonexistent email `day13-rate-a@example.invalid`:

| Attempt | HTTP | X-RateLimit-Remaining | Retry-After | Client ms |
| --- | --- | --- | --- | --- |
| 1 | 401 | 4 | — | 944 |
| 2 | 401 | 3 | — | 429 |
| 3 | 401 | 2 | — | 457 |
| 4 | 401 | 1 | — | 446 |
| 5 | 401 | 0 | — | 443 |
| 6 | **429** | — | **60** | 137 |
| 7 | **429** | — | **60** | 137 |
| post | **429** | — | **60** | 122 |

**Cooldown latency (wrong credentials, unthrottled window sample):** 405–648 ms client (n=5, avg ~473 ms). Cloud Run `httpRequest.latency` for successful auth posts ~**0.32–0.35 s**; 429s ~**0.007–0.009 s**.

### Additional login outcomes

| Scenario | HTTP | Notes |
| --- | --- | --- |
| Recovery after ≥60s | **401** with `Remaining=4` | Confirmed after prior lock window |
| Invalid email format | **400** when not IP-throttled | Rate-limit header limit still **5** when returned |
| Legitimate good login | **NOT VERIFIED** | no valid production credentials |
| App-level 15‑minute email lockout message | **NOT VERIFIED live** | IP Nest throttle hits first at 5/60s; code path exists and would return 429 with “Try again in 15 minutes” after 5 fails per email |
| X-Forwarded-For spoof bypass | **FAIL to bypass (good)** | spoofed `X-Forwarded-For` still counted same limit (5×401 then 429) |

### Cloud Run auth logs

Session sample: POST auth responses **400 / 401 / 429** only; **no 500** in the sampled auth window. 429s correlated with UAT bursts.

---

## Register Results

### Code limits

| Layer | Config |
| --- | --- |
| Nest throttle | `@Throttle({ ttl: 60000, limit: 5 })` on `POST /auth/register` |
| Validation | `@IsEmail`, `@IsStrongPassword`, `@Match('password')` confirmPassword |
| Beta gate | `assertBetaAllowlist` only if `BETA_ALLOWLIST_EMAILS` non-empty |
| Duplicate | `409` + `EMAIL_ALREADY_REGISTERED` (or closed-account conflict message) |

### Live measurements

**Validation-fail burst (no usable registration payload):**

| Attempt | HTTP | Remaining | Retry-After | Client ms |
| --- | --- | --- | --- | --- |
| 1–5 | **400** | 4→0 | — | ~94–320 |
| 6–7 | **429** | — | **60** | ~112–128 |

**Full-shape registration (minimal production side-effect):**

| Call | HTTP | Body summary |
| --- | --- | --- |
| `POST /v1/auth/register` valid DTO (random `@example.invalid`) | **201** | `success:true`, message to check email for verification code (keys: `success,data,timestamp`) |

Implications (evidence-based):

- Registration **is open** to arbitrary emails in production (beta allowlist **not enforcing** for this probe).
- At least **one UAT user row was created** as side-effect of the full-shape success path (plus OTP email attempt to a non-inbox invalid domain). A second intentional full-shape register earlier also returned 201 (random `day13-smoke-*@example.invalid`). **Cleanup of these rows is recommended** by an operator (not performed here).

| Check | Status |
| --- | --- |
| Rapid / burst → 429 | **PASS** |
| Cooldown recovery (shared IP with login) | **PASS** (login recovered; register after wait also admitted requests again) |
| Duplicate email → 409 | **NOT VERIFIED live** (second full register after success was blocked when re-attempt tooling failed / later spam reduced; **code path present**) |
| No user duplication under concurrency | **NOT VERIFIED** (would need race harness) |
| Partial / orphaned records | **PARTIALLY OBSERVED** — 201 creates DB user + OTP redis even if email provider cannot deliver to `.invalid` |

**Register validation latency:** ~111–117 ms (bad payload).  
**Full register that hit 201:** ~791 ms client.

---

## Security Findings

### F1 — Login user enumeration (Medium) — LIVE

**Evidence:**

```http
POST /v1/auth/login
HTTP/1.1 401
{"error":"No account found with this email. Create a new account to continue.","code":"USER_NOT_FOUND",...}
```

**Code** (`auth.service.ts`): unknown email → `USER_NOT_FOUND` message; wrong password for existing user → `"Invalid credentials"` / `INVALID_CREDENTIALS`. Distinct codes and messages allow reliable enumeration.

**Recommendation (not applied):** return one generic message and one error code for both cases; keep dummy bcrypt cost.

### F2 — Open registration / beta gate ineffective (Medium) — LIVE

**Evidence:** full-shape register → **201** for `@example.invalid`.  
**Code:** allowlist skipped when env empty.

**Recommendation (not applied):** set `BETA_ALLOWLIST_EMAILS` in Secret Manager for closed beta, or block non-allowlisted domains.

### F3 — Authenticated throttle override weakens method limits (Medium) — CODE

`AppThrottlerGuard.handleRequest` replaces `limit` with **`AUTHENTICATED_LIMIT = 1000`** for any authenticated request. Wallet mutations decorate lower limits (e.g. deposit 5/min, withdraw 3/min) that **will not bind** once JWT is present.

**Recommendation (not applied):** apply elevated limit only to the default app throttler, not to route-level stricter `@Throttle` configs.

### F4 — Public Swagger under non-production `NODE_ENV` (Low–Medium) — LIVE (prior Day 12 residual)

`GET /api/docs` → **200** still. Consistent with Day 12 finding (`NODE_ENV=development` / related).

### Positive security results (live)

| Check | Result |
| --- | --- |
| Rate-limit bypass via `X-Forwarded-For` | **Not successful** |
| Stack traces on wallet/auth UAT responses | **None observed** |
| Token leakage in auth/wallet error bodies | **None observed** |
| Correct 429 + `Retry-After` | **Yes** (`Retry-After: 60`) |
| Rate headers on login/register success path | `X-RateLimit-Limit=5`, `Remaining`, `Reset` |
| 5xx during this UAT window (sampled) | **None** in last **24h** gcloud sample for `httpRequest.status>=500` |

---

## Performance

Client-side timings from this environment (includes client→Cloud Run RTT):

| Endpoint | Samples (ms) | Min | Max | Approx p95 (small n) |
| --- | --- | --- | --- | --- |
| `GET /health` | 475*,91,103,104,97,104,94,109 | 91 | 475* | ~109 (*first likely cold) |
| `GET /live` | 98,97,95,93,84 | 84 | 98 | ~97 |
| `GET /ready` | 118,101,93,92,104 | 92 | 118 | ~104 |
| `GET /v1/wallet/balance` (unauth) | 101,80,70,84,91 | 70 | 101 | ~91 |
| `GET /v1/subscriptions/plans` | 116,112,106,131,114 | 106 | 131 | ~116 |
| `POST /v1/auth/login` (wrong creds) | 405–648 (window) | 405 | 648 | ~450–650 band |
| `POST /v1/auth/register` (validation fail) | 111–117 | 111 | 117 | ~117 |
| `POST /v1/auth/login` when throttled | ~120–140 | — | — | — |

**Cloud Monitoring API p95 time-series:** **NOT VERIFIED** (`gcloud monitoring time-series` not available in this CLI). Day 12B dashboard exists (`dashboards/782d6846-03a0-484b-a0a2-810a8d27f21e`) but was not queried for numeric p95 this session.

**Server-side auth latencies (logs):** ~320–375 ms for bcrypt-bound 401s; ~7–9 ms for 429s.

---

## Logs

| Signal | Finding |
| --- | --- |
| ERROR severity (api, ~6h) | **2 entries** at `2026-08-02T15:35:10Z` (pre-dating this UAT). **Payload text empty in default fields** — root cause message **NOT VERIFIED** without broader payload dump. |
| ERROR severity (api, ~24h list cap) | count of timestamps returned ≈ **2** (same events). |
| 5xx HTTP (24h sample) | **None returned** by gcloud query |
| Prisma / Redis text search | Filter issue in PowerShell quoting → full keyword scan **NOT VERIFIED**; `/health` reports redis/db connected now |
| Auth / wallet UAT traffic | Expected **401 / 400 / 429 / 201**; no 5xx in sampled auth/wallet lines for this session |
| Memory / timeout warnings | **NOT VERIFIED** (not observed in the small log slices pulled) |

---

## Regression

| Feature | Probe | Result |
| --- | --- | --- |
| Platform Trial / plans | `GET /v1/subscriptions/plans` | **200** (~116–375 ms) |
| Health stack | `/live` `/ready` `/health` | **200**, `status:ok`, DB/Redis/queue/WS healthy |
| AI Coach | `GET /v1/coach/conversations` | **401** (auth required; route alive) |
| MetaAPI / broker | `GET /v1/broker/accounts` | **401** (alive); `/health` `metaApi: configured` |
| Payments | `GET /v1/payments` | **404** (no public list — **NOT VERIFIED** as regression vs prior contract; auth payments not hit) |
| Subscriptions surface | via plans | **PASS** |
| Monitoring | Day 12B resources presumed intact | **NOT re-audited**; uptime not re-listed this session |
| Web status | `https://www.profytron.com/status` | **200** |

No evidence of this UAT breaking platform health.

---

## Issues Found

| ID | Severity | Title | Live? | Fix applied? |
| --- | --- | --- | --- | --- |
| D13-1 | Medium | Login user enumeration (`USER_NOT_FOUND` vs `INVALID_CREDENTIALS`) | Yes | **No** (awaiting approval) |
| D13-2 | Medium | Public registration unrestricted (`BETA_ALLOWLIST` ineffective) | Yes (201) | **No** |
| D13-3 | Medium | Authenticated throttler override (1000) nullifies wallet mutation limits | Code | **No** |
| D13-4 | Low–Med | Swagger `/api/docs` public (Day 12 residual) | Yes (200) | **No** |
| D13-5 | Info | Authenticated wallet UAT incomplete (no credentials) | N/A | Blocker for wallet functional sign-off only |
| D13-6 | Info | ≥1 UAT smoke user(s) created under `@example.invalid` during open-registration probe | Yes | Cleanup recommended |
| D13-7 | Info | Two ERROR-severity log lines ~15:35Z unexplained | Partial | Investigate separately |

### If requested to fix D13-1 (template only — not implemented)

- **Root cause:** branch at failed login distinguishes existence.
- **Files:** `apps/api/src/modules/auth/auth.service.ts`
- **Minimal fix:** single message + single error code for both unknown and wrong password.
- **Regression risk:** low (UX copy only).

### If requested to fix D13-2

- **Root cause:** empty `BETA_ALLOWLIST_EMAILS`.
- **Minimal fix:** secret-only allowlist population or deny-by-default.
- **Regression risk:** medium (blocks real signups if misconfigured).

### If requested to fix D13-3

- **Root cause:** `AppThrottlerGuard` forces limit 1000 when `req.user` set.
- **Files:** `apps/api/src/common/guards/throttler.guard.ts`
- **Minimal fix:** only raise limit for the default throttler name; preserve method decorator limits.
- **Regression risk:** medium (may rate-limit heavy authenticated clients).

---

## Production Readiness

| Area | Readiness |
| --- | --- |
| Wallet unauth surface | Ready (denies correctly, low latency) |
| Wallet authenticated UX/API | **Incomplete verification** this day |
| Login IP rate limit | Ready (works, recovers) |
| Login fail lockout (15m email) | Code ready; independent live hit rate **NOT VERIFIED** |
| Register IP rate limit | Ready |
| Closed-beta registration policy | **Not ready** if allowlist was expected |
| Error hygiene on probed paths | Acceptable (no stacks/tokens) |
| User privacy (enumeration) | **Gap** |

---

## Final Verdict

### ⚠️ PASSED WITH OBSERVATIONS

**What clearly works (evidence):** healthy production, unauthenticated wallet denied, Nest rate limits on login/register with correct 429 + Retry-After, rate-limit recovery, spoofed `X-Forwarded-For` does not bypass IP limit, no 5xx during session probes, plans/health regression OK.

**What is incomplete:** full authenticated wallet smoke (balance, history, empty state, live websocket, authenticated IDOR).

**What should be fixed next (await approval — no code changed today):**

1. Login enumeration message/code unification.  
2. Enforce closed-beta registration (or accept open registration consciously).  
3. Fix authenticated throttler override so deposit/withdraw `@Throttle` binds.  
4. Operator cleanup of Day 13 smoke accounts + investigate 15:35Z ERROR pair.

**No production bug fix was applied.** No commit, push, or deploy from this session.

---

## Appendix — Evidence sources

- Live HTTP probes (PowerShell `Invoke-WebRequest`, `curl.exe`) against `api-y4zmug7lwa-el.a.run.app`
- `gcloud run services describe` / `revisions describe` — revision `api-00091-26g`
- `gcloud logging read` — status/latency slices, ERROR timestamps, 5xx sample emptiness
- Source: `wallet.controller.ts`, `wallet.service.ts`, `auth.controller.ts`, `auth.service.ts`, `throttler.guard.ts`, `jwt.strategy.ts`, `all-exceptions.filter.ts`, wallet web page
- Prior audits: Day 12 / 12B for monitoring and residual NODE_ENV notes
