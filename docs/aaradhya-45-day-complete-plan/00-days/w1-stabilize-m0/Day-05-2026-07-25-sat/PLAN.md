# Day 05 — 2026-07-25 (Sat)

| Field | Value |
|-------|--------|
| **Phase** | W1 — Stabilize (M0) |
| **Sheet Day Status** | Completed |
| **Daily focus (team)** | Monitoring + content engine start |
| **Aaradhya sheet focus** | Wire Sentry web DSN; PostHog provider check; meta/title audit list for public pages |
| **Team EOD deliverable** | Sentry API verified; EXPOSE_DEV_OTP OFF; email DNS -> Day 6 verified |
| **Planned hours (10h model)** | 10.0h |
| **Primary residual task IDs** | — (early complete days / rest) |

> Historical day (before catch-up). Keep this file as archive + verification template. Re-run only if evidence is incomplete.

## Goal for Aaradhya today (one sentence)
Complete: **Wire Sentry web DSN; PostHog provider check; meta/title audit list for public pages** — and advance residual IDs: **sheet blocks only** to EOD proof quality.

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

### Block 2.0 — 10:00–12:00 (2.0h)
**Do:** Wire Sentry for web. Trigger test error in staging.

**Done when (EOD proof):** Event seen

**How (100%):**
1. Read residual task playbook if this block maps to a PT-* ID
2. Implement/verify in repo or browser as stated
3. Capture proof (screenshot, PR, prod URL, metric)
4. If blocked >30m, escalate to abhishek/sunish with evidence
5. Tick `Done` in Daily 10h sheet when proof exists

### Block 3.0 — 12:00–15:00 (3.0h)
**Do:** Audit meta title/description on home, pricing, blog index. Spreadsheet gaps.

**Done when (EOD proof):** Gap sheet

**How (100%):**
1. Read residual task playbook if this block maps to a PT-* ID
2. Implement/verify in repo or browser as stated
3. Capture proof (screenshot, PR, prod URL, metric)
4. If blocked >30m, escalate to abhishek/sunish with evidence
5. Tick `Done` in Daily 10h sheet when proof exists
6. Walk /pricing and /billing at 1280 + 390
7. Note CTA hrefs + loading/error states; file gaps

### Block 4.0 — 14:00–16:00 (2.0h)
**Do:** Check PostHog provider env; note what's missing.

**Done when (EOD proof):** Missing env list

**How (100%):**
1. Read residual task playbook if this block maps to a PT-* ID
2. Implement/verify in repo or browser as stated
3. Capture proof (screenshot, PR, prod URL, metric)
4. If blocked >30m, escalate to abhishek/sunish with evidence
5. Tick `Done` in Daily 10h sheet when proof exists
6. Confirm env vars on Cloud Run web revision
7. Fire test event; screenshot PostHog live (redact PII)

### Block 5.0 — 16:00–17:00 (1.0h)
**Do:** Help ishit with screenshot sizes for blog.

**Done when (EOD proof):** Assets helped

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
| abhishek | Wire Search Console property (or grant access); weekly goals check-in 30m |
| sunish | Wire Sentry DSN (API); confirm EXPOSE_DEV_OTP=false; SPF/DKIM checklist start |
| **aaradhya** | Wire Sentry web DSN; PostHog provider check; meta/title audit list for public pages |
| kushwaha | Prospect list → 55; 5 warm DMs (no pitch spam — value first) |
| ishit | Blog #1 full draft; social calendar skeleton (12 slots empty→fill 4) |


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
