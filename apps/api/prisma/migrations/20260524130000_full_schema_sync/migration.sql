-- CreateEnum
CREATE TYPE "MarketRegime" AS ENUM ('TRENDING', 'RANGING', 'VOLATILE', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "BrokerName" AS ENUM ('PAPER', 'BINANCE', 'BYBIT', 'KUCOIN', 'INTERACTIVE_BROKERS');

-- CreateEnum
CREATE TYPE "StrategyCategory" AS ENUM ('TREND', 'SCALPING', 'RANGE', 'VOLATILITY', 'ARBITRAGE');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'EXPERT');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('UNVERIFIED', 'PENDING', 'VERIFIED');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "TradeDirection" AS ENUM ('LONG', 'SHORT');

-- CreateEnum
CREATE TYPE "TradeStatus" AS ENUM ('OPEN', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('DEPOSIT', 'WITHDRAWAL', 'SUBSCRIPTION_PAYMENT', 'TRADING_PNL', 'COMMISSION', 'MARKETPLACE_SALE');

-- CreateEnum
CREATE TYPE "TransactionDirection" AS ENUM ('IN', 'OUT');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'CONFIRMED', 'FAILED');

-- CreateEnum
CREATE TYPE "AffiliateTier" AS ENUM ('STARTER', 'PRO', 'ELITE');

-- CreateEnum
CREATE TYPE "AchievementTier" AS ENUM ('BRONZE', 'SILVER', 'GOLD');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('INFO', 'WARNING', 'SUCCESS', 'ERROR');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('UPI', 'CARD', 'NETBANKING', 'WALLET', 'CRYPTO', 'STRIPE', 'PAYPAL');

-- CreateEnum
CREATE TYPE "SupportTicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "SupportTicketPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "StrategyNodeType" AS ENUM ('ENTRY', 'EXIT', 'INDICATOR', 'CONDITION', 'ACTION');

-- CreateEnum
CREATE TYPE "VpsProvider" AS ENUM ('AWS', 'DIGITALOCEAN', 'LINODE', 'VULTR', 'CUSTOM');

-- CreateEnum
CREATE TYPE "BotStatus" AS ENUM ('RUNNING', 'STOPPED', 'ERROR', 'PAUSED');

-- DropForeignKey
ALTER TABLE "ActivityLog" DROP CONSTRAINT "ActivityLog_leadId_fkey";

-- DropForeignKey
ALTER TABLE "ActivityLog" DROP CONSTRAINT "ActivityLog_userId_fkey";

-- DropForeignKey
ALTER TABLE "BusinessLocation" DROP CONSTRAINT "BusinessLocation_supplierId_fkey";

-- DropForeignKey
ALTER TABLE "Buyer" DROP CONSTRAINT "Buyer_userId_fkey";

-- DropForeignKey
ALTER TABLE "CollectionStaff" DROP CONSTRAINT "CollectionStaff_userId_fkey";

-- DropForeignKey
ALTER TABLE "EmailLog" DROP CONSTRAINT "EmailLog_leadId_fkey";

-- DropForeignKey
ALTER TABLE "Invoice" DROP CONSTRAINT "Invoice_buyerId_fkey";

-- DropForeignKey
ALTER TABLE "Invoice" DROP CONSTRAINT "Invoice_saleId_fkey";

-- DropForeignKey
ALTER TABLE "Invoice" DROP CONSTRAINT "Invoice_supplierId_fkey";

-- DropForeignKey
ALTER TABLE "Lead" DROP CONSTRAINT "Lead_createdById_fkey";

-- DropForeignKey
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_userId_fkey";

-- DropForeignKey
ALTER TABLE "OilBatch" DROP CONSTRAINT "OilBatch_pickupId_fkey";

-- DropForeignKey
ALTER TABLE "OilBatch" DROP CONSTRAINT "OilBatch_supplierId_fkey";

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_invoiceId_fkey";

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_supplierId_fkey";

-- DropForeignKey
ALTER TABLE "PickupAssignment" DROP CONSTRAINT "PickupAssignment_pickupId_fkey";

-- DropForeignKey
ALTER TABLE "PickupAssignment" DROP CONSTRAINT "PickupAssignment_routeId_fkey";

-- DropForeignKey
ALTER TABLE "PickupAssignment" DROP CONSTRAINT "PickupAssignment_staffId_fkey";

-- DropForeignKey
ALTER TABLE "PickupRequest" DROP CONSTRAINT "PickupRequest_locationId_fkey";

-- DropForeignKey
ALTER TABLE "PickupRequest" DROP CONSTRAINT "PickupRequest_supplierId_fkey";

-- DropForeignKey
ALTER TABLE "QualityCheck" DROP CONSTRAINT "QualityCheck_batchId_fkey";

-- DropForeignKey
ALTER TABLE "Sale" DROP CONSTRAINT "Sale_buyerId_fkey";

-- DropForeignKey
ALTER TABLE "SaleItem" DROP CONSTRAINT "SaleItem_batchId_fkey";

-- DropForeignKey
ALTER TABLE "SaleItem" DROP CONSTRAINT "SaleItem_saleId_fkey";

-- DropForeignKey
ALTER TABLE "Supplier" DROP CONSTRAINT "Supplier_leadId_fkey";

-- DropForeignKey
ALTER TABLE "Supplier" DROP CONSTRAINT "Supplier_userId_fkey";

-- DropIndex
DROP INDEX "Invoice_invoiceNo_key";

-- DropIndex
DROP INDEX "User_supabaseId_key";

-- AlterTable
ALTER TABLE "Invoice" DROP COLUMN "buyerId",
DROP COLUMN "createdAt",
DROP COLUMN "dueDate",
DROP COLUMN "gstAmount",
DROP COLUMN "invoiceNo",
DROP COLUMN "notes",
DROP COLUMN "paidAt",
DROP COLUMN "saleId",
DROP COLUMN "status",
DROP COLUMN "supplierId",
DROP COLUMN "totalAmount",
DROP COLUMN "type",
DROP COLUMN "updatedAt",
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'INR',
ADD COLUMN     "description" TEXT,
ADD COLUMN     "downloadedCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "dueAt" TIMESTAMP(3),
ADD COLUMN     "invoiceNumber" TEXT NOT NULL,
ADD COLUMN     "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "items" JSONB NOT NULL,
ADD COLUMN     "paymentId" TEXT NOT NULL,
ADD COLUMN     "tax" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "total" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Notification" DROP COLUMN "link",
ADD COLUMN     "actionUrl" TEXT,
ADD COLUMN     "metadata" JSONB,
DROP COLUMN "type",
ADD COLUMN     "type" "NotificationType" NOT NULL;

-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "invoiceId",
DROP COLUMN "notes",
DROP COLUMN "paidAt",
DROP COLUMN "referenceNo",
DROP COLUMN "supplierId",
ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'INR',
ADD COLUMN     "description" TEXT,
ADD COLUMN     "metadataJson" JSONB,
ADD COLUMN     "razorpayOrderId" TEXT,
ADD COLUMN     "razorpayPaymentId" TEXT,
ADD COLUMN     "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "stripePaymentId" TEXT,
ADD COLUMN     "userId" TEXT NOT NULL,
DROP COLUMN "method",
ADD COLUMN     "method" "PaymentMethod" NOT NULL;

-- AlterTable
ALTER TABLE "SupportTicket" DROP COLUMN "email",
DROP COLUMN "message",
DROP COLUMN "name",
ADD COLUMN     "assignedToId" TEXT,
ADD COLUMN     "category" TEXT NOT NULL,
ADD COLUMN     "description" TEXT NOT NULL,
ADD COLUMN     "priority" "SupportTicketPriority" NOT NULL DEFAULT 'MEDIUM',
ADD COLUMN     "resolvedAt" TIMESTAMP(3),
ADD COLUMN     "userId" TEXT NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "SupportTicketStatus" NOT NULL DEFAULT 'OPEN';

-- AlterTable
ALTER TABLE "User" DROP COLUMN "name",
DROP COLUMN "phone",
DROP COLUMN "supabaseId",
ALTER COLUMN "referralCode" SET NOT NULL,
ALTER COLUMN "onboardingCompleted" SET NOT NULL,
ALTER COLUMN "country" SET NOT NULL,
ALTER COLUMN "timezone" SET NOT NULL,
ALTER COLUMN "kycStatus" SET NOT NULL,
ALTER COLUMN "subscriptionTier" SET NOT NULL,
ALTER COLUMN "emailVerified" SET NOT NULL,
ALTER COLUMN "isSuspended" SET NOT NULL,
ALTER COLUMN "twoFactorEnabled" SET NOT NULL;

-- DropTable
DROP TABLE "ActivityLog";

-- DropTable
DROP TABLE "AppSettings";

-- DropTable
DROP TABLE "BlogPost";

-- DropTable
DROP TABLE "BusinessLocation";

-- DropTable
DROP TABLE "Buyer";

-- DropTable
DROP TABLE "CMSPage";

-- DropTable
DROP TABLE "CollectionStaff";

-- DropTable
DROP TABLE "EmailLog";

-- DropTable
DROP TABLE "FAQ";

-- DropTable
DROP TABLE "Lead";

-- DropTable
DROP TABLE "OilBatch";

-- DropTable
DROP TABLE "PickupAssignment";

-- DropTable
DROP TABLE "PickupRequest";

-- DropTable
DROP TABLE "PickupRoute";

-- DropTable
DROP TABLE "PricingRule";

-- DropTable
DROP TABLE "QualityCheck";

-- DropTable
DROP TABLE "Sale";

-- DropTable
DROP TABLE "SaleItem";

-- DropTable
DROP TABLE "Supplier";

-- DropEnum
DROP TYPE "BatchStatus";

-- DropEnum
DROP TYPE "LeadStatus";

-- DropEnum
DROP TYPE "PickupStatus";

-- DropEnum
DROP TYPE "Role";

-- CreateTable
CREATE TABLE "UserSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "deviceName" TEXT,
    "browser" TEXT,
    "ipAddress" TEXT,
    "country" TEXT,
    "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrokerAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "brokerName" "BrokerName" NOT NULL,
    "accountNumberLast4" TEXT NOT NULL,
    "credentialsEncrypted" TEXT NOT NULL,
    "serverName" TEXT,
    "isPaperTrading" BOOLEAN NOT NULL DEFAULT false,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isMasterSource" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastConnectedAt" TIMESTAMP(3),
    "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BrokerAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Strategy" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "StrategyCategory" NOT NULL,
    "riskLevel" "RiskLevel" NOT NULL,
    "configJson" JSONB NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "biasCheckJson" JSONB,
    "monthlyPrice" DOUBLE PRECISION,
    "annualPrice" DOUBLE PRECISION,
    "lifetimePrice" DOUBLE PRECISION,
    "maxCopies" INTEGER NOT NULL DEFAULT 500,
    "copiesCount" INTEGER NOT NULL DEFAULT 0,
    "totalRevenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Strategy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StrategyPerformance" (
    "id" TEXT NOT NULL,
    "strategyId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "winRate" DOUBLE PRECISION NOT NULL,
    "drawdown" DOUBLE PRECISION NOT NULL,
    "maxDrawdown" DOUBLE PRECISION NOT NULL,
    "sharpeRatio" DOUBLE PRECISION NOT NULL,
    "sortinoRatio" DOUBLE PRECISION,
    "totalTrades" INTEGER NOT NULL,
    "winningTrades" INTEGER NOT NULL,
    "netPnl" DOUBLE PRECISION NOT NULL,
    "equityCurve" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StrategyPerformance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserStrategySubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "strategyId" TEXT NOT NULL,
    "brokerAccountId" TEXT,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "planType" TEXT,
    "stripeSubId" TEXT,
    "stripeItemId" TEXT,
    "trialEndsAt" TIMESTAMP(3),
    "subscribedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "riskOverrideEnabled" BOOLEAN NOT NULL DEFAULT false,
    "maxDrawdownPct" DOUBLE PRECISION,
    "excludedSymbolsJson" JSONB,
    "slippageBps" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "executionPriority" INTEGER NOT NULL DEFAULT 0,
    "latencyLimitMs" INTEGER,
    "lastLatencyMs" INTEGER,
    "lastExecutionAt" TIMESTAMP(3),
    "riskPolicyJson" JSONB,
    "executionProfileJson" JSONB,

    CONSTRAINT "UserStrategySubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trade" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "strategyId" TEXT,
    "brokerAccountId" TEXT,
    "brokerTicket" TEXT,
    "symbol" TEXT NOT NULL,
    "direction" "TradeDirection" NOT NULL,
    "volume" DOUBLE PRECISION NOT NULL,
    "openPrice" DOUBLE PRECISION NOT NULL,
    "closePrice" DOUBLE PRECISION,
    "stopLoss" DOUBLE PRECISION,
    "takeProfit" DOUBLE PRECISION,
    "profit" DOUBLE PRECISION,
    "commission" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "swap" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isPaper" BOOLEAN NOT NULL DEFAULT false,
    "status" "TradeStatus" NOT NULL DEFAULT 'OPEN',
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "requestedPrice" DOUBLE PRECISION,
    "fillPrice" DOUBLE PRECISION,
    "slippageBps" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "executionLatencyMs" INTEGER,
    "icebergSliceIndex" INTEGER,
    "icebergSliceCount" INTEGER,
    "executionMode" TEXT,
    "executionMetadataJson" JSONB,

    CONSTRAINT "Trade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalletTransaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "direction" "TransactionDirection" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "balanceAfter" DOUBLE PRECISION NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "reference" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "description" TEXT,
    "metadataJson" JSONB,
    "stripePaymentId" TEXT,
    "razorpayOrderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WalletTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketplaceListing" (
    "id" TEXT NOT NULL,
    "strategyId" TEXT NOT NULL,
    "monthlyPrice" DOUBLE PRECISION NOT NULL,
    "annualPrice" DOUBLE PRECISION NOT NULL,
    "lifetimePrice" DOUBLE PRECISION NOT NULL,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "totalRevenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "trialDays" INTEGER NOT NULL DEFAULT 7,
    "maxCopies" INTEGER NOT NULL DEFAULT 500,
    "creatorSharePct" DOUBLE PRECISION NOT NULL DEFAULT 0.8,
    "platformSharePct" DOUBLE PRECISION NOT NULL DEFAULT 0.2,
    "payoutEnabled" BOOLEAN NOT NULL DEFAULT true,
    "lastPayoutAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketplaceListing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Affiliate" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "referrerId" TEXT,
    "tier" "AffiliateTier" NOT NULL DEFAULT 'STARTER',
    "commissionRate" DOUBLE PRECISION NOT NULL DEFAULT 0.30,
    "totalEarned" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalPaid" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "clickCount" INTEGER NOT NULL DEFAULT 0,
    "signupCount" INTEGER NOT NULL DEFAULT 0,
    "conversionCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Affiliate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAchievement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "achievementKey" TEXT NOT NULL,
    "tier" "AchievementTier" NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadataJson" JSONB,

    CONSTRAINT "UserAchievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StrategyReview" (
    "id" TEXT NOT NULL,
    "strategyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" SMALLINT NOT NULL,
    "reviewText" TEXT NOT NULL,
    "creatorReply" TEXT,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StrategyReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AITradeExplanation" (
    "id" TEXT NOT NULL,
    "tradeId" TEXT NOT NULL,
    "strategyId" TEXT,
    "summary" TEXT NOT NULL,
    "confidenceScore" INTEGER NOT NULL,
    "riskFactorsJson" JSONB NOT NULL,
    "keyLevelsJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AITradeExplanation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KycDocument" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "docType" TEXT NOT NULL,
    "status" "KycStatus" NOT NULL DEFAULT 'PENDING',
    "storagePath" TEXT NOT NULL,
    "onfidoId" TEXT,
    "notes" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "KycDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserFcmToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "platform" TEXT NOT NULL DEFAULT 'web',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserFcmToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaderboardEntry" (
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

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "userId" TEXT,
    "detailsJson" JSONB NOT NULL,
    "triggeredBy" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionPlan" (
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

-- CreateTable
CREATE TABLE "UserSubscription" (
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

-- CreateTable
CREATE TABLE "TraderProfile" (
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

-- CreateTable
CREATE TABLE "SocialComment" (
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

-- CreateTable
CREATE TABLE "SocialFollow" (
    "id" TEXT NOT NULL,
    "followerId" TEXT NOT NULL,
    "followingId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SocialFollow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportTicketResponse" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupportTicketResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StrategyBuilder" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" "StrategyCategory" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StrategyBuilder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StrategyNode" (
    "id" TEXT NOT NULL,
    "builderId" TEXT NOT NULL,
    "nodeType" "StrategyNodeType" NOT NULL,
    "position" JSONB NOT NULL,
    "config" JSONB NOT NULL,
    "label" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StrategyNode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StrategyEdge" (
    "id" TEXT NOT NULL,
    "builderId" TEXT NOT NULL,
    "fromNodeId" TEXT NOT NULL,
    "toNodeId" TEXT NOT NULL,

    CONSTRAINT "StrategyEdge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VpsAccount" (
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

-- CreateTable
CREATE TABLE "BotInstance" (
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

-- CreateTable
CREATE TABLE "AiRiskPolicy" (
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

-- CreateTable
CREATE TABLE "UserPreference" (
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

-- CreateTable
CREATE TABLE "BrokerApiCredential" (
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

-- CreateTable
CREATE TABLE "TradeJournalEntry" (
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

-- CreateTable
CREATE TABLE "WebhookEvent" (
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

-- CreateIndex
CREATE INDEX "UserSession_userId_idx" ON "UserSession"("userId");

-- CreateIndex
CREATE INDEX "UserSession_deviceId_idx" ON "UserSession"("deviceId");

-- CreateIndex
CREATE INDEX "BrokerAccount_userId_idx" ON "BrokerAccount"("userId");

-- CreateIndex
CREATE INDEX "Strategy_creatorId_idx" ON "Strategy"("creatorId");

-- CreateIndex
CREATE INDEX "Strategy_category_idx" ON "Strategy"("category");

-- CreateIndex
CREATE INDEX "Strategy_isPublished_isVerified_idx" ON "Strategy"("isPublished", "isVerified");

-- CreateIndex
CREATE INDEX "StrategyPerformance_strategyId_date_idx" ON "StrategyPerformance"("strategyId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "StrategyPerformance_strategyId_date_key" ON "StrategyPerformance"("strategyId", "date");

-- CreateIndex
CREATE INDEX "UserStrategySubscription_userId_status_idx" ON "UserStrategySubscription"("userId", "status");

-- CreateIndex
CREATE INDEX "UserStrategySubscription_strategyId_idx" ON "UserStrategySubscription"("strategyId");

-- CreateIndex
CREATE UNIQUE INDEX "UserStrategySubscription_userId_strategyId_key" ON "UserStrategySubscription"("userId", "strategyId");

-- CreateIndex
CREATE INDEX "Trade_userId_status_idx" ON "Trade"("userId", "status");

-- CreateIndex
CREATE INDEX "Trade_strategyId_idx" ON "Trade"("strategyId");

-- CreateIndex
CREATE INDEX "Trade_symbol_idx" ON "Trade"("symbol");

-- CreateIndex
CREATE INDEX "Trade_openedAt_idx" ON "Trade"("openedAt");

-- CreateIndex
CREATE UNIQUE INDEX "WalletTransaction_idempotencyKey_key" ON "WalletTransaction"("idempotencyKey");

-- CreateIndex
CREATE INDEX "WalletTransaction_userId_createdAt_idx" ON "WalletTransaction"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "WalletTransaction_status_idx" ON "WalletTransaction"("status");

-- CreateIndex
CREATE INDEX "WalletTransaction_idempotencyKey_idx" ON "WalletTransaction"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "MarketplaceListing_strategyId_key" ON "MarketplaceListing"("strategyId");

-- CreateIndex
CREATE INDEX "MarketplaceListing_isFeatured_idx" ON "MarketplaceListing"("isFeatured");

-- CreateIndex
CREATE UNIQUE INDEX "Affiliate_userId_key" ON "Affiliate"("userId");

-- CreateIndex
CREATE INDEX "Affiliate_referrerId_idx" ON "Affiliate"("referrerId");

-- CreateIndex
CREATE INDEX "UserAchievement_userId_idx" ON "UserAchievement"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserAchievement_userId_achievementKey_key" ON "UserAchievement"("userId", "achievementKey");

-- CreateIndex
CREATE INDEX "StrategyReview_strategyId_idx" ON "StrategyReview"("strategyId");

-- CreateIndex
CREATE UNIQUE INDEX "StrategyReview_strategyId_userId_key" ON "StrategyReview"("strategyId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "AITradeExplanation_tradeId_key" ON "AITradeExplanation"("tradeId");

-- CreateIndex
CREATE INDEX "KycDocument_userId_idx" ON "KycDocument"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserFcmToken_token_key" ON "UserFcmToken"("token");

-- CreateIndex
CREATE INDEX "UserFcmToken_userId_idx" ON "UserFcmToken"("userId");

-- CreateIndex
CREATE INDEX "LeaderboardEntry_period_rank_idx" ON "LeaderboardEntry"("period", "rank");

-- CreateIndex
CREATE UNIQUE INDEX "LeaderboardEntry_userId_period_key" ON "LeaderboardEntry"("userId", "period");

-- CreateIndex
CREATE INDEX "AuditLog_userId_createdAt_idx" ON "AuditLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_eventType_idx" ON "AuditLog"("eventType");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionPlan_name_key" ON "SubscriptionPlan"("name");

-- CreateIndex
CREATE INDEX "SubscriptionPlan_name_idx" ON "SubscriptionPlan"("name");

-- CreateIndex
CREATE UNIQUE INDEX "UserSubscription_paymentId_key" ON "UserSubscription"("paymentId");

-- CreateIndex
CREATE UNIQUE INDEX "UserSubscription_razorpaySubId_key" ON "UserSubscription"("razorpaySubId");

-- CreateIndex
CREATE INDEX "UserSubscription_status_expiresAt_idx" ON "UserSubscription"("status", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserSubscription_userId_planId_key" ON "UserSubscription"("userId", "planId");

-- CreateIndex
CREATE UNIQUE INDEX "TraderProfile_userId_key" ON "TraderProfile"("userId");

-- CreateIndex
CREATE INDEX "TraderProfile_userId_idx" ON "TraderProfile"("userId");

-- CreateIndex
CREATE INDEX "TraderProfile_isVerified_totalPnl_idx" ON "TraderProfile"("isVerified", "totalPnl");

-- CreateIndex
CREATE INDEX "SocialComment_tradeId_idx" ON "SocialComment"("tradeId");

-- CreateIndex
CREATE INDEX "SocialComment_userId_idx" ON "SocialComment"("userId");

-- CreateIndex
CREATE INDEX "SocialComment_profileId_idx" ON "SocialComment"("profileId");

-- CreateIndex
CREATE INDEX "SocialFollow_followerId_idx" ON "SocialFollow"("followerId");

-- CreateIndex
CREATE INDEX "SocialFollow_followingId_idx" ON "SocialFollow"("followingId");

-- CreateIndex
CREATE UNIQUE INDEX "SocialFollow_followerId_followingId_key" ON "SocialFollow"("followerId", "followingId");

-- CreateIndex
CREATE INDEX "SupportTicketResponse_ticketId_idx" ON "SupportTicketResponse"("ticketId");

-- CreateIndex
CREATE INDEX "SupportTicketResponse_userId_idx" ON "SupportTicketResponse"("userId");

-- CreateIndex
CREATE INDEX "StrategyBuilder_userId_idx" ON "StrategyBuilder"("userId");

-- CreateIndex
CREATE INDEX "StrategyNode_builderId_idx" ON "StrategyNode"("builderId");

-- CreateIndex
CREATE INDEX "StrategyEdge_builderId_idx" ON "StrategyEdge"("builderId");

-- CreateIndex
CREATE INDEX "StrategyEdge_fromNodeId_idx" ON "StrategyEdge"("fromNodeId");

-- CreateIndex
CREATE INDEX "StrategyEdge_toNodeId_idx" ON "StrategyEdge"("toNodeId");

-- CreateIndex
CREATE INDEX "VpsAccount_userId_idx" ON "VpsAccount"("userId");

-- CreateIndex
CREATE INDEX "VpsAccount_status_idx" ON "VpsAccount"("status");

-- CreateIndex
CREATE INDEX "BotInstance_vpsId_idx" ON "BotInstance"("vpsId");

-- CreateIndex
CREATE UNIQUE INDEX "AiRiskPolicy_userId_key" ON "AiRiskPolicy"("userId");

-- CreateIndex
CREATE INDEX "AiRiskPolicy_userId_idx" ON "AiRiskPolicy"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserPreference_userId_key" ON "UserPreference"("userId");

-- CreateIndex
CREATE INDEX "UserPreference_userId_idx" ON "UserPreference"("userId");

-- CreateIndex
CREATE INDEX "BrokerApiCredential_userId_idx" ON "BrokerApiCredential"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "BrokerApiCredential_userId_broker_key" ON "BrokerApiCredential"("userId", "broker");

-- CreateIndex
CREATE UNIQUE INDEX "TradeJournalEntry_tradeId_key" ON "TradeJournalEntry"("tradeId");

-- CreateIndex
CREATE INDEX "TradeJournalEntry_userId_createdAt_idx" ON "TradeJournalEntry"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "WebhookEvent_eventType_idx" ON "WebhookEvent"("eventType");

-- CreateIndex
CREATE INDEX "WebhookEvent_delivered_idx" ON "WebhookEvent"("delivered");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_paymentId_key" ON "Invoice"("paymentId");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");

-- CreateIndex
CREATE INDEX "Invoice_userId_issuedAt_idx" ON "Invoice"("userId", "issuedAt");

-- CreateIndex
CREATE INDEX "Invoice_invoiceNumber_idx" ON "Invoice"("invoiceNumber");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_razorpayOrderId_key" ON "Payment"("razorpayOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_razorpayPaymentId_key" ON "Payment"("razorpayPaymentId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_stripePaymentId_key" ON "Payment"("stripePaymentId");

-- CreateIndex
CREATE INDEX "Payment_userId_status_idx" ON "Payment"("userId", "status");

-- CreateIndex
CREATE INDEX "Payment_status_createdAt_idx" ON "Payment"("status", "createdAt");

-- CreateIndex
CREATE INDEX "SupportTicket_userId_status_idx" ON "SupportTicket"("userId", "status");

-- CreateIndex
CREATE INDEX "SupportTicket_status_createdAt_idx" ON "SupportTicket"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_referralCode_idx" ON "User"("referralCode");

-- AddForeignKey
ALTER TABLE "UserSession" ADD CONSTRAINT "UserSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrokerAccount" ADD CONSTRAINT "BrokerAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Strategy" ADD CONSTRAINT "Strategy_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StrategyPerformance" ADD CONSTRAINT "StrategyPerformance_strategyId_fkey" FOREIGN KEY ("strategyId") REFERENCES "Strategy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserStrategySubscription" ADD CONSTRAINT "UserStrategySubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserStrategySubscription" ADD CONSTRAINT "UserStrategySubscription_strategyId_fkey" FOREIGN KEY ("strategyId") REFERENCES "Strategy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserStrategySubscription" ADD CONSTRAINT "UserStrategySubscription_brokerAccountId_fkey" FOREIGN KEY ("brokerAccountId") REFERENCES "BrokerAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trade" ADD CONSTRAINT "Trade_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trade" ADD CONSTRAINT "Trade_strategyId_fkey" FOREIGN KEY ("strategyId") REFERENCES "Strategy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trade" ADD CONSTRAINT "Trade_brokerAccountId_fkey" FOREIGN KEY ("brokerAccountId") REFERENCES "BrokerAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplaceListing" ADD CONSTRAINT "MarketplaceListing_strategyId_fkey" FOREIGN KEY ("strategyId") REFERENCES "Strategy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Affiliate" ADD CONSTRAINT "Affiliate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Affiliate" ADD CONSTRAINT "Affiliate_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAchievement" ADD CONSTRAINT "UserAchievement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StrategyReview" ADD CONSTRAINT "StrategyReview_strategyId_fkey" FOREIGN KEY ("strategyId") REFERENCES "Strategy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StrategyReview" ADD CONSTRAINT "StrategyReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AITradeExplanation" ADD CONSTRAINT "AITradeExplanation_tradeId_fkey" FOREIGN KEY ("tradeId") REFERENCES "Trade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AITradeExplanation" ADD CONSTRAINT "AITradeExplanation_strategyId_fkey" FOREIGN KEY ("strategyId") REFERENCES "Strategy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KycDocument" ADD CONSTRAINT "KycDocument_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFcmToken" ADD CONSTRAINT "UserFcmToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaderboardEntry" ADD CONSTRAINT "LeaderboardEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSubscription" ADD CONSTRAINT "UserSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSubscription" ADD CONSTRAINT "UserSubscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SubscriptionPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSubscription" ADD CONSTRAINT "UserSubscription_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TraderProfile" ADD CONSTRAINT "TraderProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialComment" ADD CONSTRAINT "SocialComment_tradeId_fkey" FOREIGN KEY ("tradeId") REFERENCES "Trade"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialComment" ADD CONSTRAINT "SocialComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialComment" ADD CONSTRAINT "SocialComment_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "TraderProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialComment" ADD CONSTRAINT "SocialComment_replyToId_fkey" FOREIGN KEY ("replyToId") REFERENCES "SocialComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialFollow" ADD CONSTRAINT "SocialFollow_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "TraderProfile"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialFollow" ADD CONSTRAINT "SocialFollow_followingId_fkey" FOREIGN KEY ("followingId") REFERENCES "TraderProfile"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicketResponse" ADD CONSTRAINT "SupportTicketResponse_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "SupportTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicketResponse" ADD CONSTRAINT "SupportTicketResponse_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StrategyBuilder" ADD CONSTRAINT "StrategyBuilder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StrategyNode" ADD CONSTRAINT "StrategyNode_builderId_fkey" FOREIGN KEY ("builderId") REFERENCES "StrategyBuilder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StrategyEdge" ADD CONSTRAINT "StrategyEdge_builderId_fkey" FOREIGN KEY ("builderId") REFERENCES "StrategyBuilder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StrategyEdge" ADD CONSTRAINT "StrategyEdge_fromNodeId_fkey" FOREIGN KEY ("fromNodeId") REFERENCES "StrategyNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StrategyEdge" ADD CONSTRAINT "StrategyEdge_toNodeId_fkey" FOREIGN KEY ("toNodeId") REFERENCES "StrategyNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VpsAccount" ADD CONSTRAINT "VpsAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BotInstance" ADD CONSTRAINT "BotInstance_vpsId_fkey" FOREIGN KEY ("vpsId") REFERENCES "VpsAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiRiskPolicy" ADD CONSTRAINT "AiRiskPolicy_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPreference" ADD CONSTRAINT "UserPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrokerApiCredential" ADD CONSTRAINT "BrokerApiCredential_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradeJournalEntry" ADD CONSTRAINT "TradeJournalEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradeJournalEntry" ADD CONSTRAINT "TradeJournalEntry_tradeId_fkey" FOREIGN KEY ("tradeId") REFERENCES "Trade"("id") ON DELETE SET NULL ON UPDATE CASCADE;
