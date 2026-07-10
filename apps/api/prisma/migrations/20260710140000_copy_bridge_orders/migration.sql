-- AlterTable
ALTER TABLE "BrokerAccount" ADD COLUMN IF NOT EXISTS "bridgeTokenHash" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "BrokerAccount_bridgeTokenHash_key" ON "BrokerAccount"("bridgeTokenHash");

-- CreateTable
CREATE TABLE IF NOT EXISTS "CopyBridgeOrder" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "brokerAccountId" TEXT NOT NULL,
    "subscriptionId" TEXT,
    "followerTradeId" TEXT,
    "masterPositionId" TEXT,
    "action" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "side" TEXT,
    "volume" DOUBLE PRECISION NOT NULL,
    "price" DOUBLE PRECISION,
    "stopLoss" DOUBLE PRECISION,
    "takeProfit" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "brokerTicket" TEXT,
    "errorReason" TEXT,
    "claimedAt" TIMESTAMP(3),
    "filledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CopyBridgeOrder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CopyBridgeOrder_brokerAccountId_status_idx" ON "CopyBridgeOrder"("brokerAccountId", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CopyBridgeOrder_userId_status_idx" ON "CopyBridgeOrder"("userId", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CopyBridgeOrder_masterPositionId_idx" ON "CopyBridgeOrder"("masterPositionId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CopyBridgeOrder_followerTradeId_idx" ON "CopyBridgeOrder"("followerTradeId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CopyBridgeOrder_status_createdAt_idx" ON "CopyBridgeOrder"("status", "createdAt");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "CopyBridgeOrder" ADD CONSTRAINT "CopyBridgeOrder_brokerAccountId_fkey"
    FOREIGN KEY ("brokerAccountId") REFERENCES "BrokerAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
