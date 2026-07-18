# Microcopy Guide — Phase 2

Evidence base: Phase 1 domain reports + PRODUCT_DEBT.

## Voice

- Direct, calm, product-first. Prefer “Couldn’t load accounts” over “Something went wrong.”
- Never expose engineering ports, stack traces, or “start the API on port X” to customers.
- Align CTA labels with outcomes (“Forgot password?” → same wording in toasts).

## Patterns

| Situation | Prefer | Avoid |
| --- | --- | --- |
| Load failure | “Couldn’t load {noun}. Retry.” | Empty-state copy |
| Empty | “No {noun} yet. {next step}.” | “Try adjusting filters” when catalog is empty |
| Offline | “You’re offline. Changes will sync when you’re back.” | Silent failure |
| Auth recovery | Match link label (“Forgot password?”) | “Lost Access” |
| Success | Short confirmation + next step | Generic “Success” alone |

## Deferred live flows

When CTA opens a live dependency not exercised in Phase 1 (OTP, MetaAPI, checkout), keep UI ready and label outcomes clearly; do not promise completion until backend responds.
