# Product Audit — Phase 1 (Measure Only)

Answers: *is Profytron launch-ready from a customer journey perspective?*

**Locks:** no redesign, backend, API, trading, auth, AI, UI, or feature work.

## Layout

| Path | Role |
| --- | --- |
| `data/` | journey-results, conversion, errors, empty-states, inventory |
| `journeys/` | PNGs + per-journey JSON |
| `reports/` | Evidence markdown |
| `EXIT_CRITERIA.md` | Mission checklist |

## Commands

```bash
pnpm product-audit:journeys
pnpm product-audit:screenshots
pnpm product-audit:conversion
pnpm product-audit:errors
pnpm product-audit:empty
pnpm product-audit:reports
pnpm product-audit:all
```

Env: `PRODUCT_AUDIT_BASE` (default `http://localhost:3000`), `AUDIT_JWT`, `COMPAT_ADMIN_JWT`, `PRODUCT_AUDIT_LIMIT`, `PRODUCT_AUDIT_OUT`.
