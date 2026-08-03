# Day 16 — 2026-08-05 (Wed)

| Field | Value |
|-------|--------|
| **Phase** | W3 — Dogfood + beta prep (M5) |
| **Sheet Day Status** | Not Started |
| **Daily focus (team)** | Bug burn-down + email sequence |
| **Aaradhya sheet focus** | P0 frontend fixes from dogfood |
| **Team EOD deliverable** | P0 list shrinking; welcome sequence drafted |
| **Planned hours (10h model)** | 10.0h |
| **Primary residual task IDs** | PT-P03, PT-P09 |

> Plan day for catch-up (today's calendar context: Aug 2026). Primary residual Master IDs: PT-P03, PT-P09.

## Goal for Aaradhya today (one sentence)
Complete: **P0 frontend fixes from dogfood** — and advance residual IDs: **PT-P03, PT-P09** to EOD proof quality.

## Order of work (always)
1. Unblock **In Progress** residual tasks first (PT-W01, PT-P03, PT-W02 if still open)
2. Then **Critical** Not Started
3. Then **High** → **Medium** → **Low**
4. Update sheets before offline: Master Tracker, Website Checklist, Testing, Standup

## Residual Master Tracker focus (detailed)
### PT-P03 (In Progress · High) — Billing UI polish + plan cards
- Est 5.0h · Act 2.0h · Notes: Billing UI exists; trial UI coded locally, not on prod gitSha 1044ce5.
- Why: Billing UI is the money path; trial UI coded locally must reach production polish.
- Today's slice: execute next unfinished step from playbook
- Full plan file under `01-tasks/`
- EOD proof: Screenshots desktop+mobile + checklist of plan CTAs working

### PT-P09 (Not Started · High) — Manual browser QA: trial start -> banner -> upgrade
- Est 2.0h · Act 0.0h · Notes: Residual from RC validation.
- Why: Residual RC validation — manual path proves trial money UX end-to-end.
- Today's slice: execute next unfinished step from playbook
- Full plan file under `01-tasks/`
- EOD proof: Filled UAT checklist markdown


## Full 10h schedule (from Daily 10h Tasks sheet)

### Block 1.0 — 09:00–10:00 (1.0h)
**Do:** Standup / dogfood UI bugs.

**Done when (EOD proof):** List refreshed

**How (100%):**
1. Read residual task playbook if this block maps to a PT-* ID
2. Implement/verify in repo or browser as stated
3. Capture proof (screenshot, PR, prod URL, metric)
4. If blocked >30m, escalate to abhishek/sunish with evidence
5. Tick `Done` in Daily 10h sheet when proof exists

### Block 2.0 — 10:00–13:00 (3.0h)
**Do:** Onboarding + risk page UX polish.

**Done when (EOD proof):** PR

**How (100%):**
1. Read residual task playbook if this block maps to a PT-* ID
2. Implement/verify in repo or browser as stated
3. Capture proof (screenshot, PR, prod URL, metric)
4. If blocked >30m, escalate to abhishek/sunish with evidence
5. Tick `Done` in Daily 10h sheet when proof exists

### Block 3.0 — 13:00–15:00 (2.0h)
**Do:** Implement FAQ content ishit finished.

**Done when (EOD proof):** FAQs live

**How (100%):**
1. Read residual task playbook if this block maps to a PT-* ID
2. Implement/verify in repo or browser as stated
3. Capture proof (screenshot, PR, prod URL, metric)
4. If blocked >30m, escalate to abhishek/sunish with evidence
5. Tick `Done` in Daily 10h sheet when proof exists

### Block 4.0 — 14:00–16:00 (2.0h)
**Do:** Community page Discord links live.

**Done when (EOD proof):** Links work

**How (100%):**
1. Read residual task playbook if this block maps to a PT-* ID
2. Implement/verify in repo or browser as stated
3. Capture proof (screenshot, PR, prod URL, metric)
4. If blocked >30m, escalate to abhishek/sunish with evidence
5. Tick `Done` in Daily 10h sheet when proof exists

### Block 5.0 — 16:00–17:00 (1.0h)
**Do:** P0 UI from dogfood.

**Done when (EOD proof):** Fixed or queued

**How (100%):**
1. Read residual task playbook if this block maps to a PT-* ID
2. Implement/verify in repo or browser as stated
3. Capture proof (screenshot, PR, prod URL, metric)
4. If blocked >30m, escalate to abhishek/sunish with evidence
5. Tick `Done` in Daily 10h sheet when proof exists

### Block 6.0 — 17:00–18:00 (1.0h)
**Do:** EOD.

**Done when (EOD proof):** Logged

**How (100%):**
1. Read residual task playbook if this block maps to a PT-* ID
2. Implement/verify in repo or browser as stated
3. Capture proof (screenshot, PR, prod URL, metric)
4. If blocked >30m, escalate to abhishek/sunish with evidence
5. Tick `Done` in Daily 10h sheet when proof exists


## Team context (same day)
| Person | Planned focus |
|--------|----------------|
| abhishek | Triage dogfood feedback; prioritize P0/P1 board |
| sunish | P0 backend fixes (sync/auth/payments leftovers) |
| **aaradhya** | P0 frontend fixes from dogfood |
| kushwaha | Partnership outreach #7–10; soft ask for beta interest |
| ishit | Welcome email #2–3 copy; MT5 connect guide outline |


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
