# Day 08 — 2026-07-28 (Tue)

| Field | Value |
|-------|--------|
| **Phase** | W2 — Prove live (M1–M4) |
| **Sheet Day Status** | Completed |
| **Daily focus (team)** | UAT day 1 + first publish prep |
| **Aaradhya sheet focus** | SEO code: robots/sitemap verify on prod; fix broken meta tags |
| **Team EOD deliverable** | Formal live OTP UAT PASS (D7_OTP_UAT_20260728). Payment audit Day 8 (no live checkout). |
| **Planned hours (10h model)** | 10.0h |
| **Primary residual task IDs** | — (early complete days / rest) |

> Historical day (before catch-up). Keep this file as archive + verification template. Re-run only if evidence is incomplete.

## Goal for Aaradhya today (one sentence)
Complete: **SEO code: robots/sitemap verify on prod; fix broken meta tags** — and advance residual IDs: **sheet blocks only** to EOD proof quality.

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
**Do:** Verify sitemap.xml + robots.txt on production. Fix code if wrong.

**Done when (EOD proof):** Correct on prod

**How (100%):**
1. Read residual task playbook if this block maps to a PT-* ID
2. Implement/verify in repo or browser as stated
3. Capture proof (screenshot, PR, prod URL, metric)
4. If blocked >30m, escalate to abhishek/sunish with evidence
5. Tick `Done` in Daily 10h sheet when proof exists
6. view-source check title/description; curl robots + sitemap 200
7. Update SEO Tracker / Website Checklist cells

### Block 3.0 — 13:00–16:00 (3.0h)
**Do:** Fix meta tags from gap sheet (highest traffic pages first).

**Done when (EOD proof):** ≥3 pages fixed

**How (100%):**
1. Read residual task playbook if this block maps to a PT-* ID
2. Implement/verify in repo or browser as stated
3. Capture proof (screenshot, PR, prod URL, metric)
4. If blocked >30m, escalate to abhishek/sunish with evidence
5. Tick `Done` in Daily 10h sheet when proof exists
6. view-source check title/description; curl robots + sitemap 200
7. Update SEO Tracker / Website Checklist cells

### Block 4.0 — 14:00–16:00 (2.0h)
**Do:** JSON-LD quick validate on home.

**Done when (EOD proof):** Valid or issue listed

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
| abhishek | Declare UAT week; order: OTP → Payments → MetaAPI; assign evidence folder |
| sunish | Live OTP UAT formal (ALLOW_LIVE_EMAIL_OTP); file evidence |
| **aaradhya** | SEO code: robots/sitemap verify on prod; fix broken meta tags |
| kushwaha | Prospect list → 90; Discord/Telegram channel CREATE (empty ok) |
| ishit | Blog #1 FINAL for publish; start blog #2 MT5 Automation outline |


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
