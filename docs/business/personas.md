# Profytron — User Personas

Derived from pricing tiers, feature copy, and dashboard routes in `apps/web`. See [business-model.md](business-model.md) for product/pricing context.

## 1. Beginner / Curious Trader ("Free tier")
- **Goals:** Try automated trading without risk or commitment; understand what a trading bot does before paying.
- **Pain points:** Distrust of automated tools; no capital to risk yet; unfamiliar with strategy concepts.
- **Experience level:** Low.
- **Search intent:** Informational ("what is algo trading," "how do trading bots work," "is automated trading safe").
- **Expected landing pages:** Homepage, `/guides`, `/blog`, `/docs`, About.
- **Expected conversion path:** Land on educational content → Free signup → paper trading → Starter upgrade once confident.

## 2. New Live Trader ("Starter tier")
- **Goals:** Move from manual to automated live execution with minimal risk exposure; run 1-2 bots on a single broker.
- **Pain points:** Emotional/inconsistent manual trading (directly named in homepage hero: "Manually / Emotionally / Blindly / Slowly"); limited capital; needs hand-holding.
- **Experience level:** Beginner-to-intermediate.
- **Search intent:** Commercial/transactional ("best trading bot for beginners," "MT5 automated trading India," "copy trading platform India").
- **Expected landing pages:** `/pricing`, broker-specific pages (`/brokers/[slug]`), `/docs` (broker connect guide), FAQ.
- **Expected conversion path:** Pricing page → 7-day trial signup → connect one broker → deploy first bot.

## 3. Active/Independent Trader ("Pro tier")
- **Goals:** Run multiple live bots and strategies across several broker accounts; use AI risk management to protect capital while scaling.
- **Pain points:** Manually monitoring multiple positions/accounts; lacks real-time risk controls; wants unlimited AI coaching.
- **Experience level:** Intermediate.
- **Search intent:** Commercial/comparison ("best algo trading platform," "AI risk management trading," "Profytron vs [alternative]").
- **Expected landing pages:** `/pricing` (Pro, "Most Popular"), Strategy Builder marketing copy, Alpha Coach feature page/section, Analytics.
- **Expected conversion path:** Feature/comparison content → Pricing → upgrade from Starter or direct signup.

## 4. Power Trader / Portfolio Manager ("Business tier")
- **Goals:** Run a portfolio of bots at scale (up to 6 live bots, 5 broker accounts), needs VPS reliability and advanced analytics/exports.
- **Pain points:** Needs infrastructure reliability (uptime, VPS) and exportable data for personal record-keeping or tax/compliance.
- **Experience level:** Advanced.
- **Search intent:** Commercial ("VPS trading bot hosting," "multi-broker trading dashboard").
- **Expected landing pages:** `/pricing` (Business/"Elite"), Analytics module pages.
- **Expected conversion path:** Direct upgrade from Pro, or acquired via advanced content (analytics/VPS-focused guides).

## 5. Institution / Prop Desk / White-Label Buyer ("Enterprise tier")
- **Goals:** Custom deployment — white-label client dashboard, colocation (NY4/LD4), on-premise, dedicated SLAs.
- **Pain points:** Needs compliance-grade infrastructure and a named point of contact, not self-serve signup.
- **Experience level:** Institutional/professional.
- **Search intent:** Navigational/sales ("Profytron enterprise," "white-label trading platform," "colocation trading India").
- **Expected landing pages:** `/pricing` (Enterprise), `/contact` (Enterprise & Sales channel), About (infrastructure claims — see credibility caveat in business-model.md).
- **Expected conversion path:** Contact/sales-assisted, not self-serve — CTA is "Contact Engineering" via mailto.

## 6. Strategy Creator / Signal Provider (Marketplace supply side)
- **Goals:** Publish a bot/strategy to the marketplace, build a subscriber base, earn recurring passive income (80% revenue share).
- **Pain points:** Needs to prove track record (marketplace "Verified" badge requires 60-day live track record) to earn subscriber trust.
- **Experience level:** Advanced/professional trader or quant.
- **Search intent:** Commercial/navigational ("sell trading strategy online," "how to become a signal provider," "algo trading marketplace India").
- **Expected landing pages:** `/marketplace`, Creator dashboard entry, FAQ (marketplace economics section).
- **Expected conversion path:** Land on creator-economics content → signup → Creator dashboard → submit bot for listing → verification period → earning.

## 7. Affiliate / Referrer
- **Goals:** Earn 30% recurring commission by referring new users.
- **Pain points:** Needs clear tracking/attribution and a compelling reason to promote.
- **Experience level:** Varies — can be a trader, influencer, or content creator, not necessarily a Profytron user themselves.
- **Search intent:** Navigational/commercial ("Profytron affiliate program," "trading platform referral program India").
- **Expected landing pages:** Affiliate program page (dashboard-gated — no public marketing page currently found for affiliates), FAQ (affiliate section).
- **Expected conversion path:** Referral content or word-of-mouth → signup → affiliate dashboard.

## Note on scope
No personas beyond the above are supported by repository evidence. Institutional categories often assumed for trading platforms (e.g., "researchers," "students," "investment groups" as a distinct persona from prop desks) are **not** independently evidenced in the copy — Enterprise/Institution language is used generically enough to cover them, so they are folded into persona 5 rather than invented as separate entries.
