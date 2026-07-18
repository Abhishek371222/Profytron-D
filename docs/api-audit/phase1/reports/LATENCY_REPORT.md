# LATENCY_REPORT — API Audit Phase 1

| Field | Value |
|-------|-------|
| Base | http://localhost:4000 |
| Reachable | true |
| AUDIT_JWT | false |
| Probed | 24 |
| Skipped | 72 |

## Ranked by p50 (desc)

| Rank | Method | Path | p50 | min | max | avgBytes | status |
|-----:|--------|------|----:|----:|----:|---------:|-------:|
| 1 | GET | `/v1/subscriptions/plans` | 359.9 | 305.8 | 605.8 | 1626 | 200 |
| 2 | GET | `/v1/copy/masters` | 310.5 | 300.3 | 627.2 | 65 | 200 |
| 3 | GET | `/health` | 304.1 | 300.1 | 305.4 | 232 | 200 |
| 4 | GET | `/v1/market/ohlc` | 6.5 | 3.6 | 392.9 | 24969 | 200 |
| 5 | GET | `/v1/market/quote` | 5.5 | 4 | 198.5 | 192 | 200 |
| 6 | GET | `/v1/leaderboard/monthly` | 4.6 | 2.4 | 1217.1 | 1452 | 200 |
| 7 | GET | `/v1/leaderboard/strategies` | 3 | 2.9 | 1859.9 | 438 | 200 |
| 8 | GET | `/v1/market/news` | 3 | 2.3 | 982.2 | 36527 | 200 |
| 9 | GET | `/v1/auth/magic-link/verify` | 2.8 | 2.8 | 3 | 177 | 400 |
| 10 | GET | `/v1/auth/google` | 2.8 | 2.4 | 3.5 | 0 | 302 |
| 11 | GET | `/v1/auth/oauth-token-exchange` | 2.8 | 2.4 | 3.2 | 158 | 404 |
| 12 | GET | `/v1/market/economic-calendar` | 2.7 | 2.7 | 741.2 | 2814 | 200 |
| 13 | GET | `/v1/marketplace` | 2.5 | 2.1 | 3405.3 | 1985 | 200 |
| 14 | GET | `/v1/market/quotes` | 2.3 | 1.4 | 3.3 | 453 | 200 |
| 15 | GET | `/v1` | 2.2 | 1.9 | 3.5 | 265 | 200 |
| 16 | GET | `/v1/market/company-news` | 2.1 | 1.9 | 3.5 | 156 | 400 |
| 17 | GET | `/v1/search/global` | 1.9 | 1.7 | 2.2 | 152 | 400 |
| 18 | GET | `/v1/leaderboard/alltime` | 1.8 | 1.6 | 622.9 | 1436 | 200 |
| 19 | GET | `/v1/marketplace/featured` | 1.8 | 1.4 | 1824.9 | 1840 | 200 |
| 20 | GET | `/v1/strategies` | 1.8 | 1.6 | 1836.3 | 1265 | 200 |
| 21 | GET | `/v1/bridge/orders` | 1.5 | 1.3 | 2 | 153 | 401 |
| 22 | GET | `/v1/auth/google/callback` | 1.4 | 1.2 | 1.4 | 0 | 302 |
| 23 | GET | `/v1/auth/github` | 1.3 | 1.3 | 2.6 | 0 | 302 |
| 24 | GET | `/v1/auth/github/callback` | 1.3 | 1.3 | 1.8 | 0 | 302 |

## Skips (sample)

- `GET /v1/admin/dashboard`: no COMPAT_ADMIN_JWT/AUDIT_JWT
- `GET /v1/admin/stats`: no COMPAT_ADMIN_JWT/AUDIT_JWT
- `GET /v1/admin/users`: no COMPAT_ADMIN_JWT/AUDIT_JWT
- `GET /v1/admin/verifications`: no COMPAT_ADMIN_JWT/AUDIT_JWT
- `GET /v1/admin/strategies`: no COMPAT_ADMIN_JWT/AUDIT_JWT
- `GET /v1/admin/payments/overview`: no COMPAT_ADMIN_JWT/AUDIT_JWT
- `GET /v1/admin/system/metrics`: no COMPAT_ADMIN_JWT/AUDIT_JWT
- `GET /v1/admin/broker-accounts`: no COMPAT_ADMIN_JWT/AUDIT_JWT
- `GET /v1/admin/kyc/pending`: no COMPAT_ADMIN_JWT/AUDIT_JWT
- `GET /v1/affiliates/me`: no AUDIT_JWT
- `GET /v1/affiliates/dashboard`: no AUDIT_JWT
- `GET /v1/affiliates/referrals`: no AUDIT_JWT
- `GET /v1/affiliates/activity`: no AUDIT_JWT
- `GET /v1/affiliates/leaderboard`: no AUDIT_JWT
- `GET /v1/agents/dashboard`: no COMPAT_ADMIN_JWT/AUDIT_JWT
- `GET /v1/agents/activity`: no COMPAT_ADMIN_JWT/AUDIT_JWT
- `GET /v1/agents/insights`: no COMPAT_ADMIN_JWT/AUDIT_JWT
- `GET /v1/ai/coaching-report`: no AUDIT_JWT
- `GET /v1/ai/regime`: no AUDIT_JWT
- `GET /v1/risk/metrics`: no AUDIT_JWT
- `GET /v1/risk/score`: no AUDIT_JWT
- `GET /v1/risk/policy`: no AUDIT_JWT
- `GET /v1/risk/dashboard`: no AUDIT_JWT
- `GET /v1/analytics/portfolio`: no AUDIT_JWT
- `GET /v1/analytics/monthly-returns`: no AUDIT_JWT
- `GET /v1/analytics/strategy-comparison`: no AUDIT_JWT
- `GET /v1/analytics/risk`: no AUDIT_JWT
- `GET /v1/analytics/advanced`: no AUDIT_JWT
- `GET /v1/analytics/trades`: no AUDIT_JWT
- `GET /v1/analytics/trades/export`: no AUDIT_JWT

## Phase breakdown

Guard / validation / Prisma phase split requires `API_AUDIT_TIMING=1` interceptor JSONL (`data/timing-interceptor.jsonl`). Off by default — removable.
