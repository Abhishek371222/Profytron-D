# D1.3 — Alerting

Every alert must answer: **What?** · **Why it matters?** · **Who owns?** · **First response?** · **Which runbook?**

## Alert catalog

| Alert | Severity | Trigger (suggested) | Owner | First response | Runbook |
| --- | --- | --- | --- | --- | --- |
| API unhealthy | SEV1 | `/health` or `/ready` → 503 for >2 min | On-call eng | Check DB/Neon; scale/restart API | [`runbooks/API_UNAVAILABLE.md`](./runbooks/API_UNAVAILABLE.md) |
| Elevated 5xx | SEV1 | 5xx rate > 2% for 5 min | On-call eng | Sentry + recent deploy | [`runbooks/ELEVATED_ERRORS.md`](./runbooks/ELEVATED_ERRORS.md) |
| DB unavailable | SEV1 | Neon down / health database unavailable | On-call eng | Neon status; failover/PITR if needed | [`runbooks/DATABASE_UNAVAILABLE.md`](./runbooks/DATABASE_UNAVAILABLE.md) |
| Redis unavailable | SEV2 | `/health.redis` degraded >10 min | On-call eng | Provider status; expect session/cache impact | [`runbooks/REDIS_UNAVAILABLE.md`](./runbooks/REDIS_UNAVAILABLE.md) |
| Queue backlog / degraded | SEV2 | Queue degraded or depth growing | On-call eng | Workers/Redis; redrive jobs | [`runbooks/QUEUE_BACKLOG.md`](./runbooks/QUEUE_BACKLOG.md) |
| MetaAPI degraded | SEV2 | Sync failures consecutive / product banner | Trading eng | MetaAPI status; do not restart blindly | [`runbooks/METAAPI_DEGRADED.md`](./runbooks/METAAPI_DEGRADED.md) |
| Payments provider down | SEV2 | Stripe/Razorpay webhook or checkout failures spike | On-call + biz | Provider status; pause marketing checkout CTAs | [`runbooks/PAYMENTS_UNAVAILABLE.md`](./runbooks/PAYMENTS_UNAVAILABLE.md) |
| Email provider down | SEV2 | OTP/verify bounce or provider outage | On-call eng | Provider status; manual verify path if any | [`runbooks/EMAIL_UNAVAILABLE.md`](./runbooks/EMAIL_UNAVAILABLE.md) |
| Failed deployment | SEV1 | Deploy health check fail / rollback | On-call eng | Rollback previous release | [`runbooks/FAILED_DEPLOYMENT.md`](./runbooks/FAILED_DEPLOYMENT.md) |

## Do not alert on

- Single MetaAPI blip under 2 minutes  
- Client 4xx spikes from bots scraping  
- `metaApi: not_configured` on non-trading environments  

## Severity definitions

| SEV | Meaning |
| --- | --- |
| SEV1 | User-facing outage or data risk — page immediately |
| SEV2 | Degraded capability — business hours or follow-the-sun |
| SEV3 | Informational — ticket, no page |
