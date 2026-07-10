-- DB-5 NEUTRALIZED (do not restore the original DROP TABLE statements).
--
-- The original migration was a destructive full-schema sync generated against
-- an unrelated legacy database (DROP TABLE ActivityLog, Buyer, OilBatch, …).
-- It must never be executed against Profytron production.
--
-- Current schema is applied via later incremental migrations and
-- tools/apply-safe-schema-sync.mjs (`pnpm db:sync`).
--
-- If this migration is PENDING in `_prisma_migrations` on an environment
-- where the schema already matches, mark it applied without running SQL:
--
--   pnpm exec prisma migrate resolve --applied 20260524130000_full_schema_sync
--
-- This file is intentionally a no-op so `prisma migrate deploy` is safe.

SELECT 1;
