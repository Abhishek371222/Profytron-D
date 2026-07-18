# Phase 2 Recommendations

Phase 1 established evidence. Phase 2 should **fix** the highest-impact responsive debt without redesigning product architecture.

## Recommended Phase 2 themes

1. **Overflow eradication** — eliminate horizontal overflow on Tier A routes across the viewport matrix (P0).
2. **Sidebar / navigation rules** — standardize collapse at `lg` (1024), bottom-nav safe areas, focus order.
3. **Table & chart sizing** — enforce `.responsive-table-shell` and chart height tokens on analytics/dashboard.
4. **Touch target floor** — honor `--touch-min` (2.75rem) on mobile controls.
5. **Zoom resilience** — validate 110–150% zoom on forms and dialogs.
6. **Screenshot regression gate** — introduce Playwright `toHaveScreenshot` for Tier A × {390, 768, 1920} only after baselines stabilize.

## Explicitly not Phase 2 (yet)

- Landing / marketing visual redesign
- Motion / Experience engine changes
- Dashboard architecture restructuring
- Color / typography redesign

## Inputs

- [RESPONSIVE_DEBT_LIST.md](RESPONSIVE_DEBT_LIST.md)
- [PRIORITY_MATRIX.md](PRIORITY_MATRIX.md)
- [../RESPONSIVE_RULE_BOOK.md](../RESPONSIVE_RULE_BOOK.md)
