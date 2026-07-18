# DATA_GROWTH_REPORT — Phase 1

## Current sizes (live)

| Table | Est rows (reltuples) | Total | Table | Indexes |
|-------|---------------------:|------:|------:|--------:|
| AccountSnapshotOrderHistory | 17528 | 18.02 MB | 16.13 MB | 1.86 MB |
| AccountSnapshotDeal | 17860 | 15.44 MB | 13.27 MB | 2.13 MB |
| AccountSnapshotSymbol | 24357 | 10.23 MB | 4.70 MB | 5.49 MB |
| AccountSnapshot | 310 | 3.95 MB | 840.0 KB | 96.0 KB |
| AccountSnapshotPerformance | 313 | 1.03 MB | 864.0 KB | 160.0 KB |
| AccountSnapshotStatus | 313 | 776.0 KB | 584.0 KB | 160.0 KB |
| AccountSnapshotRisk | 313 | 520.0 KB | 328.0 KB | 160.0 KB |
| Trade | 151 | 368.0 KB | 64.0 KB | 272.0 KB |
| AccountSnapshotEvent | 313 | 336.0 KB | 136.0 KB | 168.0 KB |
| EquitySnapshot | 489 | 272.0 KB | 128.0 KB | 112.0 KB |
| User | -1 | 128.0 KB | 8.0 KB | 112.0 KB |
| UserStrategySubscription | -1 | 128.0 KB | 8.0 KB | 112.0 KB |
| NotificationLog | 51 | 112.0 KB | 16.0 KB | 64.0 KB |
| AccountLatestSnapshot | 1 | 112.0 KB | 8.0 KB | 64.0 KB |
| StrategyPerformance | 10 | 112.0 KB | 24.0 KB | 48.0 KB |
| Notification | 40 | 112.0 KB | 16.0 KB | 64.0 KB |
| UserActivationEvent | -1 | 96.0 KB | 8.0 KB | 80.0 KB |
| Strategy | -1 | 96.0 KB | 8.0 KB | 80.0 KB |
| EmailLog | -1 | 80.0 KB | 8.0 KB | 64.0 KB |
| MarketplaceListing | -1 | 80.0 KB | 8.0 KB | 64.0 KB |
| BrokerAccount | 4 | 80.0 KB | 8.0 KB | 64.0 KB |
| AgentEventOutbox | -1 | 80.0 KB | 8.0 KB | 64.0 KB |
| WalletTransaction | -1 | 72.0 KB | 0 B | 64.0 KB |
| TutorialProgress | 3 | 64.0 KB | 8.0 KB | 48.0 KB |
| UserSession | -1 | 64.0 KB | 8.0 KB | 48.0 KB |

**Sum total (reported):** 54.49 MB

## Exact counts (sample suite)

| Table | Count | ms |
|-------|------:|---:|
| AccountSnapshotOrderHistory | 18540 | 609.5 |
| AccountSnapshotDeal | 18504 | 913.8 |
| AccountSnapshotSymbol | 25599 | 626.3 |
| AccountSnapshot | 376 | 619.9 |
| AccountSnapshotPerformance | 372 | 631.7 |
| AccountSnapshotStatus | 372 | 620.1 |
| AccountSnapshotRisk | 372 | 607.7 |
| Trade | 151 | 600.4 |
| AccountSnapshotEvent | 372 | 637.6 |
| EquitySnapshot | 506 | 623.9 |
| User | 7 | 616.9 |
| UserStrategySubscription | 1 | 673.6 |
| NotificationLog | 59 | 631.6 |
| AccountLatestSnapshot | 1 | 628.1 |
| StrategyPerformance | 10 | 623.7 |
| Notification | 40 | 600.3 |
| UserActivationEvent | 22 | 613.7 |
| Strategy | 1 | 639.9 |
| EmailLog | 40 | 631.8 |
| MarketplaceListing | 1 | 646.3 |
| BrokerAccount | 4 | 648.2 |
| AgentEventOutbox | 4 | 645.7 |
| WalletTransaction | 0 | 628.1 |
| TutorialProgress | 6 | 633.6 |
| UserSession | 10 | 620.2 |
| Affiliate | 2 | 934.2 |
| UserAchievement | 1 | 627.9 |
| AuditLog | 21 | 617.9 |
| AgentJob | 10 | 636.1 |
| ProvisioningJob | 1 | 671.6 |
| CoachConversation | 4 | 640.2 |
| CoachMessage | 4 | 638.2 |
| LeaderboardEntry | 6 | 645.5 |
| CopyBridgeOrder | 0 | 634.5 |
| Payment | 0 | 622 |
| MasterProfile | 0 | 595.8 |
| SocialComment | 0 | 606 |
| TradeExecution | 0 | 639.4 |
| BrokerAccountShare | 0 | 658.9 |
| NotificationPreference | 5 | 633.6 |

## JSON / large text (schema hints)

| Model | Field |
|-------|-------|
| User | riskProfileJson |
| User | twoFactorBackupCodes |
| UserActivationEvent | metadata |
| AccountSnapshot | positionsJson |
| AccountSnapshot | pendingOrdersJson |
| AccountSnapshot | dealsJson |
| AccountSnapshot | orderHistoryJson |
| AccountSnapshot | symbolsJson |
| AccountSnapshot | marketDataJson |
| AccountSnapshot | accountStatusJson |
| AccountSnapshot | copyTradingJson |
| AccountSnapshot | performanceJson |
| AccountSnapshot | riskJson |
| AccountSnapshot | eventsJson |
| AccountSnapshotPosition | rawJson |
| AccountSnapshotPendingOrder | rawJson |
| AccountSnapshotDeal | rawJson |
| AccountSnapshotOrderHistory | rawJson |
| AccountSnapshotSymbol | rawJson |
| AccountSnapshotMarketData | rawJson |
| AccountSnapshotStatus | rawJson |
| AccountSnapshotCopyTrading | followerAccountIds |
| AccountSnapshotCopyTrading | rawJson |
| AccountSnapshotPerformance | rawJson |
| AccountSnapshotRisk | currencyExposureJson |
| AccountSnapshotRisk | symbolExposureJson |
| AccountSnapshotRisk | rawJson |
| AccountSnapshotEvent | detailsJson |
| Strategy | configJson |
| Strategy | biasCheckJson |
| StrategyPerformance | equityCurve |
| UserStrategySubscription | excludedSymbolsJson |
| UserStrategySubscription | riskPolicyJson |
| UserStrategySubscription | executionProfileJson |
| Trade | executionMetadataJson |
| WalletTransaction | metadataJson |
| UserAchievement | metadataJson |
| Notification | metadata |
| NotificationLog | providerResponse |
| AITradeExplanation | riskFactorsJson |
| AITradeExplanation | keyLevelsJson |
| AuditLog | detailsJson |
| Payment | metadataJson |
| Invoice | items |
| SubscriptionPlan | features |
| TraderProfile | badges |
| TraderProfile | socialLinks |
| StrategyNode | position |
| StrategyNode | config |
| VpsAccount | metadataJson |
| WebhookEvent | payload |
| AgentEventOutbox | payload |
| AgentJob | resultJson |
| AgentInsight | dataJson |
| TradeEvent | detailsJson |
| PaymentIdempotency | responseJson |
| EmailLog | metadata |

## Growth trends

Phase 1 has a **single snapshot** (no time-series). Trend requires:

1. Nightly size export → `data/sizes-history/`  
2. Neon metrics (storage / compute)  

## Scaling limitations (projected)

| Scale | Risk |
|-------|------|
| <10k trades | Current indexes + RTT dominate |
| 100k–1M trades | Need partition/retention on snapshots; revisit EXPLAIN |
| High-frequency equity snapshots | Index + storage pressure on `EquitySnapshot` / `AccountSnapshot*` |

## Caching (Redis ownership — static)

Owners referencing Redis/Bull (sample):

- `apps/api/src/adapters/redis-io.adapter.ts`
- `apps/api/src/app.controller.ts`
- `apps/api/src/app.module.ts`
- `apps/api/src/config/redis.config.ts`
- `apps/api/src/modules/agents/agents.module.ts`
- `apps/api/src/modules/ai-risk/ai-risk.module.ts`
- `apps/api/src/modules/analytics/analytics.controller.ts`
- `apps/api/src/modules/auth/auth.service.spec.ts`
- `apps/api/src/modules/auth/auth.service.ts`
- `apps/api/src/modules/auth/redis.module.ts`
- `apps/api/src/modules/auth/redis.service.ts`
- `apps/api/src/modules/auth/strategies/jwt-refresh.strategy.ts`
- `apps/api/src/modules/auth/strategies/jwt.strategy.ts`
- `apps/api/src/modules/auth/twofa.service.ts`
- `apps/api/src/modules/broker/account-snapshot.gateway.ts`
- `apps/api/src/modules/broker/broker.module.ts`
- `apps/api/src/modules/coach/coach.gateway.ts`
- `apps/api/src/modules/copy-factory/copy-factory.module.ts`
- `apps/api/src/modules/notifications/notifications.module.ts`
- `apps/api/src/modules/payments/payments.service.ts`
- `apps/api/src/modules/trading/trading.gateway.ts`
- `apps/api/src/modules/trading/trading.module.ts`
- `apps/api/src/modules/users/users.service.ts`
- `apps/api/src/modules/wallet/wallet.module.ts`
- `apps/api/src/modules/wallet/wallet.service.ts`
- `apps/api/src/types/ioredis-mock.d.ts`

TTL constants found:

- `apps/api/src/modules/ai/ai.service.ts`: TTL_AI_RESPONSE=5s
- `apps/api/src/modules/ai/ai.service.ts`: TTL_COACHING_REPORT=2s
- `apps/api/src/modules/ai-risk/ai-risk.service.ts`: TTL_RISK_SCORE=2s
- `apps/api/src/modules/ai-risk/ai-risk.service.ts`: TTL_RISK_METRICS=2s
- `apps/api/src/modules/analytics/analytics.service.ts`: TTL_ANALYTICS=2s
- `apps/api/src/modules/analytics/analytics.service.ts`: TTL_LEADERBOARD=60s
- `apps/api/src/modules/analytics/analytics.service.ts`: TTL_MACRO=60s
- `apps/api/src/modules/market/market.service.ts`: TTL_QUOTE=30s
- `apps/api/src/modules/market/market.service.ts`: TTL_OHLC_SHORT=30s
- `apps/api/src/modules/market/market.service.ts`: TTL_OHLC_LONG=5s
- `apps/api/src/modules/sync/sync-state.service.ts`: TTL_SEC=60s

| Policy theme | Notes |
|--------------|-------|
| Auth OTP / reset / magic links | Short TTLs (minutes–hours) via RedisService |
| AI response / coaching | ~2–5 minutes |
| Sync state | 24h (`sync-state.service`) |
| Bull queues | Job durability in Redis — not DB cache |
| Invalidation | Mostly TTL expiry; selective `del` in services — no central invalidation bus documented |

Duplicate cache risk: portfolio/risk keys may overlap analytics warm paths — Phase 2 should map key prefixes end-to-end.
