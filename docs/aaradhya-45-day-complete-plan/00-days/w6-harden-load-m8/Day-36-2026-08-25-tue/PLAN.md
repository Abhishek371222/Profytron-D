# Day 36 — 2026-08-25 (Tue)

| Field | Value |
|-------|--------|
| **Phase** | W6 — Harden + load (M8) |
| **Sheet Day Status** | Not Started |
| **Daily focus (team)** | Load test day |
| **Aaradhya sheet focus** | Fix frontend errors under load if any; monitor RUM |
| **Team EOD deliverable** | Load report attached |
| **Planned hours (10h model)** | 10.0h |
| **Primary residual task IDs** | PT-W01 |

> Plan day for catch-up (today's calendar context: Aug 2026). Primary residual Master IDs: PT-W01.

## Goal for Aaradhya today (one sentence)
Complete: **Fix frontend errors under load if any; monitor RUM** — and advance residual IDs: **PT-W01** to EOD proof quality.

## Order of work (always)
1. Unblock **In Progress** residual tasks first (PT-W01, PT-P03, PT-W02 if still open)
2. Then **Critical** Not Started
3. Then **High** → **Medium** → **Low**
4. Update sheets before offline: Master Tracker, Website Checklist, Testing, Standup

## Residual Master Tracker focus (detailed)
### PT-W01 (In Progress · Critical) — Landing LCP < 4s (lazy-load 3D/motion)
- Est 16.0h · Act 4.0h · Notes: Perf work in repo; LCP <4s not formally signed off.
- Why: Landing LCP is the #1 public conversion speed gate (Launch M3 + KPI).
- Today's slice: execute next unfinished step from playbook
- Full plan file under `01-tasks/`
- EOD proof: Before/after LCP numbers + PR URL + prod Lighthouse screenshot


## Full 10h schedule (from Daily 10h Tasks sheet)

### Block 1.0 — 09:00–10:00 (1.0h)
**Do:** Feature freeze: bugs only.

**Done when (EOD proof):** No features

**How (100%):**
1. Read residual task playbook if this block maps to a PT-* ID
2. Implement/verify in repo or browser as stated
3. Capture proof (screenshot, PR, prod URL, metric)
4. If blocked >30m, escalate to abhishek/sunish with evidence
5. Tick `Done` in Daily 10h sheet when proof exists

### Block 2.0 — 10:00–13:00 (3.0h)
**Do:** Fix frontend errors seen under load / Sentry.

**Done when (EOD proof):** Fix

**How (100%):**
1. Read residual task playbook if this block maps to a PT-* ID
2. Implement/verify in repo or browser as stated
3. Capture proof (screenshot, PR, prod URL, metric)
4. If blocked >30m, escalate to abhishek/sunish with evidence
5. Tick `Done` in Daily 10h sheet when proof exists

### Block 3.0 — 13:00–15:00 (2.0h)
**Do:** Reduce noisy refetch/polling if identified.

**Done when (EOD proof):** Change or N/A

**How (100%):**
1. Read residual task playbook if this block maps to a PT-* ID
2. Implement/verify in repo or browser as stated
3. Capture proof (screenshot, PR, prod URL, metric)
4. If blocked >30m, escalate to abhishek/sunish with evidence
5. Tick `Done` in Daily 10h sheet when proof exists

### Block 4.0 — 14:00–16:00 (2.0h)
**Do:** Status page trust polish.

**Done when (EOD proof):** Shipped

**How (100%):**
1. Read residual task playbook if this block maps to a PT-* ID
2. Implement/verify in repo or browser as stated
3. Capture proof (screenshot, PR, prod URL, metric)
4. If blocked >30m, escalate to abhishek/sunish with evidence
5. Tick `Done` in Daily 10h sheet when proof exists

### Block 5.0 — 16:00–17:00 (1.0h)
**Do:** Image alt / OG leftovers.

**Done when (EOD proof):** Done

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
| abhishek | Authorize load test window; freeze feature work (bugs only) |
| sunish | Run k6 load:d7:100 against healthy API; capture report |
| **aaradhya** | Fix frontend errors under load if any; monitor RUM |
| kushwaha | No big campaigns (stability week); nurture only |
| ishit | Publish case study; educational posts only |


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
