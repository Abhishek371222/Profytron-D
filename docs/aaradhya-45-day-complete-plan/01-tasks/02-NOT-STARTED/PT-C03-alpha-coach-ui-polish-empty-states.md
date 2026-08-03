# PT-C03 — Alpha Coach UI polish + empty states

| Field | Value |
|-------|--------|
| **Owner** | aaradhya |
| **Status (sheet)** | Not Started |
| **Priority** | Medium |
| **Phase** | Development |
| **Type** | Feature |
| **Estimate (hrs)** | 5.0 |
| **Actual logged (hrs)** | 0.0 |
| **Execution order** | NOT STARTED (do all IN PROGRESS before new NOT STARTED when possible) |
| **Sheet notes** | — |

## Why this exists
Coach without polished UI looks broken even if stream API works.

## Definition of Done (100%)
- No blank white panels; retry works

## Scope IN
- Empty/loading/error states on Alpha Coach UI

## Scope OUT
- Coach model quality (sunish/ai service)

## Full execution steps
- 1. Cold open coach with no messages
- 2. Loading skeleton while streaming
- 3. Error retry UX
- 4. Empty suggestions if any product wants them

## Likely code / content surfaces
- apps/web alpha-coach pages

## Dependencies & blockers
- Depends: sunish coach
- Blockers: Coach API keys UAT partial — degrade gracefully

## EOD proof required
Screens of empty/load/error/success

## Daily touch plan
- Work this task only on days that list `PT-C03` in the day plans under `00-days/`.
- If finished early, pull next priority In Progress → remaining Critical Not Started.

## Completion checklist
- [ ] Implementation complete
- [ ] Tested desktop
- [ ] Tested mobile (390px)
- [ ] Evidence saved
- [ ] Master Tracker status → Completed + notes
- [ ] Related Website Checklist / SEO / Testing cells updated
- [ ] EOD post in standup
