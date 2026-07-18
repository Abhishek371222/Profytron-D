# UI Excellence Program — Phase 1

## Responsive Foundation & Display System Audit

**Status:** Complete (measurement baseline)  
**Mode:** Measure-only — no product UI, architecture, motion, or visual redesign  
**Platform:** Phases 1–6 frozen ([phase6 EXIT_CRITERIA](../../audit/phase6/EXIT_CRITERIA.md))  
**Next:** [Phase 1B — Runtime UX Quality Audit](../phase1b/README.md)

### Mission

Establish how Profytron renders across display sizes, browsers, DPI, and zoom — with evidence — before any UI refinement. Mirrors engineering Phase 1 (`docs/audit/PHASE1_AUDIT.md`): measure and document only.

### Locked decisions

- No architecture changes
- No component redesign
- No feature work
- No color / typography / motion / experience changes
- No dashboard restructuring

Allowed: harness under `tools/ui-audit/`, artifacts under `docs/ui-audit/phase1/`, optional thin gate under `apps/web/tests/ui-audit/`.

### How to run

```bash
# Web must be reachable (default http://localhost:3000)
pnpm dev:web

# Full viewport matrix (all pages × 23 viewports) — Chromium
pnpm ui-audit:capture

# Browser / DPI / Zoom slices
pnpm ui-audit:browser
pnpm ui-audit:dpi
pnpm ui-audit:zoom

# Or all modes
pnpm ui-audit:all

# Resize / orientation measurements
pnpm ui-audit:resize

# Aggregate markdown reports
pnpm ui-audit:reports
```

Incremental re-capture:

```bash
UI_AUDIT_PATHS=/dashboard,/pricing UI_AUDIT_MODE=viewport pnpm ui-audit:capture
```

Optional env:

| Variable | Purpose |
| --- | --- |
| `WEB_BASE` / `PLAYWRIGHT_BASE_URL` | Target origin |
| `AUDIT_JWT` | Seed authenticated dashboard routes |
| `COMPAT_ADMIN_JWT` | Seed admin routes |
| `UI_AUDIT_LIMIT` | Cap captures (debug) |
| `UI_AUDIT_PATHS` | Comma-separated paths (incremental) |
| `UI_AUDIT_BROWSERS` | Comma-separated browser names (e.g. `msedge`) |
| `UI_AUDIT_DRY=1` | Metrics only, skip PNGs |
| `UI_AUDIT_*_ID` / `UI_AUDIT_*_SLUG` | Dynamic route fixtures |

### Deliverables

| Path | Contents |
| --- | --- |
| `screenshots/` | Baseline PNG library |
| `viewport-matrix/` | Per-capture JSON + `index.json` |
| `browser-matrix/` | Browser slice |
| `dpi-matrix/` | DPI slice |
| `zoom-matrix/` | Zoom slice |
| `reports/` | All audit reports |
| `RESPONSIVE_RULE_BOOK.md` | Observed responsive rules |
| `IMPLEMENTATION_SUMMARY.md` | What shipped |
| `EXIT_CRITERIA.md` | Gate checklist |

### Screenshot naming

`{routeSlug}__{w}x{h}__{browser}__dpr{n}__z{pct}.png`
