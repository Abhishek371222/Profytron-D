# Layout Standardization

**Phase:** UI Excellence 2  
**Debt cites:** `systemic__density-tokens`, `systemic__spacing-tokens`

## Density profiles

Applied via `data-density` on AppShell / admin shell from [`useDensityProfile.ts`](../../apps/web/src/lib/hooks/useDensityProfile.ts).

| Profile | Selection signals | Token remaps |
| --- | --- | --- |
| compact | narrow width, short height, high zoom/DPR | tighter `--dashboard-p`, `--section-gap`, `--card-p` |
| standard | default mid desktop | base tokens |
| comfortable | ≥1440×800, zoom ≤1.05 | slightly roomier padding/gaps |
| expanded | ≥1920×900 ultrawide-ish, low DPR/zoom | largest title + padding |

## Spacing grammar (enforced)

| Token | Role |
| --- | --- |
| `--dashboard-p` | Page padding (AppShell main) |
| `--section-gap` / `--dashboard-gap` | Grids / stacks |
| `--card-p` | Card inner padding |
| `--touch-min` | 2.75rem floor on product chrome |
| `.page-container` | max-width 1920px (unchanged) |

No dashboard widget moves. Coach shell now uses `--dashboard-p` instead of hard-coded `p-1.5 sm:p-2`.

## Resize stability

Main scroll region uses `overflow-x-hidden` + `contain-inline-size` to reduce resize CLS (debt `systemic__resize-cls`).
