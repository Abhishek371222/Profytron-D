DO $$ BEGIN CREATE TYPE "StrategyCategory" AS ENUM ('TREND', 'SCALPING', 'RANGE', 'VOLATILITY', 'ARBITRAGE'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'EXPERT'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "VerificationStatus" AS ENUM ('UNVERIFIED', 'PENDING', 'VERIFIED'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'CANCELLED', 'EXPIRED'); EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS "Strategy" (
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

CREATE TABLE IF NOT EXISTS "UserStrategySubscription" (
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

CREATE UNIQUE INDEX IF NOT EXISTS "UserStrategySubscription_userId_strategyId_key" ON "UserStrategySubscription"("userId", "strategyId");
