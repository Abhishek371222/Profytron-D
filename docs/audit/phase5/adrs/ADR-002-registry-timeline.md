# ADR-002 — Motion Registry & Timeline

- **Status:** Accepted
- **Date:** 2026-07-18

## Context
Orphaned rAF loops and opaque interruptions are hard to debug.

## Decision
Every animation registers with lifecycle + animation pause bridges. Timeline states: Created → Queued → Running → Interrupted → Completed → Disposed. Recovery policies Finish/Cancel/Resume prevent partial UI.

## Rollback
Disable motion engine flag; registry becomes no-op for feature paths.
