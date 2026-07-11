-- Normalize all billing IDs to the canonical support format:
--   PRF-WLT-YYYYMMDD-XXXXXXXX
-- Rewrite PRF-LEGACY-* and any other non-canonical values.
-- Also link SupportTicket → WalletTransaction.billingId for complaint matching.

-- 1) Rewrite legacy / non-canonical billing IDs (stable from row id + createdAt)
UPDATE "WalletTransaction"
SET "billingId" = (
  'PRF-WLT-'
  || TO_CHAR(("createdAt" AT TIME ZONE 'UTC'), 'YYYYMMDD')
  || '-'
  || UPPER(SUBSTRING(MD5("id") FROM 1 FOR 8))
)
WHERE "billingId" IS NULL
   OR "billingId" = ''
   OR "billingId" LIKE 'PRF-LEGACY-%'
   OR "billingId" !~ '^PRF-WLT-[0-9]{8}-[A-Fa-f0-9]{8}$';

CREATE UNIQUE INDEX IF NOT EXISTS "WalletTransaction_billingId_key" ON "WalletTransaction"("billingId");

-- 2) Support tickets can reference the same billing ID for exact txn matching
ALTER TABLE "SupportTicket" ADD COLUMN IF NOT EXISTS "billingId" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'SupportTicket_billingId_fkey'
  ) THEN
    ALTER TABLE "SupportTicket"
      ADD CONSTRAINT "SupportTicket_billingId_fkey"
      FOREIGN KEY ("billingId") REFERENCES "WalletTransaction"("billingId")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "SupportTicket_billingId_idx" ON "SupportTicket"("billingId");
