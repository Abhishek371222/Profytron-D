# Phase 2 Inputs

Authorized fix themes from measured evidence only — **no speculative redesign**.  
Product Phase 2 is **implementation**, organized by **user journeys** (not frontend/backend tech silos), while platform / UI / DB / API architectures stay frozen.

## Journey workstreams (authorized shape)

| Journey | Phase 1 evidence | Phase 2 stance |
| --- | --- | --- |
| Visitor → Signup → Login | AUTH + visitor reports | Fix only measured Missing/Partial on public auth/marketing |
| Onboarding | ONBOARDING_REPORT; **P0** welcome Missing | Stabilize `/onboarding` → `/onboarding/risk` reachability |
| Broker Connection | BROKER_FLOW; MetaAPI Blocked by policy | CTA/UI completeness only unless live connect explicitly authorized |
| Strategy Creation | STRATEGY_REPORT | Fix measured gaps only |
| Trading Workspace | dashboard / markets / analytics journeys | Fix measured chrome/reachability debt |
| AI Coach | AI_COACH; live stream Partial | Composer/UI only unless live stream authorized |
| Billing & Subscription | BILLING; checkout Blocked by policy | Surface/CTA completeness; no harness-enabled live payment |
| Settings & Profile | SETTINGS_REPORT | Fix measured gaps only |
| Notifications & Recovery | EMPTY_STATE + ERROR_RECOVERY | Offline cue Partial; empty-state polish if launch-critical |
| Launch Readiness | FEATURE_COMPLETENESS + PRODUCT_DEBT + PRIORITY_MATRIX | Close P0 then P1 policy-manual QA; then P2 polish |

## Themes from freeze debt

- Investigate `/onboarding` body-hidden / navigation race (**P0**)
- Manual/live QA for OTP, MetaAPI, checkout outside measure harness (**P1 policy**)
- Offline banner / AI stream expectations if launch-critical (**P2**)

## Explicit non-goals (still locked)

- Platform / UI / Database / API excellence redesigns
- Enabling live MetaAPI / checkout / OTP inside the Phase 1 harness
- Speculative feature expansion beyond measured debt

## Evidence pointers

- `data/journey-results.json` (authenticated freeze run)
- `before/journey-results-no-jwt.json` (pre-JWT snapshot)
- `data/conversion.json`
- `data/errors.json`
- `data/empty-states.json`
- `data/inventory.json`
- `reports/PRODUCT_DEBT.md`
- `FROZEN.md`
