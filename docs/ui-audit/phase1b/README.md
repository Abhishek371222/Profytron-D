# UI Excellence Program — Phase 1B

## Runtime UX Quality Audit

**Status:** Complete (lab measurement baseline; optional scale=1 sessions / live MT5 upgrades)  
**Mode:** Measure-only — no product UI, architecture, motion, or visual redesign  
**Depends on:** [Phase 1 — Responsive Foundation](../phase1/README.md) (complete)  
**Platform:** Phases 1–6 frozen ([phase6 EXIT_CRITERIA](../../audit/phase6/EXIT_CRITERIA.md))  
**Fix phase:** Deferred — do **not** start UI Phase 2 until Phase 1B evidence is reviewed

### Mission

Phase 1 answered: *how does the UI lay out across displays?*  
Phase 1B answers: *how does each page feel and perform while running?*

Users judge software by runtime behavior (scroll smoothness, stutter after long sessions, flicker under live MT5 updates, interruptible animation, memory growth, resize stability, typing latency) — not screenshots alone.

### Program map

```text
UI Excellence Program
├── Phase 1   Responsive Foundation & Display System Audit   ✅ done
├── Phase 1B  Runtime UX Quality Audit                       ← this phase
└── Phase 2+  Fix / refine (only after 1B evidence)          ⏳ not started
```

### Locked decisions

- No architecture / component / color / typography / motion / dashboard redesign
- No production visual “fixes”
- Allowed: `tools/ui-audit/runtime/`, shared `routes.json`, `docs/ui-audit/phase1b/`, thin tests

### How to run

```bash
pnpm dev:web   # reachable at PLAYWRIGHT_BASE_URL / WEB_BASE

# Tier A — every route × 3 viewports (CWV + network + layout-runtime + a11y)
pnpm ui-audit:runtime

# Extended suites
pnpm ui-audit:runtime:interactions
pnpm ui-audit:runtime:sessions      # continuous session (see UI_AUDIT_SESSION_SCALE)
pnpm ui-audit:runtime:animation
pnpm ui-audit:runtime:mt5           # 1000-update storm (live or synthetic)
pnpm ui-audit:runtime:stress

# Aggregate reports
pnpm ui-audit:runtime:reports

# Lab shorthand (scaled sessions + all modes)
pnpm ui-audit:runtime:all
```

| Variable | Purpose |
| --- | --- |
| `WEB_BASE` / `PLAYWRIGHT_BASE_URL` | Origin |
| `AUDIT_JWT` / `COMPAT_ADMIN_JWT` | Auth seeding |
| `UI_AUDIT_LIMIT` | Cap Tier A captures |
| `UI_AUDIT_PATHS` | Comma paths filter |
| `UI_AUDIT_SESSION_SCALE` | Multiply session lengths (default `1`; lab smoke e.g. `0.01` → 18s/36s/144s for 30m/1h/4h) |
| `UI_AUDIT_MT5_UPDATES` | Storm size (default `1000`) |
| `NEXT_PUBLIC_PLATFORM_METRICS=1` | Enable in-app marks (motion/experience) for richer sessions when web is started with the flag |

### Reports

| Report | Contents |
| --- | --- |
| `RUNTIME_AUDIT_REPORT.md` | Executive summary |
| `CWV_REPORT.md` | FP/FCP/LCP/INP/TBT/CLS |
| `INTERACTION_LATENCY.md` | Click → feedback, nav, modal, drawer, tooltip, search, sort, filter, tabs, accordion |
| `CONTINUOUS_SESSION_REPORT.md` | Dashboard open 30m / 1h / 4h |
| `ANIMATION_RUNTIME_REPORT.md` | Interruptions, queue, duration, drops, quality |
| `MT5_RUNTIME_REPORT.md` | 1000-update dashboard storm |
| `BROWSER_STRESS_REPORT.md` | Tabs, resize, zoom, background, minimize/restore |
| `REACT_COST_REPORT.md` | Hydration / route transition / render samples |
| `JS_MAIN_THREAD_REPORT.md` | Long tasks, blocking, event-loop lag |
| `NETWORK_REPORT.md` | API / duplicates / waterfalls / failures |
| `IMAGE_REPORT.md` | Size/format/lazy/decode |
| `MEMORY_REPORT.md` | Heap / DOM / growth |
| `SCROLL_REPORT.md` | Scroll FPS / jank |
| `ACCESSIBILITY_RUNTIME_REPORT.md` | Touch / keyboard / ARIA / contrast samples |
| `LAYOUT_RUNTIME_REPORT.md` | Live overflow / clip / overlap / dialogs |
| `RUNTIME_DEBT_LIST.md` | Measure-only debt |
| `PRIORITY_MATRIX.md` | P0–P3 |
| `PHASE2_INPUTS.md` | Evidence package for a future fix phase |

See [METRIC_TAXONOMY.md](METRIC_TAXONOMY.md) · [EXIT_CRITERIA.md](EXIT_CRITERIA.md).
