# PAGINATION_REPORT — API Audit Phase 1

## Patterns detected in code

| File | Cursor | Offset page | take |
|------|:------:|:-----------:|:----:|
| `apps/api/src/modules/admin/admin.service.ts` |  |  | Y |
| `apps/api/src/modules/affiliates/affiliates.service.ts` |  |  | Y |
| `apps/api/src/modules/agents/agent-scheduler.service.ts` |  |  | Y |
| `apps/api/src/modules/agents/core/agent-rollups.service.ts` |  |  | Y |
| `apps/api/src/modules/ai/ai.service.ts` |  |  | Y |
| `apps/api/src/modules/ai-risk/ai-risk.service.ts` |  |  | Y |
| `apps/api/src/modules/analytics/analytics.service.ts` |  |  | Y |
| `apps/api/src/modules/broker/account-snapshot.service.ts` |  |  | Y |
| `apps/api/src/modules/coach/coach.service.ts` |  |  | Y |
| `apps/api/src/modules/copy/copy.service.ts` |  |  | Y |
| `apps/api/src/modules/email/email.service.ts` |  |  | Y |
| `apps/api/src/modules/growth/lifecycle.service.ts` |  |  | Y |
| `apps/api/src/modules/journal/trading-journal.service.ts` |  |  | Y |
| `apps/api/src/modules/leaderboard/leaderboard.service.ts` |  |  | Y |
| `apps/api/src/modules/marketplace/marketplace.service.ts` | Y | Y | Y |
| `apps/api/src/modules/notifications/notifications.service.ts` |  | Y | Y |
| `apps/api/src/modules/payments/payments.service.ts` |  |  | Y |
| `apps/api/src/modules/search/search.service.ts` |  |  | Y |
| `apps/api/src/modules/social/social-trading.service.ts` |  |  | Y |
| `apps/api/src/modules/strategies/strategies.service.ts` |  |  | Y |
| `apps/api/src/modules/support/support.service.ts` |  |  | Y |
| `apps/api/src/modules/telegram/telegram-bot.service.ts` |  |  | Y |
| `apps/api/src/modules/trading/trading.service.ts` |  |  | Y |
| `apps/api/src/modules/users/users.service.ts` |  |  | Y |
| `apps/api/src/modules/wallet/wallet.service.ts` |  |  | Y |
| `apps/api/src/modules/agents/agents.controller.ts` |  |  | Y |

## List endpoints (GET inventory without `:id`)

- `/v1/admin/broker-accounts` (admin)
- `/v1/affiliates/leaderboard` (affiliates)
- `/v1/analytics/trades` (analytics)
- `/v1/analytics/trades/export` (analytics)
- `/v1/analytics/leaderboard` (analytics)
- `/v1/broker/accounts` (broker)
- `/v1/broker/accounts` (broker)
- `/v1/coach/conversations` (coach)
- `/v1/leaderboard/monthly` (leaderboard)
- `/v1/leaderboard/alltime` (leaderboard)
- `/v1/leaderboard/strategies` (leaderboard)
- `/v1/leaderboard/me` (leaderboard)
- `/v1/marketplace` (marketplace)
- `/v1/marketplace/featured` (marketplace)
- `/v1/notifications` (notifications)
- `/v1/notifications/unread-count` (notifications)
- `/v1/notifications/preferences` (notifications)
- `/v1/search/global` (search)
- `/v1/trading/trades/open` (trading)
- `/v1/trading/trades/history` (trading)
- `/v1/wallet/balance` (wallet)
- `/v1/wallet/transactions` (wallet)
