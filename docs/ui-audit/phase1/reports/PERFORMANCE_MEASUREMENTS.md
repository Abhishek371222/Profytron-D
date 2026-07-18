# Performance Measurements (resize / orientation)

Measure-only. No optimization in Phase 1.

## Resize / orientation harness

Source: `tools/ui-audit/resize-perf.mjs` → `before/resize-perf.json`

### `/`
- Steps: 6
- Max cumulative layout-shift sample: **2.2003**
- Max long-task ms sample: **912**
- Overflow-X after resize: 0 steps

### `/pricing`
- Steps: 6
- Max cumulative layout-shift sample: **2.4479**
- Max long-task ms sample: **589**
- Overflow-X after resize: 0 steps

### `/login`
- Steps: 6
- Max cumulative layout-shift sample: **2.1527**
- Max long-task ms sample: **453**
- Overflow-X after resize: 0 steps

### `/dashboard`
- Steps: 6
- Max cumulative layout-shift sample: **2.1177**
- Max long-task ms sample: **424**
- Overflow-X after resize: 0 steps

### `/marketplace`
- Steps: 6
- Max cumulative layout-shift sample: **2.1527**
- Max long-task ms sample: **405**
- Overflow-X after resize: 0 steps

### `/analytics`
- Steps: 6
- Max cumulative layout-shift sample: **2.1177**
- Max long-task ms sample: **409**
- Overflow-X after resize: 0 steps

### `/alpha-coach`
- Steps: 6
- Max cumulative layout-shift sample: **2.1527**
- Max long-task ms sample: **396**
- Overflow-X after resize: 0 steps

## Notes

- Layout shift and long-task observers are best-effort in headless Chromium.
- Paint/reflow deep profiling deferred to engineering CWV harness (`tools/audit/playwright-cwv.mjs`).
