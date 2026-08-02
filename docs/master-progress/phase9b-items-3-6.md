# Phase 9B Items 3–6 — Combined Completion Report

**Date:** 2026-08-02  
**Mode:** Local only — no commit / push / deploy  
**Items:** 3 Trial Lifecycle · 4 Subscription Expiry · 5 Billing Consistency · 6 Plans Consistency

---

## Item 3 — Trial Lifecycle

### Before
- Create: `startPlatformTrial` (complete)
- Reminders: T+3 / T+1 emails (complete)
- Conversion: paid `activatePlatformSubscriptionFromPayment` (complete)
- Soft cancel: `cancelSubscription` (access until `expiresAt`)
- **Gap:** no dedicated graceful trial end (notify + expire) separate from paid expiry; marketplace bot trials often missing `expiresAt`

### Fixed
| Change | File |
|---|---|
| `expireEndedTrials` cron (every minute) | `trial-lifecycle.service.ts` |
| Expire ACTIVE trials by `trialEndsAt` or `expiresAt` | same |
| FREE downgrade when no other ACTIVE platform sub | same |
| One-shot “Trial ended” notification + audit | same |
| Marketplace trial sets `expiresAt = trialEndsAt` + `autoRenew: false` | `marketplace.service.ts` |

Cancellation = existing `POST /subscriptions/cancel` (no hard DELETE).  
Conversion = existing payment activation (unchanged).

---

## Item 4 — Subscription Expiry / Cleanup

### Marketplace `expireSubscriptions`
- Expires when `expiresAt <= now` **or** `trialEndsAt <= now` with null/past `expiresAt`
- Unlink CopyFactory (unchanged)
- Optional “Bot trial ended” notice for trial-driven rows
- Audit includes `trialEndsAt`

### Platform `expirePlatformSubscriptions`
- **Paid / non-trial only** (`isTrial: false`) so trials don’t double-process
- Still EXPIRED + FREE downgrade + audit (includes `softCancelledBeforeExpiry`, `autoRenewal`)

### Renewal
- Still none automatic (prepaid + Stripe webhooks from 9A/9B.1–2)
- Reminders from Items 1–2 remain

---

## Item 5 — Billing Consistency

| Concern | Platform (`UserSubscription`) | Marketplace (`UserStrategySubscription`) |
|---|---|---|
| Period end | expire → EXPIRED → FREE if no other ACTIVE | expire → EXPIRED → unlink CF |
| Soft cancel | `cancelledAt` + `autoRenewal: false`, access until period end | User deactivate → CANCELLED immediately |
| Auto-renew intent | `autoRenewal` column | `executionProfileJson.autoRenew` + Redis |
| Pre-expiry reminder | daily when autoRenew true, not trial | daily prepaid bots, not Stripe-managed |
| Trial | dedicated expire cron + convert via pay | `trialEndsAt`/`expiresAt` + cleanup |

Same rules for **period end + entitlement reclaim**; product differences for hard vs soft cancel kept (intentional UX).

---

## Item 6 — Plans Consistency

| Before | After |
|---|---|
| `GET /plans` → static `PLATFORM_PLANS` | **delegates** to `PaymentsService.getSubscriptionPlans()` |
| `GET /subscriptions/plans` → DB (+ partial enrich) | **same method** (enriched shape v2 cache) |

Enrichment always yields: `slug`, `tier`, `trialEligible`, `maxBrokerAccounts`, `maxTeamMembers`, `recommended`, `cta`, `ctaHref` so billing + team-plans clients share one contract.

`PlansModule` imports `PaymentsModule` (forwardRef).

---

## Files modified (Items 3–6)

- `apps/api/src/modules/trading/trial-lifecycle.service.ts`
- `apps/api/src/modules/trading/trial-lifecycle.service.spec.ts`
- `apps/api/src/modules/trading/subscription-cleanup.service.ts`
- `apps/api/src/modules/marketplace/marketplace.service.ts`
- `apps/api/src/modules/payments/payments.service.ts`
- `apps/api/src/modules/plans/plans.controller.ts`
- `apps/api/src/modules/plans/plans.module.ts`
- `docs/master-progress/phase9b-items-3-6.md` (this file)

Earlier 9B (items 1–2) unchanged; Phase 9A not undone.

---

## Verification (run locally)

- `jest trial-lifecycle.service.spec.ts`
- `jest subscription-cleanup.service.spec.ts`
- `tsc --noEmit` apps/api

## Risk

| Risk | Mitigation |
|---|---|
| Dual cron on trials | Paid expire path excludes `isTrial` |
| Plans response shape | Enrich to superset of static + DB |
| PlansModule DI cycle | ForwardRef Payments only |

## Backward compatibility

- Cancel / checkout / trial-start routes unchanged
- Default auto-renew defaults preserved
- No schema migrations

**Phase 9B local scope complete when tests green.**
