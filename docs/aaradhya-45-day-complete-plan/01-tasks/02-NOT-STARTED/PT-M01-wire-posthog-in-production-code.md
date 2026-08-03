# PT-M01 — Wire PostHog in production (code)

| Field | Value |
|-------|--------|
| **Owner** | aaradhya |
| **Status (sheet)** | Not Started |
| **Priority** | Critical |
| **Phase** | Ops |
| **Type** | Ops |
| **Estimate (hrs)** | 5.0 |
| **Actual logged (hrs)** | 0.0 |
| **Execution order** | NOT STARTED (do all IN PROGRESS before new NOT STARTED when possible) |
| **Sheet notes** | PostHog prod wiring not verified complete through 2026-07-30. |

## Why this exists
Without PostHog in prod, activation KPI and funnel fixes are blind.

## Definition of Done (100%)
- Live event visible for a real prod session
- KPI sheet notes flip from 'not verified live'

## Scope IN
- Web PostHog provider env production
- Core events: pageview, signup, login, broker_connect_start/success, bot_subscribe
- Privacy: respect cookie banner

## Scope OUT
- Defining full funnel taxonomy (PT-M02 abhishek owns definition)

## Full execution steps
- 1. Verify env NEXT_PUBLIC_POSTHOG_KEY/HOST on Cloud Run web
- 2. Confirm provider mounts only client-side
- 3. Fire test events; see in PostHog live
- 4. Gate analytics behind consent if banner required
- 5. Document events list for team

## Likely code / content surfaces
- apps/web analytics/posthog provider
- env example

## Dependencies & blockers
- Depends: PT-M02 for full funnel naming
- Blockers: API keys from abhishek

## EOD proof required
PostHog live screenshot (redact personal data)

## Daily touch plan
- Work this task only on days that list `PT-M01` in the day plans under `00-days/`.
- If finished early, pull next priority In Progress → remaining Critical Not Started.

## Completion checklist
- [ ] Implementation complete
- [ ] Tested desktop
- [ ] Tested mobile (390px)
- [ ] Evidence saved
- [ ] Master Tracker status → Completed + notes
- [ ] Related Website Checklist / SEO / Testing cells updated
- [ ] EOD post in standup
