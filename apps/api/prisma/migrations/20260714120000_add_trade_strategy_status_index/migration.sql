-- CreateIndex
CREATE INDEX IF NOT EXISTS "Trade_strategyId_status_idx" ON "Trade"("strategyId", "status");
