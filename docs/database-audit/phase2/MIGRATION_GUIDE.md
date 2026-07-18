# MIGRATION_GUIDE — Phase 2

## Current state

- **44** migration folders under `apps/api/prisma/migrations/` (including Phase 2).
- Neon `profytron` historically applied via safe sync / `db execute` — `_prisma_migrations` may be empty (P3005 on `migrate deploy`). Treat SQL files as deploy artifacts.

## Rules

1. **Never rewrite** applied migration SQL in-place.
2. **Expand/contract:** additive columns/indexes/tables first; drop in a later migration after code no longer depends on them.
3. **Naming:** `YYYYMMDDHHMMSS_phase2_<slug>` (or feature slug).
4. **FK rule:** every new FK column gets a leading `@@index` in the same PR (Phase 2 standard).
5. **Enums:** expand values first; remove only after code stop writing them.
6. **Drift:** prefer explicit backfill migrations over silent `db push` in production.
7. **Deploy path today:** `prisma db execute --file <migration.sql>` when migrate history is unbaselined; plan a future baseline of `_prisma_migrations` as a separate ops task.

## Phase 2 migrations

| Folder | Purpose |
|--------|---------|
| `20260719010000_phase2_fk_leading_indexes` | 7 FK indexes |
| `20260719020000_phase2_drop_redundant_indexes` | Drop proven duplicate non-unique indexes |
| `20260719030000_phase2_snapshot_archive_tables` | Soft-archive tables |

## Rollback

- Indexes: `DROP INDEX IF EXISTS …` / recreate from prior SQL.
- Archive tables: stop lifecycle job; tables may remain empty (safe). Dropping archive tables loses only archived copies — restore from Neon PITR if needed.
