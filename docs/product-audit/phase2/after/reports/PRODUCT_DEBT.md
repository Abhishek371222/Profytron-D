# Product Debt

Derived **only** from measured skips/failures in this Phase 1 lab run.

| ID | Severity | Finding | Evidence |
| --- | --- | --- | --- |
| PROD-P2-auth-logout | P2 | Step auth/logout Partial: /dashboard | Page reachable; expect "log out\|logout\|sign out" soft-matched via body |
| PROD-P1-auth-live_otp | P1 | Step auth/live_otp Blocked (policy skip): Live email OTP not exercised | skipIf policy |
| PROD-P1-broker-live_metaapi | P1 | Step broker/live_metaapi Blocked (policy skip): Live MetaAPI broker connect not exercised (Phase 1 measure-only) | skipIf policy |
| PROD-P2-ai_coach-live_stream | P2 | Step ai_coach/live_stream Partial: /alpha-coach | Live model streaming not exercised (keys/network) |
| PROD-P1-billing-live_checkout | P1 | Step billing/live_checkout Blocked (policy skip): Real Razorpay/Stripe checkout not exercised | skipIf policy |
| PROD-P2-err-offline | P2 | Error probe offline Partial | No dedicated offline banner detected (browser offline set) |

## Counts

| Severity | Count |
| --- | ---: |
| P0 | 0 |
| P1 | 3 |
| P2 | 3 |
| P3 | 0 |
