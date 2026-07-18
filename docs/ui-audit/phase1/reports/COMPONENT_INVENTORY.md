# Component Inventory (responsive surface)

Inventory of UI surfaces measured by the layout probe — not a redesign list.

| Surface | Probe selectors / notes |
| --- | --- |
| Cards | `.dashboard-card`, `[class*="card"]`, `[data-slot="card"]` |
| Tables | `table`, `.responsive-table-shell` |
| Charts | `canvas`, chart class hooks |
| Navigation | `nav`, sticky/fixed samples |
| Sidebar | `[data-slot="sidebar"]`, `aside` — collapses below `lg` (1024) |
| Containers | `.page-container`, `.container`, `main` |
| Forms / buttons | counted via focusable inventory |
| Dialogs / sheets / toasts | present in product; capture when open state available (baseline closed) |
| Touch targets | `--touch-min: 2.75rem`; sub-44px targets flagged as debt |

## Shells

See [../diagrams/layout-shells.md](../diagrams/layout-shells.md).
