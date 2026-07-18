# Phase 5 Exit Criteria

- [x] Motion Engine owns tokens, timing, physics, transitions, gestures, values, a11y, lifecycle, monitoring
- [x] `platform.motion()` public API; internals private
- [x] Semantic tokens + presets; product surfaces migrated (dashboard, modals, toast, button, form, chart policy, tables)
- [x] Number engine interruptible; continues from current visual value
- [x] Dashboard updates animate only changed values
- [x] Reduced-motion / Quality Minimal complete for migrated paths
- [x] Motion budgets defined (`MOTION_CONTRACT.json`); soft-enforced via metrics
- [x] Quality Manager, Timeline, Profiler, Conflicts, Queue, Recovery, Contracts, Design Language, Debt dashboard
- [x] Regression tests under `apps/web/tests/motion/`
- [x] Rollback documented (`NEXT_PUBLIC_MOTION_ENGINE=0`)
- [x] Compatibility suite passes (run at gate)
- [x] Production build succeeds (run at gate)

## Phase 6 ready
When build + compat gates are green, Phase 6 (marketing / hero / 3D premium) may proceed on this motion foundation.

### Gate evidence (2026-07-18)
- `tsc --noEmit`: pass
- `npm run build`: pass
- `tests/motion/motion-number.node.ts`: pass
- `playwright tests/motion/motion-engine.spec.ts` (chromium): 6/6 pass

