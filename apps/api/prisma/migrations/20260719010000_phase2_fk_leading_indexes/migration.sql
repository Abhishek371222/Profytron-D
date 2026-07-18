-- Phase 2 DB-P0-FK-INDEX: additive leading indexes for measured FK gaps
CREATE INDEX IF NOT EXISTS "AffiliateFunnelEvent_refereeId_idx" ON "AffiliateFunnelEvent"("refereeId");
CREATE INDEX IF NOT EXISTS "CoachMessage_faqAnswerId_idx" ON "CoachMessage"("faqAnswerId");
CREATE INDEX IF NOT EXISTS "SocialComment_replyToId_idx" ON "SocialComment"("replyToId");
CREATE INDEX IF NOT EXISTS "Strategy_masterBrokerAccountId_idx" ON "Strategy"("masterBrokerAccountId");
CREATE INDEX IF NOT EXISTS "TradeExecution_copyRelationshipId_idx" ON "TradeExecution"("copyRelationshipId");
CREATE INDEX IF NOT EXISTS "UserStrategySubscription_brokerAccountId_idx" ON "UserStrategySubscription"("brokerAccountId");
CREATE INDEX IF NOT EXISTS "UserSubscription_planId_idx" ON "UserSubscription"("planId");
