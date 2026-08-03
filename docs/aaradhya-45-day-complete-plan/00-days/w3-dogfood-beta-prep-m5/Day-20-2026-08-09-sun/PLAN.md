# Day 20 — 2026-08-09 (Sun)

| Field | Value |
|-------|--------|
| **Phase** | W3 — Dogfood + beta prep (M5) |
| **Sheet Day Status** | Not Started |
| **Daily focus (team)** | Invite ammo ready |
| **Aaradhya sheet focus** | Light: publish any pending UI |
| **Team EOD deliverable** | 20 personalized invites queued |
| **Planned hours (10h model)** | 10.0h |
| **Primary residual task IDs** | PT-S03, PT-W03 |

> Plan day for catch-up (today's calendar context: Aug 2026). Primary residual Master IDs: PT-S03, PT-W03.

## Goal for Aaradhya today (one sentence)
Complete: **Light: publish any pending UI** — and advance residual IDs: **PT-S03, PT-W03** to EOD proof quality.

## Order of work (always)
1. Unblock **In Progress** residual tasks first (PT-W01, PT-P03, PT-W02 if still open)
2. Then **Critical** Not Started
3. Then **High** → **Medium** → **Low**
4. Update sheets before offline: Master Tracker, Website Checklist, Testing, Standup

## Residual Master Tracker focus (detailed)
### PT-S03 (Not Started · High) — Title/meta/OG audit + code fixes on key pages
- Est 6.0h · Act 0.0h · Notes: ishit provides copy where needed
- Why: Title/meta/OG wrong = SEO + share CTR loss.
- Today's slice: execute next unfinished step from playbook
- Full plan file under `01-tasks/`
- EOD proof: Gap list with before/after strings

### PT-W03 (Not Started · Critical) — Implement approved homepage hero/CTA in code
- Est 4.0h · Act 0.0h · Notes: After ishit copy
- Why: Homepage conversion copy must match approved brand message in code.
- Today's slice: execute next unfinished step from playbook
- Full plan file under `01-tasks/`
- EOD proof: Prod screenshot of hero + copy source file


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

### Residual deep-work R1 — +2.0h (catch-up fill to 10h day)
**Do:** Advance **PT-S03** — Title/meta/OG audit + code fixes on key pages (Not Started · High)

**Why today:** Sheet block hours were only 6.0h; residual backlog is still open.

**Done when:** Meaningful progress + evidence toward DoD in task playbook.

**Full steps for this task:**
   - 1. Audit home, pricing, blog index, get-bots, brokers
   - 2. Spreadsheet gap list
   - 3. Fix metadata exports/layout
   - 4. Validate view-source + social crawlers

**Acceptance target:**
- No 'Untitled' / duplicate titles on audited pages

**Link:** `01-tasks/` → `PT-S03`

### Residual deep-work R2 — +2.0h (catch-up fill to 10h day)
**Do:** Advance **PT-W03** — Implement approved homepage hero/CTA in code (Not Started · Critical)

**Why today:** Sheet block hours were only 6.0h; residual backlog is still open.

**Done when:** Meaningful progress + evidence toward DoD in task playbook.

**Full steps for this task:**
   - 1. Receive approved copy pack from ishit
   - 2. Wire strings (CMS/MDX/const) — no hardcode drift
   - 3. CTA hrefs verified (register/get-bots/pricing)
   - 4. Ship after LCP safeguards not regressed

**Acceptance target:**
- Prod shows approved copy; CTAs trackable

**Link:** `01-tasks/` → `PT-W03`


## Team context (same day)
| Person | Planned focus |
|--------|----------------|
| abhishek | Saturday: finalize invite list of 20 + backups 10 |
| sunish | Light: bot marketplace smoke |
| **aaradhya** | Light: publish any pending UI |
| kushwaha | Personalize 20 invite notes (not blast) |
| ishit | Invite email FINAL; social teaser (no public spam) |


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
