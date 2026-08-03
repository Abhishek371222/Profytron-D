# PT-P09 — Manual browser QA: trial start → banner → upgrade

**Date:** 2026-08-02 (updated continue batch)  
**Owner:** aaradhya  
**Environment:** staging or prod with trial APIs live  

## Code ready in repo (do not mark Completed until checked below)

- `StartTrialButton` → `/subscriptions/trial/start` + PostHog `trial_started` + checkout_started
- Billing plan cards show full features + empty-state plans
- `TrialStatusBanner` on billing with Upgrade CTA + dismiss

## Preconditions

- [ ] Logged-out clean session (or dedicated test account that never used trial)
- [ ] Paid plan trial-eligible (not Free-only; not `hasUsedPlatformTrial`)
- [ ] Billing UI **deployed** with latest web revision

## Steps

| # | Step | Expected | Pass |
|---|------|----------|------|
| 1 | Open `/pricing` then `/billing` | Plans render | ☐ |
| 2 | Start trial on eligible plan | Toast success; plan ACTIVE trial; event `trial_started` if PostHog live | ☐ |
| 3 | Trial banner visible | Days remaining + Upgrade | ☐ |
| 4 | Upgrade CTA | Scrolls to plans / checkout path | ☐ |
| 5 | Abandon paid checkout | Still on trial | ☐ |
| 6 | Mobile ≤390px same flow | No overflow/overlap | ☐ |

## Failures

Log bugs with screenshot + network status. Link PR for UI-only fixes.

## Close criteria

All Pass on target env → Master Tracker **Completed** + paste sheet note.
