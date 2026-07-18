-- Full MetaAPI account snapshot, appended every background-sync cycle.
-- DB-first read model for the dashboard: the API serves the newest row here
-- instead of calling MetaAPI per-request. Never updated in place — one row
-- per sync per account, so the full sync history is queryable.
CREATE TABLE IF NOT EXISTS "AccountSnapshot" (
    "id" TEXT NOT NULL,
    "brokerAccountId" TEXT NOT NULL,

    "login" TEXT,
    "broker" TEXT,
    "server" TEXT,
    "platform" TEXT,
    "currency" TEXT,
    "leverage" DOUBLE PRECISION,
    "connectionStatus" TEXT NOT NULL,
    "synchronizationStatus" TEXT,

    "balance" DOUBLE PRECISION NOT NULL,
    "equity" DOUBLE PRECISION NOT NULL,
    "credit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "margin" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "freeMargin" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "marginLevel" DOUBLE PRECISION,
    "floatingPnl" DOUBLE PRECISION NOT NULL DEFAULT 0,

    "positionsJson" JSONB,
    "positionsCount" INTEGER NOT NULL DEFAULT 0,

    "syncStatus" TEXT NOT NULL DEFAULT 'SUCCESS',
    "syncDurationMs" INTEGER,
    "metaApiLatencyMs" INTEGER,
    "apiVersion" TEXT,
    "errorMessage" TEXT,

    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccountSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "AccountSnapshot_brokerAccountId_capturedAt_idx" ON "AccountSnapshot"("brokerAccountId", "capturedAt");

DO $$ BEGIN
  ALTER TABLE "AccountSnapshot"
    ADD CONSTRAINT "AccountSnapshot_brokerAccountId_fkey"
    FOREIGN KEY ("brokerAccountId") REFERENCES "BrokerAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
