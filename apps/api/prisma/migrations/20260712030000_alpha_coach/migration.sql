-- Alpha Coach: conversations, FAQ bank, escalations

CREATE TYPE "CoachConversationStatus" AS ENUM ('ACTIVE', 'ESCALATED', 'CLOSED');
CREATE TYPE "CoachMessageRole" AS ENUM ('USER', 'ASSISTANT', 'EXECUTIVE', 'SYSTEM');
CREATE TYPE "CoachMessageSource" AS ENUM ('FAQ', 'AI', 'HUMAN', 'SYSTEM');
CREATE TYPE "CoachEscalationStatus" AS ENUM ('OPEN', 'CLAIMED', 'RESOLVED');

CREATE TABLE "CoachConversation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'New coaching session',
    "status" "CoachConversationStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoachConversation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CoachFaqAnswer" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoachFaqAnswer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CoachFaqQuestion" (
    "id" TEXT NOT NULL,
    "answerId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "normalized" TEXT NOT NULL,
    "keywords" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoachFaqQuestion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CoachMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" "CoachMessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "source" "CoachMessageSource" NOT NULL DEFAULT 'SYSTEM',
    "faqAnswerId" TEXT,
    "senderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoachMessage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CoachEscalation" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "CoachEscalationStatus" NOT NULL DEFAULT 'OPEN',
    "claimedById" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "CoachEscalation_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CoachConversation_userId_updatedAt_idx" ON "CoachConversation"("userId", "updatedAt");
CREATE INDEX "CoachConversation_status_idx" ON "CoachConversation"("status");
CREATE INDEX "CoachFaqAnswer_category_idx" ON "CoachFaqAnswer"("category");
CREATE INDEX "CoachFaqQuestion_answerId_idx" ON "CoachFaqQuestion"("answerId");
CREATE INDEX "CoachFaqQuestion_normalized_idx" ON "CoachFaqQuestion"("normalized");
CREATE INDEX "CoachMessage_conversationId_createdAt_idx" ON "CoachMessage"("conversationId", "createdAt");
CREATE INDEX "CoachMessage_senderId_idx" ON "CoachMessage"("senderId");
CREATE INDEX "CoachEscalation_status_createdAt_idx" ON "CoachEscalation"("status", "createdAt");
CREATE INDEX "CoachEscalation_userId_idx" ON "CoachEscalation"("userId");
CREATE INDEX "CoachEscalation_conversationId_idx" ON "CoachEscalation"("conversationId");
CREATE INDEX "CoachEscalation_claimedById_idx" ON "CoachEscalation"("claimedById");

ALTER TABLE "CoachConversation" ADD CONSTRAINT "CoachConversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CoachFaqQuestion" ADD CONSTRAINT "CoachFaqQuestion_answerId_fkey" FOREIGN KEY ("answerId") REFERENCES "CoachFaqAnswer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CoachMessage" ADD CONSTRAINT "CoachMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "CoachConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CoachMessage" ADD CONSTRAINT "CoachMessage_faqAnswerId_fkey" FOREIGN KEY ("faqAnswerId") REFERENCES "CoachFaqAnswer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CoachMessage" ADD CONSTRAINT "CoachMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CoachEscalation" ADD CONSTRAINT "CoachEscalation_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "CoachConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CoachEscalation" ADD CONSTRAINT "CoachEscalation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CoachEscalation" ADD CONSTRAINT "CoachEscalation_claimedById_fkey" FOREIGN KEY ("claimedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
