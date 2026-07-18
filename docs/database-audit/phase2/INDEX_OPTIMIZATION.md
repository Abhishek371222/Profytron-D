# INDEX_OPTIMIZATION — Phase 2

**Evidence:** Phase 1 `DB-P0-FK-INDEX`, `DB-P2-DUP-IX`, `DB-P2-UNUSED-IX`  
**Migrations:**
- `20260719010000_phase2_fk_leading_indexes`
- `20260719020000_phase2_drop_redundant_indexes`

## P0 — Seven measured FK leading indexes (created)

| Table | Column | Index |
|-------|--------|-------|
| AffiliateFunnelEvent | refereeId | `AffiliateFunnelEvent_refereeId_idx` |
| CoachMessage | faqAnswerId | `CoachMessage_faqAnswerId_idx` |
| SocialComment | replyToId | `SocialComment_replyToId_idx` |
| Strategy | masterBrokerAccountId | `Strategy_masterBrokerAccountId_idx` |
| TradeExecution | copyRelationshipId | `TradeExecution_copyRelationshipId_idx` |
| UserStrategySubscription | brokerAccountId | `UserStrategySubscription_brokerAccountId_idx` |
| UserSubscription | planId | `UserSubscription_planId_idx` |

Applied via `prisma db execute` (project migration history not baselined in `_prisma_migrations`; SQL files remain source of truth for deploy).

## P1 — Duplicate index signatures (14 reviewed)

Decision rule: keep UNIQUE / `@unique` constraint index; drop redundant non-unique twin when column list identical.

| Table | Dropped (non-unique) | Kept (unique) | Decision |
|-------|----------------------|---------------|----------|
| User | `User_email_idx` | `User_email_key` | DROP twin |
| User | `User_referralCode_idx` | `User_referralCode_key` | DROP twin |
| StrategyPerformance | `StrategyPerformance_strategyId_date_idx` | `…_key` | DROP twin |
| WalletTransaction | `…_billingId_idx` | `…_billingId_key` | DROP twin |
| WalletTransaction | `…_idempotencyKey_idx` | `…_idempotencyKey_key` | DROP twin |
| Invoice | `Invoice_invoiceNumber_idx` | `…_key` | DROP twin |
| SubscriptionPlan | `SubscriptionPlan_name_idx` | `…_key` | DROP twin |
| TraderProfile | `TraderProfile_userId_idx` | `…_key` | DROP twin |
| AiRiskPolicy | `AiRiskPolicy_userId_idx` | `…_key` | DROP twin |
| UserPreference | `UserPreference_userId_idx` | `…_key` | DROP twin |
| FeatureFlag | `FeatureFlag_key_idx` | `…_key` | DROP twin |
| ApiKey | `ApiKey_keyHash_idx` | `…_key` | DROP twin |
| MasterProfile | `MasterProfile_userId_idx` | `…_key` | DROP twin |
| AccountSnapshotMarketData | `…_symbol_tick_idx` | `…_tickTimestamp_idx` | DROP duplicate non-unique (same cols) |

Prisma schema updated to remove the redundant `@@index` declarations so generate stays aligned.

## P2 — Zero-scan indexes

**No indexes dropped.** Window 2 snapshot: `data/index-stats-window2.json`.

Cold `idx_scan = 0` remains inconclusive under low traffic / Neon stats resets. Re-evaluate after a production observation window ≥ 7 days.
