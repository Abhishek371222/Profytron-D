-- Enterprise bot platform: provisioning states, strategy documents, idempotency

-- AlterEnum
ALTER TYPE "SubscriptionStatus" ADD VALUE IF NOT EXISTS 'PROVISIONING';
ALTER TYPE "SubscriptionStatus" ADD VALUE IF NOT EXISTS 'FAILED';

-- CreateTable
CREATE TABLE "StrategyDocument" (
    "id" TEXT NOT NULL,
    "strategyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "storageKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL DEFAULT 'application/pdf',
    "fileSizeBytes" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "uploadedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StrategyDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProvisioningJob" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProvisioningJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentIdempotency" (
    "idempotencyKey" TEXT NOT NULL,
    "paymentId" TEXT,
    "status" TEXT NOT NULL,
    "responseJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentIdempotency_pkey" PRIMARY KEY ("idempotencyKey")
);

-- CreateIndex
CREATE INDEX "StrategyDocument_strategyId_isPublished_sortOrder_idx" ON "StrategyDocument"("strategyId", "isPublished", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "ProvisioningJob_subscriptionId_key" ON "ProvisioningJob"("subscriptionId");

-- CreateIndex
CREATE INDEX "ProvisioningJob_status_createdAt_idx" ON "ProvisioningJob"("status", "createdAt");

-- CreateIndex
CREATE INDEX "PaymentIdempotency_expiresAt_idx" ON "PaymentIdempotency"("expiresAt");

-- AddForeignKey
ALTER TABLE "StrategyDocument" ADD CONSTRAINT "StrategyDocument_strategyId_fkey" FOREIGN KEY ("strategyId") REFERENCES "Strategy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProvisioningJob" ADD CONSTRAINT "ProvisioningJob_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "UserStrategySubscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;
