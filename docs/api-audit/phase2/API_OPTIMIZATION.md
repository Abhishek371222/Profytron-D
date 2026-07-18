# API_OPTIMIZATION — Phase 2

**Evidence:** Phase 1 `LATENCY_REPORT.md`, `PRIORITY_MATRIX.md` (`API-P1-N1-CHATTY`), `PHASE2_INPUTS.md` #1

## Targeted endpoints

| Endpoint | Before p50 (Phase 1) | Optimization | After (see `data/after-latency.json`) |
|----------|---------------------:|--------------|----------------------------------------|
| `GET /v1/subscriptions/plans` | 359.9 ms | Redis cache TTL 120s (`api:cache:subscription-plans:v1`) | warm hit expected ≪ cold |
| `GET /v1/copy/masters` | 310.5 ms | In-process cache 30s; invalidate on upsert/backfill | warm hit expected ≪ cold |
| `GET /health` | 304.1 ms | 2s in-process health snapshot cache | warm samples near-instant |
| `GET /v1/market/news` | 3 ms p50 / 36KB | Single-flight `redis.cached` + summary cap | payload ↓; stampede-safe |

## Explicitly untouched

Auth login/register, trading execution, Sync Engine, WebSocket event names/payload schemas.

## Files

- [`payments.service.ts`](../../apps/api/src/modules/payments/payments.service.ts) — plans cache
- [`copy.service.ts`](../../apps/api/src/modules/copy/copy.service.ts) — masters cache
- [`app.controller.ts`](../../apps/api/src/app.controller.ts) — health cache
