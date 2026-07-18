# RESTORE_DRILL — Phase 2

**Evidence target:** `DB-P1-BACKUP-VERIFY`

## Procedure

```bash
# apps/api/.env
NEON_API_KEY=...
NEON_PROJECT_ID=...
# optional: NEON_PARENT_BRANCH_ID=...

pnpm db-audit:restore
```

Script: `tools/database-audit/restore-drill.mjs`

```
Parent branch
    ↓ Neon API create ephemeral branch
Connection URI
    ↓ Prisma SELECT 1 + orphan/dupe integrity
Delete ephemeral branch
    ↓
data/restore-drill.json
```

## Success criteria

| Check | Required |
|-------|----------|
| Branch create | ok |
| `SELECT 1` | ok |
| Trade→User orphans | 0 |
| Duplicate broker tickets | 0 |
| Branch deleted | ok |
| Evidence file written | `data/restore-drill.json` with `ok: true` |

## RPO / RTO

- **RPO:** Neon branch fork ≈ current parent head (seconds-level for this drill; confirm PITR window in Neon console plan).
- **RTO:** Wall ms in `restore-drill.json` → `rtoMs` (create → integrity).

## Application boots

Lightweight smoke uses Prisma against the restored branch (proves app DB client can connect). Full Nest boot against ephemeral URL is optional and not required when integrity smoke passes.

## If keys missing

1. Run integrity smoke: `pnpm db-audit:restore -- --integrity-only` (validates checks against current DB).
2. Script exits non-zero without keys when branch mode is requested.
3. Set `NEON_API_KEY` + `NEON_PROJECT_ID` and re-run full branch drill for complete exit gate.

Evidence file: `data/restore-drill.json` (`branchDrill: "skipped"` when integrity-only).
