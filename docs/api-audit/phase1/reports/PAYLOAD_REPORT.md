# PAYLOAD_REPORT — API Audit Phase 1

Responses use `TransformInterceptor` envelope: `{ success, data, timestamp }` (adds wrapping overhead).

## Largest responses

| Path | Bytes | Depth | Encoding | Null ratio | Top keys |
|------|------:|------:|----------|------------|----------|
| `/v1/market/news` | 36527 | 3 | — | 0 | category, count, items, source, serverTime |
| `/v1/market/ohlc` | 24969 | 3 | — | 0 | symbol, timeframe, limit, candles, source, serverTime |
| `/v1/market/economic-calendar` | 2814 | 3 | — | 0.217 | from, to, count, events, source, serverTime |
| `/v1/marketplace` | 1985 | 8 | — | 0.143 | items, nextCursor, count, total |
| `/v1/marketplace/featured` | 1840 | 7 | — | 0.134 | Array(1) |
| `/v1/subscriptions/plans` | 1626 | 3 | — | 0 | Array(4) |
| `/v1/leaderboard/monthly` | 1452 | 4 | — | 0.075 | period, entries |
| `/v1/leaderboard/alltime` | 1436 | 4 | — | 0.075 | period, entries |
| `/v1/strategies` | 1265 | 6 | — | 0.022 | strategies, total, page, limit |
| `/v1/market/quotes` | 453 | 2 | — | 0 | Array(3) |
| `/v1/leaderboard/strategies` | 438 | 3 | — | 0.111 | Array(1) |
| `/v1` | 265 | 1 | — | 0.111 | status, version, prefix, executionMode, copyFactoryEnabled, allowMetaApiSubscribers |
| `/health` | 232 | 1 | — | 0 | status, database, redis, queue, websocket, uptime |
| `/v1/market/quote` | 192 | 1 | — | 0 | symbol, price, change24hPct, timestamp, source |
| `/v1/copy/masters` | 65 | 1 | — | — | Array(0) |
| `/v1/auth/github` | 0 | 0 | — | — |  |
| `/v1/auth/github/callback` | 0 | 0 | — | — |  |
| `/v1/auth/google` | 0 | 0 | — | — |  |
| `/v1/auth/google/callback` | 0 | 0 | — | — |  |
