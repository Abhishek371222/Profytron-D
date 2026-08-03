# PT-P09 — Manual browser QA: trial start -> banner -> upgrade

| Field | Value |
|-------|--------|
| **Owner** | aaradhya |
| **Status (sheet)** | Not Started |
| **Priority** | High |
| **Phase** | Testing |
| **Type** | UAT |
| **Estimate (hrs)** | 2.0 |
| **Actual logged (hrs)** | 0.0 |
| **Execution order** | NOT STARTED (do all IN PROGRESS before new NOT STARTED when possible) |
| **Sheet notes** | Residual from RC validation. |

## Why this exists
Residual RC validation — manual path proves trial money UX end-to-end.

## Definition of Done (100%)
- Checklist all green or filed bugs with IDs

## Scope IN
- Browser QA trial start → banner → upgrade on staging/prod

## Scope OUT
- Fixing backend race (already done local per sheet notes)

## Full execution steps
- 1. Create test account
- 2. Start trial; see banner
- 3. Upgrade path opens correct plan
- 4. Log defects; re-test after fixes

## Likely code / content surfaces
- billing UI
- api trial endpoints (observe only)

## Dependencies & blockers
- Depends: PT-P03
- Blockers: Trial must be on environment under test

## EOD proof required
Filled UAT checklist markdown

## Daily touch plan
- Work this task only on days that list `PT-P09` in the day plans under `00-days/`.
- If finished early, pull next priority In Progress → remaining Critical Not Started.

## Completion checklist
- [ ] Implementation complete
- [ ] Tested desktop
- [ ] Tested mobile (390px)
- [ ] Evidence saved
- [ ] Master Tracker status → Completed + notes
- [ ] Related Website Checklist / SEO / Testing cells updated
- [ ] EOD post in standup
