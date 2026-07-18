# ADR-009: Phase 2 performance budget waiver (time-boxed)

- **Status:** Accepted
- **Date:** 2026-07-18
- **Expires:** 2026-08-18 (must re-evaluate in Phase 3 or renew)

## Context

Phase 2 established a Performance Budget Contract (`docs/audit/phase2/budgets/PERFORMANCE_CONTRACT.json`) with hard ceilings (e.g. initial JS gzip ≤220KB, long tasks ≤50ms, route transition ≤150ms).

Phase 1 baselines already exceeded several of these ceilings (landing long-task totals multi-second; login FCP multi-second due to three.js earth assets). Phase 2 scope was **core architecture reconstruction** (Application Core, Platform API, cache/data/realtime boundaries, health fail-fast) — not CWV/bundle reduction.

## Decision

Grant a **time-boxed waiver** of hard budget enforcement for Phase 2 exit:

1. Exit gate is **no regression vs Phase 1 `before/` baselines** on the remeasured routes in `docs/audit/phase2/after/`, plus architecture exit criteria.
2. Absolute budget numbers remain the **target contract** for Phase 3+ (bundle/CWV work), not a Phase 2 merge blocker.
3. Health probe latency improvement (Redis/queue timeout 1500ms → 300ms) is an accepted Phase 2 win and should not regress.

## Consequences

- Phase 3 may proceed once after-metrics are recorded and compared.
- If after-metrics show material regression vs before baselines on key routes, Phase 2 exit is blocked until explained or fixed.
- Waiver expires **2026-08-18**; without Phase 3 budget progress or a renewed ADR, CI should treat absolute budgets as warn-then-fail.

## Rollback

Revert this ADR status to Superseded and reinstate absolute budgets as exit blockers if product requires CWV gates before further architecture work.
