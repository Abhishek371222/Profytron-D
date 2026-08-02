# Day 13 — User Enumeration Fix

**Date:** 2026-08-02  
**Issue:** Day 13 UAT F1 — login user enumeration (Medium)  
**Scope:** Client-visible authentication failure responses on password login only  
**Deploy branch:** `main`

---

## Root cause

`AuthService.login()` returned **different HTTP status codes, messages, and error codes** depending on account state:

| Condition | Before | After |
| --- | --- | --- |
| Unknown email | 401 + `USER_NOT_FOUND` + “No account found…” | 401 + `INVALID_CREDENTIALS` + “Invalid email or password.” |
| Wrong password | 401 + `INVALID_CREDENTIALS` + “Invalid credentials” | same unified response |
| Deleted / inactive (`isClosedAccount`) | **403** + `USER_NOT_FOUND` + deleted message | 401 + unified response |
| Suspended | **403** + `ACCOUNT_SUSPENDED` + “Account suspended” | 401 + unified response |

Attackers could probe whether an email was registered (and sometimes account status) from response differences alone.

---

## Files changed

| File | Change |
| --- | --- |
| `apps/api/src/modules/auth/auth.service.ts` | Unify login failure client responses; keep `logger.warn` with precise internal reason |
| `apps/api/src/modules/auth/auth.controller.ts` | Swagger docs for login 401/403 descriptions only |
| `apps/api/src/modules/auth/auth.service.spec.ts` | Narrow unit tests for indistinguishable failures |

---

## Functions changed

- **`AuthService.login`** — only failure-response branches for closed/deleted, missing user / bad password / missing hash, and suspended. Fail counters, bcrypt dummy compare, rate limits, 2FA, tokens, email-unverified behaviour, registration, OTP, refresh, OAuth, magic link — **unchanged**.

Email-not-verified still returns **403** `EMAIL_NOT_VERIFIED` after a **correct** password (deliberate product UX; out of Day-13 enumeration finding which targeted existence leaks on credential failure paths). Suspended/deleted no longer surface distinct status via failed login.

---

## Why the change is safe

1. **Minimal surface** — single method, client-facing fields only.  
2. **Status code unification** — all listed credential/account-state failures use **401** so status itself does not enumerate.  
3. **Single error code** — `INVALID_CREDENTIALS` only in client body for those paths (no `USER_NOT_FOUND` / `ACCOUNT_SUSPENDED` to clients).  
4. **Internal observability retained** — `this.logger.warn(\`Login rejected: <reason> email=…\`)` before throw.  
5. **Timing posture preserved** — still runs `bcrypt.compare` (including dummy hash) before failing.  
6. **No crypto / rate-limit / JWT / wallet changes**.

---

## Tests

| Suite | Result |
| --- | --- |
| `tsc --noEmit -p tsconfig.build.json` | **PASS** |
| `auth.service.spec` + `auth.controller.spec` | **18/18 PASS** (includes 5 new enumeration cases) |
| Full API jest suite | See deploy session log |

New cases assert identical `status`/`message`/`code` for: unknown email, wrong password, deleted, disabled (`isActive:false`), suspended.

---

## Regression evidence (live post-deploy)

| Probe | Result |
| --- | --- |
| `GET /health` | **200** |
| `GET /live` | **200**, `gitSha: e336e3e` |
| `GET /ready` | **200** |
| `GET /v1/subscriptions/plans` (Platform Trial surface) | **200** |
| `GET /v1/wallet/balance` | **401** (auth required) |
| `GET /v1/coach/conversations` | **401** |
| `GET /v1/broker/accounts` | **401** |
| Monitoring stack | not reconfigured; health `ok` / WS healthy |
| MetaAPI | `/health` `metaApi: configured` |

No regressions observed on these checks.

---

## Live production evidence

### Pre-fix (Day 13 UAT)

Unknown email → `401` + `USER_NOT_FOUND` + “No account found with this email…”

### Post-fix (revision `api-00092-lw6`, `gitSha e336e3e`)

| Scenario | HTTP | `code` | `error` | Client ms (approx) |
| --- | --- | --- | --- | --- |
| Unknown email (`day13-enum-unknown-*@example.invalid`) | 401 | `INVALID_CREDENTIALS` | `Invalid email or password.` | 592 |
| Wrong password (probed address) | 401 | `INVALID_CREDENTIALS` | `Invalid email or password.` | 583 |

Bodies identical in status / code / message shape (only requestId/timestamp differ).

Register validation (unchanged): incomplete DTO still → **400** `VALIDATION_ERROR` with field messages.

| Check | Status |
| --- | --- |
| Successful login | **NOT VERIFIED** in this session (no production operator credentials on hand); unit tests cover success path |
| OTP / verify-email / forgot-password | **NOT re-exercised live**; code paths untouched |
| Deleted / suspended accounts | **CODE + unit tested**; no live fixtures available |

---

## Risk assessment

| Risk | Level | Mitigation |
| --- | --- | --- |
| Suspended users no longer see explicit suspend message on login | Low–Med | Product may later use out-of-band support; security wins over enum leak |
| Legitimate login / 2FA / OTP breakage | Low | Success path untouched; covered by existing login unit tests |
| Timing side-channel residual | Low | Pre-existing bcrypt dummy pattern retained, not a regression from this fix |

---

## Rollback

```text
Tag: pre-user-enumeration-fix → a37800b4a3e514e1d519c8fed93476fcb5fff950
(present on origin)
```

Procedure:

1. Redeploy API at tagged commit:  
   `gcloud builds submit --config=cloudbuild-api.yaml --substitutions=COMMIT_SHA=a37800b4a3e514e1d519c8fed93476fcb5fff950`
2. Or pin previous Cloud Run revision (predecessor of `api-00092-lw6`) via traffic split.
3. Confirm `/live` gitSha returns pre-fix SHA and unknown-email body again shows old message (then re-apply only if needed).

---

## Post-deploy

| Item | Value |
| --- | --- |
| Commit | `e336e3eace3f3f4acdcfeb95076ba8c7dc493c50` |
| Cloud Build | `c4071fb7-275a-4bf2-8ed3-c7091e7f4c35` **SUCCESS** (~5m17s) |
| Cloud Run revision | **`api-00092-lw6`** 100% traffic |
| Live `gitSha` | **`e336e3e`** |
| Unknown email body | `401` / `INVALID_CREDENTIALS` / `Invalid email or password.` |
| Wrong password body | identical |
| Successful login | unit-tested; production **NOT VERIFIED** (no credentials) |
| Register unchanged | **yes** (400 validation still) |
| Health | **ok** (db/redis/queue/ws) |
| Rollback tag | `pre-user-enumeration-fix` → `a37800b…` on origin |

---

## Final verdict

**READY FOR PRODUCTION**

Enumerating registered emails via login client responses is closed on live `api-00092-lw6`. Optional follow-up: run one successful login smoke with a known operator account and confirm 2FA/OTP journeys still feel correct.
