# Phase 3.1 — Synchronization timing (pre-optimization)

Measured / documented **before** SyncEngine optimizations. Sources: Phase 1 MetaApi samples, Nest poller config, Phase 2 after-metrics.

## Poller intervals (configured)

| Poller | Tick (prod / dev) | Per-account min | Env |
|--------|-------------------|-----------------|-----|
| MasterSync | 3s / 15s | n/a | `MASTER_SYNC_INTERVAL_MS` |
| BotTradeSync | 8s / 30s | 12s | `BOT_TRADE_SYNC_TICK_MS`, `BOT_TRADE_SYNC_INTERVAL_MS` |
| CopyFactory PositionSync | 5s | 15s | `COPY_SYNC_MIN_INTERVAL_MS` |
| AccountHistorySync | 60s / 5m | equity snapshot ≥4m | `ACCOUNT_HISTORY_SYNC_INTERVAL_MS` |
| TrailingStop | 5s / 15s | n/a | `TRAILING_STOP_INTERVAL_MS` |

## MetaApi RTT (London, Phase 1)

| Op | Typical ms |
|----|------------|
| account_information | 689–1780 |
| positions | 628–1453 |
| Adapter equity memory hit | ~0 (TTL 30s) |

## Downstream stages (Phase 1/2)

| Stage | Typical |
|-------|---------|
| Prisma SQL | &lt;1ms |
| Neon RTT (local→us-east-1) | 200–500ms+ / round-trip |
| `/v1/broker/accounts` | ~520ms |
| `/v1/trading/trades/open` | ~674ms |
| `/v1/analytics/portfolio` cold / warm | ≤1351ms / ~10ms Redis |
| Frontend TanStack poll | 60_000ms |
| Socket invalidate debounce | 400ms |
| `/health` (post Phase 2) | ~0.45–0.67s |

## Sequence (p50-ish)

```mermaid
sequenceDiagram
  participant Poller as Nest_poller
  participant Meta as MetaApi_REST
  participant Redis as Redis_locks
  participant PG as Postgres
  participant API as Nest_HTTP
  participant WS as TradingGateway
  participant FE as Platform_RQ

  Note over Poller: interval 3s–60s by poller
  Poller->>Redis: leader lock
  Poller->>Meta: getPositions / account_information
  Note over Meta: 0.7–1.8s miss; equity TTL 30s hit
  Poller->>PG: upsert Trade / EquitySnapshot
  Poller->>WS: trade_* / account_equity
  FE->>API: GET open trades / portfolio (60s or invalidate)
  Note over FE: Phase 2 targeted invalidate; still refetch roots
```

## Frontend refresh path (Phase 2 baseline)

1. WS event → `invalidateForTradingEvent` (debounce 400ms) **or** `applyEquityPatch` (L2 + soft portfolio stale).
2. Equity still triggers active `broker-accounts` refetch.
3. Modules poll every 60s independently → duplicate GETs possible.

## Bottlenecks to address in 3.2+

1. No shared Redis watermark / syncVersion plane.
2. Full query-root invalidation instead of versioned deltas.
3. Client `refetchInterval` owns freshness instead of scheduler + WS.
4. AccountHistorySync can early-return without closing vanished opens.
5. Sync status is ad-hoc `live|degraded`, not a full FSM.

Raw MetaApi samples: [`docs/audit/phase3/before/metaapi-latency.json`](../before/metaapi-latency.json)  
Route baselines: [`docs/audit/phase3/before/route-summary.json`](../before/route-summary.json)
