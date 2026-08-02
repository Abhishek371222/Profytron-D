# Phase 9B Item 1 — Platform Auto Renewal (Option B+)

**Date:** 2026-08-02  
**Scope:** Local only. No commit / push / deploy.  
**Decision:** Option B+ (honest prepaid lifecycle + pre-expiry reminders; no auto-charge; no silent extend; no `renewsAt` API change)

## Frontend / API consumer audit (before any renewsAt change)

| Consumer | Field | Usage | Change? |
|---|---|---|---|
| `apps/web/.../billing/page.tsx` | `current.renewsAt`, `nextPaymentDate` | Shows “Renews {date}” or “Access until” when cancelled | **No** — keep contract |
| Cancel dialog | `renewsAt` | “access until billing period ends on {date}” | **No** |
| Marketplace bots list | `bot.renewsAt` / `nextBillingDate` | Bot billing UI | **No** (marketplace; Item 2) |
| `getCurrentSubscription` | sets `renewsAt: nextBillingAt ?? expiresAt` | Billing page | **No** |

**Verdict:** Do not alter `renewsAt` / `nextBillingAt` in this item.

## What was implemented

### 1. Paid activation sets `autoRenewal: true`
`activatePlatformSubscriptionFromPayment` create + update paths.

Meaning: flag stays on for reminder eligibility and future gateway work; cancel still sets `autoRenewal: false`.

### 2. Expiry cron unchanged
`expirePlatformSubscriptions` behavior preserved (expire lapsed ACTIVE → FREE downgrade).

### 3. Pre-expiry renewal reminders
`SubscriptionCleanupService.sendPlatformRenewalReminders` @ daily 09:00:
- Eligible: `ACTIVE`, `autoRenewal: true`, `cancelledAt: null`, `isTrial: false`, `expiresAt` in T+3 or T+1 day window
- Action: in-app notification + audit `PLATFORM_RENEWAL_REMINDER`
- Copy states access ends and **billing does not auto-charge**
- Redis dedupe `platform:renew-reminder:{campaign}:{subId}` (10d TTL)
- **Does not** charge, create orders, or extend `expiresAt`

## Files modified

- `apps/api/src/modules/payments/payments.service.ts`
- `apps/api/src/modules/trading/subscription-cleanup.service.ts`
- `apps/api/src/modules/trading/subscription-cleanup.service.spec.ts`
- `docs/master-progress/phase9b-item1-platform-auto-renew.md` (this report)

## Why it works

Platform is prepaid (one-shot Razorpay orders). Safe product behavior is **remind then manual re-checkout**, not silent extend or fake auto-debit without a mandate.

## Backward compatibility

- API `renewsAt` / `nextBillingAt` unchanged
- Cancel path unchanged
- Expiry / FREE downgrade unchanged
- Extra notifications only for eligible paid autoRenewal rows

## Risk

| Risk | Mitigation |
|---|---|
| Notification spam | Redis campaign dedupe |
| Redis down | Best-effort notify once per run |
| Users confuse “Renews” UI label with auto-charge | Reminder message clarifies; full UX rename deferred |

## Verification

- `jest subscription-cleanup.service.spec.ts` — 3/3 pass  
- `tsc --noEmit` (apps/api) — pass  

## Build status

**Green (local)**

## Explicit non-goals (later items)

- Item 2 Marketplace auto-renew  
- Item 3 Trial lifecycle  
- Gateway recurring (Option C)  

**STOP** — awaiting approval for Phase 9B Item 2.
