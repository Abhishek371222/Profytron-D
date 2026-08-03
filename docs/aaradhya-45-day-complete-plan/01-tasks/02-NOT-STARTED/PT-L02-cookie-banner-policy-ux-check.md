# PT-L02 — Cookie banner / policy UX check

| Field | Value |
|-------|--------|
| **Owner** | aaradhya |
| **Status (sheet)** | Not Started |
| **Priority** | Medium |
| **Phase** | Testing |
| **Type** | Feature |
| **Estimate (hrs)** | 3.0 |
| **Actual logged (hrs)** | 0.0 |
| **Execution order** | NOT STARTED (do all IN PROGRESS before new NOT STARTED when possible) |
| **Sheet notes** | — |

## Why this exists
Cookie banner/policy UX is compliance + PostHog consent gate.

## Definition of Done (100%)
- Choice persists; no analytics before accept if required by policy

## Scope IN
- Banner UX, accept/reject, links to policy

## Scope OUT
- Legal policy drafting (abhishek)

## Full execution steps
- 1. Force first-visit state
- 2. Keyboard + mobile overlay issues
- 3. Integrate analytics gating with choice

## Likely code / content surfaces
- cookie banner component, analytics provider

## Dependencies & blockers
- Depends: PT-M01
- Blockers: —

## EOD proof required
First-visit video

## Daily touch plan
- Work this task only on days that list `PT-L02` in the day plans under `00-days/`.
- If finished early, pull next priority In Progress → remaining Critical Not Started.

## Completion checklist
- [ ] Implementation complete
- [ ] Tested desktop
- [ ] Tested mobile (390px)
- [ ] Evidence saved
- [ ] Master Tracker status → Completed + notes
- [ ] Related Website Checklist / SEO / Testing cells updated
- [ ] EOD post in standup
