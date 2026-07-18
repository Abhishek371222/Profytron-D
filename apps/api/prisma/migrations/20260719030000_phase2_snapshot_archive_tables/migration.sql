-- Phase 2 DB-P1-SNAPSHOT-GROWTH: soft-archive tables (no FK to hot parents; Sync Engine writers unchanged)
CREATE TABLE IF NOT EXISTS "AccountSnapshotOrderHistoryArchive" (
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
    "capturedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AccountSnapshotOrderHistoryArchive_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "AccountSnapshotOrderHistoryArchive_brokerAccountId_archivedAt_idx"
  ON "AccountSnapshotOrderHistoryArchive"("brokerAccountId", "archivedAt");
CREATE INDEX IF NOT EXISTS "AccountSnapshotOrderHistoryArchive_archivedAt_idx"
  ON "AccountSnapshotOrderHistoryArchive"("archivedAt");
CREATE INDEX IF NOT EXISTS "AccountSnapshotOrderHistoryArchive_snapshotId_idx"
  ON "AccountSnapshotOrderHistoryArchive"("snapshotId");

CREATE TABLE IF NOT EXISTS "AccountSnapshotDealArchive" (
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
    "capturedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AccountSnapshotDealArchive_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "AccountSnapshotDealArchive_brokerAccountId_archivedAt_idx"
  ON "AccountSnapshotDealArchive"("brokerAccountId", "archivedAt");
CREATE INDEX IF NOT EXISTS "AccountSnapshotDealArchive_archivedAt_idx"
  ON "AccountSnapshotDealArchive"("archivedAt");
CREATE INDEX IF NOT EXISTS "AccountSnapshotDealArchive_snapshotId_idx"
  ON "AccountSnapshotDealArchive"("snapshotId");

CREATE TABLE IF NOT EXISTS "AccountSnapshotSymbolArchive" (
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
    "capturedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AccountSnapshotSymbolArchive_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "AccountSnapshotSymbolArchive_brokerAccountId_archivedAt_idx"
  ON "AccountSnapshotSymbolArchive"("brokerAccountId", "archivedAt");
CREATE INDEX IF NOT EXISTS "AccountSnapshotSymbolArchive_archivedAt_idx"
  ON "AccountSnapshotSymbolArchive"("archivedAt");

CREATE TABLE IF NOT EXISTS "AccountSnapshotMarketDataArchive" (
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
    "capturedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AccountSnapshotMarketDataArchive_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "AccountSnapshotMarketDataArchive_brokerAccountId_archivedAt_idx"
  ON "AccountSnapshotMarketDataArchive"("brokerAccountId", "archivedAt");
CREATE INDEX IF NOT EXISTS "AccountSnapshotMarketDataArchive_archivedAt_idx"
  ON "AccountSnapshotMarketDataArchive"("archivedAt");
