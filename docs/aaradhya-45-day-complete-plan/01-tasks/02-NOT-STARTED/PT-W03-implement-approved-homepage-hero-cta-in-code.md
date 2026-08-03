# PT-W03 — Implement approved homepage hero/CTA in code

| Field | Value |
|-------|--------|
| **Owner** | aaradhya |
| **Status (sheet)** | Not Started |
| **Priority** | Critical |
| **Phase** | Development |
| **Type** | Feature |
| **Estimate (hrs)** | 4.0 |
| **Actual logged (hrs)** | 0.0 |
| **Execution order** | NOT STARTED (do all IN PROGRESS before new NOT STARTED when possible) |
| **Sheet notes** | After ishit copy |

## Why this exists
Homepage conversion copy must match approved brand message in code.

## Definition of Done (100%)
- Prod shows approved copy; CTAs trackable

## Scope IN
- Hero headline, subcopy, primary/secondary CTA wiring

## Scope OUT
- Writing the copy (ishit/abhishek)

## Full execution steps
- 1. Receive approved copy pack from ishit
- 2. Wire strings (CMS/MDX/const) — no hardcode drift
- 3. CTA hrefs verified (register/get-bots/pricing)
- 4. Ship after LCP safeguards not regressed

## Likely code / content surfaces
- landing hero components, content modules

## Dependencies & blockers
- Depends: PT-W01 ideally green first or parallel
- Blockers: Waiting on ishit approved hero

## EOD proof required
Prod screenshot of hero + copy source file

## Daily touch plan
- Work this task only on days that list `PT-W03` in the day plans under `00-days/`.
- If finished early, pull next priority In Progress → remaining Critical Not Started.

## Completion checklist
- [ ] Implementation complete
- [ ] Tested desktop
- [ ] Tested mobile (390px)
- [ ] Evidence saved
- [ ] Master Tracker status → Completed + notes
- [ ] Related Website Checklist / SEO / Testing cells updated
- [ ] EOD post in standup
