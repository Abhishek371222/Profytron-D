-- Wallet payment log support fields: unique billing ID for support tickets,
-- payment category, sender/receiver account addresses, and external txn id.

ALTER TABLE "WalletTransaction" ADD COLUMN IF NOT EXISTS "billingId" TEXT;
ALTER TABLE "WalletTransaction" ADD COLUMN IF NOT EXISTS "paymentCategory" TEXT;
ALTER TABLE "WalletTransaction" ADD COLUMN IF NOT EXISTS "senderAddress" TEXT;
ALTER TABLE "WalletTransaction" ADD COLUMN IF NOT EXISTS "receiverAddress" TEXT;
ALTER TABLE "WalletTransaction" ADD COLUMN IF NOT EXISTS "externalTxnId" TEXT;

-- Backfill unique billing IDs for existing ledger rows
UPDATE "WalletTransaction"
SET "billingId" = 'PRF-LEGACY-' || UPPER(SUBSTRING(REPLACE("id", '-', ''), 1, 12))
WHERE "billingId" IS NULL OR "billingId" = '';

UPDATE "WalletTransaction"
SET "paymentCategory" = CASE "type"::text
  WHEN 'DEPOSIT' THEN 'Wallet Deposit'
  WHEN 'WITHDRAWAL' THEN 'Wallet Withdrawal'
  WHEN 'SUBSCRIPTION_PAYMENT' THEN 'Subscription Payment'
  WHEN 'TRADING_PNL' THEN 'Trading P&L'
  WHEN 'COMMISSION' THEN 'Commission'
  WHEN 'MARKETPLACE_SALE' THEN 'Marketplace Sale'
  ELSE 'Other'
END
WHERE "paymentCategory" IS NULL;

UPDATE "WalletTransaction"
SET
  "senderAddress" = CASE
    WHEN "direction"::text = 'IN' THEN 'USR-ACCT-' || UPPER(SUBSTRING(REPLACE("userId", '-', ''), 1, 10))
    ELSE 'PRF-CO-ACCT-IN91-000987654321'
  END,
  "receiverAddress" = CASE
    WHEN "direction"::text = 'IN' THEN 'PRF-CO-ACCT-IN91-000987654321'
    ELSE 'USR-ACCT-' || UPPER(SUBSTRING(REPLACE("userId", '-', ''), 1, 10))
  END
WHERE "senderAddress" IS NULL OR "receiverAddress" IS NULL;

UPDATE "WalletTransaction"
SET "externalTxnId" = COALESCE("stripePaymentId", "razorpayOrderId", "reference")
WHERE "externalTxnId" IS NULL;

ALTER TABLE "WalletTransaction" ALTER COLUMN "billingId" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "WalletTransaction_billingId_key" ON "WalletTransaction"("billingId");
CREATE INDEX IF NOT EXISTS "WalletTransaction_billingId_idx" ON "WalletTransaction"("billingId");
CREATE INDEX IF NOT EXISTS "WalletTransaction_externalTxnId_idx" ON "WalletTransaction"("externalTxnId");
