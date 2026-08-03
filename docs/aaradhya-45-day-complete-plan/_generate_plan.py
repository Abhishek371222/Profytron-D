# -*- coding: utf-8 -*-
"""Generate Aaradhya complete 45-day plan package from sheet export."""
from __future__ import annotations

import json
import re
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DATA = json.loads((ROOT / "_raw.json").read_text(encoding="utf-8"))

# Detailed playbooks for each Master Tracker task (100% planned work)
TASK_PLAYBOOKS: dict[str, dict] = {
    "PT-W01": {
        "why": "Landing LCP is the #1 public conversion speed gate (Launch M3 + KPI).",
        "scope_in": [
            "Homepage first paint route only (/, optional marketing layout shell)",
            "Lazy-load/defer 3D (Spline/R3F), motion libraries, hero video/images",
            "Preload only LCP image/font; drop non-critical third-party on first paint",
            "Measure Lighthouse mobile + real Chrome DevTools mobile throttle",
        ],
        "scope_out": [
            "Dashboard performance (separate W5 work)",
            "Copy writing (ishit/abhishek) except wiring approved strings",
            "Deep SEO content pages (SEO tasks)",
        ],
        "steps": [
            "1. Baseline: run Lighthouse mobile 3x on prod + local; record LCP element + score in evidence/",
            "2. Inventory: list every above-fold import chain from page.tsx → layout → hero",
            "3. Dynamic import heavy clients (ssr:false) for 3D/motion; show static poster/fallback",
            "4. Images: next/image priority only on LCP image; sizes + AVIF/WebP; width/height set",
            "5. Fonts: display=swap, subset, reduce preloads; avoid FOIT layout shift",
            "6. Scripts: defer analytics until idle/consent if blocking; verify no GTM pre-consent hit",
            "7. CSS: remove unused heavy globals on landing if split needed",
            "8. Re-measure until LCP < 4.0s median mobile Lighthouse; save after JSON",
            "9. Ship to prod; re-probe www.profytron.com; paste numbers into KPI sheet + Day EOD",
        ],
        "files_likely": [
            "apps/web/src/app/(marketing)/page.tsx (or equivalent landing)",
            "apps/web components under 3d/, hero, motion",
            "apps/web/public/3d/posters/*",
            "next.config / font setup",
        ],
        "acceptance": [
            "Lighthouse mobile LCP < 4s (median of 3 runs) on production",
            "Evidence screenshots + JSON committed under evidence folder or linked in notes",
            "No functional breakage of CTAs / login / pricing links",
            "Sheet KPI Landing LCP updated from Unknown → measured number",
        ],
        "blockers": ["Approved hero copy (W03) can land after or with feature flag"],
        "depends": ["ishit copy optional for final hero"],
        "eod_proof": "Before/after LCP numbers + PR URL + prod Lighthouse screenshot",
    },
    "PT-P03": {
        "why": "Billing UI is the money path; trial UI coded locally must reach production polish.",
        "scope_in": [
            "Plan cards, CTAs, spacing, loading/error empty states on /billing and pricing",
            "Trial banner/upgrade entry if enabled in env",
            "Consistent plan source of truth UI labels",
        ],
        "scope_out": ["Razorpay/payment engine bugs (sunish primary)", "Marketing pricing copy authoring"],
        "steps": [
            "1. Diff local trial UI vs prod gitSha noted in sheet; list missing pieces",
            "2. Align plan cards with Phase 9C billing experience patterns",
            "3. Verify trial start CTA → banner → upgrade path on staging",
            "4. Loading skeletons, disabled states, error toasts",
            "5. Mobile QA 390px on /pricing + /billing",
            "6. Coordinate deploy with sunish for backend readiness",
            "7. Close with PT-P09 manual UAT checklist",
        ],
        "files_likely": [
            "apps/web billing / pricing / wallet routes",
            "Plan cards components",
        ],
        "acceptance": [
            "Plan cards clear on mobile/desktop",
            "Trial UI present on prod if backend flag on; else gated with honest UI",
            "No dead CTAs; all error paths readable",
        ],
        "blockers": ["Prod deploy of trial APIs"],
        "depends": ["sunish payments", "PT-P09 UAT"],
        "eod_proof": "Screenshots desktop+mobile + checklist of plan CTAs working",
    },
    "PT-W02": {
        "why": "Public pages must work at phone sizes for growth traffic.",
        "scope_in": [
            "All public marketing pages + auth pages at 390, 768, 1280",
            "Fix overflow, stacked CTAs, footer, nav drawer",
        ],
        "scope_out": ["Admin-only dense tables full redesign"],
        "steps": [
            "1. Build page checklist from Website Checklist tab",
            "2. Screenshot matrix per page × viewport",
            "3. Log bugs P0/P1; fix P0 same day, P1 within 48h",
            "4. Re-QA fixed pages; mark Website Checklist SEO/Code Ready updates",
        ],
        "files_likely": ["apps/web marketing layouts, auth pages, globals CSS"],
        "acceptance": [
            "No horizontal scroll on key pages at 390px",
            "Primary CTA always visible without obscure overlap",
            "Evidence folder of before/after shots",
        ],
        "blockers": [],
        "depends": [],
        "eod_proof": "QA matrix sheet or markdown + linked fixes",
    },
    "PT-A04": {
        "why": "Safari/iOS auth cookie issues block real users on highest-friction browsers.",
        "scope_in": [
            "Login, register, OTP, refresh cookie, hard-nav flows on Safari iOS + desktop Safari",
            "SameSite/Secure/partitioned cookie behavior checks",
        ],
        "scope_out": ["Android-only WebView bugs unless same root cause"],
        "steps": [
            "1. Device matrix: Safari 17+ iOS latest, desktop Safari",
            "2. Reproduce login → refresh → protected route",
            "3. Capture network Set-Cookie + document.cookie constraints",
            "4. Fix with auth team patterns (distinct JTIs, refresh grace already noted in MASTER_PROGRESS)",
            "5. Re-test full OTP UAT path on Safari",
            "6. Document in Testing Dashboard Auth row",
        ],
        "files_likely": [
            "apps/web auth clients",
            "apps/api auth controller cookie settings",
        ],
        "acceptance": [
            "Login + refresh survives 15 min idle on Safari iOS real device or BrowserStack",
            "Bug list empty or only P2 left",
        ],
        "blockers": ["May need API cookie header change with sunish"],
        "depends": ["Existing OTP UAT PASS evidence"],
        "eod_proof": "Safari session video or step log + cookies screenshot (redact tokens)",
    },
    "PT-T07": {
        "why": "Get Bots is public product surface; connected-accounts UI must not confuse empty users.",
        "scope_in": [
            "/get-bots, connected accounts empty/partial states",
            "bot-labels consistency",
            "Redirect /copy-trading → /get-bots still clean",
        ],
        "scope_out": ["MetaAPI connectivity bugs (sunish PT-T01/T02)"],
        "steps": [
            "1. Map current Get Bots + connected-accounts routes",
            "2. Empty state: what user should do next (connect broker / pick bot)",
            "3. Loading + error + partial connection states",
            "4. Labels from bot-labels.ts consistent",
            "5. Mobile QA + accessibility labels on primary actions",
        ],
        "files_likely": [
            "apps/web get-bots, marketplace, connected-accounts, bot-labels.ts",
        ],
        "acceptance": [
            "Empty state never dead-ends",
            "Marketing QA can demo path without verbal help",
        ],
        "blockers": ["Backend MetaAPI UAT open (Testing Dashboard)"],
        "depends": ["sunish MetaAPI"],
        "eod_proof": "UI walkthrough notes + screenshots of empty/filled",
    },
    "PT-W03": {
        "why": "Homepage conversion copy must match approved brand message in code.",
        "scope_in": ["Hero headline, subcopy, primary/secondary CTA wiring"],
        "scope_out": ["Writing the copy (ishit/abhishek)"],
        "steps": [
            "1. Receive approved copy pack from ishit",
            "2. Wire strings (CMS/MDX/const) — no hardcode drift",
            "3. CTA hrefs verified (register/get-bots/pricing)",
            "4. Ship after LCP safeguards not regressed",
        ],
        "files_likely": ["landing hero components, content modules"],
        "acceptance": ["Prod shows approved copy; CTAs trackable"],
        "blockers": ["Waiting on ishit approved hero"],
        "depends": ["PT-W01 ideally green first or parallel"],
        "eod_proof": "Prod screenshot of hero + copy source file",
    },
    "PT-W06": {
        "why": "Onboarding + risk pages drive activation; unclear UX kills broker connect.",
        "scope_in": ["Onboarding steps, risk disclosures UX, next-step clarity"],
        "scope_out": ["Legal policy text writing (abhishek)"],
        "steps": [
            "1. Walk dogfood onboarding cold",
            "2. Identify drop moments; map to form steps",
            "3. Progress indicator, better microcopy placement, error inline",
            "4. Risk page readable hierarchy + continue CTA",
            "5. Mobile pass",
        ],
        "files_likely": ["apps/web onboarding + risk routes"],
        "acceptance": ["New user can complete onboarding without help in <N steps"],
        "blockers": [],
        "depends": ["PostHog funnel data helpful (PT-M01)"],
        "eod_proof": "Before/after screenshots + step count",
    },
    "PT-M01": {
        "why": "Without PostHog in prod, activation KPI and funnel fixes are blind.",
        "scope_in": [
            "Web PostHog provider env production",
            "Core events: pageview, signup, login, broker_connect_start/success, bot_subscribe",
            "Privacy: respect cookie banner",
        ],
        "scope_out": ["Defining full funnel taxonomy (PT-M02 abhishek owns definition)"],
        "steps": [
            "1. Verify env NEXT_PUBLIC_POSTHOG_KEY/HOST on Cloud Run web",
            "2. Confirm provider mounts only client-side",
            "3. Fire test events; see in PostHog live",
            "4. Gate analytics behind consent if banner required",
            "5. Document events list for team",
        ],
        "files_likely": ["apps/web analytics/posthog provider", "env example"],
        "acceptance": [
            "Live event visible for a real prod session",
            "KPI sheet notes flip from 'not verified live'",
        ],
        "blockers": ["API keys from abhishek"],
        "depends": ["PT-M02 for full funnel naming"],
        "eod_proof": "PostHog live screenshot (redact personal data)",
    },
    "PT-A09": {
        "why": "Verify-email screens complete trust in auth journey.",
        "scope_in": ["verify-email states: waiting, success, expired, resend"],
        "scope_out": ["Email deliverability (infra)"],
        "steps": [
            "1. Inventory verify screens + copy",
            "2. Align UI with design system buttons/alerts",
            "3. Resend UX rate-limit messaging",
            "4. Mobile + dark/light if both used",
        ],
        "files_likely": ["auth verify-email routes"],
        "acceptance": ["All states covered; no blank error page"],
        "blockers": [],
        "depends": [],
        "eod_proof": "State matrix screenshots",
    },
    "PT-C03": {
        "why": "Coach without polished UI looks broken even if stream API works.",
        "scope_in": ["Empty/loading/error states on Alpha Coach UI"],
        "scope_out": ["Coach model quality (sunish/ai service)"],
        "steps": [
            "1. Cold open coach with no messages",
            "2. Loading skeleton while streaming",
            "3. Error retry UX",
            "4. Empty suggestions if any product wants them",
        ],
        "files_likely": ["apps/web alpha-coach pages"],
        "acceptance": ["No blank white panels; retry works"],
        "blockers": ["Coach API keys UAT partial — degrade gracefully"],
        "depends": ["sunish coach"],
        "eod_proof": "Screens of empty/load/error/success",
    },
    "PT-W08": {
        "why": "OG/PWA assets drive social share previews and install quality.",
        "scope_in": ["og:image paths, apple-touch, manifest icons"],
        "scope_out": ["Designing assets (ishit briefs)"],
        "steps": [
            "1. Receive asset pack sizes from ishit",
            "2. Place in public/; update metadataBase/openGraph",
            "3. Validate with OG debuggers + PWA checklist",
        ],
        "files_likely": ["apps/web/public, metadata in layout"],
        "acceptance": ["Share preview correct for / and /pricing"],
        "blockers": ["ishit asset briefs"],
        "depends": [],
        "eod_proof": "OG debugger screenshots",
    },
    "PT-S03": {
        "why": "Title/meta/OG wrong = SEO + share CTR loss.",
        "scope_in": ["Key pages title, description, OG tags code fixes"],
        "scope_out": ["Writing long-form keywords (ishit)"],
        "steps": [
            "1. Audit home, pricing, blog index, get-bots, brokers",
            "2. Spreadsheet gap list",
            "3. Fix metadata exports/layout",
            "4. Validate view-source + social crawlers",
        ],
        "files_likely": ["app layout metadata, generateMetadata"],
        "acceptance": ["No 'Untitled' / duplicate titles on audited pages"],
        "blockers": ["Copy strings from ishit when needed"],
        "depends": ["PT-W08 for images"],
        "eod_proof": "Gap list with before/after strings",
    },
    "PT-S04": {
        "why": "JSON-LD enables rich results eligibility.",
        "scope_in": ["Organization, WebSite, FAQ, Product/SoftwareApplication as relevant"],
        "scope_out": ["Content FAQs writing (ishit)"],
        "steps": [
            "1. Inventory existing JSON-LD",
            "2. Validate with Rich Results Test",
            "3. Fix errors/warnings on home + pricing",
        ],
        "files_likely": ["structured data components"],
        "acceptance": ["0 errors on Rich Results Test for home"],
        "blockers": [],
        "depends": [],
        "eod_proof": "Rich Results Test screenshot",
    },
    "PT-S10": {
        "why": "Brokers hub is SEO acquisition surface.",
        "scope_in": ["Ship content + page SEO improvements on /brokers"],
        "scope_out": ["Researching broker legal claims"],
        "steps": [
            "1. Receive ishit content",
            "2. Implement MDX/pages, internal links, meta",
            "3. Prod verify 200 + indexable",
        ],
        "files_likely": ["brokers routes/content"],
        "acceptance": ["Priority broker pages live with titles"],
        "blockers": ["ishit content"],
        "depends": [],
        "eod_proof": "URLs list live",
    },
    "PT-S11": {
        "why": "Internal linking distributes SEO equity and UX discovery.",
        "scope_in": ["Blog ↔ guides ↔ pricing ↔ get-bots ↔ brokers links"],
        "scope_out": ["Off-site link building (growth)"],
        "steps": [
            "1. Graph of key pages",
            "2. Related posts / footer / in-content links",
            "3. No orphan marketing pages",
        ],
        "files_likely": ["MDX, layout footers, related components"],
        "acceptance": ["Each critical page has ≥2 inbound internal paths"],
        "blockers": [],
        "depends": ["content published"],
        "eod_proof": "Link map markdown",
    },
    "PT-M08": {
        "why": "Community page must convert visitors to Discord/invite.",
        "scope_in": ["CTAs + invite links live"],
        "scope_out": ["Running the community (growth)"],
        "steps": [
            "1. Get final Discord/Telegram links from kushwaha",
            "2. Wire buttons; track clicks if PostHog ready",
            "3. Mobile CTA placement",
        ],
        "files_likely": ["community/contact pages"],
        "acceptance": ["All links open correct destinations"],
        "blockers": ["Links from growth"],
        "depends": [],
        "eod_proof": "Click test log",
    },
    "PT-L02": {
        "why": "Cookie banner/policy UX is compliance + PostHog consent gate.",
        "scope_in": ["Banner UX, accept/reject, links to policy"],
        "scope_out": ["Legal policy drafting (abhishek)"],
        "steps": [
            "1. Force first-visit state",
            "2. Keyboard + mobile overlay issues",
            "3. Integrate analytics gating with choice",
        ],
        "files_likely": ["cookie banner component, analytics provider"],
        "acceptance": ["Choice persists; no analytics before accept if required by policy"],
        "blockers": [],
        "depends": ["PT-M01"],
        "eod_proof": "First-visit video",
    },
    "PT-L04": {
        "why": "Chatbot/FAQ wiring reduces support load.",
        "scope_in": ["Keys env, FAQ pack render, widget placement"],
        "scope_out": ["Writing FAQ content (ishit)"],
        "steps": [
            "1. Confirm chatbot keys safe env",
            "2. Implement FAQ pack structure",
            "3. Fallback when keys missing",
        ],
        "files_likely": ["support/chatbot components"],
        "acceptance": ["FAQ readable; chatbot fails soft when offline"],
        "blockers": ["FAQ pack from ishit"],
        "depends": [],
        "eod_proof": "FAQ page + widget screenshot",
    },
    "PT-K03": {
        "why": "Time-to-first-broker is core activation metric.",
        "scope_in": ["Instrument start/success events + optional timestamps"],
        "scope_out": ["Improving broker API reliability"],
        "steps": [
            "1. Event names agreed with abhishek (PT-M02)",
            "2. Fire on UI actions and success API",
            "3. Build simple PostHog insight or note formula",
        ],
        "files_likely": ["connected accounts / onboarding flows"],
        "acceptance": ["Events visible for a test user path"],
        "blockers": ["PostHog live (PT-M01)"],
        "depends": ["PT-M01", "PT-M02"],
        "eod_proof": "Insight link/screenshot",
    },
    "PT-P09": {
        "why": "Residual RC validation — manual path proves trial money UX end-to-end.",
        "scope_in": ["Browser QA trial start → banner → upgrade on staging/prod"],
        "scope_out": ["Fixing backend race (already done local per sheet notes)"],
        "steps": [
            "1. Create test account",
            "2. Start trial; see banner",
            "3. Upgrade path opens correct plan",
            "4. Log defects; re-test after fixes",
        ],
        "files_likely": ["billing UI", "api trial endpoints (observe only)"],
        "acceptance": ["Checklist all green or filed bugs with IDs"],
        "blockers": ["Trial must be on environment under test"],
        "depends": ["PT-P03"],
        "eod_proof": "Filled UAT checklist markdown",
    },
}

# Map open tasks onto remaining calendar days (catch-up starting Day 13 = 2026-08-02)
# Days 1-9 completed/partial historically; plan still documents them fully.
TASK_DAY_FOCUS: dict[int, list[str]] = {
    # Catch-up intensive (today forward)
    13: ["PT-W01", "PT-A04"],
    14: ["PT-W01", "PT-M01"],
    15: ["PT-W02", "PT-W06"],
    16: ["PT-P03", "PT-P09"],
    17: ["PT-T07", "PT-M08"],
    18: ["PT-L04", "PT-A09"],
    19: ["PT-C03", "PT-W02"],
    20: ["PT-S03", "PT-W03"],
    21: ["PT-W01", "PT-S04"],  # close W3 with LCP sign-off attempt
    22: ["PT-M01", "PT-K03"],
    23: ["PT-W06", "PT-A04"],
    24: ["PT-T07", "PT-C03"],
    25: ["PT-S10", "PT-W08"],
    26: ["PT-L02", "PT-S11"],
    27: ["PT-P03", "PT-P09"],
    28: ["PT-W02", "PT-A09"],
    29: ["PT-K03", "PT-M01"],
    30: ["PT-T07", "PT-W06"],
    31: ["PT-W01", "PT-S03"],  # perf recheck
    32: ["PT-L04", "PT-M08"],
    33: ["PT-S10", "PT-S11"],
    34: ["PT-C03", "PT-L02"],
    35: ["PT-W08", "PT-S04"],
    36: ["PT-W01"],  # load week frontend errors
    37: ["PT-W02"],
    38: ["PT-S11", "PT-S03"],
    39: ["PT-L02", "PT-A04"],
    40: ["PT-W03", "PT-M08"],
    41: ["PT-P09", "PT-T07"],
    42: ["PT-W01", "PT-K03"],
    43: ["PT-W06", "PT-S03"],
    44: ["PT-A04", "PT-P03"],
    45: ["PT-W01", "PT-M01"],  # final numbers + retro proof
}


def slug(s: str) -> str:
    s = re.sub(r"[^a-zA-Z0-9]+", "-", s.strip().lower())
    return s.strip("-")[:80]


def phase_folder(phase: str) -> str:
    # W2 — Prove live (M1–M4) -> W2-Prove-live-M1-M4
    p = phase.replace("—", "-").replace("–", "-")
    p = re.sub(r"\s+", " ", p).strip()
    return slug(p) or "unphased"


def write(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content.rstrip() + "\n", encoding="utf-8")


def task_md(t: dict) -> str:
    tid = t["id"]
    pb = TASK_PLAYBOOKS.get(tid, {})
    status = t["status"]
    rank = "IN PROGRESS" if status.lower() == "in progress" else "NOT STARTED"

    def bullets(items, empty="- (none)"):
        if not items:
            return empty
        return "\n".join(f"- {x}" for x in items)

    return f"""# {tid} — {t['name']}

| Field | Value |
|-------|--------|
| **Owner** | aaradhya |
| **Status (sheet)** | {status} |
| **Priority** | {t['priority']} |
| **Phase** | {t['phase']} |
| **Type** | {t['type']} |
| **Estimate (hrs)** | {t['est']} |
| **Actual logged (hrs)** | {t['act']} |
| **Execution order** | {rank} (do all IN PROGRESS before new NOT STARTED when possible) |
| **Sheet notes** | {t['notes'] or '—'} |

## Why this exists
{pb.get('why', 'Complete remaining frontend/web ownership for launch plan.')}

## Definition of Done (100%)
{bullets(pb.get('acceptance', ['Task marked Completed in Master Tracker with evidence notes']))}

## Scope IN
{bullets(pb.get('scope_in', ['Implement and verify end-to-end for this task']))}

## Scope OUT
{bullets(pb.get('scope_out', ['Work owned by other teammates unless blocked and reassigned']))}

## Full execution steps
{bullets(pb.get('steps', ['1. Reproduce current state', '2. Implement', '3. Verify', '4. Evidence + mark complete']))}

## Likely code / content surfaces
{bullets(pb.get('files_likely', ['apps/web']))}

## Dependencies & blockers
- Depends: {', '.join(pb.get('depends', [])) or '—'}
- Blockers: {', '.join(pb.get('blockers', [])) or '—'}

## EOD proof required
{pb.get('eod_proof', 'Working prod/staging URL or PR + screenshot + Master Tracker note')}

## Daily touch plan
- Work this task only on days that list `{tid}` in the day plans under `00-days/`.
- If finished early, pull next priority In Progress → remaining Critical Not Started.

## Completion checklist
- [ ] Implementation complete
- [ ] Tested desktop
- [ ] Tested mobile (390px)
- [ ] Evidence saved
- [ ] Master Tracker status → Completed + notes
- [ ] Related Website Checklist / SEO / Testing cells updated
- [ ] EOD post in standup
"""


def day_md(day: int, meta: dict, blocks: list[dict]) -> str:
    phase = meta.get("phase", "")
    date = meta.get("date", "")
    wd = meta.get("weekday", "")
    focus = meta.get("focus", "")
    a_task = meta.get("aaradhya", "")
    status = meta.get("status", "")
    eod = meta.get("eod", "")
    focus_ids = TASK_DAY_FOCUS.get(day, [])
    open_by_id = {t["id"]: t for t in DATA["open_tasks"]}

    # Historical status note
    hist = status
    today_note = ""
    if day <= 9:
        today_note = (
            "> Historical day (before catch-up). Keep this file as archive + verification template. "
            "Re-run only if evidence is incomplete."
        )
    elif day == 10:
        today_note = "> Sheet status: In Progress (2026-07-30). Close residual Safari + connected-accounts items."
    elif day <= 12:
        today_note = "> Sheet still Not Started/Partial; execute catch-up now if behind."
    else:
        today_note = (
            f"> Plan day for catch-up (today's calendar context: Aug 2026). "
            f"Primary residual Master IDs: {', '.join(focus_ids) or 'scheduled polish'}."
        )

    block_lines = []
    total_h = 0.0
    if blocks:
        for b in sorted(blocks, key=lambda x: float(x.get("block") or 0)):
            total_h += float(b.get("hours") or 0)
            task_text = (b.get("task") or "").lower()
            how_extra = ""
            if "lighthouse" in task_text or "lcp" in task_text:
                how_extra = (
                    "6. Run `npx lighthouse https://www.profytron.com --form-factor=mobile --only-categories=performance` thrice\n"
                    "7. Save JSON under `docs/aaradhya-45-day-complete-plan/evidence/day-{day}/`\n"
                )
            elif "safari" in task_text or "cookie" in task_text or "auth" in task_text:
                how_extra = (
                    "6. Matrix: Safari iOS + desktop Safari login → refresh → protected route\n"
                    "7. Capture Set-Cookie flags; file bug with repro steps if fails\n"
                )
            elif "posthog" in task_text or "funnel" in task_text:
                how_extra = (
                    "6. Confirm env vars on Cloud Run web revision\n"
                    "7. Fire test event; screenshot PostHog live (redact PII)\n"
                )
            elif "billing" in task_text or "pricing" in task_text or "trial" in task_text:
                how_extra = (
                    "6. Walk /pricing and /billing at 1280 + 390\n"
                    "7. Note CTA hrefs + loading/error states; file gaps\n"
                )
            elif "seo" in task_text or "meta" in task_text or "sitemap" in task_text:
                how_extra = (
                    "6. view-source check title/description; curl robots + sitemap 200\n"
                    "7. Update SEO Tracker / Website Checklist cells\n"
                )
            block_lines.append(
                f"### Block {b.get('block')} — {b.get('start')}–{b.get('end')} ({b.get('hours')}h)\n"
                f"**Do:** {b.get('task')}\n\n"
                f"**Done when (EOD proof):** {b.get('done_when') or '—'}\n\n"
                f"**How (100%):**\n"
                f"1. Read residual task playbook if this block maps to a PT-* ID\n"
                f"2. Implement/verify in repo or browser as stated\n"
                f"3. Capture proof (screenshot, PR, prod URL, metric)\n"
                f"4. If blocked >30m, escalate to abhishek/sunish with evidence\n"
                f"5. Tick `Done` in Daily 10h sheet when proof exists\n"
                f"{how_extra}"
            )
    else:
        block_lines.append("_No Daily 10h blocks found for this day; use Master Tracker residual plan below._")

    # Expand light sheet days with residual deep-work so nothing is underspecified
    if focus_ids and total_h < 10:
        need = 10 - total_h
        per = need / len(focus_ids)
        for i, tid in enumerate(focus_ids):
            t = open_by_id.get(tid, {})
            pb = TASK_PLAYBOOKS.get(tid, {})
            steps = pb.get("steps", ["Implement", "Verify", "Evidence"])
            steps_txt = "\n".join(f"   - {s}" for s in steps)
            block_lines.append(
                f"### Residual deep-work R{i+1} — +{per:.1f}h (catch-up fill to 10h day)\n"
                f"**Do:** Advance **{tid}** — {t.get('name', tid)} ({t.get('status', '?')} · {t.get('priority', '?')})\n\n"
                f"**Why today:** Sheet block hours were only {total_h}h; residual backlog is still open.\n\n"
                f"**Done when:** Meaningful progress + evidence toward DoD in task playbook.\n\n"
                f"**Full steps for this task:**\n{steps_txt}\n\n"
                f"**Acceptance target:**\n"
                + "\n".join(f"- {a}" for a in pb.get("acceptance", ["Evidence recorded"]))
                + f"\n\n**Link:** `01-tasks/` → `{tid}`\n"
            )
        total_h = 10.0

    task_detail = []
    for tid in focus_ids:
        t = open_by_id.get(tid)
        if t:
            pb = TASK_PLAYBOOKS.get(tid, {})
            task_detail.append(
                f"### {tid} ({t['status']} · {t['priority']}) — {t['name']}\n"
                f"- Est {t['est']}h · Act {t['act']}h · Notes: {t['notes'] or '—'}\n"
                f"- Why: {pb.get('why', '—')}\n"
                f"- Today's slice: execute next unfinished step from playbook\n"
                f"- Full plan file under `01-tasks/`\n"
                f"- EOD proof: {pb.get('eod_proof', 'evidence')}\n"
            )
        else:
            task_detail.append(f"### {tid}\n- See task backlog if still open\n")

    collab = f"""## Team context (same day)
| Person | Planned focus |
|--------|----------------|
| abhishek | {meta.get('abhishek','—')} |
| sunish | {meta.get('sunish','—')} |
| **aaradhya** | {a_task} |
| kushwaha | {meta.get('kushwaha','—')} |
| ishit | {meta.get('ishit','—')} |
"""

    return f"""# Day {day:02d} — {date} ({wd})

| Field | Value |
|-------|--------|
| **Phase** | {phase} |
| **Sheet Day Status** | {hist or '—'} |
| **Daily focus (team)** | {focus} |
| **Aaradhya sheet focus** | {a_task} |
| **Team EOD deliverable** | {eod} |
| **Planned hours (10h model)** | {total_h or 10}h |
| **Primary residual task IDs** | {', '.join(focus_ids) or '— (early complete days / rest)'} |

{today_note}

## Goal for Aaradhya today (one sentence)
Complete: **{a_task}** — and advance residual IDs: **{', '.join(focus_ids) or 'sheet blocks only'}** to EOD proof quality.

## Order of work (always)
1. Unblock **In Progress** residual tasks first (PT-W01, PT-P03, PT-W02 if still open)
2. Then **Critical** Not Started
3. Then **High** → **Medium** → **Low**
4. Update sheets before offline: Master Tracker, Website Checklist, Testing, Standup

## Residual Master Tracker focus (detailed)
{chr(10).join(task_detail) if task_detail else 'No catch-up IDs mapped (use 10h blocks only).'}

## Full 10h schedule (from Daily 10h Tasks sheet)

{chr(10).join(block_lines)}

{collab}

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
"""


def build():
    # clean regenerable dirs
    for name in ["00-days", "01-tasks", "02-cross-sheet", "03-indexes"]:
        p = ROOT / name
        if p.exists():
            shutil.rmtree(p)

    open_tasks = DATA["open_tasks"]
    in_prog = [t for t in open_tasks if t["status"].lower() == "in progress"]
    not_start = [t for t in open_tasks if t["status"].lower() != "in progress"]

    # Priority sort for not started: Critical, High, Medium, Low
    pri_rank = {"Critical": 0, "High": 1, "Medium": 2, "Low": 3}

    def sort_key(t):
        return (pri_rank.get(t["priority"], 9), t["id"])

    in_prog.sort(key=sort_key)
    not_start.sort(key=sort_key)

    # Task files
    for t in in_prog:
        write(
            ROOT / "01-tasks" / "01-IN-PROGRESS" / f"{t['id']}-{slug(t['name'])}.md",
            task_md(t),
        )
    for t in not_start:
        write(
            ROOT / "01-tasks" / "02-NOT-STARTED" / f"{t['id']}-{slug(t['name'])}.md",
            task_md(t),
        )

    # Task index
    lines = ["# Aaradhya Master Tracker backlog (open only)", "", "## Execution order", ""]
    lines.append("### 1) In Progress — finish first")
    for t in in_prog:
        lines.append(
            f"- [{t['id']} {t['name']}](./01-IN-PROGRESS/{t['id']}-{slug(t['name'])}.md) "
            f"— {t['priority']} · Est {t['est']}h · Act {t['act']}h"
        )
    lines.append("")
    lines.append("### 2) Not Started — by priority")
    for t in not_start:
        lines.append(
            f"- [{t['id']} {t['name']}](./02-NOT-STARTED/{t['id']}-{slug(t['name'])}.md) "
            f"— {t['priority']} · Est {t['est']}h"
        )
    lines.append("")
    lines.append(f"**Open count:** {len(open_tasks)} · **Est hours:** {sum(float(t['est'] or 0) for t in open_tasks)}")
    write(ROOT / "01-tasks" / "README.md", "\n".join(lines))

    # Cross-sheet
    web = DATA["web_pages"]
    incomplete_web = [
        p
        for p in web
        if any(
            x.lower() in ("partial", "not started", "blocked", "no")
            for x in [p.get("content_ready", ""), p.get("seo_ready", ""), p.get("prod", "")]
        )
        or p.get("prod", "").lower() not in ("yes", "completed", "healthy")
    ]
    # Always list all with aaradhya and not fully green
    web_lines = [
        "# Website Checklist — remaining for Aaradhya",
        "",
        "Do until each row is either fully shippable or intentionally N/A.",
        "",
        "| Page | Content Ready | SEO/Code | Prod Live | Priority | What remaining |",
        "|------|---------------|----------|-----------|----------|----------------|",
    ]
    for p in web:
        rem = []
        if p["content_ready"].lower() not in ("yes", "n/a", "completed"):
            rem.append(f"content:{p['content_ready']}")
        if p["seo_ready"].lower() not in ("yes", "n/a", "completed"):
            rem.append(f"seo/code:{p['seo_ready']}")
        if p["prod"].lower() not in ("yes", "completed"):
            rem.append(f"prod:{p['prod']}")
        if not rem:
            rem = ["maintain only"]
        web_lines.append(
            f"| `{p['page']}` | {p['content_ready']} | {p['seo_ready']} | {p['prod']} | {p['priority']} | "
            f"{'; '.join(rem)}; {p['notes']} |"
        )
    web_lines += [
        "",
        "## Completion rule",
        "- Content Ready: needs ishit/abhishek text where Partial/Not Started — still list engineering ship steps.",
        "- SEO/Code Ready: metadata, linking, schema, layout — Aaradhya.",
        "- Prod Live: confirm HTTP 200 + expected UI after deploy.",
        "",
        "## Per-page engineering mini-plan",
        "For every **Partial / Not Started / Blocked** cell:",
        "1. Open route in code + prod",
        "2. Write gap list (bullet)",
        "3. Fix code OR file dependency (owner + date)",
        "4. Re-verify and update this table in the sheet",
    ]
    write(ROOT / "02-cross-sheet" / "website-checklist-remaining.md", "\n".join(web_lines))

    seo_lines = [
        "# SEO Tracker — all keywords still Not Started (Eng: Aaradhya)",
        "",
        "Content Owner for all: **ishit**. Aaradhya ships code + page plumbing.",
        "",
        "| Keyword | Volume | Difficulty | Landing | Priority | Remaining eng work |",
        "|---------|--------|------------|---------|----------|--------------------|",
    ]
    for r in DATA["seo_rows"]:
        if r["status"].lower() in ("completed", "done"):
            continue
        seo_lines.append(
            f"| {r['keyword']} | {r['volume']} | {r['diff']} | {r['landing'] or 'TBD'} | {r['priority']} | "
            f"Landing page live + title/meta/H1 + internal links + indexable |"
        )
    seo_lines += [
        "",
        "## 100% plan per keyword",
        "1. Confirm landing URL exists (create route if missing)",
        "2. Title ≤60 chars, meta ≤155, unique H1",
        "3. Internal link from ≥1 parent hub",
        "4. Schema if applicable",
        "5. Mark Status in sheet after prod check",
        "",
        "Batch by Priority: Critical first → High → Medium.",
    ]
    write(ROOT / "02-cross-sheet" / "seo-tracker-remaining.md", "\n".join(seo_lines))

    test_lines = [
        "# Testing Dashboard — remaining involving Aaradhya",
        "",
        "| Module | Primary | Secondary | Eng Status | Overall | Notes | Aaradhya remaining |",
        "|--------|---------|-----------|------------|---------|-------|--------------------|",
    ]
    for r in DATA["test_rows"]:
        inv = "aaradhya" in (r["primary"] + r["secondary"]).lower()
        openish = r["eng_status"].lower() not in ("completed", "done", "healthy")
        if not inv and not openish:
            continue
        if not inv and openish:
            # only include aaradhya modules or secondary
            continue
        rem = "Close Eng Status to Completed when UI + QA evidence exists"
        if "landing" in r["module"].lower():
            rem = "LCP sign-off + mobile QA evidence"
        if "seo" in r["module"].lower():
            rem = "Content published path + remaining meta"
        if "dashboard" in r["module"].lower():
            rem = "Get Bots + connected-accounts polish"
        if "coach" in r["module"].lower():
            rem = "UI empty/loading states"
        if "payment" in r["module"].lower():
            rem = "Secondary: billing UI + trial UAT help"
        test_lines.append(
            f"| {r['module']} | {r['primary']} | {r['secondary']} | {r['eng_status']} | {r['overall']} | "
            f"{r['notes']} | {rem} |"
        )
    write(ROOT / "02-cross-sheet" / "testing-dashboard-remaining.md", "\n".join(test_lines))

    write(
        ROOT / "02-cross-sheet" / "kpi-and-launch.md",
        """# KPI + Launch Countdown — Aaradhya remaining

## KPIs owned
| KPI | Current | Target | Cadence | Remaining work |
|-----|---------|--------|---------|----------------|
| Landing LCP mobile | Unknown | <4s | Weekly | Finish PT-W01; log number |
| 7-day activation rate | — | >30% | Weekly | PT-M01 + PT-K03 + funnel fixes |

## Launch milestones involving Aaradhya
| Milestone | Status | DoD | Remaining |
|-----------|--------|-----|-----------|
| M3 — LCP <4s + homepage copy live | Not Started | Perf + approved copy | PT-W01 + PT-W03 (ishit copy) |

## Evidence template
```
Date:
Environment: prod | staging
Lighthouse run #1/#2/#3 LCP:
Hero copy version:
PostHog event test:
Link to screenshots:
```
""",
    )

    write(
        ROOT / "02-cross-sheet" / "feature-matrix-remaining.md",
        """# Feature Matrix — Aaradhya-related incomplete

Code is often Completed; content/remaining UX still partial:

| Feature | Code | Content | Remaining for Aaradhya |
|---------|------|---------|------------------------|
| F-01 Marketing website | Completed | Partial | LCP + hero wiring + mobile QA |
| F-02 SEO system | Completed | Not Started | Ship meta/schema + pages when content ready |
| F-03 Blog + Guides | Completed | Not Started | Publish pipeline, layout, links |
| F-04 Brokers hub | Completed | Partial | PT-S10 improvements |
| F-11 Dashboard | Completed | Partial | Connected accounts / Get Bots polish |
| F-15 AI Coach | Completed (eng sunish) | Not Started | UI polish PT-C03 |
| F-18 Support + chatbot | Completed | Partial | FAQ/chatbot wiring PT-L04 |
| F-19 Help / Docs | Completed | Partial | Help IA + content implement |
| F-26 Affiliate | Completed | Not Started | Ready page for growth content |

Rule: do not mark feature fully done until Content + UX empty states are production-honest.
""",
    )

    # Days
    day_meta = {int(k): v for k, v in DATA["day_meta"].items()}
    day_blocks = {int(k): v for k, v in DATA["days_blocks"].items()}
    index_days = ["# 45 Day Index (Aaradhya)", ""]

    for day in range(1, 46):
        meta = day_meta.get(day, {"phase": "Unknown", "date": "", "weekday": "", "focus": "", "aaradhya": "", "status": "", "eod": ""})
        blocks = day_blocks.get(day, [])
        pf = phase_folder(meta.get("phase") or "phase")
        day_dir_name = f"Day-{day:02d}-{meta.get('date') or 'undated'}-{slug(meta.get('weekday') or '')}"
        # User asked: if day has phase then under phase folder, with day name folder
        day_path = ROOT / "00-days" / pf / day_dir_name / "PLAN.md"
        write(day_path, day_md(day, meta, blocks))
        # also a TASKS.md checklist for the day
        focus_ids = TASK_DAY_FOCUS.get(day, [])
        checklist = [
            f"# Day {day:02d} checklist",
            "",
            "## Sheet 10h blocks",
        ]
        for b in sorted(blocks, key=lambda x: float(x.get("block") or 0)):
            checklist.append(f"- [ ] B{b.get('block')}: {b.get('task')} → _{b.get('done_when')}_")
        checklist.append("")
        checklist.append("## Residual Master IDs")
        if focus_ids:
            for tid in focus_ids:
                checklist.append(f"- [ ] {tid}")
        else:
            checklist.append("- [ ] (none mapped)")
        checklist.append("")
        checklist.append("## Sheet updates")
        checklist += [
            "- [ ] Master Tracker",
            "- [ ] Website Checklist",
            "- [ ] Testing / KPI if touched",
            "- [ ] Standup note",
        ]
        write(ROOT / "00-days" / pf / day_dir_name / "CHECKLIST.md", "\n".join(checklist))
        index_days.append(
            f"- [Day {day:02d} {meta.get('date')} — {meta.get('phase')}](./{pf}/{day_dir_name}/PLAN.md) "
            f"· sheet:{meta.get('status') or '—'} · focus:{meta.get('aaradhya','')[:60]}"
        )

    write(ROOT / "00-days" / "README.md", "\n".join(index_days))

    # Phase README files
    phases_seen = {}
    for day, meta in day_meta.items():
        pf = phase_folder(meta.get("phase") or "phase")
        phases_seen.setdefault(pf, {"name": meta.get("phase"), "days": []})
        phases_seen[pf]["days"].append(day)
    for pf, info in phases_seen.items():
        days_sorted = sorted(info["days"])
        write(
            ROOT / "00-days" / pf / "PHASE.md",
            f"""# Phase: {info['name']}

**Days:** {days_sorted[0]:02d}–{days_sorted[-1]:02d} ({len(days_sorted)} days)

## Phase objective for Aaradhya
Ship frontend/web/UI credibility for this milestone window: performance, auth UX, billing UI, SEO plumbing, and activation instrumentation as scheduled.

## Exit criteria
- All day CHECKLIST files for this phase either green or explicitly deferred with owner/date
- Related Master Tracker Criticals for the window closed or blocked with reason
- Evidence folder notes updated

## Days
"""
            + "\n".join(f"- Day {d:02d}" for d in days_sorted),
        )

    # Root README
    write(
        ROOT / "README.md",
        f"""# Aaradhya — Complete 45-Day Plan Package

Generated from Profytron Google Sheet + Master open tasks.  
**Owner role:** Engineer — Frontend, Web, Product UI  
**Capacity:** ~45 hrs/week (sheet) · Daily model ~10h blocks from Daily 10h Tasks  
**Order of attack:** **In Progress → Not Started (Critical→High→Medium→Low)** → update every related sheet.

## Folder map

```
docs/aaradhya-45-day-complete-plan/
  README.md                          ← you are here
  00-days/
    README.md                        ← index of all 45 days
    <phase-folder>/
      PHASE.md
      Day-NN-YYYY-MM-DD-<weekday>/
        PLAN.md                      ← 100% day plan
        CHECKLIST.md                 ← tickable EOD checklist
  01-tasks/
    README.md
    01-IN-PROGRESS/                  ← finish these first
    02-NOT-STARTED/                  ← then these by priority
  02-cross-sheet/                    ← Website, SEO, Testing, KPI, Features
  03-indexes/
    HOW-TO-EXECUTE.md
    REMAINING-EVERYTHING.md
```

## Open Master Tracker summary
| Bucket | Count | Est hrs |
|--------|-------|---------|
| In Progress | {len(in_prog)} | {sum(float(t['est'] or 0) for t in in_prog)} |
| Not Started | {len(not_start)} | {sum(float(t['est'] or 0) for t in not_start)} |
| **Total open** | **{len(open_tasks)}** | **{sum(float(t['est'] or 0) for t in open_tasks)}** |

### In Progress (do first)
{chr(10).join(f"- `{t['id']}` {t['name']} ({t['priority']}, Est {t['est']}h)" for t in in_prog)}

### Not Started Critical
{chr(10).join(f"- `{t['id']}` {t['name']}" for t in not_start if t['priority']=='Critical') or '- (none)'}

## How to use (daily)
1. Open today's folder under `00-days/<phase>/Day-…/`
2. Work `PLAN.md` top → bottom; tick `CHECKLIST.md`
3. Open linked `01-tasks/…` when a residual PT-* is today's focus
4. Before offline: update Master Tracker + any cross-sheet tab
5. Never leave a partial without evidence + next step owner

## Start here tomorrow / catch-up
Sheet calendar day for **2026-08-02 ≈ Day 13** (W2).  
If behind: treat Days 10–14 as **catch-up sprint** — force close **PT-W01, PT-M01, PT-A04, PT-P03**.

See [03-indexes/HOW-TO-EXECUTE.md](./03-indexes/HOW-TO-EXECUTE.md) and [03-indexes/REMAINING-EVERYTHING.md](./03-indexes/REMAINING-EVERYTHING.md).
""",
    )

    write(
        ROOT / "03-indexes" / "HOW-TO-EXECUTE.md",
        """# How to execute this plan at 100%

## Rule of thruput
1. **Evidence > promises.** No task done without screenshot / PR / URL / metric.
2. **Depth > breadth.** One finished PT-* beats five 40% polish tasks.
3. **In Progress always wins** unless a P0 production burn needs firefighting.
4. **Dependencies:** If blocked on ishit/sunish >30 minutes, write blocker in Standup and switch to next unblocked Critical.

## Daily 10h rhythm (from sheet)
| Block | Typical window | Type |
|-------|----------------|------|
| 1 | 09:00–10:00 | Standup / funnel watch / stabilise |
| 2–3 | Main implementation blocks | Core PT-* delivery |
| 4–5 | Ship/QA/support blocks | Evidence + mobile |
| Last | EOD | Sheet updates + post |

## Sheet update protocol
After any meaningful ship:
1. Master Tracker: Status, Actual Hours, Notes/Evidence
2. Website Checklist: Content/SEO/Prod columns honesty
3. Testing Dashboard if module quality changed
4. KPI if LCP/PostHog number known
5. SEO Tracker when landing for a keyword is live
6. Daily Standup row for the day

## Definition of a green day
- [ ] All CHECKLIST blocks checked or deferred with written reason
- [ ] At least one residual PT-* moved forward with evidence if workday
- [ ] No silent blockers
- [ ] Tomorrow first task pre-written

## Definition of phase exit
See each `00-days/<phase>/PHASE.md`.

## Quality bars by work type
### Performance
- 3× Lighthouse mobile runs; median counted
- LCP element identified in notes

### UI polish
- Desktop + 390px screenshots
- Empty/loading/error states covered

### SEO code
- view-source titles unique
- robots/sitemap still 200
- Share debugger for OG when images change

### Analytics
- Real prod event in PostHog UI (not just “wired”)
""",
    )

    remaining_all = [
        "# Remaining everything — single inventory",
        "",
        "Source of truth was the Google Sheet export at plan generation. Code may have advanced (Phase 9C/10); re-verify before implementing.",
        "",
        "## A. Master Tracker open (Owner = aaradhya)",
        "",
    ]
    for t in in_prog + not_start:
        remaining_all.append(
            f"### {t['id']} · {t['status']} · {t['priority']}\n"
            f"- **{t['name']}** · Est {t['est']}h · Act {t['act']}h\n"
            f"- Notes: {t['notes'] or '—'}\n"
            f"- Plan: `01-tasks/`\n"
        )
    remaining_all += [
        "",
        "## B. Depends-on-aaradhya (other owners)",
        "- PT-M02 abhishek — aaradhya implements events after funnel defined",
        "- PT-M03 ishit — may need Resend UI wiring",
        "- PT-S13 growth — feeds landings you ship",
        "- PT-E06 — incident pairing as needed",
        "- PT-Z01 deferred Strategy Builder UI later",
        "",
        "## C. Cross-sheet",
        "- Website Checklist: `02-cross-sheet/website-checklist-remaining.md`",
        "- SEO Tracker (20 keywords): `02-cross-sheet/seo-tracker-remaining.md`",
        "- Testing: `02-cross-sheet/testing-dashboard-remaining.md`",
        "- KPI/Launch: `02-cross-sheet/kpi-and-launch.md`",
        "- Features: `02-cross-sheet/feature-matrix-remaining.md`",
        "",
        "## D. 45 day execution",
        "- All days: `00-days/README.md`",
        "- Catch-up emphasis Day 13+: residual mapping in each PLAN.md",
        "",
        "## E. Already completed (do not re-do unless broken)",
        "- PT-D03 Deploy Web + /status prod",
        "- PT-S01 sitemap/robots verify",
        "- Days 1–9 largely Completed/Partial infra path — verify marketing evidence still missing historically",
    ]
    write(ROOT / "03-indexes" / "REMAINING-EVERYTHING.md", "\n".join(remaining_all))

    print("Generated under", ROOT)
    print("In-progress tasks:", len(in_prog))
    print("Not-started tasks:", len(not_start))
    print("Days:", 45)


if __name__ == "__main__":
    build()
