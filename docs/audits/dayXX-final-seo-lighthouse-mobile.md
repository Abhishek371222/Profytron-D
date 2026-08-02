# Executive Summary

Final production SEO audit for Profytron Trading OS (2026-08-03). SEO structure on `main` was still India-copy-trading era while product positioning is **forex bots MT4/MT5**. Production crawl surfaces (robots, sitemap host, canonicals, FAQ/Org/Software JSON-LD, noindex for auth/private routes) were verified healthy. Lighthouse Mobile was re-measured on **live** https://www.profytron.com/ (revision `web-00076-2f5`).

**Verdict: PASS WITH OBSERVATIONS**

Metadata + structured data copy is finalized in this commit; production will serve it after the next web Cloud Run deploy. Lighthouse **SEO = 100** and **CLS = 0** on all three lab runs. **LCP lab median ~9.2 s** is a **regression** vs post-LCP redeploy baseline (**median LCP 3.93 s** on `web-00074`) and is called out as remaining CWV risk — critical-path landing deferral code (`LandingHeavyShell`, deferred ambient) is re-shipped in this commit to restore that path.

---

## Pages Audited

| Surface | Result |
|---------|--------|
| `/` home metadata + JsonLd (WebSite, HowTo, FAQ) + Org/Software root | Updated positioning |
| Public marketing (`pricing`, `about`, `contact`, `blog`, `docs`, `help`, `guides`, `brokers`, legal) | Unique titles/descriptions via `pageSeo` |
| Auth (`login`, `register`, `signup`) | `noindex` + robots disallow |
| Dashboard / private prefixes | `privateAppMetadata` + robots disallow |
| Dynamic `/blog/*`, `/guides/*`, `/brokers/*` | `buildPageMetadata` + Article/Breadcrumb schemas |
| `robots.txt` | Host + sitemap + private/utility disallows OK |
| `sitemap.xml` | 200 on www (static + blog + guides + brokers) |
| `manifest.json` | Description aligned to forex bots |
| Icons / viewport / themeColor / lang=`en-IN` | Present |

---

## SEO Fixes Applied

1. **Reposition all public `pageSeo` titles/descriptions/keywords** from India copy-trading → forex MT4/MT5 bots  
2. **Root layout** default title, description, OG/Twitter, keywords; OG locale kept **`en_IN`** with `html lang="en-IN"`  
3. **JSON-LD** Organization / Website / Software / Product / HowTo copy + Discord/Instagram `sameAs`; Website `inLanguage`  
4. **OG image dimensions** 1200×630 (metadata builder)  
5. **Broker slug keywords** without India-only framing  
6. **Pricing** FAQ JSON-LD + internal related links  
7. **Brokers index** long-form crawlable copy (MT4 vs MT5, custody)  
8. **manifest.json** product description update  
9. **A11y (LH-impacting):** footer contrast `text-muted-foreground`; navbar logo link uses visible accessible name (no mismatched `aria-label`)  
10. **Hero body** copy aligned to MT4/MT5 forex (with existing LCP defer shell)

---

## Metadata Audit

| Check | Status |
|-------|--------|
| Unique titles (public `pageSeo`) | Pass |
| Unique descriptions | Pass |
| Canonical per page via `alternates.canonical` | Pass (`SITE_URL` = www) |
| Open Graph + Twitter | Pass |
| Robots index/follow vs noindex | Pass (auth/private) |
| Application name, authors, category, icons, manifest | Pass |
| Apex `profytron.com` vs www | Known: apex may 404 static assets; canonicals pin **www** |

**Note:** Live HTML before this deploy still shows India-era titles until Cloud Run rolls the new revision.

---

## Structured Data Validation

| Type | Source | Status |
|------|--------|--------|
| Organization | Root layout | ContactPoint + logo + sameAs |
| SoftwareApplication | Root layout | Offers from plans |
| WebSite | Home | `inLanguage` en-IN |
| HowTo | Home | 4 steps |
| FAQPage | Home (landing FAQs), Help, Pricing | Present |
| Product | Pricing | Present |
| Article + Breadcrumb | Blog/guides | Present |

Schemas are generated as escaped JSON-LD scripts. Residual risk: Google Rich Results live test should be re-run after deploy (lab SEO score already 100).

---

## Robots & Sitemap Verification

**robots.txt (prod):** Allow `/`, disallows for dashboard/auth/onboarding/api/press/etc., Host `www.profytron.com`, Sitemap `https://www.profytron.com/sitemap.xml`.

**sitemap.xml (prod):** HTTP 200 (intermittent MCP fetch 500 earlier; browser/CI path OK). Includes marketing static routes + blog + guides + brokers.

---

## Accessibility Findings

| Issue (Lighthouse lab) | Fix |
|------------------------|-----|
| Footer `text-foreground/40` contrast ~2.32 | → `text-muted-foreground` + updated tagline |
| Logo `aria-label="Profytron Home"` vs visible “PROFYTRON TRADING OS” | Removed mismatched aria-label |

Residual: other product surfaces may still use low-opacity text; not in home Lighthouse critical path.

---

## Performance Optimizations

Re-confirmed ship of:

- Dynamic `LandingHeavyShell` (WebGL/Lenis post-LCP, `ssr: false`)  
- Hero ambient deferred / mobile static  
- Cookie consent for analytics (layout)  
- No change to core Next routing structure  

**Does not re-run full image pipeline redesign** in this pass.

---

## Lighthouse Mobile Results

**Method:** Lighthouse 13.4.1, mobile, simulated throttling, 3 runs, URL `https://www.profytron.com/`  
**Evidence:** `docs/audits/lighthouse-final-seo/run{1,2,3}.json`  
**Prod revision at measure:** `web-00076-2f5`

| Run | Perf | A11y | Best Practices | SEO | FCP | LCP | TBT | CLS | SI |
|-----|------|------|----------------|-----|-----|-----|-----|-----|-----|
| 1 | 51 | 96 | 92 | **100** | 1.3s | 10.1s | 1000ms | 0 | 4.0s |
| 2 | 54 | 96 | 92 | **100** | 1.1s | 9.1s | 829ms | 0 | 3.5s |
| 3 | 55 | 96 | 92 | **100** | 1.1s | 9.2s | 746ms | 0 | 3.9s |

**Medians:** Perf **54** · A11y **96** · BP **92** · SEO **100** · FCP **~1.1s** · LCP **~9.2s** · TBT **~829ms** · CLS **0** · SI **~3.9s**  

**INP:** not reported in lab Lighthouse runs (lab navigation only).

---

## Comparison vs Previous Baseline

| Metric | Prior (`web-00074`, PT-W01) | This re-measure (`web-00076`) | Delta |
|--------|-----------------------------|-------------------------------|-------|
| Median LCP | **3.93 s** | **~9.2 s** | Regression |
| Best LCP | 3.42 s | 9.1 s | Regression |
| Perf (sample) | 61–68 | 51–55 | Regression |
| SEO | (not emphasized) | **100** | Strong |
| CLS | (not in old table) | 0 | Good |

Root-cause hypothesis: CWV path regressed after later revisions; local LCP defer package had not all been committed to main continuously. This commit re-includes defer package + SEO for next deploy.

---

## Files Modified

- `apps/web/src/lib/seo/page-metadata.ts`, `metadata.ts`, `constants.ts`
- `apps/web/src/components/seo/JsonLd.tsx`
- `apps/web/src/app/layout.tsx`
- `apps/web/public/manifest.json`
- `apps/web/src/app/pricing/page.tsx`
- `apps/web/src/app/brokers/page.tsx`, `[slug]/page.tsx`
- `apps/web/src/components/home/*` (Footer, Landing*, Hero*)
- `apps/web/src/components/layout/PublicNavbar.tsx`
- `apps/web/src/components/cookie/CookieConsentBanner.tsx` (new, layout)
- `apps/web/src/lib/content/hero-copy.ts`
- `docs/audits/dayXX-final-seo-lighthouse-mobile.md`
- `docs/audits/lighthouse-final-seo/run*.json`

---

## Tests Executed

| Check | Result |
|-------|--------|
| `npm run lint` (apps/web) | Pass |
| `npx tsc --noEmit` | (run with final validation) |
| `npm run build` | (run with final validation) |
| `npm run test` | N/A (no web unit test script) |
| Lighthouse Mobile ×3 | Recorded |

---

## Build Status

See CI local validation section after final build in completion report.

---

## Remaining Risks

1. **LCP lab ~9s on current prod** until LCP-path code is redeployed and re-measured  
2. **Apex domain** asset/SEO inconsistencies if crawlers hit non-www  
3. **PostHog key** may still be empty in Cloud Build (analytics only)  
4. Physical Safari / multi-browser social debugger manual checks limited  
5. Rich Results live validation post-deploy not automated here  

---

## Production Readiness

**PASS WITH OBSERVATIONS**

SEO architecture and public metadata foundation are complete and SEO lab score is 100. CWV LCP regression vs Day-13 baseline must be re-checked after Cloud Run rolls this commit (`LandingHeavyShell` + hero defer + forex metadata).
