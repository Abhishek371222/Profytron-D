-- Backfills migration history for platform subscription/support response
-- tables that already existed in the live development database from earlier
-- db-push usage. This keeps shadow-database replay ordered before
-- 20260711000000_add_payment_invoice_support_ticket_tables, which adds
-- Payment/Invoice/SupportTicket and completes the remaining foreign keys.

-- CreateTable
CREATE TABLE "SubscriptionPlan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "monthlyPrice" DOUBLE PRECISION NOT NULL,
    "annualPrice" DOUBLE PRECISION,
    "features" JSONB NOT NULL,
    "maxStrategies" INTEGER NOT NULL DEFAULT 10,
    "maxCopyTrades" INTEGER NOT NULL DEFAULT 50,
    "prioritySupport" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "paymentId" TEXT,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "billingCycle" TEXT NOT NULL DEFAULT 'MONTHLY',
    "autoRenewal" BOOLEAN NOT NULL DEFAULT true,
    "razorpaySubId" TEXT,
    "subscribedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "cancelledAt" TIMESTAMP(3),
    "nextBillingAt" TIMESTAMP(3),

    CONSTRAINT "UserSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportTicketResponse" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupportTicketResponse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionPlan_name_key" ON "SubscriptionPlan"("name");

-- CreateIndex
CREATE INDEX "SubscriptionPlan_name_idx" ON "SubscriptionPlan"("name");

-- CreateIndex
CREATE UNIQUE INDEX "UserSubscription_razorpaySubId_key" ON "UserSubscription"("razorpaySubId");

-- CreateIndex
CREATE UNIQUE INDEX "UserSubscription_userId_planId_key" ON "UserSubscription"("userId", "planId");

-- CreateIndex
CREATE INDEX "UserSubscription_status_expiresAt_idx" ON "UserSubscription"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "SupportTicketResponse_ticketId_idx" ON "SupportTicketResponse"("ticketId");

-- CreateIndex
CREATE INDEX "SupportTicketResponse_userId_idx" ON "SupportTicketResponse"("userId");

-- AddForeignKey
ALTER TABLE "UserSubscription" ADD CONSTRAINT "UserSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSubscription" ADD CONSTRAINT "UserSubscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SubscriptionPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
