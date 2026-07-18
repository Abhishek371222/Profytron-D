-- Phase 2 DB-P2-DUP-IX: drop non-unique twin indexes where @unique / UNIQUE constraint already covers the same columns.
-- Unique indexes retained. Decision evidence: docs/database-audit/phase2/INDEX_OPTIMIZATION.md

DROP INDEX IF EXISTS "User_email_idx";
DROP INDEX IF EXISTS "User_referralCode_idx";
DROP INDEX IF EXISTS "StrategyPerformance_strategyId_date_idx";
DROP INDEX IF EXISTS "WalletTransaction_billingId_idx";
DROP INDEX IF EXISTS "WalletTransaction_idempotencyKey_idx";
DROP INDEX IF EXISTS "Invoice_invoiceNumber_idx";
DROP INDEX IF EXISTS "SubscriptionPlan_name_idx";
DROP INDEX IF EXISTS "TraderProfile_userId_idx";
DROP INDEX IF EXISTS "AiRiskPolicy_userId_idx";
DROP INDEX IF EXISTS "UserPreference_userId_idx";
DROP INDEX IF EXISTS "FeatureFlag_key_idx";
DROP INDEX IF EXISTS "ApiKey_keyHash_idx";
DROP INDEX IF EXISTS "MasterProfile_userId_idx";
-- Duplicate non-unique indexes from successive snapshot migrations (same columns)
DROP INDEX IF EXISTS "AccountSnapshotMarketData_brokerAccountId_symbol_tick_idx";
