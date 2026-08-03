# Master Dependency Map

```text
Web (Next) ──► API (Nest) ──► Postgres (Prisma)
                 │                │
                 ├► Redis (auth sessions, throttle, Bull)
                 ├► Stripe / Razorpay (webhooks)
                 ├► MetaAPI (live trading)
                 ├► services/ai (optional coach assist)
                 └► services/backtest (optional synthetic)

Deploy truth (prod): GCP Cloud Run (web, api, ai, backtest)
Auth/UI support: Supabase (web), Neon optional for serverless paths
Observability: Sentry, PostHog, Datadog/OTEL hooks, /metrics
```

## Blocker graph (launch)

| Dependency | Blocks | Owner type |
|------------|--------|------------|
| Redis shared store | Multi-replica auth + throttle | Infra |
| DB migrate `trade_signalId` | Trade concurrency uniqueness | Eng |
| Stripe/Razorpay live webhook URLs | Operationally Proven (payments) | Ops |
| k6 env + API token | Performance gate | Eng/Ops |
| Secret manager AES_MASTER_KEY | 2FA seal + broker crypto | Ops |
| PostHog production DSN | Activation evidence | Eng |
| Beta cohort | Release Ready | Product |

Human blockers >30m → Standup + Risk Register.
