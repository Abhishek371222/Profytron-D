# PERFORMANCE_COMPARISON — Phase 2

**Sources:** `data/before-*` vs `data/after-*`

## Prisma wall time (ms)

| Operation | Before | After | Notes |
|-----------|-------:|------:|-------|
| prisma_count_users | 640.8 | 582.0 | RTT variance |
| prisma_count_trades | 622.5 | 570.3 | RTT variance |
| prisma_open_trades_join | 660.3 | 597.3 | RTT variance |
| prisma_portfolio_style_trades | 1598.3 | 1206.8 | Improved (fewer cold spikes) |
| prisma_n1_broker_per_user | 3179.3 | 3257.7 | Sequential canary (unchanged pattern) |
| prisma_batched_broker_by_users | — | **877.9** | **New batched path (~3.7× vs sequential)** |

## SQL EXPLAIN execution

Remains sub-millisecond (see `after-explain-analyze.json`). No SQL plan regressions expected at current row counts.

## Indexes

| Metric | Before | After |
|--------|-------:|------:|
| FK leading-index gaps | 7 | **0** |
| Live tables | 80 | 84 (+4 archive) |
| Duplicate twin indexes | 14 | Reviewed; 14 non-unique twins dropped |

## Integrity

| Check | After |
|-------|-------|
| Orphans (suite) | 0 |
| Duplicate tickets | 0 |
| Restore integrity-only smoke | pass (`restore-drill.json`) |

## Storage

Snapshot hot tables unchanged until `--apply` lifecycle run (dry-run eligible=0 within 14d keep window). Archive tables ready (empty).

## Connection topology

| Item | Value |
|------|-------|
| Pooler host | `…-pooler…us-east-1…` |
| Connect wall (pooled) | ~3012 ms (cold) |
| DIRECT_URL | Currently same pooler host — **recommend non-pooler direct for migrations** |
| Guidance | `connection_limit=10&pool_timeout=10` on pooler URL (`.env.example`) |

## Query count impact (N+1)

| Path | Before | After |
|------|--------|-------|
| Harness broker fetch (10 users) | 1 + 10 finds | 1 + 1 batched find |
| Wallet pause updates | N updates | 1 updateMany |
| Copy master upserts | N sequential | 1 transaction batch |
