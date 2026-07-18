# Onboarding Spec (Guided Activation — A1)

## Principle

Progress-driven checklist, not a one-time wizard. Each completed step unlocks the next clear CTA with immediate feedback.

## Surface

- Persistent `ActivationChecklist` in dashboard shell (compact + expanded).  
- Hide only when **all required milestones** are done or user dismisses — not when merely “partially activated.”

## Required milestones (checklist)

1. Complete risk profile  
2. Connect broker or paper account  
3. Ask Alpha Coach a question  
4. Activate / subscribe first strategy  
5. Execute first paper (or first real) trade  

Optional (shown but not required for “fully activated” badge): fund wallet.

## Unlocking behavior

| Incomplete | Next CTA label | Destination |
| --- | --- | --- |
| No risk profile | Complete risk profile | `/onboarding/risk` |
| No broker | Connect account | `/connected-accounts` |
| No Coach | Ask Alpha Coach | `/alpha-coach` |
| No strategy | Activate a strategy | `/marketplace` |
| No trade | Start with paper / marketplace | `/marketplace` |

## Immediate feedback

On each milestone: toast + optional subtle celebration ([`SUCCESS_MOMENTS.md`](./SUCCESS_MOMENTS.md)) + invalidate `['activation-progress']`.
