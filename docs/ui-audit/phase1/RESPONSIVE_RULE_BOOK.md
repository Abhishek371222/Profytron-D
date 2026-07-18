# Responsive Rule Book

**Status:** Observed rules from code + Phase 1 measurements. Not a redesign.

## Breakpoints

| Name | Min width | Product meaning |
| --- | --- | --- |
| sm | 640 | Small phones → large phones |
| md | 768 | Tablet portrait start |
| lg | 1024 | **Desktop shell**; `isMobile = width < lg` |
| xl | 1280 | Wide desktop |
| 2xl | 1536 | Extra-wide |

Source: `apps/web/src/lib/hooks/useBreakpoint.ts`.

## Containers

| Rule | Value |
| --- | --- |
| Maximum content width | `.page-container` → **1920px** |
| CSS token | `--content-max: min(120rem, 100%)` |
| Horizontal padding | `--dashboard-p` (clamped; tighter on small screens) |

## Sidebar & navigation

| Rule | Behavior |
| --- | --- |
| Sidebar width | `--sidebar-w` / `--sidebar-w-collapsed` |
| Collapse | Below **lg (1024)** — mobile bottom nav / drawer patterns |
| Safe areas | `--safe-*` + `.pb-safe` / `.pt-safe` / `.px-safe` |

## Spacing & density

| Token | Role |
| --- | --- |
| `--dashboard-p` | Page padding |
| Utility grids | `.responsive-card-grid`, `.responsive-stat-grid` |
| `data-density` | Phase 2 profiles: compact / standard / comfortable / expanded (see `docs/ui-audit/phase2/reports/LAYOUT_STANDARDIZATION.md`) |
| `--touch-min` | **2.75rem** floor for product chrome controls |

## Tables

| Rule | Behavior |
| --- | --- |
| Shell | `.responsive-table-shell` + `.responsive-table-inner` |
| Sticky header | `thead th` sticky inside shell |
| Column priority | `.col-priority-md` (≥768), `.col-priority-lg` (≥1024) — hide secondary columns on narrow viewports |

## Typography scaling

- Heading / body sizes measured per route in [reports/TYPOGRAPHY_AUDIT.md](reports/TYPOGRAPHY_AUDIT.md).
- Phase 1 does **not** change the type scale.

## Charts & tables

| Surface | Rule |
| --- | --- |
| Tables | Prefer `.responsive-table-shell` horizontal scroll containment |
| Charts | Height tokens `--chart-h-*` (inventory in globals.css); pause when off-viewport (Phase 4) |

## Touch & accessibility floors

| Rule | Value |
| --- | --- |
| Minimum touch | `--touch-min: 2.75rem` (~44px) |
| Focus | Existing focus rings — verify visibility under zoom/DPI (debt) |

## Grid rules

- Marketing and dashboard use shell-specific grids; do not invent a new global grid in Phase 1.
- Ultrawide (3440+) should keep content within 1920px container unless a deliberate full-bleed section exists.

## Change policy

Any Phase 2+ UI change must cite a debt ID or rule from this book and preserve screenshot baselines for Tier A viewports.
