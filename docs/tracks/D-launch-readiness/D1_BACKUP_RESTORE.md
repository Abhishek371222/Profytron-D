# D1.4 — Backup & Restore

Builds on Database Excellence:

- [`docs/database-audit/phase1/BACKUP_REPORT.md`](../../database-audit/phase1/BACKUP_REPORT.md)  
- [`docs/database-audit/phase2/RESTORE_DRILL.md`](../../database-audit/phase2/RESTORE_DRILL.md)  
- Tool: `pnpm db-audit:restore` (`tools/database-audit/restore-drill.mjs`)

## Targets (document actuals after console confirm)

| Metric | Target (proposed) | Actual (fill) |
| --- | --- | --- |
| RPO | ≤ 5 minutes (Neon PITR) | |
| RTO | ≤ 60 minutes to serving traffic on restored DB | |
| Backup schedule | Neon continuous PITR + daily snapshot if offered | |
| Last successful restore validation | | Date: ________ |

## Operator steps

1. Confirm Neon plan PITR window in console.  
2. Run integrity smoke: `pnpm db-audit:restore -- --integrity-only`  
3. With Neon API keys: full branch drill `pnpm db-audit:restore`  
4. Paste evidence path / summary into [`WEEKLY_LOG.md`](./WEEKLY_LOG.md) and update V1 gate 8.

## Redis / queues

- Redis is **ephemeral** (sessions/cache) — not in RPO for durable trading data.  
- After DB restore: expect session logout; Bull jobs may need redrive.
