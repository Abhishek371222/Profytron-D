# Profytron — Search Intent & Page Priority Model

Each business-critical page is assigned exactly one primary search intent, a business-critical priority, and an SEO priority score (Business Importance / Search Opportunity / Conversion Value / Maintenance Priority, each Low/Medium/High). See [business-model.md](business-model.md), [feature-map.md](feature-map.md), [conversion-funnel.md](conversion-funnel.md).

| Page | Primary Intent | Business Priority | Business Importance | Search Opportunity | Conversion Value | Maintenance Priority |
|---|---|---|---|---|---|---|
| `/` (Homepage) | Navigational / Brand | Critical | High | High | High | High |
| `/pricing` | Commercial | Critical | High | Medium | Critical | High |
| `/signup`, `/register` | Transactional | Critical | High | Low | Critical | Medium |
| `/login` | Navigational | Critical | High | Low | Low (retention, not acquisition) | Low |
| `/brokers/[slug]` (×20) | Informational / Comparison | High | Medium | High (long-tail: "\[broker] MT5 bot," "\[broker] copy trading") | High | Medium |
| `/docs` | Documentation | High | Medium | Medium | Medium | Medium |
| `/api-reference` | Documentation | Medium | Low | Medium (developer intent) | Low | Medium |
| `/guides` | Informational | High | Medium | High (educational/top-of-funnel queries) | Medium | High |
| `/blog` (+ 3 posts) | Informational | High | Medium | High (thin today — only 3 posts) | Medium | High |
| `/help` | Support | Medium | Low | Low | Low | Medium |
| `/about` | Brand / Informational | Medium | Medium | Low | Medium (trust-building) | Low |
| `/contact` | Navigational / Transactional (sales) | High | Medium | Low | High (Enterprise funnel) | Low |
| `/community` | Navigational | Low | Low | Low | Low | Low — currently "coming soon" |
| `/careers` | Navigational | Low | Low | Low | None | Low — no real listings yet |
| `/press` | Navigational | Low | None | Low | None | Low — not built (redirects home) |
| `/terms`, `/privacy`, `/cookies`, `/risk-disclosure` | Support / Legal | Medium | Low | Low | Low | Medium (compliance-driven, must stay accurate) |
| `(dashboard)/dashboard` | Navigational (post-login) | Critical | High | None (gated) | N/A (retention) | Medium |
| `(dashboard)/marketplace` | Commercial (post-login) | Critical | High | None (gated — no public page) | High | Medium |
| `(dashboard)/alpha-coach` | Transactional (post-login) | High | Medium | None (gated) | Medium | Low |
| `(dashboard)/strategies`, `/strategies/builder` | Transactional (post-login) | High | Medium | None (gated) | Medium | Low |
| `(dashboard)/creator`, `/creator/add-bot` | Transactional (post-login) | Medium | Medium | None (gated) | Medium | Low |

## Notes

- **Gated pages** (everything under `(dashboard)`) have no direct SEO opportunity since they require login — their "Search Opportunity" is marked None/low by design, not by omission. Their business value shows up indirectly, through the public pages that must convince a visitor to sign up to reach them.
- **Broker pages** are the single highest-leverage underused SEO surface: 20 individual pages already exist with structured broker data (region, spreads, execution type), which naturally supports long-tail comparison/informational queries ("best MT5 broker for automated trading," "\[broker] bot trading"), but there is no `/brokers` index page tying them together — a content gap, not a fix applied here.
- **Blog** is currently very thin (3 posts) relative to its High search-opportunity rating — this is the highest-ROI content gap identified.
- Legal pages carry Medium maintenance priority specifically because Terms/Privacy/Risk Disclosure changes are compliance-driven (SEBI non-registration disclosure, DPDP Act) and inaccuracies carry regulatory risk, not just SEO risk.

## Content gaps identified (per business-intelligence engine instructions: identify only, do not create)

- No public `/marketplace` or `/strategies` page for logged-out visitors to evaluate the marketplace before signing up.
- No public Affiliate Program landing page (FAQ-only mention).
- No `/brokers` index page aggregating the 20 existing broker pages.
- No comparison content (e.g., "Profytron vs. manual trading," "Profytron vs. \[category] platforms") — no competitors are named anywhere in the repo, so this would need new, honest positioning rather than named comparisons.
- No glossary of trading/algo-trading terms.
- Blog has only 3 posts against a stated content strategy implied by `/guides` categories (Algorithmic Strategies, Risk Management, AI & Signal Analysis, Market Microstructure) — most guide topics listed on `/guides` appear to be placeholder titles without full articles behind them.
- No FAQ page as a standalone URL — FAQ content currently only feeds the homepage and `/help` page indirectly.
- Press kit does not exist (page redirects to homepage).
- Testimonial section (homepage "How It Works") has one attributed quote with no visible sourcing/verification — a trust-signal gap if scrutinized by future visitors, not a content-volume gap.
