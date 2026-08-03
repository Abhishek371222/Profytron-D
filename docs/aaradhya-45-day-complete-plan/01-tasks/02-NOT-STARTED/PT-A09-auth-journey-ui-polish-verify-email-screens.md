# PT-A09 — Auth journey UI polish (verify-email screens)

| Field | Value |
|-------|--------|
| **Owner** | aaradhya |
| **Status (sheet)** | Not Started |
| **Priority** | Medium |
| **Phase** | Development |
| **Type** | Feature |
| **Estimate (hrs)** | 4.0 |
| **Actual logged (hrs)** | 0.0 |
| **Execution order** | NOT STARTED (do all IN PROGRESS before new NOT STARTED when possible) |
| **Sheet notes** | — |

## Why this exists
Verify-email screens complete trust in auth journey.

## Definition of Done (100%)
- All states covered; no blank error page

## Scope IN
- verify-email states: waiting, success, expired, resend

## Scope OUT
- Email deliverability (infra)

## Full execution steps
- 1. Inventory verify screens + copy
- 2. Align UI with design system buttons/alerts
- 3. Resend UX rate-limit messaging
- 4. Mobile + dark/light if both used

## Likely code / content surfaces
- auth verify-email routes

## Dependencies & blockers
- Depends: —
- Blockers: —

## EOD proof required
State matrix screenshots

## Daily touch plan
- Work this task only on days that list `PT-A09` in the day plans under `00-days/`.
- If finished early, pull next priority In Progress → remaining Critical Not Started.

## Completion checklist
- [ ] Implementation complete
- [ ] Tested desktop
- [ ] Tested mobile (390px)
- [ ] Evidence saved
- [ ] Master Tracker status → Completed + notes
- [ ] Related Website Checklist / SEO / Testing cells updated
- [ ] EOD post in standup
