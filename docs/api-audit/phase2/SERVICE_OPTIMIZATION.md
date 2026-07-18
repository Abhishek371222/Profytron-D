# SERVICE_OPTIMIZATION — Phase 2

**Evidence:** `SERVICE_MAP.md`, `DEPENDENCY_GRAPH.md`, `API-P1-N1-CHATTY`

## Changes

| Area | Before | After |
|------|--------|-------|
| Subscription plans read | Every request → Prisma RTT | Cache-aside Redis 120s |
| Public masters list | Every request → Prisma | Process cache 30s + invalidate |
| Copy backfill | Sequential upserts (DB Phase 2 already `$transaction`) | Cache invalidate after backfill |
| Health probes | Full dependency probe every call | Cached snapshot 2s |

## Duplication reduced

- Plans: single cache key owned by `PaymentsService.getSubscriptionPlans` (see `CACHE_GOVERNANCE.md`).
- Masters: single in-process owner `CopyTradingService` (no second Redis key to avoid dual ownership).

## Not done (would break contracts / locks)

- Splitting `PaymentsService` into multiple public modules
- Changing controller response DTOs
- Touching Sync Engine services
