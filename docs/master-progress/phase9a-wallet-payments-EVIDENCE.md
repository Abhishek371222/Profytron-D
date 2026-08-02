# Phase 9A — Wallet / Billing / Payments Evidence

**Date:** 2026-08-02  
**Verdict:** COMPLETE (local)

## P0 #1 — Concurrent withdrawal race

**Status:** CONFIRMED (pre-existing)

| File | Evidence |
|---|---|
| `apps/api/src/modules/wallet/wallet.service.ts` | `$transaction` + `pg_advisory_xact_lock(hashtext('wallet:<userId>'))` around balance check + ledger write (~354+) |
| `apps/api/src/modules/wallet/wallet.processor.ts` | Same advisory lock pattern (~24–25) |

## P0 #2 — Delayed Stripe renewal cannot reactivate cancelled sub

**Status:** FIXED this pass

| File | Evidence |
|---|---|
| `apps/api/src/modules/payments/payments.service.ts` | `handleSubscriptionInvoicePaid`: early cancel check + conditional `updateMany` with `cancelledAt: null` and `status: { not: 'CANCELLED' }`; revenue side effects only if `count > 0` |
| `apps/api/src/modules/payments/payments.renewal-race.spec.ts` | Unit coverage for match / zero-row race / pre-cancelled skip |

## P0 #3 — Marketplace subscription lifecycle locking

**Status:** FIXED (gaps closed; full inventory in phase7 doc)

| Path | Evidence |
|---|---|
| strategies pause/resume/deactivate | `updateMany` allow-lists (`strategies.service.ts`) |
| marketplace free/trial subscribe | `upsertProvisioningSubscription` advisory lock + allow-list (`marketplace.service.ts`) |
| trading isPaused | allow-list `updateMany` (`trading.service.ts`) |
| profit-share auto-resume | requires `PAUSED` + `PROFIT_SHARE_PAUSED` (`payments.service.ts`) |
| payment cancel/fail webhooks | pre-existing allow-list `updateMany` |

## P0 #4 — Razorpay demo payment gate

**Status:** CONFIRMED

```ts
// payments.service.ts isRazorpayDemoMode()
NODE_ENV === 'development' | 'test'
&& RAZORPAY_KEY_ID === 'DEMO_KEY'
&& ALLOW_DEMO_PAYMENTS === 'true'
```

## Related auth fixes (handoff blockers)

| Fix | Evidence |
|---|---|
| Distinct access vs refresh JTIs | `auth.service.ts` `generateTokenPair` |
| Refresh grace / race re-check | `apps/web/src/lib/api/client.ts` `refreshSession` |
| Hard post-login navigation | Login/AuthCallback + `AuthProvider.tsx` `window.location.assign` |

## Commit / deploy

Local-only until explicitly committed and deployed. No push required by this evidence pack.
