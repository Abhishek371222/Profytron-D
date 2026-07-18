# Visual Regression Report

**Program:** UI Excellence Phase 2
**Date:** 2026-07-18T19:15:55.116Z

## Inventories

| Set | Count |
| --- | --- |
| Phase 1 screenshots | 2121 |
| Phase 2 screenshots (this run) | 107 |
| Overlap filenames | 107 |

## Intentional differences (debt-cited)

| Debt / theme | Notes |
| --- | --- |
| `table-overflow-x__*` | Column priority + sticky header |
| `small-touch-targets / density` | Touch-min chrome + data-density spacing |

Matched Phase 2 captures on intentional routes: **107**

## Unexpected / gaps

- New Phase 2-only filenames: 0
- Phase 1 filenames not re-captured in Phase 2 slice: 40 (expected when Phase 2 runs targeted matrices)

Full matrices remain authoritative in `docs/ui-audit/phase1/`. Phase 2 slice validates fixed surfaces.

## Verdict

Targeted Phase 2 captures recorded. Investigate any visual delta outside intentional table/density/touch themes before Phase 3.
