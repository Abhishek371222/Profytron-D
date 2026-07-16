-- Live cache columns (overwrite every sync). initialEquity remains the permanent return baseline.
ALTER TABLE "BrokerAccount" ADD COLUMN IF NOT EXISTS "lastKnownEquity" DOUBLE PRECISION;
ALTER TABLE "BrokerAccount" ADD COLUMN IF NOT EXISTS "lastKnownBalance" DOUBLE PRECISION;
