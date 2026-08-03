# PT-T07 — Get Bots / connected-accounts UI polish

| Field | Value |
|-------|--------|
| **Owner** | aaradhya |
| **Status (sheet)** | Not Started |
| **Priority** | High |
| **Phase** | Development |
| **Type** | Feature |
| **Estimate (hrs)** | 8.0 |
| **Actual logged (hrs)** | 0.0 |
| **Execution order** | NOT STARTED (do all IN PROGRESS before new NOT STARTED when possible) |
| **Sheet notes** | Get Bots + connected-accounts UI polish. /copy-trading redirects to /get-bots. |

## Why this exists
Get Bots is public product surface; connected-accounts UI must not confuse empty users.

## Definition of Done (100%)
- Empty state never dead-ends
- Marketing QA can demo path without verbal help

## Scope IN
- /get-bots, connected accounts empty/partial states
- bot-labels consistency
- Redirect /copy-trading → /get-bots still clean

## Scope OUT
- MetaAPI connectivity bugs (sunish PT-T01/T02)

## Full execution steps
- 1. Map current Get Bots + connected-accounts routes
- 2. Empty state: what user should do next (connect broker / pick bot)
- 3. Loading + error + partial connection states
- 4. Labels from bot-labels.ts consistent
- 5. Mobile QA + accessibility labels on primary actions

## Likely code / content surfaces
- apps/web get-bots, marketplace, connected-accounts, bot-labels.ts

## Dependencies & blockers
- Depends: sunish MetaAPI
- Blockers: Backend MetaAPI UAT open (Testing Dashboard)

## EOD proof required
UI walkthrough notes + screenshots of empty/filled

## Daily touch plan
- Work this task only on days that list `PT-T07` in the day plans under `00-days/`.
- If finished early, pull next priority In Progress → remaining Critical Not Started.

## Completion checklist
- [ ] Implementation complete
- [ ] Tested desktop
- [ ] Tested mobile (390px)
- [ ] Evidence saved
- [ ] Master Tracker status → Completed + notes
- [ ] Related Website Checklist / SEO / Testing cells updated
- [ ] EOD post in standup
