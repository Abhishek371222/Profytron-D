# Day 13 — 2026-08-02 (Sun)

| Field | Value |
|-------|--------|
| **Phase** | W2 — Prove live (M1–M4) |
| **Sheet Day Status** | Not Started |
| **Daily focus (team)** | Hardening + content |
| **Aaradhya sheet focus** | Cookie/banner check; OG images brief from ishit assets |
| **Team EOD deliverable** | Security smokes; FAQ started |
| **Planned hours (10h model)** | 10.0h |
| **Primary residual task IDs** | PT-W01, PT-A04 |

> Plan day for catch-up (today's calendar context: Aug 2026). Primary residual Master IDs: PT-W01, PT-A04.

## Goal for Aaradhya today (one sentence)
Complete: **Cookie/banner check; OG images brief from ishit assets** — and advance residual IDs: **PT-W01, PT-A04** to EOD proof quality.

## Order of work (always)
1. Unblock **In Progress** residual tasks first (PT-W01, PT-P03, PT-W02 if still open)
2. Then **Critical** Not Started
3. Then **High** → **Medium** → **Low**
4. Update sheets before offline: Master Tracker, Website Checklist, Testing, Standup

## Residual Master Tracker focus (detailed)
### PT-W01 (In Progress · Critical) — Landing LCP < 4s (lazy-load 3D/motion)
- Est 16.0h · Act 4.0h · Notes: Perf work in repo; LCP <4s not formally signed off.
- Why: Landing LCP is the #1 public conversion speed gate (Launch M3 + KPI).
- Today's slice: execute next unfinished step from playbook
- Full plan file under `01-tasks/`
- EOD proof: Before/after LCP numbers + PR URL + prod Lighthouse screenshot

### PT-A04 (Not Started · High) — Safari/iOS login + refresh cookie fix/QA
- Est 6.0h · Act 0.0h · Notes: Safari/iOS login QA still outstanding.
- Why: Safari/iOS auth cookie issues block real users on highest-friction browsers.
- Today's slice: execute next unfinished step from playbook
- Full plan file under `01-tasks/`
- EOD proof: Safari session video or step log + cookies screenshot (redact tokens)


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
**Do:** Advance **PT-W01** — Landing LCP < 4s (lazy-load 3D/motion) (In Progress · Critical)

**Why today:** Sheet block hours were only 6.0h; residual backlog is still open.

**Done when:** Meaningful progress + evidence toward DoD in task playbook.

**Full steps for this task:**
   - 1. Baseline: run Lighthouse mobile 3x on prod + local; record LCP element + score in evidence/
   - 2. Inventory: list every above-fold import chain from page.tsx → layout → hero
   - 3. Dynamic import heavy clients (ssr:false) for 3D/motion; show static poster/fallback
   - 4. Images: next/image priority only on LCP image; sizes + AVIF/WebP; width/height set
   - 5. Fonts: display=swap, subset, reduce preloads; avoid FOIT layout shift
   - 6. Scripts: defer analytics until idle/consent if blocking; verify no GTM pre-consent hit
   - 7. CSS: remove unused heavy globals on landing if split needed
   - 8. Re-measure until LCP < 4.0s median mobile Lighthouse; save after JSON
   - 9. Ship to prod; re-probe www.profytron.com; paste numbers into KPI sheet + Day EOD

**Acceptance target:**
- Lighthouse mobile LCP < 4s (median of 3 runs) on production
- Evidence screenshots + JSON committed under evidence folder or linked in notes
- No functional breakage of CTAs / login / pricing links
- Sheet KPI Landing LCP updated from Unknown → measured number

**Link:** `01-tasks/` → `PT-W01`

### Residual deep-work R2 — +2.0h (catch-up fill to 10h day)
**Do:** Advance **PT-A04** — Safari/iOS login + refresh cookie fix/QA (Not Started · High)

**Why today:** Sheet block hours were only 6.0h; residual backlog is still open.

**Done when:** Meaningful progress + evidence toward DoD in task playbook.

**Full steps for this task:**
   - 1. Device matrix: Safari 17+ iOS latest, desktop Safari
   - 2. Reproduce login → refresh → protected route
   - 3. Capture network Set-Cookie + document.cookie constraints
   - 4. Fix with auth team patterns (distinct JTIs, refresh grace already noted in MASTER_PROGRESS)
   - 5. Re-test full OTP UAT path on Safari
   - 6. Document in Testing Dashboard Auth row

**Acceptance target:**
- Login + refresh survives 15 min idle on Safari iOS real device or BrowserStack
- Bug list empty or only P2 left

**Link:** `01-tasks/` → `PT-A04`


## Team context (same day)
| Person | Planned focus |
|--------|----------------|
| abhishek | Saturday: legal pages skim for sign-off gaps |
| sunish | Wallet smoke test; rate-limit smoke on login/register |
| **aaradhya** | Cookie/banner check; OG images brief from ishit assets |
| kushwaha | Prospect CRM hygiene; note replies from outreach |
| ishit | Blog #3 draft; write 3 FAQ answers |


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
