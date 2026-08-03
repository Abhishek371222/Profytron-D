# Day 10 — 2026-07-30 (Thu)

| Field | Value |
|-------|--------|
| **Phase** | W2 — Prove live (M1–M4) |
| **Sheet Day Status** | In Progress |
| **Daily focus (team)** | MetaAPI UAT + distribution |
| **Aaradhya sheet focus** | Connected-accounts empty states; Safari login QA |
| **Team EOD deliverable** | TODAY: Trial race-condition fix validated locally. MetaAPI/Get Bots UAT OPEN. Sheet sync applied. |
| **Planned hours (10h model)** | 10.0h |
| **Primary residual task IDs** | — (early complete days / rest) |

> Sheet status: In Progress (2026-07-30). Close residual Safari + connected-accounts items.

## Goal for Aaradhya today (one sentence)
Complete: **Connected-accounts empty states; Safari login QA** — and advance residual IDs: **sheet blocks only** to EOD proof quality.

## Order of work (always)
1. Unblock **In Progress** residual tasks first (PT-W01, PT-P03, PT-W02 if still open)
2. Then **Critical** Not Started
3. Then **High** → **Medium** → **Low**
4. Update sheets before offline: Master Tracker, Website Checklist, Testing, Standup

## Residual Master Tracker focus (detailed)
No catch-up IDs mapped (use 10h blocks only).

## Full 10h schedule (from Daily 10h Tasks sheet)

### Block 1.0 — 09:00–10:00 (1.0h)
**Do:** Standup.

**Done when (EOD proof):** Done

**How (100%):**
1. Read residual task playbook if this block maps to a PT-* ID
2. Implement/verify in repo or browser as stated
3. Capture proof (screenshot, PR, prod URL, metric)
4. If blocked >30m, escalate to abhishek/sunish with evidence
5. Tick `Done` in Daily 10h sheet when proof exists

### Block 2.0 — 10:00–13:00 (3.0h)
**Do:** Connected-accounts empty states clearer.

**Done when (EOD proof):** Merged

**How (100%):**
1. Read residual task playbook if this block maps to a PT-* ID
2. Implement/verify in repo or browser as stated
3. Capture proof (screenshot, PR, prod URL, metric)
4. If blocked >30m, escalate to abhishek/sunish with evidence
5. Tick `Done` in Daily 10h sheet when proof exists

### Block 3.0 — 13:00–16:00 (3.0h)
**Do:** Safari/iOS login test on real device/browser. Log bugs.

**Done when (EOD proof):** Bug list

**How (100%):**
1. Read residual task playbook if this block maps to a PT-* ID
2. Implement/verify in repo or browser as stated
3. Capture proof (screenshot, PR, prod URL, metric)
4. If blocked >30m, escalate to abhishek/sunish with evidence
5. Tick `Done` in Daily 10h sheet when proof exists
6. Matrix: Safari iOS + desktop Safari login → refresh → protected route
7. Capture Set-Cookie flags; file bug with repro steps if fails

### Block 4.0 — 14:00–16:00 (2.0h)
**Do:** Fix one auth cookie/redirect bug if found.

**Done when (EOD proof):** Fix or no-repro

**How (100%):**
1. Read residual task playbook if this block maps to a PT-* ID
2. Implement/verify in repo or browser as stated
3. Capture proof (screenshot, PR, prod URL, metric)
4. If blocked >30m, escalate to abhishek/sunish with evidence
5. Tick `Done` in Daily 10h sheet when proof exists
6. Matrix: Safari iOS + desktop Safari login → refresh → protected route
7. Capture Set-Cookie flags; file bug with repro steps if fails

### Block 5.0 — 16:00–17:00 (1.0h)
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
| abhishek | Join MetaAPI UAT session; note product gaps |
| sunish | Live MetaAPI MT5 connect UAT; sync → dashboard balance check |
| **aaradhya** | Connected-accounts empty states; Safari login QA |
| kushwaha | Recruit 2 trader friends for tomorrow's broker test; community channel rules pinned |
| ishit | Blog #2 draft; LinkedIn/X post announcing blog #1 |


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
