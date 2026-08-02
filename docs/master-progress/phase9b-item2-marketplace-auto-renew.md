# Phase 9B Item 2 — Marketplace Auto Renewal

**Date:** 2026-08-02  
**Scope:** Local only. No commit / push / deploy.  
**Decision:** Same posture as Item 1 B+ — durable intent flag + reminders; no silent charge/extend; no schema migration.

## Audit findings (before fix)

| Area | Finding |
|---|---|
| `setAutoRenew` | Redis **only** (`subscription:autorenew:{user}:{strategy}`) |
| Postgres | **No** `autoRenew` column on `UserStrategySubscription` |
| Default | Redis miss → autoRenew **true** |
| Expiry cron | Expires ACTIVE when `expiresAt <= now` (unchanged; correct for prepaid) |
| Stripe path | Real renew via `invoice.paid` / `handleSubscriptionInvoicePaid` (Phase 9A) |
| BFF `strategies/my` | Hardcoded `autoRenew: true` (ignored toggle) |
| Gateway cancel | Toggling off does **not** call Stripe/Razorpay cancel (no redesign) |

## Implementation

### Real persistence + disable
- Source of truth: `executionProfileJson.autoRenew` on the strategy subscription row
- Redis updated as cache (legacy reads / speed)
- `setAutoRenew`: reject cancelled/expired/inactive
- `deactivate`: force `autoRenew: false` in profile + Redis `'0'`

### Real renewal (product-safe)
- **No** automatic charge or period extension without payment
- **Stripe** rows (`stripeSubId != null`): still renewed by webhooks only; reminders skip them
- **Prepaid** (no stripeSubId): daily T+3 / T+1 reminders when profile not `autoRenew: false`

### Real disable
- Toggle off → persisted false, UI sees false
- Deactivate → autoRenew off
- Expire cron still drops access at `expiresAt` regardless (correct)

## Files modified

- `apps/api/src/modules/strategies/strategies.service.ts`
- `apps/api/src/modules/trading/subscription-cleanup.service.ts`
- `apps/api/src/modules/trading/subscription-cleanup.service.spec.ts`
- `apps/web/src/app/api/strategies/my/route.ts`
- `docs/master-progress/phase9b-item2-marketplace-auto-renew.md`

## Why it works

Marketplace free/Razorpay checkouts are period prepaid (plus separate Stripe subscription renewals). Storing intent in Postgres survives Redis loss; reminders close the “toggle did nothing durable” gap without inventing payment mandates.

## Backward compatibility

- Default still **true** when never set
- API shape of `autoRenew` on my-strategies unchanged
- `renewsAt` / `expiresAt` unchanged
- No Prisma migration

## Risk

| Risk | Mitigation |
|---|---|
| Stripe sub keeps billing after user turns auto-renew off | Documented gap; needs gateway cancel (not Item 2 / no payments redesign) |
| Dual path Nest vs Next BFF | BFF reads `executionProfileJson` |

## Verification

- `subscription-cleanup.service.spec.ts` — includes marketplace reminder cases  
- `tsc --noEmit` apps/api  

## Build status

See session command output (local green expected).

## Explicit non-goals

- Schema column `autoRenewal` on marketplace table  
- Automatic gateway re-charge  
- Stripe `cancel_at_period_end` wiring (future)  
- Items 3–6  

**STOP** — awaiting approval for Phase 9B Item 3 (Trial Lifecycle).
