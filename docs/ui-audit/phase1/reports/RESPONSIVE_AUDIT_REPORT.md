# Responsive Audit Report

**Program:** UI Excellence — Phase 1
**Mode:** Measure-only (no visual product changes)
**Date:** 2026-07-18T18:01:26.204Z
**Base URL:** http://localhost:3000

## Executive summary

| Metric | Value |
| --- | --- |
| Viewport captures | 1587 (1586 ok) |
| Browser captures | 219 |
| DPI captures | 210 |
| Zoom captures | 252 |
| Horizontal overflow detections (viewport matrix) | 0 |
| Unique debt items | 157 |
| Capture failures | 6 |
| AUDIT_JWT present | no |

## Shells observed

- **marketing** — public landing/legal/docs
- **auth** — login/register/onboarding
- **dashboard** — AppShell sidebar + mobile bottom nav (`lg` collapse)
- **admin** — separate admin sidebar shell

## Breakpoints (code inventory)

From `apps/web/src/lib/hooks/useBreakpoint.ts`:

| Token | px |
| --- | --- |
| sm | 640 |
| md | 768 |
| lg | 1024 (mobile < lg) |
| xl | 1280 |
| 2xl | 1536 |

Container: `.page-container` max-width **1920px**; `--content-max: min(120rem, 100%)`.

## Top overflow offenders

| Route | Viewport | overflowX | Status |
| --- | --- | --- | --- |


## Evidence

- Screenshots: `docs/ui-audit/phase1/screenshots/`
- Viewport metrics: `docs/ui-audit/phase1/viewport-matrix/`
- Debt list: [RESPONSIVE_DEBT_LIST.md](RESPONSIVE_DEBT_LIST.md)
- Rule book: [../RESPONSIVE_RULE_BOOK.md](../RESPONSIVE_RULE_BOOK.md)
