# Product Standards — Phase 2

**Program:** Product Completion & Launch Readiness  
**Evidence:** [`../phase1/reports/PRODUCT_DEBT.md`](../phase1/reports/PRODUCT_DEBT.md), [`PRIORITY_MATRIX.md`](../phase1/reports/PRIORITY_MATRIX.md)  
**Locks:** Platform / UI architecture / DB / API / Trading / Auth architecture / AI backend unchanged.

## Quality ladder (every feature)

```
Complete → Usable → Recoverable → Understandable → Accessible
```

| Level | Meaning |
| --- | --- |
| Complete | End-to-end path works with existing APIs |
| Usable | User can finish without guessing |
| Recoverable | Error / empty / offline / retry paths exist |
| Understandable | Microcopy matches guides |
| Accessible | Labels, focus, and contrast preserved (no redesign) |

## Completion matrix status

| Status | Meaning |
| --- | --- |
| Complete | End-to-end working |
| Launch Ready | Customer ready |
| Needs Polish | Minor improvements |
| Deferred | Explicit future / policy skip |

## Rules

1. Cite Phase 1 debt IDs or domain report when changing product UX.
2. Prefer existing primitives (`DashboardEmptyState`, `DashErrorState`, `RenderBoundary`).
3. Never conflate **load error** with **empty state**.
4. Live OTP / MetaAPI / checkout remain **Deferred** unless re-authorized.
5. No layout redesign; no new engines.
