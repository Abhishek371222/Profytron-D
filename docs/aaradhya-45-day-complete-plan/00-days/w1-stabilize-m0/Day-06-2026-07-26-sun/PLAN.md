# Day 06 — 2026-07-26 (Sun)

| Field | Value |
|-------|--------|
| **Phase** | W1 — Stabilize (M0) |
| **Sheet Day Status** | Completed |
| **Daily focus (team)** | Weekend push: email + content |
| **Aaradhya sheet focus** | Mobile QA pass on home/pricing/login; fix obvious layout bugs |
| **Team EOD deliverable** | Resend domain verified; OTP email delivered (Day 6). Marketing — no evidence |
| **Planned hours (10h model)** | 6.0h |
| **Primary residual task IDs** | — (early complete days / rest) |

> Historical day (before catch-up). Keep this file as archive + verification template. Re-run only if evidence is incomplete.

## Goal for Aaradhya today (one sentence)
Complete: **Mobile QA pass on home/pricing/login; fix obvious layout bugs** — and advance residual IDs: **sheet blocks only** to EOD proof quality.

## Order of work (always)
1. Unblock **In Progress** residual tasks first (PT-W01, PT-P03, PT-W02 if still open)
2. Then **Critical** Not Started
3. Then **High** → **Medium** → **Low**
4. Update sheets before offline: Master Tracker, Website Checklist, Testing, Standup

## Residual Master Tracker focus (detailed)
No catch-up IDs mapped (use 10h blocks only).

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


## Team context (same day)
| Person | Planned focus |
|--------|----------------|
| abhishek | Saturday review: blockers log; approve blog #1 direction |
| sunish | Email domain DNS (SPF/DKIM/DMARC) with Resend; test OTP email to yourself |
| **aaradhya** | Mobile QA pass on home/pricing/login; fix obvious layout bugs |
| kushwaha | Prospect list → 70; competitor teardown doc finished |
| ishit | Revise blog #1; draft LinkedIn post #1 from blog; pricing copy v1 |


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
