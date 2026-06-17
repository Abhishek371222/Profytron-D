-- Performance indexes for marketplace list + analytics hot paths
CREATE INDEX IF NOT EXISTS "MarketplaceListing_isFeatured_updatedAt_idx"
  ON "MarketplaceListing" ("isFeatured" DESC, "updatedAt" DESC);

CREATE INDEX IF NOT EXISTS "Strategy_published_verified_category_idx"
  ON "Strategy" ("isPublished", "isVerified", "category")
  WHERE "deletedAt" IS NULL;

CREATE INDEX IF NOT EXISTS "Trade_userId_status_openedAt_idx"
  ON "Trade" ("userId", "status", "openedAt" DESC);

CREATE INDEX IF NOT EXISTS "UserStrategySubscription_strategyId_status_idx"
  ON "UserStrategySubscription" ("strategyId", "status");
