# Phase 2 Exit Criteria

- [x] No dashboard-wide shotgun invalidation on trade events (targeted map in mt5-sync)
- [x] Duplicate wallet socket removed
- [x] No blank refresh after first successful load (useWorkspaceQuery placeholderData)
- [x] Phase 1 benchmarks re-measured into `after/` (`route-summary.json`, `comparison.json`, `playwright-cwv.json`)
- [x] Feature Compatibility Suite green on Chromium (13 passed, 2 skipped; Firefox/WebKit not installed locally — documented)
- [x] TypeScript `tsc --noEmit` passes
- [x] ADRs 000–009 Accepted with rollback notes (ADR-009 = time-boxed budget waiver → 2026-08-18)
- [x] Platform public API + eslint boundary warns on internals
- [x] Application Core owns session/workspace facades
- [x] Recovery playbooks documented; degraded sync badge on dashboard
- [x] Budget contract evaluated: absolute ceilings waived per ADR-009; no material regression gate vs `before/` (see `after/comparison.json`)

**Production build:** run `pnpm --filter profytron build` before merge.
**Phase 3:** unblocked — after-metrics captured; budgets waived until 2026-08-18.

## After-metrics notes (2026-07-18)

| Signal | Result |
|--------|--------|
| `/health` wall | ~0.45–0.67s (was ~1.5s floor from 1500ms probes) |
| Dashboard wall/FCP/longMs | Within noise of Phase 1 baselines |
| Login FCP | Much lower vs Phase 1 (working-tree also removed heavy auth earth assets) |
| Home longMs | Still multi-second (Phase 3 CWV target; not a Phase 2 architecture failure) |
| Marketplace/pricing wallMs | Higher wall (networkidle variance); FCP/longMs improved or flat |

Compat evidence: `docs/audit/phase2/after/compat-chromium.log`
