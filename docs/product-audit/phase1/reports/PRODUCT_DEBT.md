# Product Debt

Derived **only** from measured skips/failures in this Phase 1 lab run.

| ID | Severity | Finding | Evidence |
| --- | --- | --- | --- |
| PROD-P1-auth-live_otp | P1 | Step auth/live_otp Blocked (policy skip): Live email OTP not exercised | skipIf policy |
| PROD-P0-onboarding-welcome | P0 | Step onboarding/welcome Missing: /onboarding | page.waitForSelector: Timeout 5000ms exceeded. Call log:   - waiting for locator('body') to be visible     7 × locator resolved to hidden <body class="__variable_0c9267 __variable_694534 font-sans text-body bg-background text-foreground antialiased selection:bg-primary/20 selection:text-foreground">…</body>     - waiting for" http://127.0.0.1:3000/onboarding/risk" navigation to finish...  |
| PROD-P1-broker-live_metaapi | P1 | Step broker/live_metaapi Blocked (policy skip): Live MetaAPI broker connect not exercised (Phase 1 measure-only) | skipIf policy |
| PROD-P2-ai_coach-live_stream | P2 | Step ai_coach/live_stream Partial: /alpha-coach | Live model streaming not exercised (keys/network) |
| PROD-P1-billing-live_checkout | P1 | Step billing/live_checkout Blocked (policy skip): Real Razorpay/Stripe checkout not exercised | skipIf policy |
| PROD-P2-err-offline | P2 | Error probe offline Partial | No dedicated offline banner detected (browser offline set) |

## Counts

| Severity | Count |
| --- | ---: |
| P0 | 1 |
| P1 | 3 |
| P2 | 2 |
| P3 | 0 |
