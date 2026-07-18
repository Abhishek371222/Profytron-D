# INDEX_REPORT — Phase 1

## Schema-declared indexes

| Metric | Value |
|--------|------:|
| `@@index` in Prisma | 167 |
| `@@unique` + field `@unique` (approx) | 51 |
| Live indexes (`pg_indexes`) | 300 |
| FK index gaps | **7** |
| Duplicate index signatures | **14** |
| `idx_scan = 0` (unused candidates) | **235** |

## Missing indexes (FK leading-column heuristic)

| Table | Column | References | Constraint |
|-------|--------|------------|------------|
| AffiliateFunnelEvent | refereeId | User.id | AffiliateFunnelEvent_refereeId_fkey |
| CoachMessage | faqAnswerId | CoachFaqAnswer.id | CoachMessage_faqAnswerId_fkey |
| SocialComment | replyToId | SocialComment.id | SocialComment_replyToId_fkey |
| Strategy | masterBrokerAccountId | BrokerAccount.id | Strategy_masterBrokerAccountId_fkey |
| TradeExecution | copyRelationshipId | CopyRelationship.id | TradeExecution_copyRelationshipId_fkey |
| UserStrategySubscription | brokerAccountId | BrokerAccount.id | UserStrategySubscription_brokerAccountId_fkey |
| UserSubscription | planId | SubscriptionPlan.id | UserSubscription_planId_fkey |

## Duplicate indexes (same table + same column list)

| Table | Index A | Index B | Columns |
|-------|---------|---------|---------|
| AccountSnapshotMarketData | AccountSnapshotMarketData_brokerAccountId_symbol_tickTimestamp_ | AccountSnapshotMarketData_brokerAccountId_symbol_tick_idx | "brokerAccountId", symbol, "tickTimestamp" |
| AiRiskPolicy | AiRiskPolicy_userId_idx | AiRiskPolicy_userId_key | "userId" |
| ApiKey | ApiKey_keyHash_idx | ApiKey_keyHash_key | "keyHash" |
| FeatureFlag | FeatureFlag_key_idx | FeatureFlag_key_key | key |
| Invoice | Invoice_invoiceNumber_idx | Invoice_invoiceNumber_key | "invoiceNumber" |
| MasterProfile | MasterProfile_userId_idx | MasterProfile_userId_key | "userId" |
| StrategyPerformance | StrategyPerformance_strategyId_date_idx | StrategyPerformance_strategyId_date_key | "strategyId", date |
| SubscriptionPlan | SubscriptionPlan_name_idx | SubscriptionPlan_name_key | name |
| TraderProfile | TraderProfile_userId_idx | TraderProfile_userId_key | "userId" |
| User | User_email_idx | User_email_key | email |
| User | User_referralCode_idx | User_referralCode_key | "referralCode" |
| UserPreference | UserPreference_userId_idx | UserPreference_userId_key | "userId" |
| WalletTransaction | WalletTransaction_billingId_idx | WalletTransaction_billingId_key | "billingId" |
| WalletTransaction | WalletTransaction_idempotencyKey_idx | WalletTransaction_idempotencyKey_key | "idempotencyKey" |

## Unused index candidates (`pg_stat_user_indexes.idx_scan = 0`)

> Warning: stats reset / low traffic can false-positive. Do **not** DROP in Phase 1.

| Table | Index | Size | Scans |
|-------|-------|-----:|------:|
| AccountSnapshotSymbol | AccountSnapshotSymbol_brokerAccountId_symbol_capturedAt_idx | 3.28 MB | 0 |
| AccountSnapshotSymbol | AccountSnapshotSymbol_pkey | 1.90 MB | 0 |
| AccountSnapshotDeal | AccountSnapshotDeal_pkey | 1.35 MB | 0 |
| AccountSnapshotOrderHistory | AccountSnapshotOrderHistory_pkey | 1.30 MB | 0 |
| AccountSnapshotSymbol | AccountSnapshotSymbol_snapshotId_idx | 272.0 KB | 0 |
| AccountSnapshotDeal | AccountSnapshotDeal_snapshotId_idx | 216.0 KB | 0 |
| AccountSnapshotDeal | AccountSnapshotDeal_positionId_idx | 216.0 KB | 0 |
| AccountSnapshotOrderHistory | AccountSnapshotOrderHistory_snapshotId_idx | 208.0 KB | 0 |
| AccountSnapshotDeal | AccountSnapshotDeal_dealId_idx | 176.0 KB | 0 |
| AccountSnapshotOrderHistory | AccountSnapshotOrderHistory_ticket_idx | 176.0 KB | 0 |
| AccountSnapshotRisk | AccountSnapshotRisk_snapshotId_key | 56.0 KB | 0 |
| AccountSnapshotRisk | AccountSnapshotRisk_pkey | 56.0 KB | 0 |
| AccountSnapshotPerformance | AccountSnapshotPerformance_pkey | 56.0 KB | 0 |
| AccountSnapshotEvent | AccountSnapshotEvent_snapshotId_idx | 56.0 KB | 0 |
| AccountSnapshotStatus | AccountSnapshotStatus_snapshotId_idx | 56.0 KB | 0 |
| EquitySnapshot | EquitySnapshot_pkey | 56.0 KB | 0 |
| AccountSnapshotStatus | AccountSnapshotStatus_pkey | 56.0 KB | 0 |
| AccountSnapshotPerformance | AccountSnapshotPerformance_snapshotId_key | 56.0 KB | 0 |
| AccountSnapshotPerformance | AccountSnapshotPerformance_brokerAccountId_capturedAt_idx | 48.0 KB | 0 |
| AccountSnapshotEvent | AccountSnapshotEvent_pkey | 48.0 KB | 0 |
| AccountSnapshotStatus | AccountSnapshotStatus_brokerAccountId_capturedAt_idx | 48.0 KB | 0 |
| AccountSnapshotRisk | AccountSnapshotRisk_brokerAccountId_capturedAt_idx | 48.0 KB | 0 |
| AccountSnapshotEvent | AccountSnapshotEvent_brokerAccountId_occurredAt_idx | 48.0 KB | 0 |
| Trade | Trade_pkey | 40.0 KB | 0 |
| EmailLog | EmailLog_userId_createdAt_idx | 16.0 KB | 0 |
| UserActivationEvent | UserActivationEvent_pkey | 16.0 KB | 0 |
| AuditLog | AuditLog_eventType_idx | 16.0 KB | 0 |
| AuditLog | AuditLog_userId_createdAt_idx | 16.0 KB | 0 |
| NotificationLog | NotificationLog_channel_status_idx | 16.0 KB | 0 |
| AccountLatestSnapshot | AccountLatestSnapshot_snapshotId_key | 16.0 KB | 0 |
| UserStrategySubscription | UserStrategySubscription_expiresAt_idx | 16.0 KB | 0 |
| Trade | Trade_brokerTicket_idx | 16.0 KB | 0 |
| AccountLatestSnapshot | AccountLatestSnapshot_lastSyncedAt_idx | 16.0 KB | 0 |
| AccountLatestSnapshot | AccountLatestSnapshot_syncStatus_idx | 16.0 KB | 0 |
| MarketplaceListing | MarketplaceListing_isFeatured_updatedAt_idx | 16.0 KB | 0 |
| AccountSnapshotEvent | AccountSnapshotEvent_eventType_idx | 16.0 KB | 0 |
| NotificationLog | NotificationLog_notificationId_idx | 16.0 KB | 0 |
| UserSession | UserSession_pkey | 16.0 KB | 0 |
| NotificationLog | NotificationLog_userId_sentAt_idx | 16.0 KB | 0 |
| EmailLog | EmailLog_pkey | 16.0 KB | 0 |
| StrategyPerformance | StrategyPerformance_pkey | 16.0 KB | 0 |
| LeaderboardEntry | LeaderboardEntry_pkey | 16.0 KB | 0 |
| NotificationLog | NotificationLog_pkey | 16.0 KB | 0 |
| Affiliate | Affiliate_pkey | 16.0 KB | 0 |
| NotificationPreference | NotificationPreference_pkey | 16.0 KB | 0 |
| Notification | Notification_pkey | 16.0 KB | 0 |
| EmailLog | EmailLog_type_createdAt_idx | 16.0 KB | 0 |
| AuditLog | AuditLog_pkey | 16.0 KB | 0 |
| TutorialProgress | TutorialProgress_pkey | 16.0 KB | 0 |
| User | User_username_key | 16.0 KB | 0 |

## Composite / covering notes (static)

Hot-path composites expected from prior platform audit / schema:

- `Trade[userId, status]`, `Trade[brokerAccountId, brokerTicket]` unique
- `EquitySnapshot[brokerAccountId, capturedAt]`
- Wallet `[userId, createdAt]`
- Strategy/status indexes added in recent migrations (`202606*`, `202607*`)

Evidence: `apps/api/prisma/migrations/*` and `schema-inventory.json`.

## Slow indexes

No index IO bottleneck detected at current row counts when live EXPLAIN shows Buffer Hits and sub-ms execution. Re-measure when largest fact tables exceed ~100k–1M rows.
