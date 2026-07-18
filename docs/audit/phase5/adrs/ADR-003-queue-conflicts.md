# ADR-003 — Queue & Conflict Policy

- **Status:** Accepted
- **Date:** 2026-07-18

## Context
High-frequency MT5 updates can storm decorative animations.

## Decision
Queue lanes: Critical → Interaction → Feedback → Decorative → Idle. Conflict priority: state (loading/success) > press > click > hover. One owner per `(element, property)`.

## Related
Phase 4 ADR-002 (Render Scheduler) — motion uses render idle/low lanes for metrics; number engine uses its own rAF with registry pause.
