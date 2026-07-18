# Step 5 — MT5 & MetaApi Audit

**Evidence:** `docs/audit/data/api/metaapi-latency.json`, `docs/audit/data/api/auth-endpoint-timings-final.json`, `metatrader.adapter.ts`, poller services

## Actual data path (not webhook)

```
MetaApi REST (london)
  ↑ poll / on-demand
Nest pollers + metatrader.adapter (30s equity memory cache)
  ↓
Prisma (BrokerAccount lastKnown*, EquitySnapshot, Trade)
  ↓
Redis (mastersync snapshots 24h, analytics keys, locks)
  ↓
Nest /v1 API (+ optional Next Route Handler)
  ↓
Axios + TanStack Query (60s poll) + socket invalidation
  ↓
Overview cards / charts (+ framer-motion)
```

**Missing stage vs ideal diagram:** MetaApi webhooks — **not implemented**. Comments in `master-sync.service.ts` note streaming as future.

## Measured MetaApi latency (from this machine → london)

| Operation | Account | Samples (ms) | Notes |
|-----------|---------|--------------|-------|
| list accounts | — | 896 | provisioning API |
| account_information | c95040d9… | 1780 / 715 / 689 | cold then warm |
| positions | c95040d9… | 692 / 628 / 661 | empty `[]` (2 bytes) |
| account_information | 789f8612… | 744 / 568 / 737 | |
| positions | 789f8612… | 719 / 633 / 1453 | |

**Conclusion:** A live equity refresh that misses the 30s in-memory cache costs **~0.7–1.8s MetaApi alone**, before Nest/DB/serialization/frontend.

## Backend stage costs (demo user, no linked broker on audit account)

| Stage | p50 / notes |
|-------|-------------|
| `/v1/broker/accounts` | ~520 ms (Neon RTT dominates; empty list for demo) |
| `/v1/analytics/portfolio` | cold up to 1351 ms; warm **~10 ms** (Redis) |
| `/v1/trading/trades/open` | ~674 ms |
| Adapter equity TTL | 30_000 ms cache hit → near-zero MetaApi |
| Frontend poll | LIVE_POLL_MS = 60_000 |
| Socket invalidate debounce | 400 ms |

## Why refresh feels delayed

1. **60s React Query refetch** for live widgets.
2. **30s server equity cache** can serve stale balance/equity.
3. **Pollers** (3–60s) are the source of truth updates, not push-from-broker.
4. **MetaApi RTT ~700–1800ms** when cache misses.
5. **Neon RTT** from local client ~200–500ms+ per Prisma round-trip (EXPLAIN shows SQL itself <1ms).
6. Card UI may wait on multiple queries settling (broker + portfolio + open trades).

## Timing diagram (measured arrows)

See `docs/audit/diagrams/mt5-sync-sequence.md`.
