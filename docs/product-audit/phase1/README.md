# Product Audit — Phase 1 (Measure Only)

Answers: *is Profytron launch-ready from a customer journey perspective?*

**Status:** Phase 1 baseline is **frozen** — see [`FROZEN.md`](./FROZEN.md).

**Locks:** no redesign, backend, API, trading, auth, AI, UI, or feature work in Phase 1.

## Layout

| Path | Role |
| --- | --- |
| `data/` | journey-results, conversion, errors, empty-states, inventory |
| `before/` | No-JWT snapshot retained before authenticated freeze run |
| `journeys/` | PNGs + per-journey JSON |
| `reports/` | Evidence markdown |
| `EXIT_CRITERIA.md` | Mission checklist |
| `FROZEN.md` | Freeze record + authenticated metrics |

## Commands

```bash
pnpm product-audit:journeys
pnpm product-audit:screenshots
pnpm product-audit:conversion
pnpm product-audit:errors
pnpm product-audit:empty
pnpm product-audit:reports
pnpm product-audit:all
pnpm product-audit:all:jwt   # mint AUDIT_JWT from DB + JWT_ACCESS_SECRET when unset
```

Env: `PRODUCT_AUDIT_BASE` (default `http://localhost:3000`), `AUDIT_JWT`, `COMPAT_ADMIN_JWT`, `PRODUCT_AUDIT_LIMIT`, `PRODUCT_AUDIT_OUT`.
