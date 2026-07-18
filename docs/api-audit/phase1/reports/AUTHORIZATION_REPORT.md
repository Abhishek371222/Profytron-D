# AUTHORIZATION_REPORT — API Audit Phase 1

## Model

| Layer | Behavior |
|-------|----------|
| Global | `JwtAuthGuard` on all routes |
| Escape | `@Public()` metadata (`IS_PUBLIC_KEY`) |
| Roles | `@Roles('ADMIN')` on admin/coach/agents controllers |
| Throttle | Separate `AppThrottlerGuard` (not authz) |

## Counts

| Auth tier | Endpoints |
|-----------|----------:|
| public | 45 |
| user | 179 |
| admin | 64 |

## Public routes (inventory)

- `GET /v1` (AppController)
- `GET /health` (AppController)
- `POST /v1/auth/register` (AuthController)
- `POST /v1/auth/verify-email` (AuthController)
- `POST /v1/auth/login` (AuthController)
- `POST /v1/auth/2fa/complete-login` (AuthController)
- `POST /v1/auth/supabase` (AuthController)
- `POST /v1/auth/firebase` (AuthController)
- `POST /v1/auth/refresh` (AuthController)
- `POST /v1/auth/forgot-password` (AuthController)
- `POST /v1/auth/reset-password` (AuthController)
- `POST /v1/auth/resend-otp` (AuthController)
- `POST /v1/auth/magic-link` (AuthController)
- `GET /v1/auth/magic-link/verify` (AuthController)
- `GET /v1/auth/github` (AuthController)
- `GET /v1/auth/github/callback` (AuthController)
- `GET /v1/auth/google` (AuthController)
- `GET /v1/auth/google/callback` (AuthController)
- `GET /v1/auth/oauth-token-exchange` (AuthController)
- `GET /v1/copy/masters` (CopyController)
- `GET /v1/copy/masters/:id` (CopyController)
- `GET /v1/bridge/orders` (CopyBridgeController)
- `POST /v1/bridge/orders/:id/result` (CopyBridgeController)
- `GET /v1/leaderboard/monthly` (LeaderboardController)
- `GET /v1/leaderboard/alltime` (LeaderboardController)
- `GET /v1/leaderboard/strategies` (LeaderboardController)
- `GET /v1/market/quote` (MarketController)
- `GET /v1/market/quotes` (MarketController)
- `GET /v1/market/ohlc` (MarketController)
- `GET /v1/market/news` (MarketController)
- `GET /v1/market/company-news` (MarketController)
- `GET /v1/market/economic-calendar` (MarketController)
- `GET /v1/marketplace` (MarketplaceController)
- `GET /v1/marketplace/featured` (MarketplaceController)
- `GET /v1/marketplace/:id/analytics` (MarketplaceController)
- `GET /v1/marketplace/:id` (MarketplaceController)
- `GET /v1/marketplace/:id/reviews` (MarketplaceController)
- `POST /v1/webhooks/stripe` (PaymentsController)
- `POST /v1/webhooks/razorpay` (PaymentsController)
- `GET /v1/search/global` (SearchController)
- `GET /v1/strategies` (StrategiesController)
- `GET /v1/strategies/:id` (StrategiesController)
- `GET /v1/strategies/:id/documents/:documentId/file` (StrategiesController)
- `GET /v1/subscriptions/plans` (SubscriptionsController)
- `POST /v1/telegram/webhook` (TelegramController)

## Admin-marked

- `GET /v1/admin/dashboard`
- `GET /v1/admin/stats`
- `GET /v1/admin/users`
- `GET /v1/admin/users/:id`
- `POST /v1/admin/users/:id/withdraw`
- `PATCH /v1/admin/users/:id/status`
- `PATCH /v1/admin/users/:id/role`
- `GET /v1/admin/verifications`
- `GET /v1/admin/strategies`
- `POST /v1/admin/strategies`
- `PATCH /v1/admin/strategies/:id`
- `POST /v1/admin/strategies/pdf`
- `POST /v1/admin/strategies/:strategyId/documents`
- `DELETE /v1/admin/strategies/:strategyId/documents/:documentId`
- `DELETE /v1/admin/strategies/:id`
- `POST /v1/admin/verifications/:id/handle`
- `GET /v1/admin/payments/overview`
- `GET /v1/admin/system/metrics`
- `POST /v1/admin/setup/master-copy`
- `GET /v1/admin/broker-accounts`
- `PATCH /v1/admin/broker-accounts/:id/master`
- `POST /v1/admin/broker-accounts/:id/broadcast`
- `GET /v1/admin/kyc/pending`
- `GET /v1/admin/kyc/documents/:docId/url`
- `POST /v1/admin/kyc/:userId/review`
- `GET /v1/agents/dashboard`
- `GET /v1/agents/activity`
- `GET /v1/agents/insights`
- `POST /v1/agents/budgets/:agentType/enable`
- `POST /v1/agents/budgets/:agentType/disable`
- `POST /v1/agents/run-all-low`
- `POST /v1/agents/run/:agentType`
- `GET /v1/coach/conversations`
- `POST /v1/coach/conversations`
- `GET /v1/coach/conversations/:id`
- `DELETE /v1/coach/conversations/:id`
- `POST /v1/coach/conversations/:id/messages`
- `POST /v1/coach/conversations/:id/messages/stream`
- `POST /v1/coach/conversations/:id/escalate`
- `GET /v1/coach/admin/escalations`
- `GET /v1/coach/admin/conversations/:id`
- `POST /v1/coach/admin/escalations/:id/claim`
- `POST /v1/coach/admin/escalations/:id/reply`
- `POST /v1/coach/admin/escalations/:id/resolve`
- `GET /v1/growth/activation`
- `POST /v1/growth/track`
- `GET /v1/growth/metrics`
- `PATCH /v1/support/tickets/:id/status`
- `PATCH /v1/support/tickets/:id/assign`
- `GET /v1/support/admin/billing/:billingId`
- `GET /v1/support/admin/pending`
- `POST /v1/trading/emergency-stop`
- `POST /v1/trading/trades/order`
- `POST /v1/trading/trades/bulk-close`
- `POST /v1/trading/trades/:id/close`
- `PATCH /v1/trading/trades/:id/modify`
- `POST /v1/trading/trades/:id/break-even`
- `POST /v1/trading/trades/:id/trailing-stop`
- `GET /v1/trading/subscriptions`
- `PATCH /v1/trading/subscriptions/:id`
- `GET /v1/trading/trades/open`
- `POST /v1/trading/sync-bots`
- `GET /v1/trading/trades/history`
- `GET /v1/trading/master-status`
