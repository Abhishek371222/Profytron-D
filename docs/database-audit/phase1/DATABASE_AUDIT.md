# DATABASE_AUDIT — Phase 1 (Measure Only)

**Status:** Complete (evidence-first)  
**Generated:** 2026-07-18T19:31:03.107Z  
**Lock:** No trading/auth/API/frontend/schema behavior changes in this phase.

## Executive verdict

| Item | Result |
|------|--------|
| Prisma models | **80** |
| Enums | **42** |
| Declared relations | **113** |
| Schema `@@index` count | **167** |
| Migrations on disk | **41** |
| Live DB connected | **yes** |
| Live host | ep-orange-fog-adhqrkf4-pooler.c-2.us-east-1.aws.neon.tech |
| Isolation (live) | read committed |

Cross-ref: platform audit `docs/audit/data/db/*` and `docs/audit/steps/07-database.md`.

## Scope covered

1. Schema inventory from `apps/api/prisma/schema.prisma`
2. Live catalog (tables, columns, PK/FK/unique/check, indexes, sizes) when `DATABASE_URL`/`DIRECT_URL` available
3. EXPLAIN ANALYZE + Prisma wall timings
4. Integrity spot-checks (orphans, duplicate tickets, timestamp consistency)
5. Transactions/settings snapshot
6. Prisma migration history listing
7. Redis ownership (static code scan)
8. Security roles / RLS flags (live)
9. Backup posture from deploy runbooks (config evidence)

## Critical insight (topology)

At current data volume, **SQL execution time is typically sub-millisecond** while **Prisma client wall time is hundreds–thousands of ms** due to Neon network RTT / pooler / cold connections. Treat “slow queries” as **latency + chatty access patterns** first; re-rank EXPLAIN when rows grow past ~100k trades.

## Evidence files

| File | Purpose |
|------|---------|
| `data/schema-inventory.json` | Parsed Prisma models/relations/indexes |
| `data/migrations.json` | Migration folder list |
| `data/live-audit.json` | Full live catalog + checks |
| `data/explain-analyze.json` | EXPLAIN ANALYZE summaries |
| `data/query-timings.json` | Prisma wall timings |
| `data/sizes.json` | Table/index byte sizes |

## Report index

| Report | File |
|--------|------|
| ER diagram | [ER_DIAGRAM.md](./ER_DIAGRAM.md) |
| Indexes | [INDEX_REPORT.md](./INDEX_REPORT.md) |
| Queries | [QUERY_REPORT.md](./QUERY_REPORT.md) |
| Integrity | [INTEGRITY_REPORT.md](./INTEGRITY_REPORT.md) |
| Transactions | [TRANSACTION_REPORT.md](./TRANSACTION_REPORT.md) |
| Security | [SECURITY_REPORT.md](./SECURITY_REPORT.md) |
| Backup | [BACKUP_REPORT.md](./BACKUP_REPORT.md) |
| Prisma | [PRISMA_REVIEW.md](./PRISMA_REVIEW.md) |
| Growth | [DATA_GROWTH_REPORT.md](./DATA_GROWTH_REPORT.md) |
| Priority | [PRIORITY_MATRIX.md](./PRIORITY_MATRIX.md) |
| Phase 2 inputs | [PHASE2_INPUTS.md](./PHASE2_INPUTS.md) |
| Summary | [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) |
| Exit | [EXIT_CRITERIA.md](./EXIT_CRITERIA.md) |

## How to re-run

```bash
pnpm db-audit:all
# or
pnpm db-audit:parse && pnpm db-audit:live && pnpm db-audit:reports
```

Requires `apps/api/.env` with `DATABASE_URL` (and preferably `DIRECT_URL` for catalog/EXPLAIN).
