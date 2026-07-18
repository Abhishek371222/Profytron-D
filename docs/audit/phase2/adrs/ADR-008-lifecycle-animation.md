# ADR-008 Lifecycle + Animation Foundation

- **Status:** Accepted
- **Date:** 2026-07-18
- **Owner:** Lifecycle / Animation

## Why changed
Socket/timer leaks risk; motion without reduced-motion gate.

## Alternatives considered
1. Ad-hoc cleanup in each effect — fragile.
2. `platform.lifecycle()` + `platform.animation()` — accepted.

## Tradeoffs
+ Deterministic dispose  
− Must register resources consciously

## Rollback
Stop calling lifecycle.own; keep local effect cleanups.

## Files affected
- `apps/web/src/platform/lifecycle/**`
- `apps/web/src/platform/animation/**`
- Wallet + dashboard realtime socket ownership
