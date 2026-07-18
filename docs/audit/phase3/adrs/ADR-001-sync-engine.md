# ADR-001: Nest Synchronization Engine (Redis watermarks)

- **Status:** Accepted
- **Date:** 2026-07-18

## Context

Pollers previously upserted blindly and emitted full-refresh WS signals. Redis held only leader locks and MasterSync position snapshots.

## Decision

Introduce `SyncModule` (`SyncEngineService` + `SyncStateService`) that:

1. Diffs equity/positions against Redis watermarks `sync:acct:{id}:{entity}`
2. Bumps monotonic `syncVersion`
3. Emits additive WS events `positions_delta`, versioned `account_equity`, `sync_status`
4. Leaves Postgres as source of truth for HTTP reads

Disable with `SYNC_ENGINE_ENABLED=0` (rollback to always-changed emit path).

## Consequences

Fewer redundant WS/HTTP updates; clients must ignore stale versions. No MetaApi streaming in this phase.
