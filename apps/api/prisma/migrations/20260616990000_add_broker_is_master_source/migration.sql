-- Backfills migration history for a column that was already applied to the
-- live database via `prisma db push` without ever being captured as a
-- migration file. This left the migration chain unable to replay cleanly
-- from scratch (20260617000000_analytics_trade_indexes creates an index on
-- this column, but no prior migration ever created the column itself).
-- Resolved with `prisma migrate resolve --applied` rather than run for real,
-- since the column already exists on the live database.

ALTER TABLE "BrokerAccount" ADD COLUMN IF NOT EXISTS "isMasterSource" BOOLEAN NOT NULL DEFAULT false;
