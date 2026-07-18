# PERFORMANCE_COMPARISON — API Phase 2

**Sources:** Phase 1 `data/latency.json` / `payloads.json` vs Phase 2 `data/after-latency.json`

## Targeted latency (ms)

| Endpoint | Before p50 | After p50 | After warm p50 | Δ |
|----------|----------:|----------:|---------------:|--:|
| `GET /v1/subscriptions/plans` | 359.9 | 3.2 | 3.2 | **~99%** |
| `GET /v1/copy/masters` | 310.5 | 2.1 | 2.6 | **~99%** |
| `GET /health` | 304.1 | 1.9 | 1.9 | **~99%** (cache; may be 503 if DB degraded) |
| `GET /v1/market/news` | 3.0 | 3.6 | 3.6 | flat warm; cold miss single-flight |
| News payload bytes | 36527 | 35447 | — | ~3% (summary/logo trim) |

Cold first-sample still pays Neon/upstream RTT (e.g. plans max 961 ms once); warm path meets `API_BUDGETS.md`.

## Other metrics

| Metric | Notes |
|--------|-------|
| Validation | Unchanged pipe behavior |
| Serialization | Skip double-envelope wrap |
| Query count | Plans/masters warm: **0** Prisma |
| WS | Skip identical price rebroadcast |
| Dependencies | No new cycles |

## Re-run

```bash
pnpm api-audit:phase2:after
pnpm api-audit:all
```
