-- AlterTable
ALTER TABLE "Strategy" ADD COLUMN IF NOT EXISTS "reviewStartedAt" TIMESTAMP(3);
ALTER TABLE "Strategy" ADD COLUMN IF NOT EXISTS "reviewEndsAt" TIMESTAMP(3);
ALTER TABLE "Strategy" ADD COLUMN IF NOT EXISTS "reviewNotes" TEXT;

-- AlterTable
ALTER TABLE "StrategyDocument" ADD COLUMN IF NOT EXISTS "kind" TEXT NOT NULL DEFAULT 'PDF';

-- CreateIndex
CREATE INDEX IF NOT EXISTS "StrategyDocument_strategyId_kind_idx" ON "StrategyDocument"("strategyId", "kind");
