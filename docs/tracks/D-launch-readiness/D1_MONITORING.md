# D1.2 — Monitoring

Observe production without guessing. Document **where each signal comes from**.

| Signal | Source | Where to look |
| --- | --- | --- |
| API latency / error rate / throughput | Host metrics + Sentry performance (if enabled) | Render/Cloud Run metrics · Sentry |
| HTTP 5xx | Load balancer / host · Sentry | Host dashboard · Sentry Issues |
| App exceptions | `@sentry/nestjs` (`apps/api/src/instrument.ts`) | Sentry project (API) |
| Web errors | `@sentry/nextjs` | Sentry project (Web) |
| Health status | `/health` polling | Uptime robot / host health check |
| Queue depth / worker failures | Bull + host logs | API logs · Redis · `trade_execution` queue |
| DB connectivity | `/health.database` + Neon | Neon console · `/health` |
| Redis availability | `/health.redis` + Upstash/Redis host | Provider console · `/health` |
| Memory / CPU / Disk | Host platform | Render / Cloud Run / VM |
| Deployment version | `/` status `gitSha` · `/health.gitSha` | API root + health |
| MetaAPI sync health | App sync health maps / Connected Accounts UI | Product UI · API logs (degrade, don’t page on every blip) |

## Minimum dashboards (operator to create if missing)

1. **API** — request rate, p95 latency, 5xx rate, instance count  
2. **Dependencies** — `/health` history (DB/Redis/queue)  
3. **Errors** — Sentry unresolved issues (API + Web)  
4. **Data** — Neon connections / storage / PITR window  

## Gaps to close in host consoles (not code)

- [ ] Confirm Sentry DSN set in prod for API + Web  
- [ ] Confirm uptime check hits `/health` every 1–5 min  
- [ ] Confirm Neon metrics visible to on-call
