# Day 32 — 2026-08-21 (Fri)

| Field | Value |
|-------|--------|
| **Phase** | W5 — Expand toward 50 (M7) |
| **Sheet Day Status** | Not Started |
| **Daily focus (team)** | Retention focus |
| **Aaradhya sheet focus** | Settings/support ticket UX |
| **Team EOD deliverable** | Win-back started |
| **Planned hours (10h model)** | 10.0h |
| **Primary residual task IDs** | PT-L04, PT-M08 |

> Plan day for catch-up (today's calendar context: Aug 2026). Primary residual Master IDs: PT-L04, PT-M08.

## Goal for Aaradhya today (one sentence)
Complete: **Settings/support ticket UX** — and advance residual IDs: **PT-L04, PT-M08** to EOD proof quality.

## Order of work (always)
1. Unblock **In Progress** residual tasks first (PT-W01, PT-P03, PT-W02 if still open)
2. Then **Critical** Not Started
3. Then **High** → **Medium** → **Low**
4. Update sheets before offline: Master Tracker, Website Checklist, Testing, Standup

## Residual Master Tracker focus (detailed)
### PT-L04 (Not Started · Medium) — Chatbot keys + FAQ content pack wiring
- Est 4.0h · Act 0.0h · Notes: ishit writes FAQ pack
- Why: Chatbot/FAQ wiring reduces support load.
- Today's slice: execute next unfinished step from playbook
- Full plan file under `01-tasks/`
- EOD proof: FAQ page + widget screenshot

### PT-M08 (Not Started · Medium) — Community page CTAs + invite links
- Est 3.0h · Act 0.0h · Notes: Links from growth
- Why: Community page must convert visitors to Discord/invite.
- Today's slice: execute next unfinished step from playbook
- Full plan file under `01-tasks/`
- EOD proof: Click test log


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
| abhishek | Review churn/inactive beta users; win-back plan |
| sunish | Notification reliability (trade alerts email) |
| **aaradhya** | Settings/support ticket UX |
| kushwaha | Win-back DMs to inactive; community AMA announce |
| ishit | AMA announcement creative; Short #2 script |


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
