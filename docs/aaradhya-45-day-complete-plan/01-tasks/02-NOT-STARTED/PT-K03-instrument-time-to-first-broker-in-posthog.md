# PT-K03 — Instrument time-to-first-broker in PostHog

| Field | Value |
|-------|--------|
| **Owner** | aaradhya |
| **Status (sheet)** | Not Started |
| **Priority** | High |
| **Phase** | Marketing |
| **Type** | Feature |
| **Estimate (hrs)** | 3.0 |
| **Actual logged (hrs)** | 0.0 |
| **Execution order** | NOT STARTED (do all IN PROGRESS before new NOT STARTED when possible) |
| **Sheet notes** | — |

## Why this exists
Time-to-first-broker is core activation metric.

## Definition of Done (100%)
- Events visible for a test user path

## Scope IN
- Instrument start/success events + optional timestamps

## Scope OUT
- Improving broker API reliability

## Full execution steps
- 1. Event names agreed with abhishek (PT-M02)
- 2. Fire on UI actions and success API
- 3. Build simple PostHog insight or note formula

## Likely code / content surfaces
- connected accounts / onboarding flows

## Dependencies & blockers
- Depends: PT-M01, PT-M02
- Blockers: PostHog live (PT-M01)

## EOD proof required
Insight link/screenshot

## Daily touch plan
- Work this task only on days that list `PT-K03` in the day plans under `00-days/`.
- If finished early, pull next priority In Progress → remaining Critical Not Started.

## Completion checklist
- [ ] Implementation complete
- [ ] Tested desktop
- [ ] Tested mobile (390px)
- [ ] Evidence saved
- [ ] Master Tracker status → Completed + notes
- [ ] Related Website Checklist / SEO / Testing cells updated
- [ ] EOD post in standup
