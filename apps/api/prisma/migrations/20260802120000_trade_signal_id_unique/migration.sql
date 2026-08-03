-- Dedupe concurrent trade execution by stable signal id (RC P1-8).
-- Postgres UNIQUE allows multiple NULLs, so pre-signal legacy rows stay valid.
ALTER TABLE "Trade" ADD COLUMN IF NOT EXISTS "signalId" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "trade_broker_account_signal_unique"
  ON "Trade" ("brokerAccountId", "signalId");

CREATE INDEX IF NOT EXISTS "Trade_signalId_idx" ON "Trade" ("signalId");
