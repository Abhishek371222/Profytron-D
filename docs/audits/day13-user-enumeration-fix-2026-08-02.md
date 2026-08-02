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

## Regression evidence (pre / post deploy)

Targeted production smoke after revision Ready:

- Health: `/live` `/ready` `/health`
- Plans (Platform Trial surface): `GET /v1/subscriptions/plans`
- Wallet unauth gate: `GET /v1/wallet/balance` → 401
- Coach auth gate: `GET /v1/coach/conversations` → 401
- Broker auth gate: `GET /v1/broker/accounts` → 401

*(Filled with live numbers in Post-deploy section.)*

---

## Live production evidence

### Pre-fix (revision pre-deploy)

Unknown email returned `USER_NOT_FOUND` / “No account found…” (Day 13 UAT).

### Post-fix (record after deploy)

See **Post-deploy** below after Cloud Run revision is live.

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
```

Procedure:

1. `git checkout pre-user-enumeration-fix` (or revert the fix commit)
2. Redeploy API via `gcloud builds submit --config=cloudbuild-api.yaml --substitutions=COMMIT_SHA=<sha>`
3. Or traffic pin previous Cloud Run revision via console/`gcloud run services update-traffic`

---

## Post-deploy

_To be completed after Cloud Build succeeds._

| Item | Value |
| --- | --- |
| Commit | _(pending)_ |
| Cloud Run revision | _(pending)_ |
| Unknown email body | _(pending)_ |
| Wrong password body | _(pending)_ |
| Successful login | _(pending)_ |
| Register unchanged | _(pending)_ |
| Health | _(pending)_ |

---

## Final verdict

_(pending deploy + live validation)_
