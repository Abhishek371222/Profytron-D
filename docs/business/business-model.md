# Profytron — Business Model

Generated from repository evidence per `docs/operating-system/02-business-intelligence.md`. This is permanent project knowledge — later SEO/content/metadata work should reference this file instead of re-deriving it.

## Identity

- **Legal entity:** Profytron Technologies Pvt. Ltd. (India, Companies Act 2013), registered office Bengaluru, Karnataka. Remote-first team.
- **Brand tagline:** "India's algorithmic trading platform" (`lib/seo/constants.ts`)
- **Domain:** profytron.com (API at api.profytron.com)
- **Stage:** Pre-launch / closed beta (per `PROJECT_STATUS.md`, `PRODUCT_ROADMAP.md`, `V1_LAUNCH_CRITERIA.md` — invite list of 20–50 users). Several core paths (live email OTP, live MetaAPI broker connection, live Razorpay/Stripe payments, production email delivery) are flagged as not-yet-fully-live in production as of the latest docs.

## Mission / positioning

Stated homepage thesis: stop trading "Manually / Emotionally / Blindly / Slowly." Profytron's pitch is that it closes the infrastructure gap between retail traders and institutional trading desks: *"The gap between retail trading and institutional execution is not talent — it is infrastructure. We close that gap."* (About page)

**Caution for future content work:** the About page and two of the three blog posts lean heavily on institutional-infrastructure language (NY4/LD4 colocation, FPGA execution, "military-grade infrastructure," sub-millisecond claims) that is only actually sold under the custom-priced Enterprise tier — no lower tier includes it. There is also one homepage testimonial (Dr. Alex Volkov / "Omega Desk") with no visible sourcing, and rate-limit tier names on the API Reference page ("Developer Node," "Alpha Desk," "Institution") don't match the real pricing tiers (Free/Starter/Pro/Business/Enterprise). Treat these as **aspirational/placeholder copy, not verified claims** — do not launder them into new SEO content as if they were confirmed facts, and flag them as a trust-signal risk (see Content Gaps).

## Core product

A SaaS platform for **automated trading bots**, explicitly not a broker or fund manager: *"Profytron never holds your funds... Our platform is a SaaS tool, not a broker or fund manager."* (FAQ) It connects to a user's own broker account (via MetaAPI, to MT4/MT5) and executes strategies on the user's behalf.

Four pillars, per the homepage Features section:
1. **Automated trading bots** — deploy strategies with risk controls, paper or live MT5.
2. **Alpha Coach** — AI trade-review/coaching assistant.
3. **Copy trading** — follow other users' strategies with transparent, broker-verified performance.
4. **Portfolio analytics** — equity, risk, and trade history in one view.

## Supporting products

- **Strategy Builder** — visual, no-code, drag-and-drop node graph for building strategies (indicators, conditions, actions). Per the roadmap this is spec-locked but build is **deferred**, not yet shipped as the "Figma for trading strategies" vision.
- **Marketplace** — bot/strategy creators list strategies; subscribers copy them.
- **Creator tools** — dashboard for publishing bots/strategies to the marketplace.
- **Affiliate program** — referral commissions.
- **Broker directory** — 20 integrated brokers + paper trading, all via MT4/MT5.
- **AI Risk Engine** — real-time drawdown/volatility monitoring that can auto-stop copy trading.
- **Wallet/KYC** — funds management and identity verification (India-specific: Aadhaar/PAN/Passport).

## Revenue model

**Primary: subscription tiers** (INR, monthly or annual with ~17% discount), 7-day free trial on paid plans:

| Plan | Price/mo | Positioning | Key limits |
|---|---|---|---|
| Free | ₹0 | Paper trading + marketplace exploration | 1 paper bot, 30-day analytics, 5 Alpha Coach sessions/mo |
| Starter | ₹799 | New traders starting live MT5 copy execution | 2 live bots, 1 broker account, 25 Alpha Coach sessions/mo |
| Pro | ₹999 (Most Popular) | Active traders building/deploying strategies | 4 live bots, unlimited strategy deployments, 3 broker accounts, unlimited Alpha Coach, AI risk mgmt |
| Business | ₹1,299 (shown as "Elite" on landing) | Power traders running multiple bots/portfolios | 6 live bots, 5 broker accounts, 1 VPS slot, advanced analytics |
| Enterprise | Custom | White-label / colocation / on-prem | NY4/LD4 colocation, dedicated solutions architect, white-label dashboard |

**Secondary: marketplace take-rate.** Strategy creators keep 80% of subscriber fees; Profytron retains a 20% platform fee. FAQ states top creators (50+ subscribers) can earn ₹50,000–₹5,00,000+/month.

**Tertiary: affiliate program.** 30% recurring commission for the referrer's lifetime of the referred account, tiered by referral volume (Starter/Pro/Elite affiliate tiers).

## Target markets

- **Country:** India (INR pricing, UPI/Razorpay/Net Banking payment rails, Indian legal framework — IT Act 2000, DPDP Act 2023, Consumer Protection E-Commerce Rules 2020, arbitration seated in Bengaluru). Stripe is used for international payments, suggesting a secondary international audience, but all public-facing pricing/legal copy is India-first.
- **Language:** English only (no i18n evidence found).
- **Search market:** India, English-language algorithmic/automated trading queries.

## Compliance posture

Explicitly **not SEBI-registered** as a broker, investment adviser, portfolio manager, or research analyst (Risk Disclosure page). Positions itself as an execution/automation SaaS layered on top of a user's own regulated broker account, not as a financial advisor. This is a critical constraint for all future content: copy must avoid language that could be read as investment advice or return guarantees.

## Competitor context

No competitors are named or referenced anywhere in the repository. Positioning is implicitly against "manual trading" and "institutional tools staying locked inside institutions," not against named platforms (e.g., no mention of 3Commas, Zerlia, MetaTrader marketplace competitors, etc. by name).
