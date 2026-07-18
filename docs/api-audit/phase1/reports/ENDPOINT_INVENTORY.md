# ENDPOINT_INVENTORY — API Audit Phase 1

**Generated:** 2026-07-18T20:12:52.543Z

| Metric | Count |
|--------|------:|
| Controllers | 35 |
| Endpoints | 288 |
| Public | 45 |
| User (JWT) | 179 |
| Admin | 64 |
| Probeable GET/HEAD (no `:param`) | 133 |

## By method

| Method | Count |
|--------|------:|
| GET | 133 |
| POST | 112 |
| PATCH | 21 |
| DELETE | 18 |
| PUT | 4 |

## Global stack

| Layer | Components |
|-------|------------|
| Guards | JwtAuthGuard, AppThrottlerGuard |
| Pipes | ValidationPipe(whitelist,transform,forbidNonWhitelisted) |
| Interceptors | SentryInterceptor, TransformInterceptor, AuditInterceptor |
| Filters | AllExceptionsFilter |

## Endpoints (full)

| Method | Path | Module | Controller | Auth | Handler |
|--------|------|--------|------------|------|---------|
| GET | `/v1` | app | AppController | public | Get |
| GET | `/health` | app | AppController | public | Get |
| GET | `/v1/admin/dashboard` | admin | AdminController | admin | Get |
| GET | `/v1/admin/stats` | admin | AdminController | admin | Get |
| GET | `/v1/admin/users` | admin | AdminController | admin | Get |
| GET | `/v1/admin/users/:id` | admin | AdminController | admin | Get |
| POST | `/v1/admin/users/:id/withdraw` | admin | AdminController | admin | Post |
| PATCH | `/v1/admin/users/:id/status` | admin | AdminController | admin | Patch |
| PATCH | `/v1/admin/users/:id/role` | admin | AdminController | admin | Patch |
| GET | `/v1/admin/verifications` | admin | AdminController | admin | Get |
| GET | `/v1/admin/strategies` | admin | AdminController | admin | Get |
| POST | `/v1/admin/strategies` | admin | AdminController | admin | Post |
| PATCH | `/v1/admin/strategies/:id` | admin | AdminController | admin | Patch |
| POST | `/v1/admin/strategies/pdf` | admin | AdminController | admin | Post |
| POST | `/v1/admin/strategies/:strategyId/documents` | admin | AdminController | admin | Post |
| DELETE | `/v1/admin/strategies/:strategyId/documents/:documentId` | admin | AdminController | admin | Delete |
| DELETE | `/v1/admin/strategies/:id` | admin | AdminController | admin | Delete |
| POST | `/v1/admin/verifications/:id/handle` | admin | AdminController | admin | Post |
| GET | `/v1/admin/payments/overview` | admin | AdminController | admin | Get |
| GET | `/v1/admin/system/metrics` | admin | AdminController | admin | Get |
| POST | `/v1/admin/setup/master-copy` | admin | AdminController | admin | Post |
| GET | `/v1/admin/broker-accounts` | admin | AdminController | admin | Get |
| PATCH | `/v1/admin/broker-accounts/:id/master` | admin | AdminController | admin | Patch |
| POST | `/v1/admin/broker-accounts/:id/broadcast` | admin | AdminController | admin | Post |
| GET | `/v1/admin/kyc/pending` | admin | AdminController | admin | Get |
| GET | `/v1/admin/kyc/documents/:docId/url` | admin | AdminController | admin | Get |
| POST | `/v1/admin/kyc/:userId/review` | admin | AdminController | admin | Post |
| GET | `/v1/affiliates/me` | affiliates | AffiliatesController | user | Get |
| GET | `/v1/affiliates/dashboard` | affiliates | AffiliatesController | user | Get |
| GET | `/v1/affiliates/referrals` | affiliates | AffiliatesController | user | Get |
| GET | `/v1/affiliates/activity` | affiliates | AffiliatesController | user | Get |
| GET | `/v1/affiliates/leaderboard` | affiliates | AffiliatesController | user | Get |
| POST | `/v1/affiliates/capture/:code` | affiliates | AffiliatesController | user | Post |
| POST | `/v1/affiliates/withdraw` | affiliates | AffiliatesController | user | Post |
| GET | `/v1/agents/dashboard` | agents | AgentsController | admin | Get |
| GET | `/v1/agents/activity` | agents | AgentsController | admin | Get |
| GET | `/v1/agents/insights` | agents | AgentsController | admin | Get |
| POST | `/v1/agents/budgets/:agentType/enable` | agents | AgentsController | admin | Post |
| POST | `/v1/agents/budgets/:agentType/disable` | agents | AgentsController | admin | Post |
| POST | `/v1/agents/run-all-low` | agents | AgentsController | admin | Post |
| POST | `/v1/agents/run/:agentType` | agents | AgentsController | admin | Post |
| POST | `/v1/ai/explain-trade/:tradeId` | ai | AIController | user | Post |
| POST | `/v1/ai/explain` | ai | AIController | user | Post |
| POST | `/v1/ai/chat` | ai | AIController | user | Post |
| GET | `/v1/ai/coaching-report` | ai | AIController | user | Get |
| GET | `/v1/ai/market-regime/:symbol` | ai | AIController | user | Get |
| GET | `/v1/ai/regime` | ai | AIController | user | Get |
| GET | `/v1/risk/metrics` | ai-risk | AiRiskController | user | Get |
| GET | `/v1/risk/score` | ai-risk | AiRiskController | user | Get |
| GET | `/v1/risk/policy` | ai-risk | AiRiskController | user | Get |
| PUT | `/v1/risk/policy` | ai-risk | AiRiskController | user | Put |
| GET | `/v1/risk/dashboard` | ai-risk | AiRiskController | user | Get |
| GET | `/v1/analytics/portfolio` | analytics | AnalyticsController | user | Get |
| GET | `/v1/analytics/monthly-returns` | analytics | AnalyticsController | user | Get |
| GET | `/v1/analytics/strategy-comparison` | analytics | AnalyticsController | user | Get |
| GET | `/v1/analytics/risk` | analytics | AnalyticsController | user | Get |
| GET | `/v1/analytics/advanced` | analytics | AnalyticsController | user | Get |
| GET | `/v1/analytics/trades` | analytics | AnalyticsController | user | Get |
| GET | `/v1/analytics/trades/export` | analytics | AnalyticsController | user | Get |
| GET | `/v1/analytics/execution` | analytics | AnalyticsController | user | Get |
| GET | `/v1/analytics/tax-report` | analytics | AnalyticsController | user | Get |
| GET | `/v1/analytics/global` | analytics | AnalyticsController | user | Get |
| GET | `/v1/analytics/leaderboard` | analytics | AnalyticsController | user | Get |
| GET | `/v1/settings/api-keys` | api-keys | ApiKeysController | user | Get |
| POST | `/v1/settings/api-keys` | api-keys | ApiKeysController | user | Post |
| DELETE | `/v1/settings/api-keys/:id` | api-keys | ApiKeysController | user | Delete |
| POST | `/v1/auth/register` | auth | AuthController | public | Post |
| POST | `/v1/auth/verify-email` | auth | AuthController | public | Post |
| POST | `/v1/auth/login` | auth | AuthController | public | Post |
| POST | `/v1/auth/2fa/complete-login` | auth | AuthController | public | Post |
| POST | `/v1/auth/supabase` | auth | AuthController | public | Post |
| POST | `/v1/auth/firebase` | auth | AuthController | public | Post |
| POST | `/v1/auth/refresh` | auth | AuthController | public | Post |
| POST | `/v1/auth/logout` | auth | AuthController | user | Post |
| POST | `/v1/auth/forgot-password` | auth | AuthController | public | Post |
| POST | `/v1/auth/reset-password` | auth | AuthController | public | Post |
| POST | `/v1/auth/resend-otp` | auth | AuthController | public | Post |
| POST | `/v1/auth/magic-link` | auth | AuthController | public | Post |
| GET | `/v1/auth/magic-link/verify` | auth | AuthController | public | Get |
| POST | `/v1/auth/2fa/setup` | auth | AuthController | user | Post |
| POST | `/v1/auth/2fa/cancel-setup` | auth | AuthController | user | Post |
| POST | `/v1/auth/2fa/verify-setup` | auth | AuthController | user | Post |
| POST | `/v1/auth/2fa/disable` | auth | AuthController | user | Post |
| POST | `/v1/auth/2fa/backup-codes` | auth | AuthController | user | Post |
| GET | `/v1/auth/github` | auth | AuthController | public | Get |
| GET | `/v1/auth/github/callback` | auth | AuthController | public | Get |
| GET | `/v1/auth/google` | auth | AuthController | public | Get |
| GET | `/v1/auth/google/callback` | auth | AuthController | public | Get |
| GET | `/v1/auth/oauth-token-exchange` | auth | AuthController | public | Get |
| GET | `/v1/broker/accounts/:id/snapshot/latest` | broker | AccountSnapshotController | user | Get |
| GET | `/v1/broker/accounts/:id/snapshot/summary` | broker | AccountSnapshotController | user | Get |
| GET | `/v1/broker/accounts/:id/snapshot/history` | broker | AccountSnapshotController | user | Get |
| GET | `/v1/broker/accounts/:id/snapshot/positions` | broker | AccountSnapshotController | user | Get |
| GET | `/v1/broker/accounts/:id/snapshot/pending-orders` | broker | AccountSnapshotController | user | Get |
| GET | `/v1/broker/accounts/:id/snapshot/deals` | broker | AccountSnapshotController | user | Get |
| GET | `/v1/broker/accounts/:id/snapshot/balance-history` | broker | AccountSnapshotController | user | Get |
| GET | `/v1/broker/accounts/:id/snapshot/equity-history` | broker | AccountSnapshotController | user | Get |
| GET | `/v1/broker/accounts/:id/snapshot/drawdown-history` | broker | AccountSnapshotController | user | Get |
| GET | `/v1/broker/accounts/:id/snapshot/returns-history` | broker | AccountSnapshotController | user | Get |
| GET | `/v1/broker/accounts/:id/snapshot/analytics` | broker | AccountSnapshotController | user | Get |
| GET | `/v1/broker/accounts/:id/snapshot/performance` | broker | AccountSnapshotController | user | Get |
| GET | `/v1/broker/accounts/:id/snapshot/risk` | broker | AccountSnapshotController | user | Get |
| GET | `/v1/broker/accounts/:id/snapshot/symbols` | broker | AccountSnapshotController | user | Get |
| GET | `/v1/broker/accounts/:id/snapshot/timeline` | broker | AccountSnapshotController | user | Get |
| POST | `/v1/broker/accounts/connect` | broker | BrokerController | user | Post |
| GET | `/v1/broker/accounts` | broker | BrokerController | user | Get |
| DELETE | `/v1/broker/accounts/:id` | broker | BrokerController | user | Delete |
| POST | `/v1/broker/accounts/:id/test` | broker | BrokerController | user | Post |
| POST | `/v1/broker/accounts/:id/bridge-token` | broker | BrokerController | user | Post |
| POST | `/v1/broker/accounts/:id/share` | broker | BrokerController | user | Post |
| GET | `/v1/broker/accounts` | broker | BrokerController | user | Get |
| POST | `/v1/broker/accounts/:id/accept` | broker | BrokerController | user | Post |
| POST | `/v1/broker/accounts/:id/decline` | broker | BrokerController | user | Post |
| DELETE | `/v1/broker/accounts/:id` | broker | BrokerController | user | Delete |
| GET | `/v1/coach/conversations` | coach | CoachController | admin | Get |
| POST | `/v1/coach/conversations` | coach | CoachController | admin | Post |
| GET | `/v1/coach/conversations/:id` | coach | CoachController | admin | Get |
| DELETE | `/v1/coach/conversations/:id` | coach | CoachController | admin | Delete |
| POST | `/v1/coach/conversations/:id/messages` | coach | CoachController | admin | Post |
| POST | `/v1/coach/conversations/:id/messages/stream` | coach | CoachController | admin | Post |
| POST | `/v1/coach/conversations/:id/escalate` | coach | CoachController | admin | Post |
| GET | `/v1/coach/admin/escalations` | coach | CoachController | admin | Get |
| GET | `/v1/coach/admin/conversations/:id` | coach | CoachController | admin | Get |
| POST | `/v1/coach/admin/escalations/:id/claim` | coach | CoachController | admin | Post |
| POST | `/v1/coach/admin/escalations/:id/reply` | coach | CoachController | admin | Post |
| POST | `/v1/coach/admin/escalations/:id/resolve` | coach | CoachController | admin | Post |
| GET | `/v1/copy/masters` | copy | CopyController | public | Get |
| GET | `/v1/copy/masters/:id` | copy | CopyController | public | Get |
| GET | `/v1/copy/master/me` | copy | CopyController | user | Get |
| PUT | `/v1/copy/master/me` | copy | CopyController | user | Put |
| GET | `/v1/copy/relationships` | copy | CopyController | user | Get |
| PUT | `/v1/copy/subscriptions/:id/sizing` | copy | CopyController | user | Put |
| GET | `/v1/bridge/orders` | copy-bridge | CopyBridgeController | public | Get |
| POST | `/v1/bridge/orders/:id/result` | copy-bridge | CopyBridgeController | public | Post |
| GET | `/v1/admin/flags` | feature-flags | FeatureFlagsController | user | Get |
| GET | `/v1/admin/flags/:key` | feature-flags | FeatureFlagsController | user | Get |
| PUT | `/v1/admin/flags/:key` | feature-flags | FeatureFlagsController | user | Put |
| DELETE | `/v1/admin/flags/:key` | feature-flags | FeatureFlagsController | user | Delete |
| GET | `/v1/growth/activation` | growth | GrowthController | admin | Get |
| POST | `/v1/growth/track` | growth | GrowthController | admin | Post |
| GET | `/v1/growth/metrics` | growth | GrowthController | admin | Get |
| GET | `/v1/journal` | journal | JournalController | user | Get |
| GET | `/v1/journal/insights` | journal | JournalController | user | Get |
| POST | `/v1/journal` | journal | JournalController | user | Post |
| PATCH | `/v1/journal/:id` | journal | JournalController | user | Patch |
| PATCH | `/v1/journal/:id/rate` | journal | JournalController | user | Patch |
| POST | `/v1/journal/:id/analyze` | journal | JournalController | user | Post |
| GET | `/v1/leaderboard/monthly` | leaderboard | LeaderboardController | public | Get |
| GET | `/v1/leaderboard/alltime` | leaderboard | LeaderboardController | public | Get |
| GET | `/v1/leaderboard/strategies` | leaderboard | LeaderboardController | public | Get |
| GET | `/v1/leaderboard/me` | leaderboard | LeaderboardController | user | Get |
| GET | `/v1/market/quote` | market | MarketController | public | Get |
| GET | `/v1/market/quotes` | market | MarketController | public | Get |
| GET | `/v1/market/ohlc` | market | MarketController | public | Get |
| GET | `/v1/market/news` | market | MarketController | public | Get |
| GET | `/v1/market/company-news` | market | MarketController | public | Get |
| GET | `/v1/market/economic-calendar` | market | MarketController | public | Get |
| GET | `/v1/marketplace` | marketplace | MarketplaceController | public | Get |
| GET | `/v1/marketplace/featured` | marketplace | MarketplaceController | public | Get |
| GET | `/v1/marketplace/:id/analytics` | marketplace | MarketplaceController | public | Get |
| GET | `/v1/marketplace/:id` | marketplace | MarketplaceController | public | Get |
| POST | `/v1/marketplace/:strategyId/listing` | marketplace | MarketplaceController | user | Post |
| POST | `/v1/marketplace/:strategyId/subscribe` | marketplace | MarketplaceController | user | Post |
| PATCH | `/v1/marketplace/:strategyId/risk-overrides` | marketplace | MarketplaceController | user | Patch |
| GET | `/v1/marketplace/:strategyId/risk-overrides` | marketplace | MarketplaceController | user | Get |
| GET | `/v1/marketplace/:id/reviews` | marketplace | MarketplaceController | public | Get |
| POST | `/v1/marketplace/:id/reviews` | marketplace | MarketplaceController | user | Post |
| PATCH | `/v1/marketplace/reviews/:reviewId/reply` | marketplace | MarketplaceController | user | Patch |
| GET | `/v1/notifications` | notifications | NotificationsController | user | Get |
| GET | `/v1/notifications/unread-count` | notifications | NotificationsController | user | Get |
| GET | `/v1/notifications/preferences` | notifications | NotificationsController | user | Get |
| PATCH | `/v1/notifications/preferences` | notifications | NotificationsController | user | Patch |
| PATCH | `/v1/notifications/mark-seen` | notifications | NotificationsController | user | Patch |
| PATCH | `/v1/notifications/mark-all-read` | notifications | NotificationsController | user | Patch |
| PATCH | `/v1/notifications/:id/read` | notifications | NotificationsController | user | Patch |
| DELETE | `/v1/notifications/:id` | notifications | NotificationsController | user | Delete |
| DELETE | `/v1/notifications` | notifications | NotificationsController | user | Delete |
| POST | `/v1/notifications/fcm-token` | notifications | NotificationsController | user | Post |
| POST | `/v1/notifications/fcm-token/remove` | notifications | NotificationsController | user | Post |
| POST | `/v1/webhooks/stripe` | payments | PaymentsController | public | Post |
| POST | `/v1/webhooks/razorpay` | payments | PaymentsController | public | Post |
| POST | `/v1/payments/razorpay/order` | payments | RazorpayController | user | Post |
| POST | `/v1/payments/razorpay/verify` | payments | RazorpayController | user | Post |
| POST | `/v1/payments/razorpay/demo-complete` | payments | RazorpayController | user | Post |
| GET | `/v1/plans` | plans | PlansController | user | Get |
| GET | `/v1/search/global` | search | SearchController | public | Get |
| GET | `/v1/strategies` | strategies | StrategiesController | public | Get |
| GET | `/v1/strategies/my` | strategies | StrategiesController | user | Get |
| GET | `/v1/strategies/created` | strategies | StrategiesController | user | Get |
| GET | `/v1/strategies/:id` | strategies | StrategiesController | public | Get |
| POST | `/v1/strategies` | strategies | StrategiesController | user | Post |
| PATCH | `/v1/strategies/:id` | strategies | StrategiesController | user | Patch |
| DELETE | `/v1/strategies/:id` | strategies | StrategiesController | user | Delete |
| POST | `/v1/strategies/:id/activate` | strategies | StrategiesController | user | Post |
| POST | `/v1/strategies/:id/deactivate` | strategies | StrategiesController | user | Post |
| POST | `/v1/strategies/:id/pause` | strategies | StrategiesController | user | Post |
| POST | `/v1/strategies/:id/resume` | strategies | StrategiesController | user | Post |
| PATCH | `/v1/strategies/:id/auto-renew` | strategies | StrategiesController | user | Patch |
| POST | `/v1/strategies/:id/backtest` | strategies | StrategiesController | user | Post |
| POST | `/v1/strategies/backtest/preview` | strategies | StrategiesController | user | Post |
| POST | `/v1/strategies/:id/backtest/walk-forward` | strategies | StrategiesController | user | Post |
| POST | `/v1/strategies/:id/backtest/sensitivity` | strategies | StrategiesController | user | Post |
| POST | `/v1/strategies/:id/publish` | strategies | StrategiesController | user | Post |
| POST | `/v1/strategies/:id/publish-live` | strategies | StrategiesController | user | Post |
| GET | `/v1/strategies/:id/documents` | strategies | StrategiesController | user | Get |
| GET | `/v1/strategies/:id/documents/:documentId/file` | strategies | StrategiesController | public | Get |
| POST | `/v1/strategies/:id/documents` | strategies | StrategiesController | user | Post |
| DELETE | `/v1/strategies/:id/documents/:documentId` | strategies | StrategiesController | user | Delete |
| POST | `/v1/builder` | strategy-builder | StrategyBuilderController | user | Post |
| GET | `/v1/builder` | strategy-builder | StrategyBuilderController | user | Get |
| GET | `/v1/builder/:id` | strategy-builder | StrategyBuilderController | user | Get |
| DELETE | `/v1/builder/:id` | strategy-builder | StrategyBuilderController | user | Delete |
| POST | `/v1/builder/:id/nodes` | strategy-builder | StrategyBuilderController | user | Post |
| PATCH | `/v1/builder/nodes/:nodeId` | strategy-builder | StrategyBuilderController | user | Patch |
| DELETE | `/v1/builder/nodes/:nodeId` | strategy-builder | StrategyBuilderController | user | Delete |
| POST | `/v1/builder/:id/edges` | strategy-builder | StrategyBuilderController | user | Post |
| DELETE | `/v1/builder/edges/:edgeId` | strategy-builder | StrategyBuilderController | user | Delete |
| POST | `/v1/builder/:id/compile` | strategy-builder | StrategyBuilderController | user | Post |
| POST | `/v1/builder/:id/backtest` | strategy-builder | StrategyBuilderController | user | Post |
| GET | `/v1/builder/:id/codegen` | strategy-builder | StrategyBuilderController | user | Get |
| POST | `/v1/builder/:id/publish` | strategy-builder | StrategyBuilderController | user | Post |
| GET | `/v1/subscriptions/plans` | subscriptions | SubscriptionsController | public | Get |
| GET | `/v1/subscriptions/current` | subscriptions | SubscriptionsController | user | Get |
| POST | `/v1/subscriptions/checkout` | subscriptions | SubscriptionsController | user | Post |
| POST | `/v1/subscriptions/cancel` | subscriptions | SubscriptionsController | user | Post |
| GET | `/v1/subscriptions/invoices` | subscriptions | SubscriptionsController | user | Get |
| GET | `/v1/subscriptions/payments` | subscriptions | SubscriptionsController | user | Get |
| POST | `/v1/support/tickets` | support | SupportController | user | Post |
| GET | `/v1/support/tickets` | support | SupportController | user | Get |
| GET | `/v1/support/tickets/:id` | support | SupportController | user | Get |
| POST | `/v1/support/tickets/:id/responses` | support | SupportController | user | Post |
| PATCH | `/v1/support/tickets/:id/status` | support | SupportController | admin | Patch |
| PATCH | `/v1/support/tickets/:id/assign` | support | SupportController | admin | Patch |
| GET | `/v1/support/admin/billing/:billingId` | support | SupportController | admin | Get |
| GET | `/v1/support/admin/pending` | support | SupportController | admin | Get |
| POST | `/v1/telegram/webhook` | telegram | TelegramController | public | Post |
| POST | `/v1/telegram/link` | telegram | TelegramController | user | Post |
| GET | `/v1/telegram/test-alert` | telegram | TelegramController | user | Get |
| POST | `/v1/trading/emergency-stop` | trading | TradingController | admin | Post |
| POST | `/v1/trading/trades/order` | trading | TradingController | admin | Post |
| POST | `/v1/trading/trades/bulk-close` | trading | TradingController | admin | Post |
| POST | `/v1/trading/trades/:id/close` | trading | TradingController | admin | Post |
| PATCH | `/v1/trading/trades/:id/modify` | trading | TradingController | admin | Patch |
| POST | `/v1/trading/trades/:id/break-even` | trading | TradingController | admin | Post |
| POST | `/v1/trading/trades/:id/trailing-stop` | trading | TradingController | admin | Post |
| GET | `/v1/trading/subscriptions` | trading | TradingController | admin | Get |
| PATCH | `/v1/trading/subscriptions/:id` | trading | TradingController | admin | Patch |
| GET | `/v1/trading/trades/open` | trading | TradingController | admin | Get |
| POST | `/v1/trading/sync-bots` | trading | TradingController | admin | Post |
| GET | `/v1/trading/trades/history` | trading | TradingController | admin | Get |
| GET | `/v1/trading/master-status` | trading | TradingController | admin | Get |
| GET | `/v1/tutorial/progress` | tutorial | TutorialController | user | Get |
| POST | `/v1/tutorial/progress` | tutorial | TutorialController | user | Post |
| GET | `/v1/users/me` | users | UsersController | user | Get |
| PATCH | `/v1/users/me` | users | UsersController | user | Patch |
| POST | `/v1/users/me/avatar` | users | UsersController | user | Post |
| PATCH | `/v1/users/me/risk-profile` | users | UsersController | user | Patch |
| GET | `/v1/users/me/sessions` | users | UsersController | user | Get |
| DELETE | `/v1/users/me/sessions/:id` | users | UsersController | user | Delete |
| DELETE | `/v1/users/me/sessions` | users | UsersController | user | Delete |
| POST | `/v1/users/me/password-reset/request-otp` | users | UsersController | user | Post |
| POST | `/v1/users/me/password-reset/verify-otp` | users | UsersController | user | Post |
| POST | `/v1/users/me/password-reset/confirm` | users | UsersController | user | Post |
| POST | `/v1/users/me/delete/request-otp` | users | UsersController | user | Post |
| POST | `/v1/users/me/delete/verify-otp` | users | UsersController | user | Post |
| DELETE | `/v1/users/me` | users | UsersController | user | Delete |
| GET | `/v1/users/me/kyc` | users | UsersController | user | Get |
| POST | `/v1/users/me/kyc` | users | UsersController | user | Post |
| GET | `/v1/users/me/email-history` | users | UsersController | user | Get |
| GET | `/v1/vps` | vps | VpsController | user | Get |
| POST | `/v1/vps` | vps | VpsController | user | Post |
| POST | `/v1/vps/:id/start` | vps | VpsController | user | Post |
| POST | `/v1/vps/:id/stop` | vps | VpsController | user | Post |
| DELETE | `/v1/vps/:id` | vps | VpsController | user | Delete |
| GET | `/v1/vps/:id/bots` | vps | VpsController | user | Get |
| POST | `/v1/vps/:id/bots` | vps | VpsController | user | Post |
| POST | `/v1/vps/bots/:botId/start` | vps | VpsController | user | Post |
| POST | `/v1/vps/bots/:botId/stop` | vps | VpsController | user | Post |
| GET | `/v1/wallet/balance` | wallet | WalletController | user | Get |
| GET | `/v1/wallet/transactions` | wallet | WalletController | user | Get |
| POST | `/v1/wallet/deposit` | wallet | WalletController | user | Post |
| POST | `/v1/wallet/withdrawal-otp` | wallet | WalletController | user | Post |
| POST | `/v1/wallet/withdraw/preview` | wallet | WalletController | user | Post |
| POST | `/v1/wallet/withdraw` | wallet | WalletController | user | Post |
| GET | `/v1/wallet/statement/:year/:month` | wallet | WalletController | user | Get |
| GET | `/v1/wallet/billing/:billingId` | wallet | WalletController | user | Get |
| GET | `/v1/wallet/transaction/:id` | wallet | WalletController | user | Get |
| POST | `/v1/wallet/webhook` | wallet | WalletController | user | Post |
