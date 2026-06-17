-- Copy trading domain model (additive). Adds first-class master profiles,
-- explicit master↔follower relationships, an append-only event log, and a
-- master-ticket → follower-ticket execution map. Existing copy flow is untouched.

-- CreateEnum
CREATE TYPE "CopySizingMode" AS ENUM ('FIXED', 'MULTIPLIER', 'EQUITY_RATIO');
CREATE TYPE "CopyRelationshipStatus" AS ENUM ('ACTIVE', 'PAUSED', 'STOPPED');
CREATE TYPE "TradeEventType" AS ENUM ('SIGNAL_RECEIVED', 'POSITION_OPENED', 'POSITION_MODIFIED', 'POSITION_CLOSED', 'RISK_BLOCKED', 'EXECUTION_FAILED');
CREATE TYPE "ExecutionStatus" AS ENUM ('PENDING', 'FILLED', 'FAILED', 'CLOSED');

-- CreateTable
CREATE TABLE "MasterProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "brokerAccountId" TEXT,
    "displayName" TEXT NOT NULL,
    "bio" TEXT,
    "strategyDescription" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "followersCount" INTEGER NOT NULL DEFAULT 0,
    "roiPct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "maxDrawdownPct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "winRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sharpeRatio" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MasterProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CopyRelationship" (
    "id" TEXT NOT NULL,
    "masterProfileId" TEXT NOT NULL,
    "followerUserId" TEXT NOT NULL,
    "subscriptionId" TEXT,
    "followerAccountId" TEXT,
    "status" "CopyRelationshipStatus" NOT NULL DEFAULT 'ACTIVE',
    "sizingMode" "CopySizingMode" NOT NULL DEFAULT 'MULTIPLIER',
    "lotMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "fixedLot" DOUBLE PRECISION,
    "maxDrawdownPct" DOUBLE PRECISION,
    "dailyLossLimitUsd" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CopyRelationship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TradeEvent" (
    "id" TEXT NOT NULL,
    "type" "TradeEventType" NOT NULL,
    "masterProfileId" TEXT,
    "masterAccountId" TEXT,
    "masterPositionId" TEXT,
    "userId" TEXT,
    "tradeId" TEXT,
    "symbol" TEXT,
    "side" TEXT,
    "volume" DOUBLE PRECISION,
    "price" DOUBLE PRECISION,
    "stopLoss" DOUBLE PRECISION,
    "takeProfit" DOUBLE PRECISION,
    "detailsJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TradeEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TradeExecution" (
    "id" TEXT NOT NULL,
    "copyRelationshipId" TEXT,
    "followerUserId" TEXT NOT NULL,
    "followerTradeId" TEXT,
    "masterPositionId" TEXT,
    "masterTicket" TEXT,
    "followerTicket" TEXT,
    "symbol" TEXT NOT NULL,
    "side" TEXT NOT NULL,
    "requestedVolume" DOUBLE PRECISION NOT NULL,
    "filledVolume" DOUBLE PRECISION,
    "requestedPrice" DOUBLE PRECISION,
    "fillPrice" DOUBLE PRECISION,
    "slippageBps" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "latencyMs" INTEGER,
    "status" "ExecutionStatus" NOT NULL DEFAULT 'PENDING',
    "errorReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TradeExecution_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MasterProfile_userId_key" ON "MasterProfile"("userId");
CREATE UNIQUE INDEX "MasterProfile_brokerAccountId_key" ON "MasterProfile"("brokerAccountId");
CREATE INDEX "MasterProfile_userId_idx" ON "MasterProfile"("userId");
CREATE INDEX "MasterProfile_isPublic_isVerified_idx" ON "MasterProfile"("isPublic", "isVerified");

CREATE UNIQUE INDEX "CopyRelationship_subscriptionId_key" ON "CopyRelationship"("subscriptionId");
CREATE UNIQUE INDEX "CopyRelationship_masterProfileId_followerUserId_key" ON "CopyRelationship"("masterProfileId", "followerUserId");
CREATE INDEX "CopyRelationship_masterProfileId_status_idx" ON "CopyRelationship"("masterProfileId", "status");
CREATE INDEX "CopyRelationship_followerUserId_idx" ON "CopyRelationship"("followerUserId");

CREATE INDEX "TradeEvent_masterPositionId_idx" ON "TradeEvent"("masterPositionId");
CREATE INDEX "TradeEvent_userId_createdAt_idx" ON "TradeEvent"("userId", "createdAt");
CREATE INDEX "TradeEvent_type_createdAt_idx" ON "TradeEvent"("type", "createdAt");

CREATE UNIQUE INDEX "TradeExecution_followerTradeId_key" ON "TradeExecution"("followerTradeId");
CREATE INDEX "TradeExecution_masterPositionId_idx" ON "TradeExecution"("masterPositionId");
CREATE INDEX "TradeExecution_followerUserId_createdAt_idx" ON "TradeExecution"("followerUserId", "createdAt");
CREATE INDEX "TradeExecution_status_idx" ON "TradeExecution"("status");

CREATE INDEX "BrokerAccount_isMasterSource_idx" ON "BrokerAccount"("isMasterSource");

-- AddForeignKey
ALTER TABLE "MasterProfile" ADD CONSTRAINT "MasterProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MasterProfile" ADD CONSTRAINT "MasterProfile_brokerAccountId_fkey" FOREIGN KEY ("brokerAccountId") REFERENCES "BrokerAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CopyRelationship" ADD CONSTRAINT "CopyRelationship_masterProfileId_fkey" FOREIGN KEY ("masterProfileId") REFERENCES "MasterProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CopyRelationship" ADD CONSTRAINT "CopyRelationship_followerUserId_fkey" FOREIGN KEY ("followerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TradeExecution" ADD CONSTRAINT "TradeExecution_copyRelationshipId_fkey" FOREIGN KEY ("copyRelationshipId") REFERENCES "CopyRelationship"("id") ON DELETE SET NULL ON UPDATE CASCADE;
