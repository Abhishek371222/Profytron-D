# PHASE2_INPUTS — API (from Phase 1)

Authorized themes only:

1. Reduce wall latency on top ranked GETs (batching/caching) **without** contract changes where possible.
2. Payload trimming / field selection on largest responses.
3. OpenAPI decorator coverage.
4. Pagination standard (versioned if breaking).
5. Targeted throttles on expensive AI/analytics if abuse appears.
6. Optional keep/remove `AuditTimingInterceptor` based on usefulness.

Do **not** start: rewriting trading, auth, sync, WS protocols, DTO breaks.
