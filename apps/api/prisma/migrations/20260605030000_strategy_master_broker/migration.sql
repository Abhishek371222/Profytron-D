-- Link marketplace copy strategies to a specific master MT5 account
ALTER TABLE "Strategy" ADD COLUMN IF NOT EXISTS "masterBrokerAccountId" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Strategy_masterBrokerAccountId_fkey'
  ) THEN
    ALTER TABLE "Strategy"
      ADD CONSTRAINT "Strategy_masterBrokerAccountId_fkey"
      FOREIGN KEY ("masterBrokerAccountId") REFERENCES "BrokerAccount"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "Strategy_masterBrokerAccountId_idx"
  ON "Strategy"("masterBrokerAccountId");
