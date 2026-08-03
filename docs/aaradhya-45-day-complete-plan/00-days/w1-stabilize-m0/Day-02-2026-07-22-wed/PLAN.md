# Day 02 — 2026-07-22 (Wed)

| Field | Value |
|-------|--------|
| **Phase** | W1 — Stabilize (M0) |
| **Sheet Day Status** | Completed |
| **Daily focus (team)** | API path chosen; LCP work started; marketing foundations |
| **Aaradhya sheet focus** | Start LCP PR: dynamic import hero visuals; defer non-critical JS |
| **Team EOD deliverable** | GCP API path + startupProbe /ready harden (PRODUCTION_STATUS) |
| **Planned hours (10h model)** | 10.0h |
| **Primary residual task IDs** | — (early complete days / rest) |

> Historical day (before catch-up). Keep this file as archive + verification template. Re-run only if evidence is incomplete.

## Goal for Aaradhya today (one sentence)
Complete: **Start LCP PR: dynamic import hero visuals; defer non-critical JS** — and advance residual IDs: **sheet blocks only** to EOD proof quality.

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

### Block 2.0 — 10:00–14:00 (4.0h)
**Do:** Start LCP PR: dynamic import / lazy heavy hero visuals.

**Done when (EOD proof):** PR opened

**How (100%):**
1. Read residual task playbook if this block maps to a PT-* ID
2. Implement/verify in repo or browser as stated
3. Capture proof (screenshot, PR, prod URL, metric)
4. If blocked >30m, escalate to abhishek/sunish with evidence
5. Tick `Done` in Daily 10h sheet when proof exists
6. Run `npx lighthouse https://www.profytron.com --form-factor=mobile --only-categories=performance` thrice
7. Save JSON under `docs/aaradhya-45-day-complete-plan/evidence/day-{day}/`

### Block 3.0 — 14:00–16:00 (2.0h)
**Do:** Remove or defer non-critical third-party scripts on home if any.

**Done when (EOD proof):** Change committed

**How (100%):**
1. Read residual task playbook if this block maps to a PT-* ID
2. Implement/verify in repo or browser as stated
3. Capture proof (screenshot, PR, prod URL, metric)
4. If blocked >30m, escalate to abhishek/sunish with evidence
5. Tick `Done` in Daily 10h sheet when proof exists

### Block 4.0 — 16:00–18:00 (2.0h)
**Do:** Run Lighthouse mobile locally. Save JSON/screenshot.

**Done when (EOD proof):** Before metrics saved

**How (100%):**
1. Read residual task playbook if this block maps to a PT-* ID
2. Implement/verify in repo or browser as stated
3. Capture proof (screenshot, PR, prod URL, metric)
4. If blocked >30m, escalate to abhishek/sunish with evidence
5. Tick `Done` in Daily 10h sheet when proof exists
6. Run `npx lighthouse https://www.profytron.com --form-factor=mobile --only-categories=performance` thrice
7. Save JSON under `docs/aaradhya-45-day-complete-plan/evidence/day-{day}/`

### Block 5.0 — 18:00–19:00 (1.0h)
**Do:** EOD: paste before LCP number in chat.

**Done when (EOD proof):** Number shared

**How (100%):**
1. Read residual task playbook if this block maps to a PT-* ID
2. Implement/verify in repo or browser as stated
3. Capture proof (screenshot, PR, prod URL, metric)
4. If blocked >30m, escalate to abhishek/sunish with evidence
5. Tick `Done` in Daily 10h sheet when proof exists
6. Run `npx lighthouse https://www.profytron.com --form-factor=mobile --only-categories=performance` thrice
7. Save JSON under `docs/aaradhya-45-day-complete-plan/evidence/day-{day}/`


## Team context (same day)
| Person | Planned focus |
|--------|----------------|
| abhishek | Decide Render decommission date; review sunish deploy plan; set SEV1 owner = you |
| sunish | Deploy/fix API on GCP Cloud Run (min-instances=1); document URLs |
| **aaradhya** | Start LCP PR: dynamic import hero visuals; defer non-critical JS |
| kushwaha | Join 5 trader communities (read-only); start prospect CRM columns (name, channel, status) |
| ishit | Outline homepage hero angles (3 options); draft positioning bullets for growth |


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
