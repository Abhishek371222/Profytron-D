# API_BUDGETS.md

Budgets for **warm** public GETs (lab, local Neon RTT). Cold starts may exceed once.

| Class | p50 budget | Notes |
|-------|----------:|-------|
| Static / cached config (`/subscriptions/plans`, `/copy/masters` warm) | ≤ 50 ms | After Phase 2 caches |
| Health (warm cache) | ≤ 20 ms | 2s snapshot |
| Market cached (quotes/news hit) | ≤ 30 ms | Redis hit |
| Market upstream miss | ≤ 2000 ms | External Finnhub/TwelveData |
| Authenticated dashboard aggregates | ≤ 500 ms | Prefer Redis + batch Prisma |

Payload budgets (encoded JSON body before transport compression):

| Route class | Soft max |
|-------------|---------:|
| News list | ≤ 40 KB (prefer ≤ 25 KB warm) |
| OHLC default | ≤ 50 KB |
| Leaderboard page | ≤ 10 KB |

Exceeding budgets requires Phase evidence + PRIORITY_MATRIX entry before adding infra.
