# TRANSACTION_REPORT — Phase 1

## Isolation

| Setting | Value |
|---------|-------|
| Live `transaction_isolation` | read committed |
| App default expectation | Read Committed (Postgres default) |

## pg_settings (subset)

| Name | Setting | Unit |
|------|---------|------|
| default_transaction_isolation | read committed |  |
| effective_cache_size | 104832 | 8kB |
| idle_in_transaction_session_timeout | 300000 | ms |
| lock_timeout | 0 | ms |
| maintenance_work_mem | 65536 | kB |
| max_connections | 112 |  |
| random_page_cost | 4 |  |
| shared_buffers | 16384 | 8kB |
| statement_timeout | 0 | ms |
| work_mem | 4096 | kB |

## Activity snapshot (non-self)

| PID | State | Wait | Query (truncate) |
|-----|-------|------|------------------|
| — | — | — | — |

## Deadlocks / lock contention

Phase 1 captured a **point-in-time** `pg_stat_activity` snapshot only. No deadlock log scrape configured in-repo. Neon console / Postgres logs are source of truth for historical deadlocks.

## Retry behavior (application)

- Bull queues + MetaAPI sync paths implement app-level retries (code), not DB SERIALIZABLE retries.
- Prisma transactions: used selectively in billing/wallet/auth modules — no Phase 1 code changes.

## Long-running transactions

Review activity `xact_age` in `live-audit.json` if present. Flag any idle-in-transaction for Phase 2.
