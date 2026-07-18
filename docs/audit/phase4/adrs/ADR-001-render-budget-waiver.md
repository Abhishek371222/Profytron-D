# ADR-001: Phase 4 render budget waiver (time-boxed)

- **Status:** Accepted
- **Date:** 2026-07-18
- **Expires:** 2026-08-18

## Context

Phase 4 targets avg commit ≤5ms / max ≤10ms / 60 FPS. CI and laptop variance may not meet absolute FPS in headless Chromium.

## Decision

Exit gate: **architectural isolation complete** + no regression in dashboard cascade (clock/quotes no longer fan out). Absolute commit/FPS soft-enforced via metrics; hard CI fail deferred to waiver expiry (aligns with Phase 2 ADR-009).

## Rollback

Supersede and enforce hard budgets in CI.
