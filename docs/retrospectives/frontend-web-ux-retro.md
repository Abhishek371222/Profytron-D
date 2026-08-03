# Frontend Web/UX Retrospective & Final Core Web Vitals Report

**Project:** Profytron Trading OS  
**Document type:** Release closeout — documentation & measurement only  
**Date measured:** 2026-08-03  
**Primary URL:** https://www.profytron.com/  
**Prod revision:** `web-00103-skm` @ **100%** traffic  
**Git SHA (serving prod):** `109d93ebc3db6f1d8be8dd12a6866729b95fc346`  
**Image tag:** `web:109d93ebc3db6f1d8be8dd12a6866729b95fc346`  

---

# Executive Summary

Frontend implementation for the release window is **complete and synchronized to production**. This retrospective records **lab Core Web Vitals and Lighthouse scores** on live production, compares them to the documented historical baseline (SEO Lighthouse gate on revision `web-00076-2f5`), summarizes completed UX workstreams, accessibility work, and production validation.

**No application code was changed for this gate.**

**All values in the CWV and Lighthouse tables below are lab measurements** (Lighthouse 13.4.1, simulated throttling, headless Chrome). **Field CrUX / RUM CWV and INP are not available** to this audit (PostHog key often unset in build; no CrUX export in-scope). **INP is not reported by standard Lighthouse lab navigation.**

**Final frontend release verdict: PASS WITH OBSERVATIONS**

Key lab outcomes on production home (`/`):

| Surface | Perf | A11y | BP | SEO | LCP | CLS |
|---------|------|------|----|-----|-----|-----|
| Mobile (median of 2 runs) | **73** | **97** | **100** | **100** | **~3.6 s** | **0** |
| Desktop (1 run) | **85** | **97** | **100** | **100** | **1.9 s** | **~0.002** |

Compared with the SEO-gate mobile median (**Perf 54**, **LCP ~9.2 s** on `web-00076-2f5`), lab LCP and Performance score have **improved substantially**. Mobile LCP remains above Google’s “good” lab/field threshold of **2.5 s** — documented as a **non-blocking observation**, not a release blocker after full FE closeout.

---

## Final Core Web Vitals

### Measurement method (lab)

| Item | Value |
|------|--------|
| Tool | Lighthouse **13.4.1** |
| Mode | CLI, headless Chrome, **simulated** throttling |
| URL | `https://www.profytron.com/` |
| Form factors | Mobile (2 runs), Desktop (1 run) |
| Evidence JSON | `docs/audits/lighthouse-retro-final/mobile-run{1,2}.json`, `desktop-run1.json` |
| Field data | **Not collected** this gate |
| INP | **Not available** in these lab navigations |

### Lab Core Web Vitals — Mobile

| Metric | Run 1 | Run 2 | Median / note |
|--------|-------|-------|----------------|
| **LCP** | 3.8 s (3776 ms) | 3.3 s (3326 ms) | **~3.6 s** |
| **INP** | — | — | **Not measured** (lab nav) |
| **CLS** | 0 | 0 | **0** |

### Lab Core Web Vitals — Desktop

| Metric | Run 1 | Note |
|--------|-------|------|
| **LCP** | 1.9 s (1943 ms) | Within common “good” band for lab desktop |
| **INP** | — | **Not measured** |
| **CLS** | 0.002 | Within “good” band |

**TTFB (document server response, lab audit):** mobile ~90–92 ms · desktop ~84 ms. Independent HTTP probe (agent HEAD/GET, not Lighthouse): HTML GET ~45 KB in ~221 ms wall time with `x-nextjs-cache: HIT` / prerender headers (network-path dependent; **not** a substitute for lab TTFB).

---

## Lighthouse Results

### Mobile (lab)

| Run | Perf | A11y | Best Practices | SEO | FCP | LCP | TBT | CLS | SI | TTFB |
|-----|------|------|----------------|-----|-----|-----|-----|-----|-----|------|
| 1 | 70 | 97 | 100 | 100 | 1.1 s | 3.8 s | 700 ms | 0 | 3.7 s | 92 ms |
| 2 | 76 | 97 | 100 | 100 | 1.1 s | 3.3 s | 580 ms | 0 | 3.5 s | 90 ms |
| **Median** | **73** | **97** | **100** | **100** | **~1.1 s** | **~3.6 s** | **~640 ms** | **0** | **~3.6 s** | **~91 ms** |

### Desktop (lab)

| Run | Perf | A11y | Best Practices | SEO | FCP | LCP | TBT | CLS | SI | TTFB |
|-----|------|------|----------------|-----|-----|-----|-----|-----|-----|------|
| 1 | **85** | **97** | **100** | **100** | 0.4 s | 1.9 s | 130 ms | 0.002 | 2.0 s | 84 ms |

### Transfer / network (lab, home document navigation)

Approximate **resource** sizes from Lighthouse network requests (transfer size):

| Form factor | Network requests | JS transfer (≈) | CSS transfer (≈) | Total byte weight (≈) |
|-------------|------------------|-----------------|------------------|------------------------|
| Mobile | 93 | ~691 KB (~58 scripts) | ~58 KB (3 stylesheets) | ~1.65 MB |
| Desktop | 101 | ~701 KB (~60 scripts) | ~58 KB (3 stylesheets) | ~1.69 MB |

Home HTML document itself is prerendered (~**45 KB** Content-Length on a live HEAD probe).

### Supporting metrics (summary)

| Metric | Mobile (median) | Desktop |
|--------|-----------------|---------|
| FCP | ~1.1 s | 0.4 s |
| Speed Index | ~3.6 s | 2.0 s |
| TBT | ~640 ms | 130 ms |
| Lighthouse Performance | 73 | 85 |
| Accessibility | 97 | 97 |
| Best Practices | 100 | 100 |
| SEO | 100 | 100 |

---

## Baseline Comparison

### Historical baseline (measured, comparable methodology)

Source: `docs/audits/dayXX-final-seo-lighthouse-mobile.md` + `docs/audits/lighthouse-final-seo/run{1,2,3}.json`  
**Prod at baseline:** `web-00076-2f5` · **Mobile only** · Lighthouse 13.4.1 · simulated throttling · `https://www.profytron.com/`

| Metric | Baseline median (mobile) | Final median (mobile) | Direction |
|--------|--------------------------|------------------------|-----------|
| Performance score | 54 | **73** | ↑ ~+19 pts |
| Accessibility | 96 | **97** | ↑ |
| Best Practices | 92 | **100** | ↑ |
| SEO | 100 | **100** | stable |
| LCP | ~9.2 s | **~3.6 s** | ↑ large improvement |
| FCP | ~1.1 s | **~1.1 s** | ~stable |
| TBT | ~829 ms | **~640 ms** | ↑ modest |
| CLS | 0 | **0** | stable |
| SI | ~3.9 s | **~3.6 s** | slight ↑ |

### Secondary historical reference (not re-used as raw numbers this gate)

- Post-LCP recovery target cited in SEO audit for `web-00074`: median lab **LCP ~3.93 s** — final median **~3.6 s** is **at least as good** as that recovery target, and clearly better than the **~9.2 s** regression snapshot on `web-00076-2f5`.
- Dashboard-only ships (dynamic order modal, idle scene strip, viewport modules, polling reductions) improve **authenticated** UX; **authed dashboard lab CWV was not re-captured** (no session JWT in this gate). Treat those as implementation outcomes, not new CWV numbers.

### Methodology notes

| Comparable | Not comparable without caveats |
|------------|--------------------------------|
| Same tool major (LH 13.4.1), URL, mobile form factor, simulated throttling | Desktop baseline was not captured at SEO gate |
| Category scores + paint metrics on public `/` | Field CrUX / RUM vs lab |
| | Per-run variance (LCP 3.3–3.8 s this gate) |
| | Network request graphs differ slightly vs older revision (new features/scripts) |

### Interpretation of significant changes

1. **LCP recovery:** Landing deferral path (`LandingHeavyShell`, deferred ambient / post-LCP heavy work) is reflected in final lab LCP (~3.6 s vs ~9.2 s regression snapshot).
2. **SEO / Best Practices / A11y:** SEO remained perfect; BP moved to 100 and A11y to 97 after contrast/name and trust/copy ships.
3. **TBT still elevated on mobile lab:** ~640 ms median — consistent with a marketing page that still loads a large JS surface (~690 KB JS transfer). Not a P0 after FE closeout; residual optimization opportunity.
4. **CLS** remains excellent (0 mobile).
5. **Bundle / requests:** Final lab home still ~1.65 MB total weight / ~93 mobile requests — tradeoff of feature-rich public shell + third-party hooks under consent.

---

## UX Improvements Delivered

Completed workstreams closed across audits and ships (evidence in `docs/audits/dayXX-*` and production SHA `109d93eb`):

### Completed

| Theme | Outcome |
|-------|---------|
| **Navigation** | Consistent labels (Bot Plans, Market Watch, Paper/Live); command palette + sidebar terminology aligned |
| **Dashboard polish** | Overview performance path, deferred secondary chrome, mobile dashboard UX |
| **Onboarding** | Risk / activation paths closed; onboarding hotfix verification done |
| **Empty states** | Centralized `EMPTY_STATES`; `role="status"` on empty primitives |
| **Copy consistency** | Forex bots MT4/MT5 positioning; coach notes; no invented SLA claims |
| **Accessibility** | Focus-visible, reduced-motion, footer/contrast fixes, logo accessible name |
| **Mobile responsiveness** | Dashboard + public shells pass mobile dogfood gates |
| **Community** | Discord/community routes closed |
| **Help Center** | FAQs / help catalog shipping complete |
| **Settings** | Profile, security, support, notifications, API access polish |
| **Notifications** | Contrast + empty states |
| **Beta feedback** | Confusion sources ranked and P0/P1 clarity fixes shipped |
| **Performance** | Landing LCP deferral; dashboard code-splits; polling / visibility awareness |
| **Production stabilization** | Status/trust honesty; security UI masks; Cloud Run pin by SHA; FE sign-off closed |

### Explicit non-defects remaining (product intent)

- Strategy Builder and selected surfaces: honest **Coming soon**
- `WithdrawSheet` fee schedule: intentional product **TODO** (non-blocking)
- Field analytics dashboards (PostHog) depend on consent + configured keys

---

## Accessibility Summary

| Area | Status on release |
|------|-------------------|
| **Keyboard support** | Interactive app chrome designed for tab order; global focus rings |
| **Focus management** | Focus-visible / focus-ring utilities in global CSS |
| **Contrast** | P1 contrast ships (notifications, support, journal, leaderboard, footer muted text) |
| **Screen reader** | Empty `role="status"`; logo/nav accessible names corrected; status/trust copy neutral |
| **ARIA** | Targeted fixes (remove mismatched logo `aria-label`; empty status roles); LH A11y **97** lab on home |
| **Reduced motion** | `prefers-reduced-motion` honored for motion/ambient patterns |

Residual: low-opacity text may still exist on secondary surfaces outside home LH critical path (tracked historically as non-blocking).

---

## What Worked Well

- **Evidence-driven gates:** Dogfood/P0/P1 verification closed work with audits rather than speculative refactors.
- **Terminology system:** Bot Plans / Market Watch / Paper–Live reduced beta confusion across nav, empties, and help.
- **Landing performance architecture:** Heavy shell deferred past LCP recovered lab LCP from multi-second regression.
- **Central empty-state module:** Single source of journey copy improved consistency.
- **Production discipline:** Pin images by git SHA; sign-off against `origin/main` == prod image tag.
- **Security UX basics:** Secret masking (2FA / bridge tokens) without blocking primary flows.
- **Honest trust surfaces:** Status page distinguishes process uptime vs product SLA marketing.

---

## Challenges

- **Prod deploy sync:** Multiple Cloud Run revisions; risk of measuring the wrong digest until tags verified.
- **Copy across many routes:** 80+ `page.tsx` surfaces made terminology sweeps iterative.
- **Responsive edge cases:** Dashboard dual layout paths (engine vs legacy) complicated QA.
- **Dashboard performance:** Authenticated CWV hard to lab without session; architecture proxy used for closeout.
- **Landing JS weight:** Marketing + product affordances keep mobile TBT elevated despite LCP wins.
- **Analytics lag:** Empty PostHog keys in some builds limit field CWV / funnel observation.
- **Local Windows CI parity:** Chrome-launcher EPERM noise after LH runs; rare local `next build` crashes on developer machines (prod image remains SoT) — **this gate’s local lint, tsc, and build succeeded**.

---

## Future Opportunities

Non-blocking only (not open release defects):

- Advanced personalization of dashboard and coach
- Deeper analytics / risk dashboards
- Cross-browser QA expansion (Safari/iOS field focus)
- Further landing JS reduction or route-level code-splitting beyond current deferral
- CrUX / real-user INP dashboards once PostHog or similar is continuously key-configured
- Fee-schedule copy completion for withdraw flows (`WithdrawSheet` product TODO)

---

## Production Summary

| Item | Value |
|------|--------|
| Branch | `main` |
| Latest frontend commit (serving) | `109d93ebc3db6f1d8be8dd12a6866729b95fc346` — `fix(status): polish status page and trust signals` |
| Cloud Run service | `web` · region `asia-south1` · project `gen-lang-client-0497144011` |
| Ready revision | **`web-00103-skm`** @ **100%** |
| Image digest | `sha256:9dc7f100aa6a7af7ab5d4722c2c6646836b72cffdc3d84b0a76ad87467616788` |
| Registry tags | `109d93ebc3db6f1d8be8dd12a6866729b95fc346`, `latest` |
| Prod matches repository tip | **Yes** (`origin/main` = `HEAD` = image tag) |
| Outstanding FE blockers | **None** (sign-off + zero-backlog gates) |
| Build status (local gate) | **PASS** (see Validation) |

Local dirty WIP (auth store, temp env files, untracked prior audits) may remain on developer machines — **not part of the production ship surface**.

---

## Validation Results

Ran from `apps/web` on 2026-08-03:

| Command | Result |
|---------|--------|
| `npm run lint` | **PASS** (exit 0) |
| `npx tsc --noEmit` | **PASS** (exit 0) |
| `npm run build` | **PASS** (exit 0) — Next production build completed |
| `npm run test` | **Not configured** for the frontend (`package.json` scripts: predev, dev, prebuild, build, start, lint only) |

> `npm run test` is not configured for the frontend; lint, typecheck, and production build completed successfully.

---

## Final Verdict

| Dimension | Result |
|-----------|--------|
| Implementation complete | **Yes** (prior FE closeout) |
| Prod synchronized | **Yes** (`109d93eb` / `web-00103-skm` @ 100%) |
| Lab CWV recorded | **Yes** (LCP/CLS; INP N/A) |
| Field CWV | **Unavailable** — stated explicitly |
| No new product code this gate | **Yes** |
| Residual CWV risk | Mobile lab LCP ~3.6 s and TBT ~640 ms remain **observations**, not open blockers for this closed roadmap |
| **Release verdict** | **PASS WITH OBSERVATIONS** |

---

*Document author: engineering release closeout · Measurement + UX summary only · 2026-08-03*
