# Step 6 — API Audit

**Evidence:** `docs/audit/data/api/*.json`, health controller source

## Cross-cutting

| Concern | Finding |
|---------|---------|
| Compression | `compression` enabled (1KB threshold); many small JSON bodies uncompressed |
| Envelope | `{ success, data, timestamp }` via TransformInterceptor |
| Auth | Global JwtAuthGuard; 401 ~1–10ms |
| Throttle | 100/min anon, 1000/min auth |
| Queue health | `queue: degraded` during audit |
| **/health latency** | **~1500–1630 ms stable** — Redis/queue probe uses **1500ms timeout**; degraded queue path blocks health on timeout |

## Public / unauthenticated (p50)

| Endpoint | p50 ms | Bytes |
|----------|--------|-------|
| `/v1/market/quotes?...` | 3.7 | 453 |
| `/v1/marketplace/listings` | ~3.5 | 187 |
| `/v1/leaderboard` | ~1–4 | 154 |
| `/health` | **1505** | 231 |

## Authenticated (demo JWT, 3 samples)

| Endpoint | min / p50 / max (ms) | Bytes |
|----------|----------------------|-------|
| `/v1/notifications` | 493 / **988** / 988 | 542 |
| `/v1/trading/trades/open` | 217 / **674** / 798 | 65 |
| `/v1/broker/accounts` | 519 / **520** / 751 | 65 |
| `/v1/coach/conversations` | 228 / **454** / 685 | 65 |
| `/v1/users/me` | 224 / **320** / 512 | 741 |
| `/v1/trading/trades/history?limit=50` | 218 / **308** / 465 | 92 |
| `/v1/wallet/balance` | 221 / **229** / 239 | 134 |
| `/v1/analytics/portfolio?range=1m` | 2.6 / **9.8** / **1351** | 307 |
| `/v1/analytics/risk` | 1.7 / 2.8 / **2298** | 212 |
| `/v1/risk/score` | 1.9 / 2.6 / **543** | 88 |

## Waterfalls / duplicates

Dashboard fires **5+ parallel queries** after sessionReady — good parallelism, but each pays Neon RTT. Portfolio/risk show **cold-cache cliffs** (seconds) then sub-10ms.

## Batching / parallelization candidates (Phase 2)

1. **Dashboard bootstrap batch** endpoint returning portfolio + open trades + risk + account snapshot in one round-trip.
2. Fix health probe so degraded Redis/Bull does not wait full 1500ms.
3. Ensure gzip for payloads >1KB on analytics exports.
4. Align Next Route Handler paths with Nest to avoid double hops where both exist.

## Controllers

33 controller files; routes documented in Swagger `/api/docs-json` (non-prod).
