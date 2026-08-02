# Profytron RC-1 — Release Notes

**Status:** GO WITH CONDITIONS  
**Operational readiness:** 78 / 100  
**Date:** 2026-08-02  
**Baseline:** Phases 1–10 complete (`a977727` → `bf3e84b` → `f123ef4` + Phase 10 merge history)  
**Scope:** Release engineering only — no feature work, no Phase 11

Related checklists:

- [RC1_DEPLOYMENT_CHECKLIST.md](./RC1_DEPLOYMENT_CHECKLIST.md)
- [RC1_SMOKE_TEST.md](./RC1_SMOKE_TEST.md)
- [RC1_BETA_CHECKLIST.md](./RC1_BETA_CHECKLIST.md)

---

## Executive Summary

Profytron feature roadmap (Phases 1–10) is complete. RC-1 fixes verified **production blockers** found during the release-candidate audit: authentication fail-closed behaviour, 2FA secret exposure, incomplete logout, wallet/refund integrity, Stripe deposit handling on the canonical webhook, marketplace renewal debit errors, MetaAPI retry re-opens, mock email marked sent without delivery, and hard-coded admin bootstrap passwords.

This release prepares the repository for **staging deployment**. Production traffic requires secrets, webhook configuration, MetaAPI, smoke tests, and a controlled beta — not more product features.

---

## Implemented Fixes (P0)

| Area | Fix |
|------|-----|
| Auth | Strip `twoFactorSecret` / backup codes from `sanitizeUser` and profile update responses |
| Auth | Logout revokes and blacklists **refresh** JTI (or all refresh sessions if cookie absent) |
| Auth | Refresh fails closed when Redis session lookup fails (unless `REDIS_INMEMORY=true`) |
| Auth | JWT blacklist `exists` fails closed (treat as revoked when Redis is unknown) |
| Auth | Login lockout check fails closed in production/staging if Redis is unavailable |
| Email | Without Resend: status `FAILED` unless `test` / `development` / `ALLOW_MOCK_EMAIL=true` |
| Wallet/Stripe | `payment_intent.succeeded` handled on canonical `/v1/webhooks/stripe` |
| Marketplace | Card renewals record a `Payment` row only — no buyer wallet **OUT** |
| Refunds | Gateway must succeed; ledger-only only if `ALLOW_LEDGER_ONLY_REFUNDS=true` |
| Razorpay | Event NX lock deleted on handler failure so retries can reprocess |
| Trading | Skip MetaAPI re-execute if open trade exists for signal or broker ticket |
| Admin | Bootstrap admin requires `ADMIN_DEFAULT_PASSWORD` (no `Demo@123` default) |
| Demo pay | Platform demo checkout no longer wallet-credits pure plan payments |

## Implemented Fixes (P1)

| Area | Fix |
|------|-----|
| Throttle | Authenticated raise only for module default (100→1000); respects `@Throttle` (coach, auth) |
| Notifications | List `limit` capped at 100 |
| Env | `EXPOSE_DEV_OTP=true` rejected in production/staging |
| JWT | Default access TTL 15m in production/staging when unset |
| Ops script | `link-existing-master.cjs` requires `ADMIN_DEFAULT_PASSWORD` |
| Tests | `AppController` provides `MetricsService` mock |

---

## Security Fixes

- Fail-closed session / blacklist / login lockout under Redis failure in prod/staging
- Cookie clear uses `COOKIE_SECURE` consistently with set-cookie
- 2FA material never returned in API user JSON
- No hard-coded bootstrap admin password in app or link-master script
- Mock OTP diagnostics not enabled in production/staging
- Refund path cannot “succeed” without gateway unless explicitly opted in

## Billing / Wallet Fixes

- Marketplace Stripe renewals do not debit wallet deposits
- Admin refunds require Razorpay/Stripe API success when gateway ids present
- Stripe wallet deposits confirmable via main webhook path
- Demo platform path aligned with live (no double deposit credit)

## Trading Fixes

- Signal-level open-trade guard before MetaAPI execute
- Broker ticket de-duplication after successful MetaAPI order id
- (Residual) concurrent multi-worker race still theoretical without DB unique constraint

## Infrastructure Fixes

- Resend missing: warn; email fail-closed
- Error codes: `SERVICE_UNAVAILABLE`, `UNAUTHORIZED`
- Nest test DI for metrics (health code path)
- Release documentation set under `docs/releases/`

---

## Known Limitations

| ID | Item | Guidance |
|----|------|----------|
| P1-7 | In-process rate limits | OK for single API instance; Redis-backed throttling before multi-replica |
| P1-8 | Trade concurrency | Prefer one trade worker; monitor duplicate opens |
| P1-9 | Dual deposit idempotency keys | Rare; monitor double-credit vs Stripe PIs |
| P2 | Process-local `/metrics` | Scrape each instance; use Sentry/APM |
| P2 | Origin check ≠ full CSRF cookie double-submit | Rely on CORS allowlist + origin middleware |
| P2 | No full WCAG AA audit | Partial prior a11y only |
| P2 | Prisma seed may still use demo credentials | **Never seed production** |

---

## Deployment Notes

1. Deploy to **staging** first with sandbox Stripe/Razorpay and full webhook wiring.
2. Set production/staging secrets (JWT, AES, DB, Redis, payment, Resend, CORS).
3. Do **not** set `EXPOSE_DEV_OTP`, `REDIS_INMEMORY`, `ALLOW_MOCK_EMAIL` in staging/prod unless deliberately testing mock mail offline.
4. Point Stripe Dashboard to `POST /v1/webhooks/stripe` including `payment_intent.succeeded`.
5. Start with **one API instance** until throttling is shared.
6. Run [RC1_SMOKE_TEST.md](./RC1_SMOKE_TEST.md) before beta cohort.
7. Follow [RC1_DEPLOYMENT_CHECKLIST.md](./RC1_DEPLOYMENT_CHECKLIST.md).

## Rollback Notes

1. Redeploy previous container/image/commit (pre-RC-1).
2. RC-1 ships **no Prisma schema migration** in this change set — DB rollback usually unnecessary.
3. Restore Redis first if auth storms follow Redis outages (fail-closed is intentional).
4. Do not “fix” refunds by setting `ALLOW_LEDGER_ONLY_REFUNDS` broadly.
5. Keep at least one known-good image tag before promoting.

---

## Recommendation

**GO WITH CONDITIONS** — code is staging-ready after verification; production requires ops checklist and smoke/beta success.
