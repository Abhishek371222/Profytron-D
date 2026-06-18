-- Add time-ordered composite indexes on Trade for dashboard/strategy listings.
-- Speeds up "user's trades ordered by openedAt" and "per-strategy trades over time"
-- queries which previously fell back to [userId,status] / [strategyId] + a sort.
--
-- NOTE: On a large Trade table, prefer running these as CREATE INDEX CONCURRENTLY
-- during a maintenance window to avoid a write lock. Prisma migrations run inside a
-- transaction (so cannot use CONCURRENTLY); if the table is very large, apply the
-- two statements manually with CONCURRENTLY and then `prisma migrate resolve
-- --applied 20260618120000_trade_time_indexes`.

-- CreateIndex
CREATE INDEX "Trade_userId_openedAt_idx" ON "Trade"("userId", "openedAt");

-- CreateIndex
CREATE INDEX "Trade_strategyId_openedAt_idx" ON "Trade"("strategyId", "openedAt");
