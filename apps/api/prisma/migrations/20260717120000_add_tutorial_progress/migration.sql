-- CreateEnum
CREATE TYPE "TutorialStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED');

-- CreateTable
CREATE TABLE "TutorialProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tourId" TEXT NOT NULL DEFAULT 'main',
    "status" "TutorialStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "currentStepId" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TutorialProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TutorialProgress_userId_tourId_key" ON "TutorialProgress"("userId", "tourId");

-- CreateIndex
CREATE INDEX "TutorialProgress_userId_idx" ON "TutorialProgress"("userId");

-- AddForeignKey
ALTER TABLE "TutorialProgress" ADD CONSTRAINT "TutorialProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
