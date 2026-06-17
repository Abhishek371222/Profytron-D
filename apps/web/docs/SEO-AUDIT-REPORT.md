# Profytron SEO Audit & Implementation Report
**Date:** June 14, 2026  
**Scope:** `apps/web` — Next.js 16 App Router

---

## Executive Summary

| Area | Before | After | Target |
|------|--------|-------|--------|
| Per-page metadata | 1/64 routes | 20+ public routes | All indexable pages |
| Sitemap URLs | ~30 | 40+ (static + blog + brokers) | All public content |
| Structured data | Org + Software + FAQ | + WebSite, HowTo, Product, Article, Breadcrumb | Rich results ready |
| Blog indexability | Modal-only | `/blog/[slug]` SSG pages | Crawlable articles |
| Contact page | 404 | `/contact` live | Required for E-E-A-T |
| robots.txt | 4 disallow paths | 20+ private prefixes + AI bots | Full app protection |
| Heading hierarchy | h1→h3, h2→h4 skips | Fixed on landing | WCAG / SEO best practice |

**Build status:** ✅ `npm run build` passes

---

## Phase 1 — Issues Found & Fixes

### Critical (Fixed)

| Issue | Impact | Fix |
|-------|--------|-----|
| No per-page titles/descriptions | Duplicate SERP snippets | `src/lib/seo/metadata.ts` + `page-metadata.ts` + route layouts |
| `/contact` 404 | Broken trust + auth allowlist mismatch | `src/app/contact/page.tsx` |
| Blog not crawlable | Zero content SEO | `src/lib/blog/posts.ts` + `/blog/[slug]` with Article schema |
| Sitemap missing legal/marketing pages | Under-indexing | `PUBLIC_SITEMAP_ROUTES` in `sitemap-routes.ts` |
| Auth-gated URLs in sitemap | Crawl budget waste | Removed marketplace/leaderboard from sitemap |
| Organization logo 404 | Rich result failure | Fixed to `/icons/icon-512.svg` |

### High (Fixed)

| Issue | Fix |
|-------|-----|
| Shared OG image for all pages | Per-route `buildPageMetadata()` with canonical + OG |
| robots.txt incomplete | Expanded `PRIVATE_PREFIXES` + AI crawler rules |
| Dashboard indexable | `noindex` on `(dashboard)/layout.tsx` |
| Footer links to login walls | Point product links to `/register` + `/#anchors` |
| No canonical URLs | `alternates.canonical` on all metadata |

### Medium (Partially Addressed)

| Issue | Status | Next Step |
|-------|--------|-----------|
| Landing fully client-rendered | Unchanged | Consider RSC for hero copy |
| No `opengraph-image.tsx` per route | Pending | Add dynamic OG for blog/pricing |
| Admin layout noindex | robots only | Split admin layout like dashboard |
| AggregateRating in schema | Added (static) | Wire to real review data |

---

## Phase 2 — Technical SEO (Implemented)

### New Files
- `src/lib/seo/constants.ts` — Site URL, OG defaults
- `src/lib/seo/metadata.ts` — `buildPageMetadata()`, `absoluteUrl()`
- `src/lib/seo/page-metadata.ts` — Pre-built metadata for all public routes
- `src/lib/seo/sitemap-routes.ts` — Centralized sitemap route list
- `src/lib/seo/faq-items.ts` — Shared FAQ data for schema + UI
- `src/components/seo/Breadcrumbs.tsx` — Visual + schema-ready breadcrumbs
- `src/app/blog/[slug]/page.tsx` — SSG blog articles
- `src/app/contact/page.tsx` — Contact hub

### Redirects (`next.config.ts`)
- `/documentation` → `/docs` (301)
- `/signup` → `/register` (301)
- `/press` → `/` (301)

---

## Phase 3 — AI Search Optimization (Implemented)

| Schema | Location |
|--------|----------|
| Organization | Root layout |
| WebSite + SearchAction | Homepage |
| SoftwareApplication + Offers | Root layout |
| FAQPage | Homepage |
| HowTo (4 steps) | Homepage |
| Product + Offers | `/pricing` |
| Article | `/blog/[slug]` |
| BreadcrumbList | Contact, blog posts |

**AI crawler rules:** GPTBot, Google-Extended, anthropic-ai, PerplexityBot, Bingbot configured in `robots.ts`.

---

## Phase 4–12 — Roadmap (Recommended Next)

### Content SEO (Month 1)
- [ ] Expand blog to 12+ articles with keyword clusters
- [ ] Add FAQ blocks to `/pricing`, `/docs`, `/help`
- [ ] Create landing pages: `/copy-trading`, `/ai-trading-coach`, `/mt5-trading`

### UI/CRO (Month 1–2)
- [ ] Email capture on homepage (waitlist API exists at `/api/waitlist`)
- [ ] Exit-intent modal on pricing
- [ ] A/B test hero headline variants

### Performance (Ongoing)
- [ ] LCP: preload hero image, priority on above-fold
- [ ] INP: audit Framer Motion on mobile
- [ ] Add `next/image` to all marketing images

### Lighthouse Targets
Run: `npx lighthouse https://profytron.com --view`

Expected after deploy:
- SEO: 95–100 (metadata + schema + sitemap)
- Performance: 85–95 (depends on CDN + image optimization)
- Accessibility: 90–95 (breadcrumb ARIA, heading fixes help)
- Best Practices: 95–100 (CSP/HSTS already configured)

---

## Keyword Strategy (Primary Clusters)

| Cluster | Target Pages |
|---------|--------------|
| algorithmic trading India | `/`, `/pricing`, blog |
| copy trading MT5 | `/`, `/docs`, broker pages |
| AI trading coach | `/`, future `/ai-coach` landing |
| strategy marketplace | `/`, `/register` |
| forex algo trading | `/brokers/*`, blog |

---

## 12-Month SEO Growth Roadmap

| Quarter | Focus |
|---------|-------|
| Q1 | Technical foundation (✅), blog cadence, broker page expansion |
| Q2 | Link building (guest posts, trading communities), GSC monitoring |
| Q3 | Programmatic SEO (broker × strategy pages), video schema |
| Q4 | International (EN-IN + Hindi content), authority backlinks |

---

## Files Changed (This Implementation)

```
src/lib/seo/*           — Metadata, sitemap, FAQ data
src/lib/blog/posts.ts   — Shared blog content
src/app/sitemap.ts      — Expanded dynamic sitemap
src/app/robots.ts       — Private routes + AI bots
src/app/page.tsx        — Homepage metadata + schemas
src/app/contact/        — New contact page
src/app/blog/[slug]/    — Indexable blog articles
src/app/*/layout.tsx    — Per-route metadata (15 routes)
src/components/seo/     — Enhanced JsonLd, Breadcrumbs
src/components/home/    — Heading + footer SEO fixes
next.config.ts          — SEO redirects
```
