# PT-L04 — Chatbot keys + FAQ content pack wiring

| Field | Value |
|-------|--------|
| **Owner** | aaradhya |
| **Status (sheet)** | Not Started |
| **Priority** | Medium |
| **Phase** | Ops |
| **Type** | Ops |
| **Estimate (hrs)** | 4.0 |
| **Actual logged (hrs)** | 0.0 |
| **Execution order** | NOT STARTED (do all IN PROGRESS before new NOT STARTED when possible) |
| **Sheet notes** | ishit writes FAQ pack |

## Why this exists
Chatbot/FAQ wiring reduces support load.

## Definition of Done (100%)
- FAQ readable; chatbot fails soft when offline

## Scope IN
- Keys env, FAQ pack render, widget placement

## Scope OUT
- Writing FAQ content (ishit)

## Full execution steps
- 1. Confirm chatbot keys safe env
- 2. Implement FAQ pack structure
- 3. Fallback when keys missing

## Likely code / content surfaces
- support/chatbot components

## Dependencies & blockers
- Depends: —
- Blockers: FAQ pack from ishit

## EOD proof required
FAQ page + widget screenshot

## Daily touch plan
- Work this task only on days that list `PT-L04` in the day plans under `00-days/`.
- If finished early, pull next priority In Progress → remaining Critical Not Started.

## Completion checklist
- [ ] Implementation complete
- [ ] Tested desktop
- [ ] Tested mobile (390px)
- [ ] Evidence saved
- [ ] Master Tracker status → Completed + notes
- [ ] Related Website Checklist / SEO / Testing cells updated
- [ ] EOD post in standup
