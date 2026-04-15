-- Guard migration for environments that drifted from Prisma schema.
-- Keeps API paths using fullName/bio/copiesCount from crashing at runtime.

ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "fullName" TEXT;

ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "bio" TEXT;

UPDATE "User"
SET "fullName" = COALESCE(
  NULLIF("fullName", ''),
  NULLIF(split_part("email", '@', 1), ''),
  'User'
)
WHERE "fullName" IS NULL OR "fullName" = '';

ALTER TABLE "User"
ALTER COLUMN "fullName" SET NOT NULL;

ALTER TABLE "Strategy"
ADD COLUMN IF NOT EXISTS "copiesCount" INTEGER NOT NULL DEFAULT 0;
