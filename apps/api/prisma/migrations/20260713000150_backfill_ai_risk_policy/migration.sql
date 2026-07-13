-- Backfills migration history for AiRiskPolicy, which already existed in the
-- live development database from earlier db-push usage. The following
-- 20260713000200 migration only adds dailyWinTargetUsd and needs this table
-- present during shadow-database replay.

-- CreateTable
CREATE TABLE "AiRiskPolicy" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "maxDailyLossUsd" DOUBLE PRECISION,
    "maxDailyLossPct" DOUBLE PRECISION,
    "maxDrawdownPct" DOUBLE PRECISION,
    "autoStopAfterLoss" BOOLEAN NOT NULL DEFAULT false,
    "autoStopAfterWin" BOOLEAN NOT NULL DEFAULT false,
    "riskPerTradePct" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "maxOpenTrades" INTEGER NOT NULL DEFAULT 10,
    "minWinRate" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiRiskPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AiRiskPolicy_userId_key" ON "AiRiskPolicy"("userId");

-- CreateIndex
CREATE INDEX "AiRiskPolicy_userId_idx" ON "AiRiskPolicy"("userId");

-- AddForeignKey
ALTER TABLE "AiRiskPolicy" ADD CONSTRAINT "AiRiskPolicy_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
