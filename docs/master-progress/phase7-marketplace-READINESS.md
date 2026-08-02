# Phase 7 — Marketplace Readiness

**Date:** 2026-08-02  
**Verdict:** PASS  

## Scope

Marketplace listings → subscribe → payment activation → provisioning →
pause/resume/deactivate. Reopened phase closeout.

## Architecture (happy path)

```
Listing (marketplace) → POST .../subscribe (marketplace.service)
  → free/trial: upsertProvisioningSubscription (advisory lock) → PROVISIONING
  → paid: Razorpay/Stripe checkout → payments activate → PROVISIONING/ACTIVE
  → SubscriptionProvisioningService + CopyFactory link
User pause/resume/cancel → POST /strategies/:id/{pause|resume|deactivate}
  (optimistic updateMany allow-lists)
Webhooks → payments.service cancel/fail/renew allow-lists
```

## Subscription status state machine

Enum (`schema.prisma` `SubscriptionStatus`):  
`INACTIVE | PROVISIONING | ACTIVE | PAUSED | FAILED | CANCELLED | EXPIRED | BLOCKED`

Canonical user lifecycle transitions:
- Subscribe (allow from non-live): → `PROVISIONING` then ACTIVE (after provision)
- Pause: ACTIVE → PAUSED (`strategies.service` + trading PATCH)
- Resume: PAUSED → ACTIVE
- Deactivate/cancel: ACTIVE|PAUSED|PROVISIONING → CANCELLED
- Payment fail: ACTIVE → INACTIVE (grace)
- Renewal: non-CANCELLED → ACTIVE via conditional `updateMany`

## Optimistic locking inventory

| Path | Mechanism | File |
|---|---|---|
| Free/trial subscribe | `pg_advisory_xact_lock` + `updateMany` status allow-list | `marketplace.service.ts` |
| Pause / resume / deactivate | `updateMany` + status `in` allow-list | `strategies.service.ts` |
| Trading isPaused toggle | `updateMany` ACTIVE↔PAUSED | `trading.service.ts` |
| Stripe/Razorpay cancel/fail | `updateMany` status allow-lists | `payments.service.ts` |
| Stripe renewal invoice | `updateMany` `status not CANCELLED` + `cancelledAt: null` | `payments.service.ts` |
| Profit-share auto-resume | `updateMany` requires PAUSED + PROFIT_SHARE_PAUSED | `payments.service.ts` |

## Pause/resume verification (API ownership)

- Marketplace module: subscribe (+ risk overrides) only — lifecycle control remains on strategies routes (canonical).
- UI: `my-bots`, `connected-accounts` call `/strategies/...` pause/resume/deactivate.

## Production readiness

| Check | Status |
|---|---|
| Broker prerequisite on subscribe | `requireActiveMt5Broker` |
| Demo Razorpay gate | three-condition AND chain |
| Webhook cancel race vs renew | conditional renew updateMany |
| Subscribe double-click race | advisory lock helper |
| Paid subscribe race | checkout is external; activation path owned by payments (webhook idempotency Track D) |

## Exit criteria

- [x] Architecture documented
- [x] Lifecycle transitions inventoried with file evidence
- [x] Pause/resume/cancel ownership clear
- [x] Prior false claim (“locking only if built from scratch”) corrected — partial locking existed; remaining gaps closed

## Status

**VERIFIED COMPLETE** — Phase 7 no longer REOPENED
