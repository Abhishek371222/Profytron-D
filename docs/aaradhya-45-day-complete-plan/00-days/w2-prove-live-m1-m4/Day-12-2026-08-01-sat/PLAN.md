# Day 12 — 2026-08-01 (Sat)

| Field | Value |
|-------|--------|
| **Phase** | W2 — Prove live (M1–M4) |
| **Sheet Day Status** | Not Started |
| **Daily focus (team)** | W2 ship day |
| **Aaradhya sheet focus** | Ship remaining SEO fixes; Lighthouse re-measure home mobile |
| **Team EOD deliverable** | LCP improved number recorded; blog #2 live |
| **Planned hours (10h model)** | 10.0h |
| **Primary residual task IDs** | — (early complete days / rest) |

> Sheet still Not Started/Partial; execute catch-up now if behind.

## Goal for Aaradhya today (one sentence)
Complete: **Ship remaining SEO fixes; Lighthouse re-measure home mobile** — and advance residual IDs: **sheet blocks only** to EOD proof quality.

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
**Do:** Ship remaining SEO fixes.

**Done when (EOD proof):** Shipped

**How (100%):**
1. Read residual task playbook if this block maps to a PT-* ID
2. Implement/verify in repo or browser as stated
3. Capture proof (screenshot, PR, prod URL, metric)
4. If blocked >30m, escalate to abhishek/sunish with evidence
5. Tick `Done` in Daily 10h sheet when proof exists
6. view-source check title/description; curl robots + sitemap 200
7. Update SEO Tracker / Website Checklist cells

### Block 3.0 — 13:00–16:00 (3.0h)
**Do:** Final Lighthouse mobile home run. Compare to Day 2.

**Done when (EOD proof):** Comparison posted

**How (100%):**
1. Read residual task playbook if this block maps to a PT-* ID
2. Implement/verify in repo or browser as stated
3. Capture proof (screenshot, PR, prod URL, metric)
4. If blocked >30m, escalate to abhishek/sunish with evidence
5. Tick `Done` in Daily 10h sheet when proof exists
6. Run `npx lighthouse https://www.profytron.com --form-factor=mobile --only-categories=performance` thrice
7. Save JSON under `docs/aaradhya-45-day-complete-plan/evidence/day-{day}/`

### Block 4.0 — 14:00–16:00 (2.0h)
**Do:** W2 review attend + take UI notes.

**Done when (EOD proof):** Notes

**How (100%):**
1. Read residual task playbook if this block maps to a PT-* ID
2. Implement/verify in repo or browser as stated
3. Capture proof (screenshot, PR, prod URL, metric)
4. If blocked >30m, escalate to abhishek/sunish with evidence
5. Tick `Done` in Daily 10h sheet when proof exists

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
| abhishek | Friday deploy window approve; W2 review 45m |
| sunish | Stabilize any UAT bugs; uptime alert test fire |
| **aaradhya** | Ship remaining SEO fixes; Lighthouse re-measure home mobile |
| kushwaha | Partnership outreach #4–6; invite 10 people to Discord (soft) |
| ishit | Publish blog #2; FAQ list of 15 topics drafted |


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
