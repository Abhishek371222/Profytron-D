-- AI Workforce tables
CREATE TYPE "AgentType" AS ENUM ('CEO', 'PRODUCT', 'CUSTOMER_SUCCESS', 'SUPPORT', 'MARKETING', 'SEO', 'SECURITY', 'ANALYTICS', 'BILLING', 'DEVOPS');
CREATE TYPE "AgentJobStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'SKIPPED_NO_AI', 'FAILED', 'DEAD_LETTER');

CREATE TABLE "AgentEventOutbox" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "userId" TEXT,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "idempotencyKey" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AgentEventOutbox_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AgentEventOutbox_idempotencyKey_key" ON "AgentEventOutbox"("idempotencyKey");
CREATE INDEX "AgentEventOutbox_processedAt_createdAt_idx" ON "AgentEventOutbox"("processedAt", "createdAt");
CREATE INDEX "AgentEventOutbox_eventType_createdAt_idx" ON "AgentEventOutbox"("eventType", "createdAt");

CREATE TABLE "AgentJob" (
    "id" TEXT NOT NULL,
    "agentType" "AgentType" NOT NULL,
    "eventType" TEXT NOT NULL,
    "entityId" TEXT,
    "userId" TEXT,
    "status" "AgentJobStatus" NOT NULL DEFAULT 'PENDING',
    "gateSource" TEXT,
    "modelLevel" TEXT,
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "costUsd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "latencyMs" INTEGER,
    "errorMessage" TEXT,
    "resultJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    CONSTRAINT "AgentJob_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AgentJob_agentType_status_createdAt_idx" ON "AgentJob"("agentType", "status", "createdAt");
CREATE INDEX "AgentJob_userId_createdAt_idx" ON "AgentJob"("userId", "createdAt");

CREATE TABLE "AgentInsight" (
    "id" TEXT NOT NULL,
    "agentType" "AgentType" NOT NULL,
    "scope" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "dataJson" JSONB NOT NULL DEFAULT '{}',
    "validUntil" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AgentInsight_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AgentInsight_agentType_scope_createdAt_idx" ON "AgentInsight"("agentType", "scope", "createdAt");

CREATE TABLE "DailyMetricsSnapshot" (
    "date" DATE NOT NULL,
    "mrr" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "arr" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "newUsers" INTEGER NOT NULL DEFAULT 0,
    "churnedUsers" INTEGER NOT NULL DEFAULT 0,
    "activationRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "depositsInr" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "supportTickets" INTEGER NOT NULL DEFAULT 0,
    "errorRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DailyMetricsSnapshot_pkey" PRIMARY KEY ("date")
);

CREATE TABLE "SupportKnowledgeChunk" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SupportKnowledgeChunk_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SupportKnowledgeChunk_slug_key" ON "SupportKnowledgeChunk"("slug");

CREATE TABLE "AgentBudget" (
    "agentType" "AgentType" NOT NULL,
    "dailyTokenCap" INTEGER NOT NULL DEFAULT 10000,
    "dailyCostCapUsd" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "tokensUsedToday" INTEGER NOT NULL DEFAULT 0,
    "costUsedTodayUsd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "resetAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AgentBudget_pkey" PRIMARY KEY ("agentType")
);
