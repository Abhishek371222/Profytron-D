# DEPENDENCY_REDUCTION — Phase 2

**Evidence:** Phase 1 `DEPENDENCY_GRAPH.md` — **0** mutual injection cycles detected.

## Before

- Large services (`PaymentsService`, broker sync) remain hubs by design.
- Chatty Prisma from list endpoints amplified RTT.

## After

- No new circular injections introduced.
- Read-path load removed from Prisma for cached plans/masters (fewer edges exercised per request).
- Masters list cache clears on upsert + backfill (write path still owns Prisma).

## Deferred

Extracting `PaymentsService` into billing-only modules requires a dedicated Phase 3+ with contract tests — out of Phase 2 locks.
