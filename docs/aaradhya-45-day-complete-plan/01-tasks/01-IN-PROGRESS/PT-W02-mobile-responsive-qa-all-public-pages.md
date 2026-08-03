# PT-W02 — Mobile responsive QA all public pages

| Field | Value |
|-------|--------|
| **Owner** | aaradhya |
| **Status (sheet)** | In Progress |
| **Priority** | High |
| **Phase** | Testing |
| **Type** | Chore |
| **Estimate (hrs)** | 10.0 |
| **Actual logged (hrs)** | 3.0 |
| **Execution order** | IN PROGRESS (do all IN PROGRESS before new NOT STARTED when possible) |
| **Sheet notes** | — |

## Why this exists
Public pages must work at phone sizes for growth traffic.

## Definition of Done (100%)
- No horizontal scroll on key pages at 390px
- Primary CTA always visible without obscure overlap
- Evidence folder of before/after shots

## Scope IN
- All public marketing pages + auth pages at 390, 768, 1280
- Fix overflow, stacked CTAs, footer, nav drawer

## Scope OUT
- Admin-only dense tables full redesign

## Full execution steps
- 1. Build page checklist from Website Checklist tab
- 2. Screenshot matrix per page × viewport
- 3. Log bugs P0/P1; fix P0 same day, P1 within 48h
- 4. Re-QA fixed pages; mark Website Checklist SEO/Code Ready updates

## Likely code / content surfaces
- apps/web marketing layouts, auth pages, globals CSS

## Dependencies & blockers
- Depends: —
- Blockers: —

## EOD proof required
QA matrix sheet or markdown + linked fixes

## Daily touch plan
- Work this task only on days that list `PT-W02` in the day plans under `00-days/`.
- If finished early, pull next priority In Progress → remaining Critical Not Started.

## Completion checklist
- [ ] Implementation complete
- [ ] Tested desktop
- [ ] Tested mobile (390px)
- [ ] Evidence saved
- [ ] Master Tracker status → Completed + notes
- [ ] Related Website Checklist / SEO / Testing cells updated
- [ ] EOD post in standup
