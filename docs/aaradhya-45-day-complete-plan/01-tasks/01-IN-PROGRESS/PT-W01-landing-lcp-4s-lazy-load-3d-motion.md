# PT-W01 — Landing LCP < 4s (lazy-load 3D/motion)

| Field | Value |
|-------|--------|
| **Owner** | aaradhya |
| **Status (sheet)** | In Progress |
| **Priority** | Critical |
| **Phase** | Development |
| **Type** | Feature |
| **Estimate (hrs)** | 16.0 |
| **Actual logged (hrs)** | 4.0 |
| **Execution order** | IN PROGRESS (do all IN PROGRESS before new NOT STARTED when possible) |
| **Sheet notes** | Perf work in repo; LCP <4s not formally signed off. |

## Why this exists
Landing LCP is the #1 public conversion speed gate (Launch M3 + KPI).

## Definition of Done (100%)
- Lighthouse mobile LCP < 4s (median of 3 runs) on production
- Evidence screenshots + JSON committed under evidence folder or linked in notes
- No functional breakage of CTAs / login / pricing links
- Sheet KPI Landing LCP updated from Unknown → measured number

## Scope IN
- Homepage first paint route only (/, optional marketing layout shell)
- Lazy-load/defer 3D (Spline/R3F), motion libraries, hero video/images
- Preload only LCP image/font; drop non-critical third-party on first paint
- Measure Lighthouse mobile + real Chrome DevTools mobile throttle

## Scope OUT
- Dashboard performance (separate W5 work)
- Copy writing (ishit/abhishek) except wiring approved strings
- Deep SEO content pages (SEO tasks)

## Full execution steps
- 1. Baseline: run Lighthouse mobile 3x on prod + local; record LCP element + score in evidence/
- 2. Inventory: list every above-fold import chain from page.tsx → layout → hero
- 3. Dynamic import heavy clients (ssr:false) for 3D/motion; show static poster/fallback
- 4. Images: next/image priority only on LCP image; sizes + AVIF/WebP; width/height set
- 5. Fonts: display=swap, subset, reduce preloads; avoid FOIT layout shift
- 6. Scripts: defer analytics until idle/consent if blocking; verify no GTM pre-consent hit
- 7. CSS: remove unused heavy globals on landing if split needed
- 8. Re-measure until LCP < 4.0s median mobile Lighthouse; save after JSON
- 9. Ship to prod; re-probe www.profytron.com; paste numbers into KPI sheet + Day EOD

## Likely code / content surfaces
- apps/web/src/app/(marketing)/page.tsx (or equivalent landing)
- apps/web components under 3d/, hero, motion
- apps/web/public/3d/posters/*
- next.config / font setup

## Dependencies & blockers
- Depends: ishit copy optional for final hero
- Blockers: Approved hero copy (W03) can land after or with feature flag

## EOD proof required
Before/after LCP numbers + PR URL + prod Lighthouse screenshot

## Daily touch plan
- Work this task only on days that list `PT-W01` in the day plans under `00-days/`.
- If finished early, pull next priority In Progress → remaining Critical Not Started.

## Completion checklist
- [ ] Implementation complete
- [ ] Tested desktop
- [ ] Tested mobile (390px)
- [ ] Evidence saved
- [ ] Master Tracker status → Completed + notes
- [ ] Related Website Checklist / SEO / Testing cells updated
- [ ] EOD post in standup
