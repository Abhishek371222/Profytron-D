# Day 13 — Final Validation

**Date:** 2026-08-02  
**Scope:** Close remaining Day 13 UAT gaps without regressing the deployed user-enumeration fix (`e336e3e`).  
**Production API:** `https://api-y4zmug7lwa-el.a.run.app`  
**Live revision (this validation):** `api-00093-rvg` · process `gitSha` **`e336e3e`** (enumeration fix still live)

---

## What was verified

### 1. Authenticated wallet (test harness)

Production operator JWT **not available** in this environment (no secrets/hardcoded credentials). Coverage is via unit tests that always run, plus optional HTTP integration when `API_TEST_WITH_INFRA=true`.

| Check | Evidence |
| --- | --- |
| History route name | **`GET /v1/wallet/transactions`** (there is no `/wallet/history`) |
| `getBalance` scopes by `userId` | `wallet.service.spec.ts` |
| Empty wallet → zeros | unit + (infra) API empty-user case |
| History filtered by caller | unit + (infra) two-user deposit case |
| Foreign `transaction/:id` | **404** via `findFirst({ id, userId })` (IDOR-safe miss) |
| Foreign `billing/:billingId` | **403** when `tx.userId !== caller` |
| Unauthenticated wallet | **401** — re-verified in production this session |
| Cross-user live production JWT IDOR | **NOT VERIFIED live** — requires operator credentials (commands below) |

### 2. Day 13 observations reclassification

| ID | Original finding | Classification | Action this task |
| --- | --- | --- | --- |
| D13-1 | Login user enumeration | **Security Critical** (was) | **Already fixed** in `e336e3e` and live-verified again (`INVALID_CREDENTIALS` / “Invalid email or password.”) |
| D13-2 | Open registration (`BETA_ALLOWLIST` empty) | **Recommended Improvement** (product/ops closed-beta policy) | **Deferred** — secret/config only; not a code bug in auth responses |
| D13-3 | Auth throttler override nullifies `@Throttle` | **Resolved / intent fulfilled** | Code on `main` only elevates when `limit === MODULE_DEFAULT_LIMIT` (100). Stricter wallet route limits (e.g. deposit 5) are preserved for JWT users. Guarded by `throttler.guard.spec.ts` |
| D13-4 | Public Swagger `/api/docs` | **Recommended Improvement** (ops `NODE_ENV`) | **Deferred** — Day 12 residual, not critical wallet/auth path |
| D13-5 | Authenticated wallet incomplete | **Info / testing gap** | Closed via automated tests; production JWT still optional |
| D13-6 | UAT smoke users `@example.invalid` | **Recommended Improvement** (ops cleanup) | **Deferred** |
| D13-7 | Unexplained ERROR logs ~15:35Z | **Recommended Improvement** (ops) | **Deferred** |

**No additional Security-Critical fixes implemented** (user-enumeration already shipped; nothing else in that class required a code change today).

### 3. Authentication rate limits (production re-spot)

| Probe | Result |
| --- | --- |
| `POST /v1/auth/login` (unknown email) | **401**, `X-RateLimit-Limit: 5`, `Remaining: 4`, body code **`INVALID_CREDENTIALS`** message **Invalid email or password.** |
| `POST /v1/auth/register` (invalid body) | **400**, `X-RateLimit-Limit: 5`, `Remaining: 4` |
| Authenticated throttle override | **Not unconditional** — see `AppThrottlerGuard` source + unit guard tests |

Full 5→429 burst was proven on Day 13 UAT earlier; this pass was a light re-spot to avoid re-burning the IP window.

### 4. Regression smoke (production)

| Endpoint | HTTP |
| --- | --- |
| `/live` | 200 · `gitSha e336e3e` |
| `/health` | 200 |
| `/ready` | 200 |
| `/v1/subscriptions/plans` | 200 |
| `/v1/wallet/balance` | 401 unauth |
| `/v1/wallet/transactions` | 401 unauth |
| `/v1/coach/conversations` | 401 |
| `/v1/broker/accounts` | 401 |

### 5. User-enumeration fix regression

Confirmed **not** regressed: login failure client message remaining **Invalid email or password.** / `INVALID_CREDENTIALS` (not `USER_NOT_FOUND`).

---

## What was fixed

| Change | Purpose |
| --- | --- |
| `apps/api/src/modules/wallet/wallet.service.spec.ts` | Unit tests: balance scope, empty wallet, history filter, IDOR 404/403 |
| `apps/api/src/modules/wallet/wallet.security.api.spec.ts` | Optional infra HTTP smoke + multi-user IDOR (skipped without `API_TEST_WITH_INFRA=true`) |
| `apps/api/src/common/guards/throttler.guard.spec.ts` | Prevent regression of unconditional authenticated limit override |
| This document | Day 13 close-out |

**No production code paths changed for wallet/auth behaviour** in this close-out (enumeration fix left intact).

---

## Remaining deferred items

1. **Production JWT wallet UAT** — run once credentials are available (commands at end of this doc).  
2. **`BETA_ALLOWLIST_EMAILS`** — ops decision for closed beta.  
3. **`NODE_ENV` / Swagger public** — Day 12 residual.  
4. **Cleanup Day 13 smoke users** / **ERROR log investigation** — ops.  
5. **Infra wallet HTTP suite** — run with `API_TEST_WITH_INFRA=true` against local/test DB when that env is configured.

---

## Test results

| Suite | Result |
| --- | --- |
| `wallet.service.spec` + `throttler.guard.spec` + `auth.service.spec` | **3 passed suites**, **27 passed** tests; `wallet.security.api` **1 suite skipped** (infra off) |
| Full API `jest --runInBand` | **24 passed suites**, **146 passed** tests, 7 suites / 35 tests skipped (infra-gated), exit 0 |

---

## Production readiness verdict

**Day 13 Complete** for engineered verification + deferred non-critical observations.

Justification:

- Wallet authz/ownership is covered by automated tests (unit always; HTTP IDOR when infra enabled).  
- Unauthenticated wallet remains **401** in production.  
- Login/register rate-limit headers still enforce **limit=5**.  
- User-enumeration fix remains live and re-verified.  
- Authenticated throttle override finding is **superseded** by current guard code + regression test.  
- No Security-Critical unfixed issues remain **without** an owner decision (open signup is product config).

---

## Commands once production credentials available

```bash
# Export only via local env — do not commit secrets
export PROFYTRON_UAT_EMAIL='...'
export PROFYTRON_UAT_PASSWORD='...'
BASE=https://api-y4zmug7lwa-el.a.run.app

TOKEN=$(curl -sS -X POST "$BASE/v1/auth/login" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$PROFYTRON_UAT_EMAIL\",\"password\":\"$PROFYTRON_UAT_PASSWORD\"}" \
  | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{console.log(JSON.parse(d).data.accessToken)})")

curl -sS -H "Authorization: Bearer $TOKEN" "$BASE/v1/wallet/balance"
curl -sS -H "Authorization: Bearer $TOKEN" "$BASE/v1/wallet/transactions"
# Optional second account token for IDOR spot-check against a known foreign billingId/transaction id
```

Local full wallet HTTP suite:

```bash
cd apps/api
# Requires test DB + Redis per createTestApp / CI docs
set API_TEST_WITH_INFRA=true
node ./node_modules/jest/bin/jest.js --runInBand --testPathPatterns=wallet.security.api
```
