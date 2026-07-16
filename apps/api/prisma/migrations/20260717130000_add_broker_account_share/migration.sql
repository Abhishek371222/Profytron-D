-- CreateEnum
CREATE TYPE "ShareStatus" AS ENUM ('PENDING', 'ACTIVE', 'DECLINED', 'REVOKED');

-- CreateTable
CREATE TABLE "BrokerAccountShare" (
    "id" TEXT NOT NULL,
    "brokerAccountId" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "memberUserId" TEXT,
    "inviteEmail" TEXT NOT NULL,
    "status" "ShareStatus" NOT NULL DEFAULT 'PENDING',
    "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrokerAccountShare_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BrokerAccountShare_brokerAccountId_inviteEmail_key" ON "BrokerAccountShare"("brokerAccountId", "inviteEmail");

-- CreateIndex
CREATE INDEX "BrokerAccountShare_memberUserId_status_idx" ON "BrokerAccountShare"("memberUserId", "status");

-- CreateIndex
CREATE INDEX "BrokerAccountShare_ownerUserId_idx" ON "BrokerAccountShare"("ownerUserId");

-- CreateIndex
CREATE INDEX "BrokerAccountShare_inviteEmail_idx" ON "BrokerAccountShare"("inviteEmail");

-- AddForeignKey
ALTER TABLE "BrokerAccountShare" ADD CONSTRAINT "BrokerAccountShare_brokerAccountId_fkey" FOREIGN KEY ("brokerAccountId") REFERENCES "BrokerAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrokerAccountShare" ADD CONSTRAINT "BrokerAccountShare_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrokerAccountShare" ADD CONSTRAINT "BrokerAccountShare_memberUserId_fkey" FOREIGN KEY ("memberUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
