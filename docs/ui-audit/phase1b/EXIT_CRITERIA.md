# UI Excellence Phase 1B — Exit Criteria

**Program:** Runtime UX Quality Audit  
**Mode:** Measure & document only  
**Prerequisite:** Phase 1 responsive baseline complete  
**Platform Phases 1–6:** Frozen  
**UI Phase 2:** Not started (blocked until this evidence is reviewed)

Hard lock: no redesigns. Allowed: `tools/ui-audit/runtime/`, `docs/ui-audit/phase1b/`, thin tests.

---

## Checklist

| # | Criterion | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Tier A metrics for every static route × 3 viewports (Chromium) | [x] | **218** captures (**213** ok, **5** dynamic skips) |
| 2 | CWV set: FP, FCP, LCP, INP proxy, TBT proxy, CLS | [x] | `reports/CWV_REPORT.md` |
| 3 | `INTERACTION_LATENCY.md` | [x] | Generated; many dashboard interactions skipped without `AUDIT_JWT` |
| 4 | `CONTINUOUS_SESSION_REPORT.md` (30m / 1h / 4h) | [x] | Lab scale **0.01** (18s / 36s / 144s). Full walls: `UI_AUDIT_SESSION_SCALE=1 pnpm ui-audit:runtime:sessions` |
| 5 | `ANIMATION_RUNTIME_REPORT.md` | [x] | Generated |
| 6 | `MT5_RUNTIME_REPORT.md` (1000 updates) | [x] | **synthetic** mode, 1000 updates applied |
| 7 | `BROWSER_STRESS_REPORT.md` | [x] | Generated |
| 8 | Network / JS / images / memory / scroll / a11y / layout-runtime | [x] | All reports under `reports/` |
| 9 | Debt + priority + Phase 2 inputs | [x] | **218** debt items; `PHASE2_INPUTS.md` |
| 10 | No product UI changes | [x] | Harness/docs/tests only |
| 11 | Compat slice (Firefox + WebKit) | ☐ | Optional — `pnpm ui-audit:runtime:compat` |

---

## Gate evidence

| Field | Value |
| --- | --- |
| Date | 2026-07-18T18:37:13.546Z |
| Host | win32 / x64 / Node v24.18.0 |
| Base URL | http://localhost:3000 |
| Session scale | 0.01 (lab) |
| Tier A captures | 213 ok / 218 total |
| Debt items | 218 |
| AUDIT_JWT | absent |
| Artifact gate | `phase1b-artifacts.spec.ts` — 3 passed |

### Commands used

```bash
UI_AUDIT_SESSION_SCALE=0.01 pnpm ui-audit:runtime:all
# equivalent: node tools/ui-audit/runtime/run-all.mjs
```

### Full-duration sessions (optional gate upgrade)

```bash
UI_AUDIT_SESSION_SCALE=1 pnpm ui-audit:runtime:sessions
pnpm ui-audit:runtime:reports
```

### Live MT5 (optional richer evidence)

```bash
AUDIT_JWT=... NEXT_PUBLIC_PLATFORM_METRICS=1 pnpm ui-audit:runtime:mt5
```

---

## Sign-off

- [x] Measurement package complete for Phase 1B lab run  
- [ ] Full 30m/1h/4h sessions (scale=1) — optional upgrade before Phase 2 design  
- [ ] Live MT5 path (authenticated trading socket) — optional upgrade  
- [x] UI Phase 2 **not** started — design only after reviewing `reports/PHASE2_INPUTS.md`  
- [x] Platform freeze intact  
