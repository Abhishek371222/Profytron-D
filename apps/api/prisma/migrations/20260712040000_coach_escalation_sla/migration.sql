-- Alpha Coach executive SLA fields
ALTER TABLE "CoachEscalation" ADD COLUMN IF NOT EXISTS "slaDeadline" TIMESTAMP(3);
ALTER TABLE "CoachEscalation" ADD COLUMN IF NOT EXISTS "claimedAt" TIMESTAMP(3);

-- Backfill open escalations with a 15-minute SLA from creation
UPDATE "CoachEscalation"
SET "slaDeadline" = "createdAt" + INTERVAL '15 minutes'
WHERE "slaDeadline" IS NULL AND "status" IN ('OPEN', 'CLAIMED');
