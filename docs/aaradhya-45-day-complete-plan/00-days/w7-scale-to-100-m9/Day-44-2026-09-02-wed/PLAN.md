# Day 44 — 2026-09-02 (Wed)

| Field | Value |
|-------|--------|
| **Phase** | W7 — Scale to 100 (M9) |
| **Sheet Day Status** | Not Started |
| **Daily focus (team)** | Push to 100 |
| **Aaradhya sheet focus** | Hotfixes only; onboarding tweaks |
| **Team EOD deliverable** | ~100 invited / approaching 100 active |
| **Planned hours (10h model)** | 10.0h |
| **Primary residual task IDs** | PT-A04, PT-P03 |

> Plan day for catch-up (today's calendar context: Aug 2026). Primary residual Master IDs: PT-A04, PT-P03.

## Goal for Aaradhya today (one sentence)
Complete: **Hotfixes only; onboarding tweaks** — and advance residual IDs: **PT-A04, PT-P03** to EOD proof quality.

## Order of work (always)
1. Unblock **In Progress** residual tasks first (PT-W01, PT-P03, PT-W02 if still open)
2. Then **Critical** Not Started
3. Then **High** → **Medium** → **Low**
4. Update sheets before offline: Master Tracker, Website Checklist, Testing, Standup

## Residual Master Tracker focus (detailed)
### PT-A04 (Not Started · High) — Safari/iOS login + refresh cookie fix/QA
- Est 6.0h · Act 0.0h · Notes: Safari/iOS login QA still outstanding.
- Why: Safari/iOS auth cookie issues block real users on highest-friction browsers.
- Today's slice: execute next unfinished step from playbook
- Full plan file under `01-tasks/`
- EOD proof: Safari session video or step log + cookies screenshot (redact tokens)

### PT-P03 (In Progress · High) — Billing UI polish + plan cards
- Est 5.0h · Act 2.0h · Notes: Billing UI exists; trial UI coded locally, not on prod gitSha 1044ce5.
- Why: Billing UI is the money path; trial UI coded locally must reach production polish.
- Today's slice: execute next unfinished step from playbook
- Full plan file under `01-tasks/`
- EOD proof: Screenshots desktop+mobile + checklist of plan CTAs working


## Full 10h schedule (from Daily 10h Tasks sheet)

### Block 1.0 — 09:00–10:00 (1.0h)
**Do:** Funnel watch.

**Done when (EOD proof):** Noted

**How (100%):**
1. Read residual task playbook if this block maps to a PT-* ID
2. Implement/verify in repo or browser as stated
3. Capture proof (screenshot, PR, prod URL, metric)
4. If blocked >30m, escalate to abhishek/sunish with evidence
5. Tick `Done` in Daily 10h sheet when proof exists
6. Confirm env vars on Cloud Run web revision
7. Fire test event; screenshot PostHog live (redact PII)

### Block 2.0 — 10:00–13:00 (3.0h)
**Do:** Hotfix onboarding/UX only.

**Done when (EOD proof):** Hotfix

**How (100%):**
1. Read residual task playbook if this block maps to a PT-* ID
2. Implement/verify in repo or browser as stated
3. Capture proof (screenshot, PR, prod URL, metric)
4. If blocked >30m, escalate to abhishek/sunish with evidence
5. Tick `Done` in Daily 10h sheet when proof exists

### Block 3.0 — 13:00–15:00 (2.0h)
**Do:** Final polish CTAs for new invites.

**Done when (EOD proof):** Shipped

**How (100%):**
1. Read residual task playbook if this block maps to a PT-* ID
2. Implement/verify in repo or browser as stated
3. Capture proof (screenshot, PR, prod URL, metric)
4. If blocked >30m, escalate to abhishek/sunish with evidence
5. Tick `Done` in Daily 10h sheet when proof exists

### Block 4.0 — 14:00–16:00 (2.0h)
**Do:** Write web/UX retro bullets.

**Done when (EOD proof):** Retro

**How (100%):**
1. Read residual task playbook if this block maps to a PT-* ID
2. Implement/verify in repo or browser as stated
3. Capture proof (screenshot, PR, prod URL, metric)
4. If blocked >30m, escalate to abhishek/sunish with evidence
5. Tick `Done` in Daily 10h sheet when proof exists

### Block 5.0 — 16:00–17:00 (1.0h)
**Do:** CWV final snapshot.

**Done when (EOD proof):** Saved

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
| abhishek | Daily activation standup 15m; unblock stuck users |
| sunish | Hotfixes only; MetaAPI quotas watch |
| **aaradhya** | Hotfixes only; onboarding tweaks |
| kushwaha | Send batch 2 invites; partnerships announce if ready |
| ishit | User-story posts (consented); Short #3 |


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
