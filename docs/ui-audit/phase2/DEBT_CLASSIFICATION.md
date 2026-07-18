# Phase 2 — Debt Classification

**Status:** Locked for implementation  
**Sources:** Phase 1 `before/debt.json` + Phase 1B `before/runtime-debt.json`  
**Machine file:** [before/debt-classification.json](before/debt-classification.json)

## Policy

| Bucket | Action |
| --- | --- |
| **P0** | Must fix in Phase 2 |
| **P1** | Fix if low-risk / high impact |
| **P2** | Defer |
| **P3** | Won’t fix unless requirements change |

No PR without citing a classification ID.

## Summary

| Bucket | Count | What |
| --- | --- | --- |
| P0 | ~151 | Table overflow on billing / connected-accounts / subscriptions; product-chrome small touch targets |
| P1 | 4+ systemic | Density tokens, spacing normalize, typography truncate, resize CLS |
| P2 | ~198 | Marketing/footer touch noise, narrow-card probe, cosmetic |
| P3 | ~26 | Long-tasks (engines/marketing), duplicate requests |

Exact counts: see JSON `summary`.

## P0 rules

1. `table-overflow-x` on slugs `billing`, `connected-accounts`, `subscriptions`
2. `small-touch-targets` on Tier A + product chrome slugs (dashboard, settings, markets, wallet, etc.) — **not** marketing footer/legal pages

## P1 rules (systemic)

- `systemic__density-tokens` — Compact / Standard / Comfortable / Expanded via `data-density`
- `systemic__spacing-tokens` — AppShell / page-container / card padding → CSS vars
- `systemic__typography-truncate` — `min-w-0` / truncate on shell titles
- `systemic__resize-cls` — overflow containment + density

## P2 / P3 (deferred)

- Footer/marketing link touch samples  
- `narrow-card`, `extreme-scroll-height`  
- `long-tasks`, `duplicate-requests` (platform freeze / out of scope)

## Evidence cites

- [Phase 1 RESPONSIVE_DEBT_LIST](../phase1/reports/RESPONSIVE_DEBT_LIST.md)
- [Phase 1B RUNTIME_DEBT_LIST](../phase1b/reports/RUNTIME_DEBT_LIST.md)
- [PHASE2_INPUTS](../phase1b/reports/PHASE2_INPUTS.md)
