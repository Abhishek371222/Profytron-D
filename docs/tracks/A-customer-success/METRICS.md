# Track A Metrics (A5)

## Product KPIs

| Metric | Definition |
| --- | --- |
| Account → first login | Signup cohort with `FIRST_LOGIN` |
| Onboarding completion rate | `ONBOARDING_COMPLETED` / signed-up |
| Broker connection rate | `BROKER_CONNECTED` / onboarded |
| First strategy activation rate | `FIRST_MARKETPLACE_SUB` (or deploy) / brokered |
| First AI Coach interaction rate | `FIRST_COACH_INTERACTION` / onboarded |
| Time to first successful trade | `FIRST_PAPER_TRADE` or `FIRST_REAL_TRADE` − signup |
| 7-day activation rate | Users with broker+trade (or Coach+strategy) within 7d |
| Step drop-off | Abandon / view per funnel step |

## Instrumentation

| Channel | Use |
| --- | --- |
| `UserActivationEvent` via `/growth/track` | Durable milestones (unique per user) |
| PostHog `trackEvent` | Funnel steps, retries, help clicks |
| Coach Insights `adoption_*` events | Step view/complete/abandon, retry, recovery success |

## Decision loop

Feed admin growth metrics + Coach Insights + Track A funnel into roadmap choices (same spirit as Coach Insights decision engine).
