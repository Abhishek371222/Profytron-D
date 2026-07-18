-- Coach Insights: first-party product analytics for Alpha Coach
CREATE TABLE IF NOT EXISTS "CoachInsightEvent" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "event" TEXT NOT NULL,
  "conversationId" TEXT,
  "intent" TEXT,
  "questionPreview" VARCHAR(160),
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CoachInsightEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "CoachInsightEvent_event_createdAt_idx" ON "CoachInsightEvent"("event", "createdAt");
CREATE INDEX IF NOT EXISTS "CoachInsightEvent_userId_createdAt_idx" ON "CoachInsightEvent"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "CoachInsightEvent_intent_createdAt_idx" ON "CoachInsightEvent"("intent", "createdAt");
CREATE INDEX IF NOT EXISTS "CoachInsightEvent_conversationId_createdAt_idx" ON "CoachInsightEvent"("conversationId", "createdAt");
CREATE INDEX IF NOT EXISTS "CoachInsightEvent_createdAt_idx" ON "CoachInsightEvent"("createdAt");

DO $$ BEGIN
  ALTER TABLE "CoachInsightEvent"
    ADD CONSTRAINT "CoachInsightEvent_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
