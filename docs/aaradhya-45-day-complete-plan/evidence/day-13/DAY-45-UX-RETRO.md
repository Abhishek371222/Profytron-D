# Day 45 — Web / UX retro + CWV notes

**Date written:** 2026-08-02  
**Owner:** aaradhya (engineering closeout)

## What improved (repo)

1. **Landing LCP path** — light shell first paint; `LandingHeavyShell` idle-defer; mobile no ambient/WebGL/Lenis rotation; hero static critical path.
2. **Consent + analytics** — Cookie banner, PostHog gated, `time_to_first_broker`, `trial_started`, web vitals when live.
3. **Activation surfaces** — Get Bots / connected accounts empties, onboarding + secure cookies, completion event.
4. **Money path UI** — Billing full plan features, trial banner, StartTrial analytics.
5. **Trust / SEO** — status honesty, help FAQ = shared schema, JsonLd FAQs, internal links, OG 1200×630, logo alts.
6. **Hardening** — Query networkMode online, quieter polling (accounts/markets/history background off), API keys education, support empty/error, leaderboard empties + CTAs.

## CWV / KPI truth

| Metric | Status |
|--------|--------|
| Prod web | **web-00074-nkc** (LCP defer ship) after **web-00073-qd7** |
| Landing LCP mobile | **Median 3.93s PASS** on `web-00074-nkc` (see `PT-W01-lighthouse-median.md`) |
| Cookie/compliance UX | Shipped |
| PostHog | Code ready; env key ops |

## What remains for humans

- Median Lighthouse if lab noisy on local agent host → recheck from clean machine or PageSpeed Insights
- Safari/iOS session video → PT-A04 sheet Completed
- ishit hero/brokers long form/custom OG art
- Live Stripe trial UAT checklist
- Paste `SHEET-SYNC.md` into Google Sheet

## Recommendation

Treat Days 1–45 Aaradhya engineering as **closed**. Do not re-open as Not Started unless regressions appear.
