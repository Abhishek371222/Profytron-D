-- User activation milestones for growth analytics
CREATE TABLE IF NOT EXISTS "UserActivationEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserActivationEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "UserActivationEvent_userId_event_key" ON "UserActivationEvent"("userId", "event");
CREATE INDEX IF NOT EXISTS "UserActivationEvent_userId_idx" ON "UserActivationEvent"("userId");
CREATE INDEX IF NOT EXISTS "UserActivationEvent_event_idx" ON "UserActivationEvent"("event");
CREATE INDEX IF NOT EXISTS "UserActivationEvent_createdAt_idx" ON "UserActivationEvent"("createdAt");

ALTER TABLE "UserActivationEvent" ADD CONSTRAINT "UserActivationEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
