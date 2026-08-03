# Day 41 — 2026-08-30 (Sun)

| Field | Value |
|-------|--------|
| **Phase** | W6 — Harden + load (M8) |
| **Sheet Day Status** | Not Started |
| **Daily focus (team)** | Prep scale |
| **Aaradhya sheet focus** | Light fixes |
| **Team EOD deliverable** | Invite ops ready |
| **Planned hours (10h model)** | 10.0h |
| **Primary residual task IDs** | PT-P09, PT-T07 |

> Plan day for catch-up (today's calendar context: Aug 2026). Primary residual Master IDs: PT-P09, PT-T07.

## Goal for Aaradhya today (one sentence)
Complete: **Light fixes** — and advance residual IDs: **PT-P09, PT-T07** to EOD proof quality.

## Order of work (always)
1. Unblock **In Progress** residual tasks first (PT-W01, PT-P03, PT-W02 if still open)
2. Then **Critical** Not Started
3. Then **High** → **Medium** → **Low**
4. Update sheets before offline: Master Tracker, Website Checklist, Testing, Standup

## Residual Master Tracker focus (detailed)
### PT-P09 (Not Started · High) — Manual browser QA: trial start -> banner -> upgrade
- Est 2.0h · Act 0.0h · Notes: Residual from RC validation.
- Why: Residual RC validation — manual path proves trial money UX end-to-end.
- Today's slice: execute next unfinished step from playbook
- Full plan file under `01-tasks/`
- EOD proof: Filled UAT checklist markdown

### PT-T07 (Not Started · High) — Get Bots / connected-accounts UI polish
- Est 8.0h · Act 0.0h · Notes: Get Bots + connected-accounts UI polish. /copy-trading redirects to /get-bots.
- Why: Get Bots is public product surface; connected-accounts UI must not confuse empty users.
- Today's slice: execute next unfinished step from playbook
- Full plan file under `01-tasks/`
- EOD proof: UI walkthrough notes + screenshots of empty/filled


## Full 10h schedule (from Daily 10h Tasks sheet)

### Block 1.0 — 09:00–10:00 (1.0h)
**Do:** Check Vercel/web deploy + /status manually.

**Done when (EOD proof):** Page loads or bug noted

**How (100%):**
1. Read residual task playbook if this block maps to a PT-* ID
2. Implement/verify in repo or browser as stated
3. Capture proof (screenshot, PR, prod URL, metric)
4. If blocked >30m, escalate to abhishek/sunish with evidence
5. Tick `Done` in Daily 10h sheet when proof exists

### Block 2.0 — 10:00–12:00 (2.0h)
**Do:** One small UI chore (typo, spacing, mobile overflow).

**Done when (EOD proof):** PR or fix

**How (100%):**
1. Read residual task playbook if this block maps to a PT-* ID
2. Implement/verify in repo or browser as stated
3. Capture proof (screenshot, PR, prod URL, metric)
4. If blocked >30m, escalate to abhishek/sunish with evidence
5. Tick `Done` in Daily 10h sheet when proof exists

### Block 3.0 — 12:00–13:00 (1.0h)
**Do:** Update Website Checklist tab honestly.

**Done when (EOD proof):** Checklist updated

**How (100%):**
1. Read residual task playbook if this block maps to a PT-* ID
2. Implement/verify in repo or browser as stated
3. Capture proof (screenshot, PR, prod URL, metric)
4. If blocked >30m, escalate to abhishek/sunish with evidence
5. Tick `Done` in Daily 10h sheet when proof exists

### Block 4.0 — 13:00–14:00 (1.0h)
**Do:** Prep Monday Lighthouse run command.

**Done when (EOD proof):** Command ready

**How (100%):**
1. Read residual task playbook if this block maps to a PT-* ID
2. Implement/verify in repo or browser as stated
3. Capture proof (screenshot, PR, prod URL, metric)
4. If blocked >30m, escalate to abhishek/sunish with evidence
5. Tick `Done` in Daily 10h sheet when proof exists
6. Run `npx lighthouse https://www.profytron.com --form-factor=mobile --only-categories=performance` thrice
7. Save JSON under `docs/aaradhya-45-day-complete-plan/evidence/day-{day}/`

### Block 5.0 — 14:00–15:00 (1.0h)
**Do:** Rest.

**Done when (EOD proof):** Done

**How (100%):**
1. Read residual task playbook if this block maps to a PT-* ID
2. Implement/verify in repo or browser as stated
3. Capture proof (screenshot, PR, prod URL, metric)
4. If blocked >30m, escalate to abhishek/sunish with evidence
5. Tick `Done` in Daily 10h sheet when proof exists

### Residual deep-work R1 — +2.0h (catch-up fill to 10h day)
**Do:** Advance **PT-P09** — Manual browser QA: trial start -> banner -> upgrade (Not Started · High)

**Why today:** Sheet block hours were only 6.0h; residual backlog is still open.

**Done when:** Meaningful progress + evidence toward DoD in task playbook.

**Full steps for this task:**
   - 1. Create test account
   - 2. Start trial; see banner
   - 3. Upgrade path opens correct plan
   - 4. Log defects; re-test after fixes

**Acceptance target:**
- Checklist all green or filed bugs with IDs

**Link:** `01-tasks/` → `PT-P09`

### Residual deep-work R2 — +2.0h (catch-up fill to 10h day)
**Do:** Advance **PT-T07** — Get Bots / connected-accounts UI polish (Not Started · High)

**Why today:** Sheet block hours were only 6.0h; residual backlog is still open.

**Done when:** Meaningful progress + evidence toward DoD in task playbook.

**Full steps for this task:**
   - 1. Map current Get Bots + connected-accounts routes
   - 2. Empty state: what user should do next (connect broker / pick bot)
   - 3. Loading + error + partial connection states
   - 4. Labels from bot-labels.ts consistent
   - 5. Mobile QA + accessibility labels on primary actions

**Acceptance target:**
- Empty state never dead-ends
- Marketing QA can demo path without verbal help

**Link:** `01-tasks/` → `PT-T07`


## Team context (same day)
| Person | Planned focus |
|--------|----------------|
| abhishek | Saturday: ops dry-run of invite-to-100 process |
| sunish | Light fixes |
| **aaradhya** | Light fixes |
| kushwaha | Segment prospect list for 100 |
| ishit | Batch social assets |


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
