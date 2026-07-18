# Priority Matrix

| Priority | Theme | Items | Phase 2 stance |
| --- | --- | ---: | --- |
| P0 | Launch blockers (Missing / no JWT) | 1 | Fix reachability before claiming launch-ready |
| P1 | Policy-blocked live flows | 3 | Manual/live QA outside harness; do not enable in measure scripts |
| P2 | Partial UI signals | 2 | Tighten expectations or polish |
| P3 | Polish | 0 | Deferred |

| ID | Sev | Finding | Suggested Phase 2 |
| --- | --- | --- | --- |
| PROD-P1-auth-live_otp | P1 | Step auth/live_otp Blocked (policy skip): Live email OTP not exercised | Authorize live probe or manual QA outside measure harness |
| PROD-P0-onboarding-welcome | P0 | Step onboarding/welcome Missing: /onboarding | Investigate reachability / routing before launch |
| PROD-P1-broker-live_metaapi | P1 | Step broker/live_metaapi Blocked (policy skip): Live MetaAPI broker connect not exercised (Phase 1 measure-only) | Authorize live probe or manual QA outside measure harness |
| PROD-P2-ai_coach-live_stream | P2 | Step ai_coach/live_stream Partial: /alpha-coach | Tighten expect selectors or complete UI signal |
| PROD-P1-billing-live_checkout | P1 | Step billing/live_checkout Blocked (policy skip): Real Razorpay/Stripe checkout not exercised | Authorize live probe or manual QA outside measure harness |
| PROD-P2-err-offline | P2 | Error probe offline Partial | Improve offline/unauthorized UX if launch-critical |
