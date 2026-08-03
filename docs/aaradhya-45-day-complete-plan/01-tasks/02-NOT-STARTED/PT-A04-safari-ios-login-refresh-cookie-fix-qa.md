# PT-A04 — Safari/iOS login + refresh cookie fix/QA

| Field | Value |
|-------|--------|
| **Owner** | aaradhya |
| **Status (sheet)** | Not Started |
| **Priority** | High |
| **Phase** | Testing |
| **Type** | Bug |
| **Estimate (hrs)** | 6.0 |
| **Actual logged (hrs)** | 0.0 |
| **Execution order** | NOT STARTED (do all IN PROGRESS before new NOT STARTED when possible) |
| **Sheet notes** | Safari/iOS login QA still outstanding. |

## Why this exists
Safari/iOS auth cookie issues block real users on highest-friction browsers.

## Definition of Done (100%)
- Login + refresh survives 15 min idle on Safari iOS real device or BrowserStack
- Bug list empty or only P2 left

## Scope IN
- Login, register, OTP, refresh cookie, hard-nav flows on Safari iOS + desktop Safari
- SameSite/Secure/partitioned cookie behavior checks

## Scope OUT
- Android-only WebView bugs unless same root cause

## Full execution steps
- 1. Device matrix: Safari 17+ iOS latest, desktop Safari
- 2. Reproduce login → refresh → protected route
- 3. Capture network Set-Cookie + document.cookie constraints
- 4. Fix with auth team patterns (distinct JTIs, refresh grace already noted in MASTER_PROGRESS)
- 5. Re-test full OTP UAT path on Safari
- 6. Document in Testing Dashboard Auth row

## Likely code / content surfaces
- apps/web auth clients
- apps/api auth controller cookie settings

## Dependencies & blockers
- Depends: Existing OTP UAT PASS evidence
- Blockers: May need API cookie header change with sunish

## EOD proof required
Safari session video or step log + cookies screenshot (redact tokens)

## Daily touch plan
- Work this task only on days that list `PT-A04` in the day plans under `00-days/`.
- If finished early, pull next priority In Progress → remaining Critical Not Started.

## Completion checklist
- [ ] Implementation complete
- [ ] Tested desktop
- [ ] Tested mobile (390px)
- [ ] Evidence saved
- [ ] Master Tracker status → Completed + notes
- [ ] Related Website Checklist / SEO / Testing cells updated
- [ ] EOD post in standup
