# ADR-002: MT5 client state machine

- **Status:** Accepted
- **Date:** 2026-07-18

## Decision

Replace ad-hoc `live|degraded|offline` with deterministic phases:

`Idle → Synchronizing → Fresh → Degraded → Recovering → Fresh`

Timestamps: `enteredAt`, `lastSyncedAt`, `lastErrorAt`, `lastAppliedVersion`.

Badge maps `fresh`→live (hidden), `degraded|recovering`→visible, `idle`→offline.

## Rollback

`setMt5SyncState({ syncStatus })` shim remains for callers.
