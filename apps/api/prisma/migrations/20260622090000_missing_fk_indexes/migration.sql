-- Add missing foreign-key indexes flagged by the pre-launch audit.
--   * StrategyReview.userId — "all reviews written by a user" / FK lookups.
--   * AITradeExplanation.strategyId — per-strategy explanation lookups + FK.
--
-- NOTE: On large tables prefer CREATE INDEX CONCURRENTLY in a maintenance
-- window (Prisma runs migrations in a transaction, so it cannot use
-- CONCURRENTLY here). IF NOT EXISTS keeps this idempotent if a db push already
-- created them.

-- CreateIndex
CREATE INDEX IF NOT EXISTS "StrategyReview_userId_idx" ON "StrategyReview"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AITradeExplanation_strategyId_idx" ON "AITradeExplanation"("strategyId");
