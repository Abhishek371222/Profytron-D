# Day 29 — 2026-08-18 (Tue)

| Field | Value |
|-------|--------|
| **Phase** | W5 — Expand toward 50 (M7) |
| **Sheet Day Status** | Not Started |
| **Daily focus (team)** | Scale invites |
| **Aaradhya sheet focus** | Instrument time-to-first-broker events if missing |
| **Team EOD deliverable** | 35 total invited path |
| **Planned hours (10h model)** | 10.0h |
| **Primary residual task IDs** | PT-K03, PT-M01 |

> Plan day for catch-up (today's calendar context: Aug 2026). Primary residual Master IDs: PT-K03, PT-M01.

## Goal for Aaradhya today (one sentence)
Complete: **Instrument time-to-first-broker events if missing** — and advance residual IDs: **PT-K03, PT-M01** to EOD proof quality.

## Order of work (always)
1. Unblock **In Progress** residual tasks first (PT-W01, PT-P03, PT-W02 if still open)
2. Then **Critical** Not Started
3. Then **High** → **Medium** → **Low**
4. Update sheets before offline: Master Tracker, Website Checklist, Testing, Standup

## Residual Master Tracker focus (detailed)
### PT-K03 (Not Started · High) — Instrument time-to-first-broker in PostHog
- Est 3.0h · Act 0.0h · Notes: —
- Why: Time-to-first-broker is core activation metric.
- Today's slice: execute next unfinished step from playbook
- Full plan file under `01-tasks/`
- EOD proof: Insight link/screenshot

### PT-M01 (Not Started · Critical) — Wire PostHog in production (code)
- Est 5.0h · Act 0.0h · Notes: PostHog prod wiring not verified complete through 2026-07-30.
- Why: Without PostHog in prod, activation KPI and funnel fixes are blind.
- Today's slice: execute next unfinished step from playbook
- Full plan file under `01-tasks/`
- EOD proof: PostHog live screenshot (redact personal data)


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
**Do:** Add/verify time-to-first-broker PostHog events.

**Done when (EOD proof):** Events firing

**How (100%):**
1. Read residual task playbook if this block maps to a PT-* ID
2. Implement/verify in repo or browser as stated
3. Capture proof (screenshot, PR, prod URL, metric)
4. If blocked >30m, escalate to abhishek/sunish with evidence
5. Tick `Done` in Daily 10h sheet when proof exists
6. Confirm env vars on Cloud Run web revision
7. Fire test event; screenshot PostHog live (redact PII)

### Block 3.0 — 13:00–15:00 (2.0h)
**Do:** Dashboard polish from AMA feedback.

**Done when (EOD proof):** PR

**How (100%):**
1. Read residual task playbook if this block maps to a PT-* ID
2. Implement/verify in repo or browser as stated
3. Capture proof (screenshot, PR, prod URL, metric)
4. If blocked >30m, escalate to abhishek/sunish with evidence
5. Tick `Done` in Daily 10h sheet when proof exists

### Block 4.0 — 14:00–16:00 (2.0h)
**Do:** Internal linking between blog/guides/pricing.

**Done when (EOD proof):** Links live

**How (100%):**
1. Read residual task playbook if this block maps to a PT-* ID
2. Implement/verify in repo or browser as stated
3. Capture proof (screenshot, PR, prod URL, metric)
4. If blocked >30m, escalate to abhishek/sunish with evidence
5. Tick `Done` in Daily 10h sheet when proof exists
6. Walk /pricing and /billing at 1280 + 390
7. Note CTA hrefs + loading/error states; file gaps

### Block 5.0 — 16:00–17:00 (1.0h)
**Do:** CWV spot check.

**Done when (EOD proof):** Numbers

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
| abhishek | Approve next 30 invites; set activation target >30% |
| sunish | Copy-trading + bots UAT leftovers for power users |
| **aaradhya** | Instrument time-to-first-broker events if missing |
| kushwaha | Send next invite wave (15) |
| ishit | Publish risk management guide |


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
