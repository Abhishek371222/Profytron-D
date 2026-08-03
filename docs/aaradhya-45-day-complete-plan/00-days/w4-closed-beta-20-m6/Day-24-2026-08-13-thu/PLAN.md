# Day 24 — 2026-08-13 (Thu)

| Field | Value |
|-------|--------|
| **Phase** | W4 — Closed beta 20 (M6) |
| **Sheet Day Status** | Not Started |
| **Daily focus (team)** | Listen + fix |
| **Aaradhya sheet focus** | Fix top UI confusion from beta |
| **Team EOD deliverable** | 3 interviews done |
| **Planned hours (10h model)** | 10.0h |
| **Primary residual task IDs** | PT-T07, PT-C03 |

> Plan day for catch-up (today's calendar context: Aug 2026). Primary residual Master IDs: PT-T07, PT-C03.

## Goal for Aaradhya today (one sentence)
Complete: **Fix top UI confusion from beta** — and advance residual IDs: **PT-T07, PT-C03** to EOD proof quality.

## Order of work (always)
1. Unblock **In Progress** residual tasks first (PT-W01, PT-P03, PT-W02 if still open)
2. Then **Critical** Not Started
3. Then **High** → **Medium** → **Low**
4. Update sheets before offline: Master Tracker, Website Checklist, Testing, Standup

## Residual Master Tracker focus (detailed)
### PT-T07 (Not Started · High) — Get Bots / connected-accounts UI polish
- Est 8.0h · Act 0.0h · Notes: Get Bots + connected-accounts UI polish. /copy-trading redirects to /get-bots.
- Why: Get Bots is public product surface; connected-accounts UI must not confuse empty users.
- Today's slice: execute next unfinished step from playbook
- Full plan file under `01-tasks/`
- EOD proof: UI walkthrough notes + screenshots of empty/filled

### PT-C03 (Not Started · Medium) — Alpha Coach UI polish + empty states
- Est 5.0h · Act 0.0h · Notes: —
- Why: Coach without polished UI looks broken even if stream API works.
- Today's slice: execute next unfinished step from playbook
- Full plan file under `01-tasks/`
- EOD proof: Screens of empty/load/error/success


## Full 10h schedule (from Daily 10h Tasks sheet)

### Block 1.0 — 09:00–10:00 (1.0h)
**Do:** Watch PostHog funnel drop-offs morning.

**Done when (EOD proof):** Drop step named

**How (100%):**
1. Read residual task playbook if this block maps to a PT-* ID
2. Implement/verify in repo or browser as stated
3. Capture proof (screenshot, PR, prod URL, metric)
4. If blocked >30m, escalate to abhishek/sunish with evidence
5. Tick `Done` in Daily 10h sheet when proof exists
6. Confirm env vars on Cloud Run web revision
7. Fire test event; screenshot PostHog live (redact PII)

### Block 2.0 — 10:00–13:00 (3.0h)
**Do:** Fix onboarding/registration UX causing drop-offs.

**Done when (EOD proof):** Fix shipped

**How (100%):**
1. Read residual task playbook if this block maps to a PT-* ID
2. Implement/verify in repo or browser as stated
3. Capture proof (screenshot, PR, prod URL, metric)
4. If blocked >30m, escalate to abhishek/sunish with evidence
5. Tick `Done` in Daily 10h sheet when proof exists

### Block 3.0 — 13:00–15:00 (2.0h)
**Do:** Hotfix UI for beta confusion.

**Done when (EOD proof):** Hotfix

**How (100%):**
1. Read residual task playbook if this block maps to a PT-* ID
2. Implement/verify in repo or browser as stated
3. Capture proof (screenshot, PR, prod URL, metric)
4. If blocked >30m, escalate to abhishek/sunish with evidence
5. Tick `Done` in Daily 10h sheet when proof exists

### Block 4.0 — 14:00–16:00 (2.0h)
**Do:** Ship FAQ updates from beta questions.

**Done when (EOD proof):** Updated

**How (100%):**
1. Read residual task playbook if this block maps to a PT-* ID
2. Implement/verify in repo or browser as stated
3. Capture proof (screenshot, PR, prod URL, metric)
4. If blocked >30m, escalate to abhishek/sunish with evidence
5. Tick `Done` in Daily 10h sheet when proof exists

### Block 5.0 — 16:00–17:00 (1.0h)
**Do:** EOD funnel note.

**Done when (EOD proof):** Logged

**How (100%):**
1. Read residual task playbook if this block maps to a PT-* ID
2. Implement/verify in repo or browser as stated
3. Capture proof (screenshot, PR, prod URL, metric)
4. If blocked >30m, escalate to abhishek/sunish with evidence
5. Tick `Done` in Daily 10h sheet when proof exists
6. Confirm env vars on Cloud Run web revision
7. Fire test event; screenshot PostHog live (redact PII)

### Block 6.0 — 17:00–18:00 (1.0h)
**Do:** Quick regression on mobile signup.

**Done when (EOD proof):** Still works

**How (100%):**
1. Read residual task playbook if this block maps to a PT-* ID
2. Implement/verify in repo or browser as stated
3. Capture proof (screenshot, PR, prod URL, metric)
4. If blocked >30m, escalate to abhishek/sunish with evidence
5. Tick `Done` in Daily 10h sheet when proof exists


## Team context (same day)
| Person | Planned focus |
|--------|----------------|
| abhishek | Product calls with 3 beta users (15m each) |
| sunish | Fix top sync/balance bug from beta |
| **aaradhya** | Fix top UI confusion from beta |
| kushwaha | Invite 5 more from waitlist if slots; partnership update |
| ishit | Case-study notes (with consent); Short/Reel script #1 |


## Cross-sheet micro-checks (end of day — do all that apply)
- [ ] **Master Tracker**: status/hours/notes for any task touched
- [ ] **Website Checklist**: SEO/Code Ready / Prod Live if page shipped
- [ ] **Testing Dashboard**: Eng Status if module improved
- [ ] **KPI Dashboard**: LCP or activation if measured
- [ ] **SEO Tracker**: if keyword page shipped
- [ ] **Daily Standup**: yesterday/today/blockers 3 lines
- [ ] **Launch Countdown**: M3 if LCP+hero progressed

## Quality bar (nothing half-done)
- Work is not “done” without evidence
- Prefer one finished PT-* over three half-finished UI tweaks
- If day is Rest: only P0 prod burns; update plan gaps instead of inventing features

## Sign-off
- [ ] All blocks attempted or consciously deferred with reason
- [ ] Evidence folder/links posted
- [ ] Tomorrow’s first block pre-noted
