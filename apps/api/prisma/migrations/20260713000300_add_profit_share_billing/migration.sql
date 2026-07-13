-- Add profit-sharing bot billing alongside the existing fixed-fee model.

-- AlterEnum
ALTER TYPE "SubscriptionStatus" ADD VALUE IF NOT EXISTS 'BLOCKED';

-- AlterEnum
ALTER TYPE "TransactionType" ADD VALUE IF NOT EXISTS 'PROFIT_SHARE_DEBIT';
ALTER TYPE "TransactionType" ADD VALUE IF NOT EXISTS 'PROFIT_SHARE_LOSS_CREDIT';

-- CreateEnum
CREATE TYPE "SubscriptionBillingModel" AS ENUM ('FIXED', 'PROFIT_SHARE');

-- CreateEnum
CREATE TYPE "ProfitShareState" AS ENUM ('PROFIT_SHARE_OK', 'PROFIT_SHARE_DUE', 'PROFIT_SHARE_PAUSED', 'PROFIT_SHARE_SETTLING');

-- CreateEnum
CREATE TYPE "ProfitShareLedgerStatus" AS ENUM ('PENDING', 'COLLECTED', 'CREDITED', 'WRITTEN_OFF');

-- AlterTable
ALTER TABLE "UserStrategySubscription" ADD COLUMN "billingModel" "SubscriptionBillingModel" NOT NULL DEFAULT 'FIXED',
ADD COLUMN "profitSharePct" DOUBLE PRECISION,
ADD COLUMN "equityBaselineAtSubscribe" DOUBLE PRECISION,
ADD COLUMN "profitShareAccruedUnsettled" DOUBLE PRECISION,
ADD COLUMN "profitShareState" "ProfitShareState",
ADD COLUMN "lastProfitCheckAt" TIMESTAMP(3),
ADD COLUMN "lastProfitPingAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "ProfitShareLedgerEntry" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "periodStart" DATE NOT NULL,
    "periodEnd" DATE NOT NULL,
    "netPnl" DOUBLE PRECISION NOT NULL,
    "companySharePct" DOUBLE PRECISION NOT NULL,
    "companyShareAmount" DOUBLE PRECISION NOT NULL,
    "status" "ProfitShareLedgerStatus" NOT NULL DEFAULT 'PENDING',
    "settledAt" TIMESTAMP(3),
    "walletTransactionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProfitShareLedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserStrategySubscription_billingModel_status_idx" ON "UserStrategySubscription"("billingModel", "status");

-- CreateIndex
CREATE INDEX "UserStrategySubscription_profitShareState_idx" ON "UserStrategySubscription"("profitShareState");

-- CreateIndex
CREATE UNIQUE INDEX "ProfitShareLedgerEntry_subscriptionId_periodStart_periodEnd_key" ON "ProfitShareLedgerEntry"("subscriptionId", "periodStart", "periodEnd");

-- CreateIndex
CREATE INDEX "ProfitShareLedgerEntry_subscriptionId_periodEnd_idx" ON "ProfitShareLedgerEntry"("subscriptionId", "periodEnd");

-- CreateIndex
CREATE INDEX "ProfitShareLedgerEntry_status_periodEnd_idx" ON "ProfitShareLedgerEntry"("status", "periodEnd");

-- CreateIndex
CREATE INDEX "ProfitShareLedgerEntry_walletTransactionId_idx" ON "ProfitShareLedgerEntry"("walletTransactionId");

-- AddForeignKey
ALTER TABLE "ProfitShareLedgerEntry" ADD CONSTRAINT "ProfitShareLedgerEntry_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "UserStrategySubscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfitShareLedgerEntry" ADD CONSTRAINT "ProfitShareLedgerEntry_walletTransactionId_fkey" FOREIGN KEY ("walletTransactionId") REFERENCES "WalletTransaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
