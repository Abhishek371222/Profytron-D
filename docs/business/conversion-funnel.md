# Profytron — Conversion Funnel

See [business-model.md](business-model.md) and [personas.md](personas.md) for underlying context.

## Funnel stages and page mapping

| Stage | Pages | Purpose |
|---|---|---|
| **Awareness** | Homepage (`/`), `/blog` (3 posts: backtesting bias, LLM signal pipelines, colocation), Guides category pages | Bring in organic search traffic around algo-trading topics |
| **Education** | `/guides`, `/docs`, `/help`, individual blog posts | Build understanding of algo trading, risk, AI signals; establish credibility |
| **Feature evaluation** | Homepage feature sections (bots, Alpha Coach, copy trading, analytics), `/brokers/[slug]` pages, `/api-reference` | Let evaluators confirm Profytron supports their broker/use case |
| **Pricing** | `/pricing` | Compare plans, primary commercial-intent conversion page |
| **Signup** | `/signup` → `/register`, `/onboarding`, `/onboarding/risk` | Account creation + risk-profile onboarding before dashboard access |
| **Activation (Dashboard)** | `(dashboard)/dashboard`, `/get-bots`, `/bots`, `/connected-accounts` | First bot deployed / first broker connected — the core activation event |
| **Onboarding depth** | `/settings/kyc`, `/connected-accounts`, `/strategies` | Required steps to unlock withdrawals, live trading, marketplace participation |
| **Retention** | `/analytics`, `/journal`, `/leaderboard`, `/alpha-coach`, `/history` | Ongoing engagement loops that justify continued subscription |
| **Expansion/monetization** | `/pricing` (upgrade), `/marketplace` (subscribe to strategies), `/creator` (publish strategies), `/affiliate` (refer others) | Additional revenue paths beyond base subscription |
| **Support** | `/help`, `/contact`, `/docs`, `settings/support` | Reduce churn from friction/confusion |

## Primary funnel (self-serve subscriber)

```
Organic search / blog → Homepage → Pricing → Signup/Register → Onboarding (risk profile)
  → Connect broker account → KYC (if withdrawal/marketplace needed)
  → Deploy first bot (paper or live) → Dashboard analytics (retention)
  → Upgrade tier (Starter → Pro → Business) as bot/broker-account limits are hit
```

## Secondary funnel (marketplace supply side — creators)

```
Existing trader with track record → Creator dashboard → Add Bot (submit strategy)
  → 60-day live verification period → "Verified" badge → Marketplace listing
  → Subscriber revenue (80% share, weekly payout) → KYC required for payout
```

## Tertiary funnel (enterprise/white-label)

```
Institutional visitor → Pricing (Enterprise, "Contact Engineering") or About page
  → /contact (Enterprise & Sales channel) → Sales-assisted, not self-serve
```

## Quaternary funnel (affiliate)

```
Existing user or external promoter → Affiliate dashboard (gated, no public marketing page found)
  → Referral link shared → New user signs up → 30% recurring commission (lifetime)
```

## Funnel gaps observed
- No standalone public marketing page exists for the Affiliate Program (it's dashboard-gated); the only public mention is in the FAQ. This is a missed top-of-funnel opportunity for a page like `/affiliate` or `/partners`.
- No standalone public `/marketplace` or `/strategies` marketing page for logged-out visitors was found among the public routes explored — the marketplace/strategies routes live under the authenticated `(dashboard)` group, meaning prospective creators/subscribers can't evaluate the marketplace before signing up. This is a funnel friction point worth flagging (not fixing here — see content-gaps note in search-intent.md).
- Press page redirects to homepage with no actual press kit — reduces credibility for journalists/partners doing due diligence during the Enterprise evaluation stage.
