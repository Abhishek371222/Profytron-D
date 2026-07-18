-- Expand the DB-first MetaAPI snapshot read model. All changes are additive so
-- existing account snapshot history remains valid and readable.

ALTER TABLE "AccountSnapshot"
  ADD COLUMN IF NOT EXISTS "pendingOrdersJson" JSONB,
  ADD COLUMN IF NOT EXISTS "dealsJson" JSONB,
  ADD COLUMN IF NOT EXISTS "orderHistoryJson" JSONB,
  ADD COLUMN IF NOT EXISTS "symbolsJson" JSONB,
  ADD COLUMN IF NOT EXISTS "marketDataJson" JSONB,
  ADD COLUMN IF NOT EXISTS "accountStatusJson" JSONB,
  ADD COLUMN IF NOT EXISTS "copyTradingJson" JSONB,
  ADD COLUMN IF NOT EXISTS "performanceJson" JSONB,
  ADD COLUMN IF NOT EXISTS "riskJson" JSONB,
  ADD COLUMN IF NOT EXISTS "eventsJson" JSONB,
  ADD COLUMN IF NOT EXISTS "realizedProfit" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "unrealizedProfit" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "todayProfit" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "todayLoss" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "weeklyProfit" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "monthlyProfit" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "netProfit" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "lastSuccessfulSync" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "AccountLatestSnapshot" (
  "brokerAccountId" TEXT NOT NULL,
  "snapshotId" TEXT NOT NULL,
  "lastSyncedAt" TIMESTAMP(3) NOT NULL,
  "lastSuccessfulSync" TIMESTAMP(3) NOT NULL,
  "syncDurationMs" INTEGER,
  "syncStatus" TEXT NOT NULL DEFAULT 'SUCCESS',
  "metaApiLatencyMs" INTEGER,
  "apiVersion" TEXT,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AccountLatestSnapshot_pkey" PRIMARY KEY ("brokerAccountId")
);

CREATE TABLE IF NOT EXISTS "AccountSnapshotPosition" (
  "id" TEXT NOT NULL,
  "snapshotId" TEXT NOT NULL,
  "brokerAccountId" TEXT NOT NULL,
  "positionId" TEXT,
  "ticket" TEXT,
  "symbol" TEXT NOT NULL,
  "side" TEXT,
  "volume" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "openPrice" DOUBLE PRECISION,
  "currentPrice" DOUBLE PRECISION,
  "stopLoss" DOUBLE PRECISION,
  "takeProfit" DOUBLE PRECISION,
  "commission" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "swap" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "profit" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "comment" TEXT,
  "magicNumber" TEXT,
  "openTime" TIMESTAMP(3),
  "durationSeconds" INTEGER,
  "currentPips" DOUBLE PRECISION,
  "risk" DOUBLE PRECISION,
  "reward" DOUBLE PRECISION,
  "status" TEXT,
  "rawJson" JSONB,
  "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AccountSnapshotPosition_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AccountSnapshotPendingOrder" (
  "id" TEXT NOT NULL,
  "snapshotId" TEXT NOT NULL,
  "brokerAccountId" TEXT NOT NULL,
  "orderId" TEXT,
  "symbol" TEXT NOT NULL,
  "orderType" TEXT,
  "volume" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "entryPrice" DOUBLE PRECISION,
  "stopLoss" DOUBLE PRECISION,
  "takeProfit" DOUBLE PRECISION,
  "expiration" TIMESTAMP(3),
  "comment" TEXT,
  "status" TEXT,
  "createdTime" TIMESTAMP(3),
  "rawJson" JSONB,
  "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AccountSnapshotPendingOrder_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AccountSnapshotDeal" (
  "id" TEXT NOT NULL,
  "snapshotId" TEXT NOT NULL,
  "brokerAccountId" TEXT NOT NULL,
  "dealId" TEXT,
  "positionId" TEXT,
  "orderId" TEXT,
  "symbol" TEXT,
  "price" DOUBLE PRECISION,
  "volume" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "commission" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "swap" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "fee" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "profit" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "time" TIMESTAMP(3),
  "executionType" TEXT,
  "rawJson" JSONB,
  "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AccountSnapshotDeal_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AccountSnapshotOrderHistory" (
  "id" TEXT NOT NULL,
  "snapshotId" TEXT NOT NULL,
  "brokerAccountId" TEXT NOT NULL,
  "ticket" TEXT,
  "positionId" TEXT,
  "symbol" TEXT,
  "openPrice" DOUBLE PRECISION,
  "closePrice" DOUBLE PRECISION,
  "openTime" TIMESTAMP(3),
  "closeTime" TIMESTAMP(3),
  "profit" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "swap" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "commission" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "netProfit" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "holdingSeconds" INTEGER,
  "exitReason" TEXT,
  "rawJson" JSONB,
  "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AccountSnapshotOrderHistory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AccountSnapshotSymbol" (
  "id" TEXT NOT NULL,
  "snapshotId" TEXT NOT NULL,
  "brokerAccountId" TEXT NOT NULL,
  "symbol" TEXT NOT NULL,
  "bid" DOUBLE PRECISION,
  "ask" DOUBLE PRECISION,
  "spread" DOUBLE PRECISION,
  "digits" INTEGER,
  "contractSize" DOUBLE PRECISION,
  "tickSize" DOUBLE PRECISION,
  "tickValue" DOUBLE PRECISION,
  "minLot" DOUBLE PRECISION,
  "maxLot" DOUBLE PRECISION,
  "lotStep" DOUBLE PRECISION,
  "tradingEnabled" BOOLEAN,
  "rawJson" JSONB,
  "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AccountSnapshotSymbol_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AccountSnapshotMarketData" (
  "id" TEXT NOT NULL,
  "snapshotId" TEXT NOT NULL,
  "brokerAccountId" TEXT NOT NULL,
  "symbol" TEXT NOT NULL,
  "bid" DOUBLE PRECISION,
  "ask" DOUBLE PRECISION,
  "spread" DOUBLE PRECISION,
  "open" DOUBLE PRECISION,
  "high" DOUBLE PRECISION,
  "low" DOUBLE PRECISION,
  "close" DOUBLE PRECISION,
  "volume" DOUBLE PRECISION,
  "timeframe" TEXT,
  "tickTimestamp" TIMESTAMP(3),
  "rawJson" JSONB,
  "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AccountSnapshotMarketData_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AccountSnapshotStatus" (
  "id" TEXT NOT NULL,
  "snapshotId" TEXT NOT NULL,
  "brokerAccountId" TEXT NOT NULL,
  "connected" BOOLEAN,
  "connectionStatus" TEXT,
  "synchronizationState" TEXT,
  "terminalState" TEXT,
  "lastHeartbeat" TIMESTAMP(3),
  "lastConnected" TIMESTAMP(3),
  "lastDisconnected" TIMESTAMP(3),
  "rawJson" JSONB,
  "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AccountSnapshotStatus_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AccountSnapshotCopyTrading" (
  "id" TEXT NOT NULL,
  "snapshotId" TEXT NOT NULL,
  "brokerAccountId" TEXT NOT NULL,
  "masterAccountId" TEXT,
  "followerAccountIds" JSONB,
  "subscriptionStatus" TEXT,
  "lotMultiplier" DOUBLE PRECISION,
  "riskMultiplier" DOUBLE PRECISION,
  "copyDelayMs" INTEGER,
  "copyStatus" TEXT,
  "syncStatus" TEXT,
  "rawJson" JSONB,
  "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AccountSnapshotCopyTrading_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AccountSnapshotPerformance" (
  "id" TEXT NOT NULL,
  "snapshotId" TEXT NOT NULL,
  "brokerAccountId" TEXT NOT NULL,
  "totalReturn" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "absoluteReturn" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "roi" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "dailyReturn" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "weeklyReturn" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "monthlyReturn" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "yearlyReturn" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "cagr" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "profitFactor" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "expectancy" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "recoveryFactor" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "sharpeRatio" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "sortinoRatio" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "calmarRatio" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "winRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "lossRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "averageWin" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "averageLoss" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "largestWin" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "largestLoss" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "averageHoldingSeconds" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "maxDrawdown" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "relativeDrawdown" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "floatingDrawdown" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "balanceDrawdown" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "currentDrawdown" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "maximumConsecutiveWins" INTEGER NOT NULL DEFAULT 0,
  "maximumConsecutiveLosses" INTEGER NOT NULL DEFAULT 0,
  "averageTradeDurationSeconds" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "averagePips" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "averageRiskReward" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "bestDay" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "worstDay" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "bestWeek" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "worstWeek" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "bestMonth" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "worstMonth" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "totalLots" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "averageLotSize" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "tradesToday" INTEGER NOT NULL DEFAULT 0,
  "tradesThisWeek" INTEGER NOT NULL DEFAULT 0,
  "tradesThisMonth" INTEGER NOT NULL DEFAULT 0,
  "rawJson" JSONB,
  "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AccountSnapshotPerformance_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AccountSnapshotRisk" (
  "id" TEXT NOT NULL,
  "snapshotId" TEXT NOT NULL,
  "brokerAccountId" TEXT NOT NULL,
  "currentExposure" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "portfolioExposure" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "marginUsage" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "freeMarginPct" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "riskPerTrade" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "riskPct" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "largestPosition" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "largestExposure" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "currencyExposureJson" JSONB,
  "symbolExposureJson" JSONB,
  "estimatedValueAtRisk" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "maximumAdverseExcursion" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "maximumFavorableExcursion" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "rawJson" JSONB,
  "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AccountSnapshotRisk_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AccountSnapshotEvent" (
  "id" TEXT NOT NULL,
  "snapshotId" TEXT NOT NULL,
  "brokerAccountId" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "entityType" TEXT,
  "entityId" TEXT,
  "detailsJson" JSONB,
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AccountSnapshotEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "AccountLatestSnapshot_snapshotId_key" ON "AccountLatestSnapshot"("snapshotId");
CREATE INDEX IF NOT EXISTS "AccountLatestSnapshot_lastSyncedAt_idx" ON "AccountLatestSnapshot"("lastSyncedAt");
CREATE INDEX IF NOT EXISTS "AccountLatestSnapshot_syncStatus_idx" ON "AccountLatestSnapshot"("syncStatus");

CREATE INDEX IF NOT EXISTS "AccountSnapshotPosition_brokerAccountId_capturedAt_idx" ON "AccountSnapshotPosition"("brokerAccountId", "capturedAt");
CREATE INDEX IF NOT EXISTS "AccountSnapshotPosition_snapshotId_idx" ON "AccountSnapshotPosition"("snapshotId");
CREATE INDEX IF NOT EXISTS "AccountSnapshotPosition_symbol_idx" ON "AccountSnapshotPosition"("symbol");
CREATE INDEX IF NOT EXISTS "AccountSnapshotPosition_ticket_idx" ON "AccountSnapshotPosition"("ticket");

CREATE INDEX IF NOT EXISTS "AccountSnapshotPendingOrder_brokerAccountId_capturedAt_idx" ON "AccountSnapshotPendingOrder"("brokerAccountId", "capturedAt");
CREATE INDEX IF NOT EXISTS "AccountSnapshotPendingOrder_snapshotId_idx" ON "AccountSnapshotPendingOrder"("snapshotId");
CREATE INDEX IF NOT EXISTS "AccountSnapshotPendingOrder_orderId_idx" ON "AccountSnapshotPendingOrder"("orderId");
CREATE INDEX IF NOT EXISTS "AccountSnapshotPendingOrder_symbol_idx" ON "AccountSnapshotPendingOrder"("symbol");

CREATE INDEX IF NOT EXISTS "AccountSnapshotDeal_brokerAccountId_time_idx" ON "AccountSnapshotDeal"("brokerAccountId", "time");
CREATE INDEX IF NOT EXISTS "AccountSnapshotDeal_snapshotId_idx" ON "AccountSnapshotDeal"("snapshotId");
CREATE INDEX IF NOT EXISTS "AccountSnapshotDeal_dealId_idx" ON "AccountSnapshotDeal"("dealId");
CREATE INDEX IF NOT EXISTS "AccountSnapshotDeal_positionId_idx" ON "AccountSnapshotDeal"("positionId");

CREATE INDEX IF NOT EXISTS "AccountSnapshotOrderHistory_brokerAccountId_closeTime_idx" ON "AccountSnapshotOrderHistory"("brokerAccountId", "closeTime");
CREATE INDEX IF NOT EXISTS "AccountSnapshotOrderHistory_snapshotId_idx" ON "AccountSnapshotOrderHistory"("snapshotId");
CREATE INDEX IF NOT EXISTS "AccountSnapshotOrderHistory_ticket_idx" ON "AccountSnapshotOrderHistory"("ticket");

CREATE INDEX IF NOT EXISTS "AccountSnapshotSymbol_brokerAccountId_symbol_capturedAt_idx" ON "AccountSnapshotSymbol"("brokerAccountId", "symbol", "capturedAt");
CREATE INDEX IF NOT EXISTS "AccountSnapshotSymbol_snapshotId_idx" ON "AccountSnapshotSymbol"("snapshotId");

CREATE INDEX IF NOT EXISTS "AccountSnapshotMarketData_brokerAccountId_symbol_tickTimestamp_idx" ON "AccountSnapshotMarketData"("brokerAccountId", "symbol", "tickTimestamp");
CREATE INDEX IF NOT EXISTS "AccountSnapshotMarketData_snapshotId_idx" ON "AccountSnapshotMarketData"("snapshotId");

CREATE INDEX IF NOT EXISTS "AccountSnapshotStatus_brokerAccountId_capturedAt_idx" ON "AccountSnapshotStatus"("brokerAccountId", "capturedAt");
CREATE INDEX IF NOT EXISTS "AccountSnapshotStatus_snapshotId_idx" ON "AccountSnapshotStatus"("snapshotId");

CREATE INDEX IF NOT EXISTS "AccountSnapshotCopyTrading_brokerAccountId_capturedAt_idx" ON "AccountSnapshotCopyTrading"("brokerAccountId", "capturedAt");
CREATE INDEX IF NOT EXISTS "AccountSnapshotCopyTrading_snapshotId_idx" ON "AccountSnapshotCopyTrading"("snapshotId");

CREATE UNIQUE INDEX IF NOT EXISTS "AccountSnapshotPerformance_snapshotId_key" ON "AccountSnapshotPerformance"("snapshotId");
CREATE INDEX IF NOT EXISTS "AccountSnapshotPerformance_brokerAccountId_capturedAt_idx" ON "AccountSnapshotPerformance"("brokerAccountId", "capturedAt");

CREATE UNIQUE INDEX IF NOT EXISTS "AccountSnapshotRisk_snapshotId_key" ON "AccountSnapshotRisk"("snapshotId");
CREATE INDEX IF NOT EXISTS "AccountSnapshotRisk_brokerAccountId_capturedAt_idx" ON "AccountSnapshotRisk"("brokerAccountId", "capturedAt");

CREATE INDEX IF NOT EXISTS "AccountSnapshotEvent_brokerAccountId_occurredAt_idx" ON "AccountSnapshotEvent"("brokerAccountId", "occurredAt");
CREATE INDEX IF NOT EXISTS "AccountSnapshotEvent_snapshotId_idx" ON "AccountSnapshotEvent"("snapshotId");
CREATE INDEX IF NOT EXISTS "AccountSnapshotEvent_eventType_idx" ON "AccountSnapshotEvent"("eventType");

ALTER TABLE "AccountLatestSnapshot" ADD CONSTRAINT "AccountLatestSnapshot_brokerAccountId_fkey" FOREIGN KEY ("brokerAccountId") REFERENCES "BrokerAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AccountLatestSnapshot" ADD CONSTRAINT "AccountLatestSnapshot_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "AccountSnapshot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AccountSnapshotPosition" ADD CONSTRAINT "AccountSnapshotPosition_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "AccountSnapshot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AccountSnapshotPendingOrder" ADD CONSTRAINT "AccountSnapshotPendingOrder_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "AccountSnapshot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AccountSnapshotDeal" ADD CONSTRAINT "AccountSnapshotDeal_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "AccountSnapshot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AccountSnapshotOrderHistory" ADD CONSTRAINT "AccountSnapshotOrderHistory_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "AccountSnapshot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AccountSnapshotSymbol" ADD CONSTRAINT "AccountSnapshotSymbol_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "AccountSnapshot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AccountSnapshotMarketData" ADD CONSTRAINT "AccountSnapshotMarketData_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "AccountSnapshot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AccountSnapshotStatus" ADD CONSTRAINT "AccountSnapshotStatus_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "AccountSnapshot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AccountSnapshotCopyTrading" ADD CONSTRAINT "AccountSnapshotCopyTrading_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "AccountSnapshot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AccountSnapshotPerformance" ADD CONSTRAINT "AccountSnapshotPerformance_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "AccountSnapshot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AccountSnapshotRisk" ADD CONSTRAINT "AccountSnapshotRisk_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "AccountSnapshot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AccountSnapshotEvent" ADD CONSTRAINT "AccountSnapshotEvent_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "AccountSnapshot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
