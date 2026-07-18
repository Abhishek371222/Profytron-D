# Phase 4.1 — Render timing (pre-optimization)

Structural + Phase 1–3 evidence **before** Rendering Engine isolation.

## Coupling (dashboard overview)

| Trigger | Frequency | Blast radius |
|---------|-----------|--------------|
| `serverTime` setState | 1 Hz | Entire `DashboardPage` + all Overview children |
| `useLiveMarketFeed` in model | ~12s + socket | Parent → all siblings (memo modules unused) |
| Equity / positions delta | WS | Parent re-render; memo would help if wired |
| News/calendar query | 2–10 min | Parent |

## Expected commit ranking (pre-isolation)

1. Full page reconcile on clock tick (unnecessary work on Metrics/Chart/News)
2. Recharts `OverviewPerformance` when parent props recreate
3. Open positions + market watch on quote updates
4. Metric cards on equity patch

## Lists

Overview caps: recent trades/news/calendar ≤8. **No virtualization** recommended until audit shows >50ms list commits.

## Long tasks

Phase 1/2 home longMs multi-second (landing — out of Phase 4 scope). Dashboard soft-nav historically low FCP but parent cascade remains the Phase 4 target.

## Artifacts

- Structural baseline: this doc
- Route baselines: [`../before/route-summary.json`](../before/route-summary.json)
- Gate copy: [`../before/gate-summary.json`](../before/gate-summary.json)

Optimizations begin only after this document exists.
