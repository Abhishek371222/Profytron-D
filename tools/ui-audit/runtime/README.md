# UI Excellence — Runtime probes (Phase 1B)

Measure-only. No product UI changes.

| Script | Role |
| --- | --- |
| `capture-runtime.mjs` | Tier A (all routes × 3 viewports) / compat |
| `capture-extended.mjs` | interactions, sessions, animation, mt5, stress |
| `generate-runtime-reports.mjs` | Markdown + debt + PHASE2_INPUTS |
| `run-all.mjs` | Lab full pipeline (session scale default `0.01`) |
| `probes.mjs` | Injected observers + layout/scroll/mt5 probes |

Shared: `../routes.json`, `AUDIT_JWT` / `COMPAT_ADMIN_JWT`.
