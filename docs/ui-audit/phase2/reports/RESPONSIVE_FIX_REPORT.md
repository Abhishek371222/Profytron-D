# Responsive Fix Report

**Phase:** UI Excellence 2  
**Mode:** Evidence-led fixes only (P0/P1)

## P0 — Tables

| Debt | Fix |
| --- | --- |
| `table-overflow-x__billing__*` | Column priority: Description + Invoice hidden &lt; md; sticky thead; `responsive-table-inner`; invoice button touch-min |
| `table-overflow-x__connected-accounts__*` | Broker Account `col-priority-md`; sticky thead; action buttons touch-min; bot name `shell-title` |
| `table-overflow-x__subscriptions__*` | Removed `min-w-[860px]`; Plan/Auto-Renew `col-priority-md`; Next Billing/Broker `col-priority-lg`; larger switch + Upgrade hit targets |

Shared CSS: sticky `thead th`, `.col-priority-md` / `.col-priority-lg` in [`globals.css`](../../apps/web/src/styles/globals.css).

## P0 — Touch (product chrome)

| Surface | Fix |
| --- | --- |
| Sidebar nav / collapse | `min-height/width: var(--touch-min)` |
| TopBar icon buttons + user menu | touch-min |
| Notification button | touch-min |
| Mobile bottom nav links | `min-h-[var(--touch-min)]` |
| Table action controls | touch-min |

Marketing/footer link samples remain **P2** (not enlarged globally).

## P1 — Density / spacing / typography / resize

See [LAYOUT_STANDARDIZATION.md](LAYOUT_STANDARDIZATION.md), [TYPOGRAPHY_FIX_REPORT.md](reports/TYPOGRAPHY_FIX_REPORT.md).

## Deferred

P2/P3 per [DEBT_CLASSIFICATION.md](DEBT_CLASSIFICATION.md) — narrow-card, footer touch noise, long-tasks, duplicate requests.
