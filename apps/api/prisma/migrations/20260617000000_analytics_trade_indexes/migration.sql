-- Composite indexes for analytics, open trades, wallet balance, and master sync hot paths

CREATE INDEX IF NOT EXISTS "Trade_userId_status_closedAt_idx"
  ON "Trade" ("userId", "status", "closedAt" DESC);

CREATE INDEX IF NOT EXISTS "Trade_status_closedAt_idx"
  ON "Trade" ("status", "closedAt" DESC);

CREATE INDEX IF NOT EXISTS "Trade_userId_status_brokerAccountId_idx"
  ON "Trade" ("userId", "status", "brokerAccountId");

CREATE INDEX IF NOT EXISTS "BrokerAccount_userId_isDefault_isActive_idx"
  ON "BrokerAccount" ("userId", "isDefault", "isActive");

CREATE INDEX IF NOT EXISTS "BrokerAccount_isMasterSource_isActive_idx"
  ON "BrokerAccount" ("isMasterSource", "isActive");

CREATE INDEX IF NOT EXISTS "WalletTransaction_userId_direction_status_idx"
  ON "WalletTransaction" ("userId", "direction", "status");
