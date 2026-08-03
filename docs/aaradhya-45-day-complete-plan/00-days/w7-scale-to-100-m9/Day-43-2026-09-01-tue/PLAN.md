# Day 43 — 2026-09-01 (Tue)

| Field | Value |
|-------|--------|
| **Phase** | W7 — Scale to 100 (M9) |
| **Sheet Day Status** | Not Started |
| **Daily focus (team)** | Scale start |
| **Aaradhya sheet focus** | Funnel UX final polish for new users |
| **Team EOD deliverable** | User count climbing |
| **Planned hours (10h model)** | 10.0h |
| **Primary residual task IDs** | PT-W06, PT-S03 |

> Plan day for catch-up (today's calendar context: Aug 2026). Primary residual Master IDs: PT-W06, PT-S03.

## Goal for Aaradhya today (one sentence)
Complete: **Funnel UX final polish for new users** — and advance residual IDs: **PT-W06, PT-S03** to EOD proof quality.

## Order of work (always)
1. Unblock **In Progress** residual tasks first (PT-W01, PT-P03, PT-W02 if still open)
2. Then **Critical** Not Started
3. Then **High** → **Medium** → **Low**
4. Update sheets before offline: Master Tracker, Website Checklist, Testing, Standup

## Residual Master Tracker focus (detailed)
### PT-W06 (Not Started · High) — Onboarding + risk page UX/code polish
- Est 8.0h · Act 0.0h · Notes: —
- Why: Onboarding + risk pages drive activation; unclear UX kills broker connect.
- Today's slice: execute next unfinished step from playbook
- Full plan file under `01-tasks/`
- EOD proof: Before/after screenshots + step count

### PT-S03 (Not Started · High) — Title/meta/OG audit + code fixes on key pages
- Est 6.0h · Act 0.0h · Notes: ishit provides copy where needed
- Why: Title/meta/OG wrong = SEO + share CTR loss.
- Today's slice: execute next unfinished step from playbook
- Full plan file under `01-tasks/`
- EOD proof: Gap list with before/after strings


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
| abhishek | Open scale: approve invites toward 100 users |
| sunish | Capacity watch; auto-scale/min instances tune |
| **aaradhya** | Funnel UX final polish for new users |
| kushwaha | Send large invite wave (batch 1 of 2) |
| ishit | Launch content burst: 1 blog remix + 3 socials |


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
