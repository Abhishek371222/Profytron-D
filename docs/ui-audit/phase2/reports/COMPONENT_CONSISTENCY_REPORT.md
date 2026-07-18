# Component Consistency Report

Derived from Phase 1 COMPONENT_INVENTORY + debt IDs (no pre-existing VISUAL_CONSISTENCY_REPORT).

| Component | Consistency adjustment | Debt |
| --- | --- | --- |
| Tables | Shared sticky header + column priority utilities | table-overflow-x |
| Icon buttons (TopBar / notifications) | `--touch-min` floor | small-touch-targets |
| Sidebar nav / collapse | `--touch-min` | small-touch-targets |
| Mobile bottom nav | `--touch-min` | small-touch-targets |
| Cards / grids | Still use `.dashboard-card` / `--section-gap` | spacing tokens |

No badge/avatar visual redesign. Widget placement unchanged.
