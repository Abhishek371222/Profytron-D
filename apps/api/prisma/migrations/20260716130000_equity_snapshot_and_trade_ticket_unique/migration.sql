-- Durable equity/balance history, independent of MetaAPI's own deal history retention.
CREATE TABLE IF NOT EXISTS "EquitySnapshot" (
    "id" TEXT NOT NULL,
    "brokerAccountId" TEXT NOT NULL,
    "balance" DOUBLE PRECISION NOT NULL,
    "equity" DOUBLE PRECISION NOT NULL,
    "margin" DOUBLE PRECISION,
    "freeMargin" DOUBLE PRECISION,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EquitySnapshot_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "EquitySnapshot_brokerAccountId_capturedAt_idx" ON "EquitySnapshot"("brokerAccountId", "capturedAt");

DO $$ BEGIN
  ALTER TABLE "EquitySnapshot"
    ADD CONSTRAINT "EquitySnapshot_brokerAccountId_fkey"
    FOREIGN KEY ("brokerAccountId") REFERENCES "BrokerAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Idempotency key for MetaAPI-sourced Trade rows so history/equity sync can
-- upsert by (brokerAccountId, brokerTicket) instead of risking duplicates.
-- Guarded: if production already has duplicate (brokerAccountId, brokerTicket)
-- rows from before this sync existed, skip the constraint rather than failing
-- the whole deploy — AccountHistorySyncService falls back to plain create in
-- that case, so this is a soft upgrade, not a hard requirement.
DO $$ BEGIN
  ALTER TABLE "Trade"
    ADD CONSTRAINT "trade_broker_account_ticket_unique"
    UNIQUE ("brokerAccountId", "brokerTicket");
EXCEPTION
  WHEN duplicate_object THEN null;
  WHEN unique_violation THEN
    RAISE NOTICE 'Skipping trade_broker_account_ticket_unique — duplicate (brokerAccountId, brokerTicket) rows exist. Dedupe manually then re-add.';
END $$;
