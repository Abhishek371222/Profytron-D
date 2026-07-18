# CACHE_USAGE_REPORT — API Audit Phase 1

No Nest `CacheModule`. Redis cache-aside + Bull queues.

## Code ownership (TTL / EX)

### `apps/api/src/modules/ai/ai.service.ts`
- TTL consts: TTL_AI_RESPONSE=5s, TTL_COACHING_REPORT=2s
- EX seconds: —

### `apps/api/src/modules/ai-risk/ai-risk.service.ts`
- TTL consts: TTL_RISK_SCORE=2s, TTL_RISK_METRICS=2s
- EX seconds: —

### `apps/api/src/modules/analytics/analytics.service.ts`
- TTL consts: TTL_ANALYTICS=2s, TTL_LEADERBOARD=60s, TTL_MACRO=60s
- EX seconds: —

### `apps/api/src/modules/leaderboard/leaderboard.service.ts`
- TTL consts: —
- EX seconds: —

### `apps/api/src/modules/market/market.service.ts`
- TTL consts: TTL_QUOTE=30s, TTL_OHLC_SHORT=30s, TTL_OHLC_LONG=5s
- EX seconds: —

### `apps/api/src/modules/marketplace/marketplace.service.ts`
- TTL consts: —
- EX seconds: —

### `apps/api/src/modules/payments/payments.service.ts`
- TTL consts: —
- EX seconds: 3600, 86400, 86400, 86400

### `apps/api/src/modules/sync/sync-state.service.ts`
- TTL consts: TTL_SEC=60s
- EX seconds: —

### `apps/api/src/modules/wallet/wallet.service.ts`
- TTL consts: —
- EX seconds: 600

## Themes

| Area | Typical TTL |
|------|-------------|
| Auth OTP / magic | minutes–hours |
| Market quotes | 30s–5m |
| AI responses | 2–5m |
| Sync watermarks | 24h |
| Payment idempotency | 24h |

Hit ratio: **not measured** without Redis INFO sampling in this phase (document ownership only).
