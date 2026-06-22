-- Safe additive sync: extra enums, columns, and post-init Profytron tables.

DO $$ BEGIN CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "PaymentMethod" AS ENUM ('UPI', 'CARD', 'NETBANKING', 'WALLET', 'CRYPTO', 'STRIPE', 'PAYPAL'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "SupportTicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "SupportTicketPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "StrategyNodeType" AS ENUM ('ENTRY', 'EXIT', 'INDICATOR', 'CONDITION', 'ACTION'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "VpsProvider" AS ENUM ('AWS', 'DIGITALOCEAN', 'LINODE', 'VULTR', 'CUSTOM'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "BotStatus" AS ENUM ('RUNNING', 'STOPPED', 'ERROR', 'PAUSED'); EXCEPTION WHEN duplicate_object THEN null; END $$;

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "passwordHash" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "twoFactorEnabled" BOOLEAN DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "twoFactorSecret" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "twoFactorBackupCodes" JSONB;
ALTER TABLE "BrokerAccount" ADD COLUMN IF NOT EXISTS "isMasterSource" BOOLEAN DEFAULT false;
ALTER TABLE "MarketplaceListing" ADD COLUMN IF NOT EXISTS "creatorSharePct" DOUBLE PRECISION DEFAULT 0.8;
ALTER TABLE "MarketplaceListing" ADD COLUMN IF NOT EXISTS "platformSharePct" DOUBLE PRECISION DEFAULT 0.2;
ALTER TABLE "MarketplaceListing" ADD COLUMN IF NOT EXISTS "payoutEnabled" BOOLEAN DEFAULT true;
ALTER TABLE "MarketplaceListing" ADD COLUMN IF NOT EXISTS "lastPayoutAt" TIMESTAMP(3);
ALTER TABLE "UserStrategySubscription" ADD COLUMN IF NOT EXISTS "riskOverrideEnabled" BOOLEAN DEFAULT false;
ALTER TABLE "UserStrategySubscription" ADD COLUMN IF NOT EXISTS "maxDrawdownPct" DOUBLE PRECISION;
ALTER TABLE "UserStrategySubscription" ADD COLUMN IF NOT EXISTS "excludedSymbolsJson" JSONB;
ALTER TABLE "UserStrategySubscription" ADD COLUMN IF NOT EXISTS "slippageBps" DOUBLE PRECISION DEFAULT 0;
ALTER TABLE "UserStrategySubscription" ADD COLUMN IF NOT EXISTS "executionPriority" INTEGER DEFAULT 0;
ALTER TABLE "UserStrategySubscription" ADD COLUMN IF NOT EXISTS "latencyLimitMs" INTEGER;
ALTER TABLE "UserStrategySubscription" ADD COLUMN IF NOT EXISTS "lastLatencyMs" INTEGER;
ALTER TABLE "UserStrategySubscription" ADD COLUMN IF NOT EXISTS "lastExecutionAt" TIMESTAMP(3);
ALTER TABLE "UserStrategySubscription" ADD COLUMN IF NOT EXISTS "riskPolicyJson" JSONB;
ALTER TABLE "UserStrategySubscription" ADD COLUMN IF NOT EXISTS "executionProfileJson" JSONB;
ALTER TABLE "Trade" ADD COLUMN IF NOT EXISTS "requestedPrice" DOUBLE PRECISION;
ALTER TABLE "Trade" ADD COLUMN IF NOT EXISTS "fillPrice" DOUBLE PRECISION;
ALTER TABLE "Trade" ADD COLUMN IF NOT EXISTS "slippageBps" DOUBLE PRECISION DEFAULT 0;
ALTER TABLE "Trade" ADD COLUMN IF NOT EXISTS "executionLatencyMs" INTEGER;
ALTER TABLE "Trade" ADD COLUMN IF NOT EXISTS "icebergSliceIndex" INTEGER;
ALTER TABLE "Trade" ADD COLUMN IF NOT EXISTS "icebergSliceCount" INTEGER;
ALTER TABLE "Trade" ADD COLUMN IF NOT EXISTS "executionMode" TEXT;
ALTER TABLE "Trade" ADD COLUMN IF NOT EXISTS "executionMetadataJson" JSONB;

CREATE TABLE IF NOT EXISTS "UserFcmToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "platform" TEXT NOT NULL DEFAULT 'web',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "UserFcmToken_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "UserFcmToken_token_key" ON "UserFcmToken"("token");
CREATE INDEX IF NOT EXISTS "UserFcmToken_userId_idx" ON "UserFcmToken"("userId");

CREATE TABLE IF NOT EXISTS "LeaderboardEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "winRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalPnl" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sharpeRatio" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalTrades" INTEGER NOT NULL DEFAULT 0,
    "profitFactor" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "maxDrawdown" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "LeaderboardEntry_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "LeaderboardEntry_userId_period_key" ON "LeaderboardEntry"("userId", "period");
CREATE INDEX IF NOT EXISTS "LeaderboardEntry_period_rank_idx" ON "LeaderboardEntry"("period", "rank");

CREATE TABLE IF NOT EXISTS "SubscriptionPlan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "monthlyPrice" DOUBLE PRECISION NOT NULL,
    "annualPrice" DOUBLE PRECISION,
    "features" JSONB NOT NULL,
    "maxStrategies" INTEGER NOT NULL DEFAULT 10,
    "maxCopyTrades" INTEGER NOT NULL DEFAULT 50,
    "prioritySupport" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SubscriptionPlan_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "SubscriptionPlan_name_key" ON "SubscriptionPlan"("name");

CREATE TABLE IF NOT EXISTS "UserSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "paymentId" TEXT,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "billingCycle" TEXT NOT NULL DEFAULT 'MONTHLY',
    "autoRenewal" BOOLEAN NOT NULL DEFAULT true,
    "razorpaySubId" TEXT,
    "subscribedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "cancelledAt" TIMESTAMP(3),
    "nextBillingAt" TIMESTAMP(3),
    CONSTRAINT "UserSubscription_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "UserSubscription_userId_planId_key" ON "UserSubscription"("userId", "planId");

CREATE TABLE IF NOT EXISTS "TraderProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bio" TEXT,
    "headline" TEXT,
    "followers" INTEGER NOT NULL DEFAULT 0,
    "following" INTEGER NOT NULL DEFAULT 0,
    "totalTrades" INTEGER NOT NULL DEFAULT 0,
    "winRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgRr" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalPnl" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "monthlyReturn" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "badges" JSONB NOT NULL DEFAULT '[]',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedPnlProof" TEXT,
    "socialLinks" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TraderProfile_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "TraderProfile_userId_key" ON "TraderProfile"("userId");

CREATE TABLE IF NOT EXISTS "SocialComment" (
    "id" TEXT NOT NULL,
    "tradeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "replyToId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SocialComment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "SocialFollow" (
    "id" TEXT NOT NULL,
    "followerId" TEXT NOT NULL,
    "followingId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SocialFollow_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "SocialFollow_followerId_followingId_key" ON "SocialFollow"("followerId", "followingId");

CREATE TABLE IF NOT EXISTS "SupportTicketResponse" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SupportTicketResponse_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "StrategyBuilder" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" "StrategyCategory" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "StrategyBuilder_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "StrategyNode" (
    "id" TEXT NOT NULL,
    "builderId" TEXT NOT NULL,
    "nodeType" "StrategyNodeType" NOT NULL,
    "position" JSONB NOT NULL,
    "config" JSONB NOT NULL,
    "label" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StrategyNode_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "StrategyEdge" (
    "id" TEXT NOT NULL,
    "builderId" TEXT NOT NULL,
    "fromNodeId" TEXT NOT NULL,
    "toNodeId" TEXT NOT NULL,
    CONSTRAINT "StrategyEdge_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "VpsAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" "VpsProvider" NOT NULL,
    "instanceId" TEXT NOT NULL,
    "hostname" TEXT,
    "status" "BotStatus" NOT NULL DEFAULT 'STOPPED',
    "cpuCores" INTEGER NOT NULL DEFAULT 2,
    "memoryGb" INTEGER NOT NULL DEFAULT 4,
    "ipAddress" TEXT,
    "sshKey" TEXT,
    "credential" TEXT,
    "monthlyPrice" DOUBLE PRECISION NOT NULL,
    "accessToken" TEXT,
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "VpsAccount_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "BotInstance" (
    "id" TEXT NOT NULL,
    "vpsId" TEXT NOT NULL,
    "strategyId" TEXT,
    "name" TEXT NOT NULL,
    "status" "BotStatus" NOT NULL DEFAULT 'STOPPED',
    "logPath" TEXT,
    "processPid" INTEGER,
    "startedAt" TIMESTAMP(3),
    "stoppedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BotInstance_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AiRiskPolicy" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "maxDailyLossUsd" DOUBLE PRECISION,
    "maxDailyLossPct" DOUBLE PRECISION,
    "maxDrawdownPct" DOUBLE PRECISION,
    "autoStopAfterLoss" BOOLEAN NOT NULL DEFAULT false,
    "autoStopAfterWin" BOOLEAN NOT NULL DEFAULT false,
    "riskPerTradePct" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "maxOpenTrades" INTEGER NOT NULL DEFAULT 10,
    "minWinRate" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AiRiskPolicy_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "AiRiskPolicy_userId_key" ON "AiRiskPolicy"("userId");

CREATE TABLE IF NOT EXISTS "UserPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',
    "theme" TEXT NOT NULL DEFAULT 'dark',
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "pushNotifications" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "UserPreference_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "UserPreference_userId_key" ON "UserPreference"("userId");

CREATE TABLE IF NOT EXISTS "BrokerApiCredential" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "broker" "BrokerName" NOT NULL,
    "apiKey" TEXT NOT NULL,
    "secretKey" TEXT NOT NULL,
    "passphrase" TEXT,
    "testnet" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BrokerApiCredential_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "BrokerApiCredential_userId_broker_key" ON "BrokerApiCredential"("userId", "broker");

CREATE TABLE IF NOT EXISTS "TradeJournalEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tradeId" TEXT,
    "emotions" TEXT,
    "lessonLearned" TEXT,
    "screenshotUrl" TEXT,
    "aiAnalysis" TEXT,
    "rating" SMALLINT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TradeJournalEntry_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "TradeJournalEntry_tradeId_key" ON "TradeJournalEntry"("tradeId");

CREATE TABLE IF NOT EXISTS "WebhookEvent" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "userId" TEXT,
    "payload" JSONB NOT NULL,
    "delivered" BOOLEAN NOT NULL DEFAULT false,
    "deliveredAt" TIMESTAMP(3),
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WebhookEvent_pkey" PRIMARY KEY ("id")
);

CREATE OR REPLACE FUNCTION sync_user_legacy_fields()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW."name" IS NULL OR NEW."name" = '' THEN
    NEW."name" := COALESCE(NULLIF(NEW."fullName", ''), split_part(NEW.email, '@', 1), 'User');
  END IF;
  IF NEW."fullName" IS NULL OR NEW."fullName" = '' THEN
    NEW."fullName" := NEW."name";
  END IF;
  IF NEW."supabaseId" IS NULL OR NEW."supabaseId" = '' THEN
    NEW."supabaseId" := NEW.id;
  END IF;
  IF NEW."referralCode" IS NULL OR NEW."referralCode" = '' THEN
    NEW."referralCode" := gen_random_uuid()::text;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS user_legacy_fields_trigger ON "User";
CREATE TRIGGER user_legacy_fields_trigger
  BEFORE INSERT OR UPDATE ON "User"
  FOR EACH ROW EXECUTE FUNCTION sync_user_legacy_fields();

-- ───────────────────────────────────────────────────────────────────────────
-- Additive sync for models/columns/enums added after the original supplement.
-- All statements are idempotent (IF NOT EXISTS / ADD VALUE IF NOT EXISTS).
-- ───────────────────────────────────────────────────────────────────────────

-- Enum value additions used by current code paths.
ALTER TYPE "SubscriptionStatus" ADD VALUE IF NOT EXISTS 'PAUSED';
ALTER TYPE "BrokerName" ADD VALUE IF NOT EXISTS 'MT4';
ALTER TYPE "BrokerName" ADD VALUE IF NOT EXISTS 'MT5';

-- Notification columns added after init (code writes category/isSeen/priority/icon).
ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "category" TEXT NOT NULL DEFAULT 'SYSTEM';
ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "priority" TEXT NOT NULL DEFAULT 'NORMAL';
ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "icon" TEXT;
ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "isSeen" BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS "Notification_userId_category_idx" ON "Notification"("userId", "category");

CREATE TABLE IF NOT EXISTS "NotificationPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "inAppEnabled" BOOLEAN NOT NULL DEFAULT true,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "pushEnabled" BOOLEAN NOT NULL DEFAULT true,
    "securityAlerts" BOOLEAN NOT NULL DEFAULT true,
    "tradingAlerts" BOOLEAN NOT NULL DEFAULT true,
    "paymentAlerts" BOOLEAN NOT NULL DEFAULT true,
    "systemAlerts" BOOLEAN NOT NULL DEFAULT true,
    "marketingAlerts" BOOLEAN NOT NULL DEFAULT false,
    "accountAlerts" BOOLEAN NOT NULL DEFAULT true,
    "quietHoursEnabled" BOOLEAN NOT NULL DEFAULT false,
    "quietHoursStart" TEXT NOT NULL DEFAULT '22:00',
    "quietHoursEnd" TEXT NOT NULL DEFAULT '07:00',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "NotificationPreference_userId_key" ON "NotificationPreference"("userId");

CREATE TABLE IF NOT EXISTS "NotificationLog" (
    "id" TEXT NOT NULL,
    "notificationId" TEXT,
    "userId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SENT',
    "providerResponse" JSONB,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NotificationLog_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "NotificationLog_userId_sentAt_idx" ON "NotificationLog"("userId", "sentAt");
CREATE INDEX IF NOT EXISTS "NotificationLog_notificationId_idx" ON "NotificationLog"("notificationId");
CREATE INDEX IF NOT EXISTS "NotificationLog_channel_status_idx" ON "NotificationLog"("channel", "status");

CREATE TABLE IF NOT EXISTS "EmailLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "to" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SENT',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EmailLog_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "EmailLog_userId_createdAt_idx" ON "EmailLog"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "EmailLog_to_createdAt_idx" ON "EmailLog"("to", "createdAt");
CREATE INDEX IF NOT EXISTS "EmailLog_type_createdAt_idx" ON "EmailLog"("type", "createdAt");

CREATE TABLE IF NOT EXISTS "FeatureFlag" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "rolloutPct" INTEGER NOT NULL DEFAULT 0,
    "userIds" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "FeatureFlag_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "FeatureFlag_key_key" ON "FeatureFlag"("key");
CREATE INDEX IF NOT EXISTS "FeatureFlag_enabled_idx" ON "FeatureFlag"("enabled");

CREATE TABLE IF NOT EXISTS "ApiKey" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "keyPrefix" TEXT NOT NULL,
    "scopes" TEXT[],
    "lastUsedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "ApiKey_keyHash_key" ON "ApiKey"("keyHash");
CREATE INDEX IF NOT EXISTS "ApiKey_userId_idx" ON "ApiKey"("userId");
CREATE INDEX IF NOT EXISTS "ApiKey_keyHash_idx" ON "ApiKey"("keyHash");
