# Step 7 — Database Audit

**Evidence:** `docs/audit/data/db/query-timings.json`, `docs/audit/data/db/explain-analyze.json`, `schema.prisma`

## Critical insight

| Measurement | Result |
|-------------|--------|
| Prisma client wall time `portfolio_style_trades` | **5477 ms** |
| Same pattern `EXPLAIN ANALYZE` Execution Time | **0.115 ms** |
| `COUNT(*)` Prisma | 523 ms |
| `COUNT(*)` EXPLAIN | **0.056 ms** |

**Almost all “slow query” time from the API host is Neon network RTT + pooler/connect overhead, not SQL execution.** Query plans are healthy for current data volume (151 trades, 4 accounts).

## Ranked Prisma wall times (local → Neon us-east-1)

| Operation | Wall ms | Rows |
|-----------|---------|------|
| portfolio_style_trades (closed, take 200) | 5477 | 103 |
| count_users | 3093 | 6 |
| n1_sim_broker_per_user (6 sequential finds) | 2956 | 4 |
| marketplace_listings + strategy include | 2017 | 1 |
| closed_trades_agg groupBy | 1413 | — |
| broker_accounts_by_user | 1033 | 2 |
| equity_snapshots_recent | 768 | 100 |
| open_trades_join | 540 | 0 |
| count_trades | 523 | 151 |

## Indexes (schema review)

Present on hot paths: `Trade[userId,status]`, `Trade[brokerAccountId,brokerTicket]` unique, `EquitySnapshot[brokerAccountId,capturedAt]`, marketplace featured flags, wallet `[userId,createdAt]`. Adequate for current scale.

## N+1

Simulated per-user broker fetch: **6 sequential queries ≈ 3s wall**. Prefer `findMany({ where: { userId: { in: [...] }}})`.

## Connection pooling

External Neon `-pooler` URL; no Prisma Accelerate. Cold connections amplify first-request latency (matches analytics cold spikes).

## Recommendations (Phase 2)

1. Co-locate API with DB region (or read replicas closer to users).
2. Dashboard batch query / single round-trip.
3. Keep Redis warm for portfolio/risk (already effective when hit).
4. Avoid N+1 in admin/list endpoints.
5. Re-run EXPLAIN when trade table grows past 100k rows — current plans not predictive of scale.
