# Profytron — Feature Map

Status classification (Current / Deferred / Roadmap-only / Coming Soon) is drawn from `PROJECT_STATUS.md`, `PRODUCT_ROADMAP.md`, `V1_LAUNCH_CRITERIA.md`, and route/page evidence. See [business-model.md](business-model.md).

| Feature | Purpose | Business Value | User Value | Dependencies | SEO Importance | Conversion Importance | Trust Importance | Nav Importance | Status |
|---|---|---|---|---|---|---|---|---|---|
| Trading Bots (deploy/run) | Deploy pre-built or custom bots, paper or live MT5 | Core subscription driver (bot-count gates plans) | Automates execution without screen-watching | MetaAPI broker connection | High | Critical | High | Critical | Current |
| Bot Marketplace | Browse/subscribe to strategies published by creators | Take-rate revenue (20% platform fee) | Access to verified, track-recorded strategies | Creator submissions, verification pipeline | High | Critical | Critical (needs "Verified" badges to earn trust) | Critical | Current |
| Creator Tools (add-bot, creator dashboard) | Let traders publish/monetize their own bots | Supply-side of marketplace flywheel | 80% revenue share, passive income | KYC, 60-day live track record for verification | Medium | High | High | High | Current |
| Copy Trading | Mirror another trader's live execution | Differentiator vs. plain bot-running platforms | Passive exposure to proven strategies without building one | MetaAPI, master/copy sync engine (`COPY_TRADING_ARCHITECTURE.md`) | High | Critical | Critical (transparency claim: "broker-verified performance") | Critical | Current |
| Alpha Coach (AI) | AI chat coaching / trade review | Key upsell lever (session count gated by plan) | Guidance without needing a human coach | LLM backend, trade history | Medium | High | Medium | High | Current |
| AI Risk Engine | Real-time drawdown/volatility monitoring, auto-stop | Reduces platform liability exposure to catastrophic user losses | Protects user capital automatically | `AiRiskService`, broker execution pipeline | Medium | High (Pro+ exclusive) | Critical (core safety claim) | Medium | Current |
| Portfolio Analytics (Performance, Risk, Trade Forensics) | Equity/risk/trade-history visualization | Retention driver, plan-gated depth (30-day free vs. advanced exports on Business) | Understand bot/strategy performance | Real closed-trade data (no synthetic demo data) | Low-Medium | Medium | Medium | High | Current |
| Strategy Builder (no-code visual editor) | Drag-and-drop node graph to build custom strategies | Flagship differentiator ("Figma for trading strategies") — but **not yet shipped** | Build custom logic without coding | — | High (if shipped) | High (if shipped) | Medium | Medium | **Deferred** (spec locked, build not started per roadmap Track B) |
| Broker Directory / Broker Connect | 20 broker integrations + paper trading, via MT4/MT5 | Reduces onboarding friction across broker ecosystem | Lets users keep their existing broker | MetaAPI | High (each broker page = long-tail SEO surface) | High | High ("Profytron never holds funds") | Medium | Current |
| Wallet & Billing | Manage funds, view billing/renewals, export statements | Payment operations | Transparency into charges/renewals | Razorpay/Stripe — **payment gateway flagged as not fully live in production yet** | Low | Critical (blocking if broken) | High | High | Current, with **live payment integration deferred** |
| KYC / Identity Verification | Identity verification for withdrawals >₹10k/day and marketplace listing | Regulatory/compliance requirement | Enables withdrawals and creator status | Aadhaar/PAN/Passport verification pipeline | None | Medium (blocks monetization actions) | Critical | Low | Current |
| Affiliate Program | 30% lifetime recurring referral commission | Low-CAC growth channel | Passive income for referrers | Attribution/tracking | Medium (own landing/FAQ content opportunity) | Medium | Low | Medium | Current |
| Leaderboard | Rankings of top traders/strategies | Social proof, gamification, engagement/retention | Discover top performers | Real trade data | Low | Medium (feeds marketplace trust) | Medium | Medium | Current |
| Journal | Auto-generated trading journal from trade history | Retention/stickiness | Reflective learning tool | Trade history | Low | Low | Low | Low | Current |
| Community (Discord) | Community engagement channel | Brand/retention | Peer support, roadmap input | — | Low | Low | Low | Medium | **Coming Soon** (waitlist only, not live) |
| Careers | Recruiting | Talent pipeline | — | — | Low | None | Low | Low | **Coming Soon** (no real listings, email waitlist only) |
| Press Kit | Media/press resources | Brand/PR | — | — | Low | None | Low | Low | **Not built** (redirects to homepage) |
| API Access (REST) | Programmatic access to positions/orders/strategies/signals | Enables power users, integrations | Build custom tooling on top of Profytron | JWT auth (RS256), scoped tokens | Medium (developer-intent SEO) | Low-Medium | Medium | Medium | Current (rate-limit tier naming inconsistent with pricing tiers — needs cleanup, see business-model.md) |

## Explicit non-goals (from `PRODUCT_ROADMAP.md`)
- Autonomous strategy-building agents
- Unrestricted tool-calling agents
- Broad General Availability launch without adoption/safety gates

These should never be implied as current or near-term capabilities in SEO/content copy.

## Hidden/internal-only functionality (do not expose publicly)
- Admin routes (`/admin`) — internal only, no public SEO surface.
- Internal rate-limit tier labels ("Developer Node," "Alpha Desk," "Institution") used in API Reference copy — these are inconsistent with real pricing tier names and should not be treated as an official naming scheme in new content.
