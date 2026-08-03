# PT-P03 — Billing UI polish + plan cards

| Field | Value |
|-------|--------|
| **Owner** | aaradhya |
| **Status (sheet)** | In Progress |
| **Priority** | High |
| **Phase** | Development |
| **Type** | Feature |
| **Estimate (hrs)** | 5.0 |
| **Actual logged (hrs)** | 2.0 |
| **Execution order** | IN PROGRESS (do all IN PROGRESS before new NOT STARTED when possible) |
| **Sheet notes** | Billing UI exists; trial UI coded locally, not on prod gitSha 1044ce5. |

## Why this exists
Billing UI is the money path; trial UI coded locally must reach production polish.

## Definition of Done (100%)
- Plan cards clear on mobile/desktop
- Trial UI present on prod if backend flag on; else gated with honest UI
- No dead CTAs; all error paths readable

## Scope IN
- Plan cards, CTAs, spacing, loading/error empty states on /billing and pricing
- Trial banner/upgrade entry if enabled in env
- Consistent plan source of truth UI labels

## Scope OUT
- Razorpay/payment engine bugs (sunish primary)
- Marketing pricing copy authoring

## Full execution steps
- 1. Diff local trial UI vs prod gitSha noted in sheet; list missing pieces
- 2. Align plan cards with Phase 9C billing experience patterns
- 3. Verify trial start CTA → banner → upgrade path on staging
- 4. Loading skeletons, disabled states, error toasts
- 5. Mobile QA 390px on /pricing + /billing
- 6. Coordinate deploy with sunish for backend readiness
- 7. Close with PT-P09 manual UAT checklist

## Likely code / content surfaces
- apps/web billing / pricing / wallet routes
- Plan cards components

## Dependencies & blockers
- Depends: sunish payments, PT-P09 UAT
- Blockers: Prod deploy of trial APIs

## EOD proof required
Screenshots desktop+mobile + checklist of plan CTAs working

## Daily touch plan
- Work this task only on days that list `PT-P03` in the day plans under `00-days/`.
- If finished early, pull next priority In Progress → remaining Critical Not Started.

## Completion checklist
- [ ] Implementation complete
- [ ] Tested desktop
- [ ] Tested mobile (390px)
- [ ] Evidence saved
- [ ] Master Tracker status → Completed + notes
- [ ] Related Website Checklist / SEO / Testing cells updated
- [ ] EOD post in standup
