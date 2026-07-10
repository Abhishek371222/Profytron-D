-- CreateEnum
CREATE TYPE "AffiliateFunnelEventType" AS ENUM ('CLICK', 'SIGNUP', 'CONVERSION', 'PAYOUT');

-- CreateTable
CREATE TABLE "AffiliateFunnelEvent" (
    "id" TEXT NOT NULL,
    "referrerId" TEXT NOT NULL,
    "refereeId" TEXT,
    "eventType" "AffiliateFunnelEventType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sourceRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AffiliateFunnelEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AffiliateFunnelEvent_sourceRef_key" ON "AffiliateFunnelEvent"("sourceRef");

-- CreateIndex
CREATE INDEX "AffiliateFunnelEvent_referrerId_createdAt_idx" ON "AffiliateFunnelEvent"("referrerId", "createdAt");

-- CreateIndex
CREATE INDEX "AffiliateFunnelEvent_referrerId_eventType_idx" ON "AffiliateFunnelEvent"("referrerId", "eventType");

-- AddForeignKey
ALTER TABLE "AffiliateFunnelEvent" ADD CONSTRAINT "AffiliateFunnelEvent_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliateFunnelEvent" ADD CONSTRAINT "AffiliateFunnelEvent_refereeId_fkey" FOREIGN KEY ("refereeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
