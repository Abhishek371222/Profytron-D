# CACHE_GOVERNANCE — Phase 2

Every hot path has **exactly one** ownership strategy.

| Endpoint / key | Strategy | Owner | TTL |
|----------------|----------|-------|-----|
| `api:cache:subscription-plans:v1` | Redis | `PaymentsService.getSubscriptionPlans` | 120s |
| Public masters list | Runtime (process memory) | `CopyTradingService.listPublicMasters` | 30s |
| `/health` snapshot | Runtime | `AppController.getHealth` | 2s |
| `market:news:*` | Redis single-flight | `MarketService.getMarketNews` | 120s |
| `market:quote:*` / OHLC | Redis | `MarketService` (pre-existing) | 30s–5m |
| Auth OTP / sessions | Redis | `AuthService` / `RedisService` | minutes–hours |
| Sync watermarks | Redis | `SyncStateService` | 24h |

## Rules

1. Do not add a second cache for the same logical resource.
2. Invalidate (or short TTL) on writes that change public reads.
3. Prefer `RedisService.cached()` for stampede-prone upstream/IO keys.
4. Runtime caches must be process-local only (not a substitute for Redis shared state across replicas unless documented).
