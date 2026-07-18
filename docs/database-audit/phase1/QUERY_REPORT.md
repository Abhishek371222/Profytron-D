# QUERY_REPORT — Phase 1

## Ranking method

1. **Prisma wall time** (client → Neon RTT inclusive) — primary UX impact today  
2. **EXPLAIN ANALYZE Execution Time** — true SQL cost on database  
3. **Chatty patterns** (N+1) — multiplies RTT

## Prisma wall timings (this run)

| Operation | ms | ok | result |
|-----------|---:|:--:|--------|
| prisma_count_users | 640.8 | true | 7 |
| prisma_count_trades | 622.5 | true | 151 |
| prisma_open_trades_join | 660.3 | true | 0 |
| prisma_portfolio_style_trades | 1598.3 | true | 24 |
| prisma_n1_broker_per_user | 3179.3 | true | {"users":7,"accounts":4} |

## EXPLAIN ANALYZE (this run)

| SQL (truncated) | Plan | Exec ms | Actual rows |
|----------------|------|--------:|------------:|
| `SELECT id FROM "Trade" WHERE "userId" IS NOT NULL AND status = 'CLOSED` | Limit | 0.123 | 151 |
| `SELECT COUNT(*) FROM "Trade"` | Aggregate | 0.065 | 1 |
| `SELECT * FROM "BrokerAccount" LIMIT 20` | Limit | 0.031 | 4 |
| `SELECT * FROM "EquitySnapshot" ORDER BY "capturedAt" DESC LIMIT 100` | Limit | 0.214 | 100 |
| `SELECT status, COUNT(*), COALESCE(SUM(profit),0) FROM "Trade" GROUP BY` | Aggregate | 0.102 | 1 |
| `SELECT * FROM "Trade" WHERE status = 'OPEN' LIMIT 50` | Limit | 0.057 | 0 |

## Impact ranking

| Rank | Finding | Impact | Evidence |
|-----:|---------|--------|----------|
| 1 | Network RTT / cold pooler dwarfs SQL | Critical at product UX | Prisma ms ≫ EXPLAIN ms |
| 2 | N+1 sequential finds | High on admin/list paths | `prisma_n1_*` |
| 3 | Multi-query dashboards | High | portfolio + includes |
| 4 | Large scans / sorts | Low today | EXPLAIN Limit/Index ops healthy |
| 5 | Hash join / temp tables | Not observed as bottleneck | live plans |

## N+1

Simulated per-user `brokerAccount.findMany` loops amplify RTT. Prefer:

```ts
prisma.brokerAccount.findMany({ where: { userId: { in: userIds } } })
```

## Temporary tables / sorts / hash joins

Not dominant in captured plans at current volume. Capture raw `live-audit.json → explains` for buffer hit vs read when scaling.

Cross-ref: platform audit `docs/audit/data/db/*` and `docs/audit/steps/07-database.md`.
