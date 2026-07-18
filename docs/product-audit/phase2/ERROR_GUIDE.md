# Error Guide — Phase 2

## Rule

Every audited journey must offer recovery: message + retry or alternate path.

## Patterns

| Layer | Pattern |
| --- | --- |
| Page load | `DashErrorState` or equivalent with Retry |
| Mutation | Inline or toast + keep form values |
| OAuth / deep link | In-page failure with retry + link back to login |
| Offline | Global offline banner (Wave 10) + disable destructive submits when offline |

## Auth

- Missing reset token → dedicated invalid-link state (not submit-only toast)
- Verify email without address → prompt to enter email / go to login
- Preserve provider error detail when safe; never dump raw stacks

## Debt references

- `PROD-P2-err-offline` — offline banner
- Domain reports for load-error conflation (broker, marketplace, billing)
