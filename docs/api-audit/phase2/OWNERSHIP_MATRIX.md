# OWNERSHIP_MATRIX.md

| Domain | Module | Primary service | Cache owner |
|--------|--------|-----------------|-------------|
| Auth / sessions | `auth` | `AuthService`, `RedisService` | Auth Redis keys |
| Subscriptions / plans | `subscriptions`, `payments` | `PaymentsService` | `api:cache:subscription-plans:v1` |
| Copy masters | `copy` | `CopyTradingService` | Process cache |
| Market data | `market` | `MarketService` | `market:*` Redis |
| Trading HTTP | `trading` | `TradingService` | none (DB) |
| Trading WS prices | `trading` | `TradingGateway` | `lastPriceSnapshot` |
| Broker / sync | `broker`, `sync` | Sync services | Sync Redis watermarks |
| Wallet | `wallet` | `WalletService` | OTP Redis |
| Admin | `admin` | `AdminService` | none |
| Health | `app` | `AppController` | 2s process cache |

New endpoints must name an owner in PR description.
