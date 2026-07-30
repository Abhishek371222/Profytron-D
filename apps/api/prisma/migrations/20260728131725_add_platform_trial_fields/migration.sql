-- AlterTable
ALTER TABLE "User" ADD COLUMN     "hasUsedPlatformTrial" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "UserSubscription" ADD COLUMN     "isTrial" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "trialConversionFailedAt" TIMESTAMP(3),
ADD COLUMN     "trialConvertedAt" TIMESTAMP(3),
ADD COLUMN     "trialEndsAt" TIMESTAMP(3),
ADD COLUMN     "trialStartedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "UserSubscription_isTrial_trialEndsAt_idx" ON "UserSubscription"("isTrial", "trialEndsAt");
