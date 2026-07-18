#!/usr/bin/env node
/**
 * Aggregate capture JSON into Phase 1 markdown reports + debt list.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const OUT = path.resolve(ROOT, process.env.UI_AUDIT_OUT || 'docs/ui-audit/phase1');
const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, 'routes.json'), 'utf8'));

function readIndex(name) {
  const p = path.join(OUT, name, 'index.json');
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function loadMetricFiles(dir) {
  const abs = path.join(OUT, dir);
  if (!fs.existsSync(abs)) return [];
  return fs
    .readdirSync(abs)
    .filter((f) => f.endsWith('.json') && f !== 'index.json' && f !== 'gaps.json')
    .map((f) => {
      try {
        return JSON.parse(fs.readFileSync(path.join(abs, f), 'utf8'));
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

function severityRank(s) {
  return { high: 0, medium: 1, low: 2 }[s] ?? 3;
}

function collectDebt(files) {
  const debt = [];
  for (const r of files) {
    if (!r.metrics?.issues?.length) continue;
    for (const issue of r.metrics.issues) {
      debt.push({
        id: `${issue.type}__${r.slug}__${r.viewport?.w}x${r.viewport?.h}`,
        type: issue.type,
        severity: issue.severity || 'medium',
        slug: r.slug,
        path: r.path,
        viewport: r.viewport,
        browser: r.browser,
        dpr: r.dpr,
        zoom: r.zoom,
        detail: issue,
      });
    }
    if (r.metrics?.scroll?.overflowX > 1) {
      debt.push({
        id: `overflow-x__${r.slug}__${r.viewport?.w}x${r.viewport?.h}`,
        type: 'overflow-x',
        severity: r.metrics.scroll.overflowX > 20 ? 'high' : 'medium',
        slug: r.slug,
        path: r.path,
        viewport: r.viewport,
        browser: r.browser,
        detail: { value: r.metrics.scroll.overflowX },
      });
    }
  }
  const map = new Map();
  for (const d of debt) {
    if (!map.has(d.id) || severityRank(d.severity) < severityRank(map.get(d.id).severity)) {
      map.set(d.id, d);
    }
  }
  return [...map.values()].sort(
    (a, b) => severityRank(a.severity) - severityRank(b.severity) || a.slug.localeCompare(b.slug),
  );
}

function typographySummary(files) {
  const bySlug = {};
  for (const r of files) {
    if (!r.metrics?.typography) continue;
    if (!bySlug[r.slug]) bySlug[r.slug] = [];
    bySlug[r.slug].push({
      viewport: r.viewport,
      typography: r.metrics.typography,
    });
  }
  return bySlug;
}

function mdTable(headers, rows) {
  const nl = String.fromCharCode(10);
  const head = '| ' + headers.join(' | ') + ' |';
  const sep = '| ' + headers.map(() => '---').join(' | ') + ' |';
  const body = rows.map((r) => '| ' + r.join(' | ') + ' |').join(nl);
  return head + nl + sep + nl + body;
}

function write(name, content) {
  const p = path.join(OUT, name);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content);
  console.log('Wrote ' + p);
}

function main() {
  const nl = String.fromCharCode(10);
  const viewportIdx = readIndex('viewport-matrix');
  const browserIdx = readIndex('browser-matrix');
  const dpiIdx = readIndex('dpi-matrix');
  const zoomIdx = readIndex('zoom-matrix');
  const viewportFiles = loadMetricFiles('viewport-matrix');
  const browserFiles = loadMetricFiles('browser-matrix');
  const dpiFiles = loadMetricFiles('dpi-matrix');
  const zoomFiles = loadMetricFiles('zoom-matrix');
  const allFiles = [...viewportFiles, ...browserFiles, ...dpiFiles, ...zoomFiles];
  const debt = collectDebt(allFiles);
  const envPath = path.join(OUT, 'before', 'environment.json');
  const env = fs.existsSync(envPath) ? JSON.parse(fs.readFileSync(envPath, 'utf8')) : {};
  const resizePath = path.join(OUT, 'before', 'resize-perf.json');
  const resize = fs.existsSync(resizePath) ? JSON.parse(fs.readFileSync(resizePath, 'utf8')) : null;

  const overflowCount = viewportFiles.filter((r) => r.metrics?.scroll?.overflowX > 1).length;
  const failed = (viewportIdx?.failed ?? 0) + (browserIdx?.failed ?? 0);

  write(
    'reports/RESPONSIVE_AUDIT_REPORT.md',
    [
      '# Responsive Audit Report',
      '',
      '**Program:** UI Excellence — Phase 1',
      '**Mode:** Measure-only (no visual product changes)',
      '**Date:** ' + (env.date || new Date().toISOString()),
      '**Base URL:** ' + (viewportIdx?.base || env.base || 'n/a'),
      '',
      '## Executive summary',
      '',
      '| Metric | Value |',
      '| --- | --- |',
      '| Viewport captures | ' + (viewportIdx?.count ?? 0) + ' (' + (viewportIdx?.ok ?? 0) + ' ok) |',
      '| Browser captures | ' + (browserIdx?.count ?? 0) + ' |',
      '| DPI captures | ' + (dpiIdx?.count ?? 0) + ' |',
      '| Zoom captures | ' + (zoomIdx?.count ?? 0) + ' |',
      '| Horizontal overflow detections (viewport matrix) | ' + overflowCount + ' |',
      '| Unique debt items | ' + debt.length + ' |',
      '| Capture failures | ' + failed + ' |',
      '| AUDIT_JWT present | ' + (env.auth?.AUDIT_JWT ? 'yes' : 'no') + ' |',
      '',
      '## Shells observed',
      '',
      '- **marketing** — public landing/legal/docs',
      '- **auth** — login/register/onboarding',
      '- **dashboard** — AppShell sidebar + mobile bottom nav (`lg` collapse)',
      '- **admin** — separate admin sidebar shell',
      '',
      '## Breakpoints (code inventory)',
      '',
      'From `apps/web/src/lib/hooks/useBreakpoint.ts`:',
      '',
      '| Token | px |',
      '| --- | --- |',
      '| sm | 640 |',
      '| md | 768 |',
      '| lg | 1024 (mobile < lg) |',
      '| xl | 1280 |',
      '| 2xl | 1536 |',
      '',
      'Container: `.page-container` max-width **1920px**; `--content-max: min(120rem, 100%)`.',
      '',
      '## Top overflow offenders',
      '',
      mdTable(
        ['Route', 'Viewport', 'overflowX', 'Status'],
        viewportFiles
          .filter((r) => r.metrics?.scroll?.overflowX > 1)
          .sort((a, b) => (b.metrics.scroll.overflowX || 0) - (a.metrics.scroll.overflowX || 0))
          .slice(0, 40)
          .map((r) => [
            r.slug,
            r.viewport?.w + 'x' + r.viewport?.h,
            String(r.metrics.scroll.overflowX),
            String(r.status ?? ''),
          ]),
      ),
      '',
      '## Evidence',
      '',
      '- Screenshots: `docs/ui-audit/phase1/screenshots/`',
      '- Viewport metrics: `docs/ui-audit/phase1/viewport-matrix/`',
      '- Debt list: [RESPONSIVE_DEBT_LIST.md](RESPONSIVE_DEBT_LIST.md)',
      '- Rule book: [../RESPONSIVE_RULE_BOOK.md](../RESPONSIVE_RULE_BOOK.md)',
      '',
    ].join(nl),
  );

  const allVps = [...manifest.viewports.mobile, ...manifest.viewports.tablet, ...manifest.viewports.desktop];

  write(
    'reports/VIEWPORT_COMPATIBILITY_REPORT.md',
    [
      '# Viewport Compatibility Report',
      '',
      'Full matrix: **every static route × ' + allVps.length + ' viewports** on Chromium @ DPR 1 / zoom 100%.',
      '',
      '## Counts',
      '',
      '- Captures: ' + (viewportIdx?.count ?? 0),
      '- OK: ' + (viewportIdx?.ok ?? 0),
      '- Failed: ' + (viewportIdx?.failed ?? 0),
      '- Skipped (dynamic fixtures): ' + (viewportIdx?.skipped ?? 0),
      '- Overflow-X hits: ' + (viewportIdx?.overflowX ?? overflowCount),
      '',
      '## Viewport list',
      '',
      '### Mobile',
      ...manifest.viewports.mobile.map((v) => '- ' + v.w + '×' + v.h),
      '',
      '### Tablet',
      ...manifest.viewports.tablet.map((v) => '- ' + v.w + '×' + v.h),
      '',
      '### Desktop / Ultrawide',
      ...manifest.viewports.desktop.map((v) => '- ' + v.w + '×' + v.h),
      '',
      '## Per-viewport overflow summary',
      '',
      mdTable(
        ['Viewport', 'Captures', 'Overflow-X'],
        allVps.map((vp) => {
          const rows = viewportFiles.filter((r) => r.viewport?.w === vp.w && r.viewport?.h === vp.h);
          const ox = rows.filter((r) => r.metrics?.scroll?.overflowX > 1).length;
          return [vp.w + '×' + vp.h, String(rows.length), String(ox)];
        }),
      ),
      '',
      '## Dynamic routes',
      '',
      'Skipped without fixtures (documented, not silent):',
      '',
      ...manifest.routes.filter((r) => r.dynamic).map((r) => '- `' + r.path + '` — ' + r.skipReason + ' (env `' + r.envKey + '`)'),
      '',
    ].join(nl),
  );

  const gapsPath = path.join(OUT, 'browser-matrix', 'gaps.json');
  const browserGaps = fs.existsSync(gapsPath) ? JSON.parse(fs.readFileSync(gapsPath, 'utf8')) : { gaps: [] };

  write(
    'reports/BROWSER_COMPATIBILITY_REPORT.md',
    [
      '# Browser Compatibility Report',
      '',
      'Slice: Tier A surfaces + smoke routes × {390×844, 768×1024, 1920×1080} × Chromium / Firefox / WebKit / Edge (when installed).',
      '',
      '## Counts',
      '',
      '- Captures: ' + (browserIdx?.count ?? 0),
      '- OK: ' + (browserIdx?.ok ?? 0),
      '- Failed: ' + (browserIdx?.failed ?? 0),
      '',
      '## Gaps',
      '',
      ...(browserGaps.gaps?.length
        ? browserGaps.gaps.map((g) => '- **' + g.browser + '**: ' + g.reason)
        : ['- No launch gaps recorded (or browser matrix not run).']),
      '',
      '## Failures by browser',
      '',
      mdTable(
        ['Browser', 'Failures', 'OK'],
        (manifest.browsers || []).map((b) => {
          const rows = browserFiles.filter((r) => r.browser === b);
          return [b, String(rows.filter((r) => r.error).length), String(rows.filter((r) => r.ok).length)];
        }),
      ),
      '',
      '## OS notes',
      '',
      'Lab host: `' + (env.host?.platform || 'unknown') + '` / `' + (env.host?.arch || '') + '` / Node `' + (env.host?.node || '') + '`.',
      '',
      'True Windows / macOS / Linux / iPadOS / Android matrix requires multi-host or device lab. This phase records:',
      '',
      '1. Playwright Chromium / Firefox / WebKit engines on the lab host',
      '2. Device descriptors for iPad/Android-class viewports in the viewport matrix',
      '3. Manual OS spot-check checklist in [../before/OS_MANUAL_CHECKLIST.md](../before/OS_MANUAL_CHECKLIST.md)',
      '',
    ].join(nl),
  );

  write(
    'reports/DPI_REPORT.md',
    [
      '# DPI Report',
      '',
      'Slice: Tier A × compat viewports × DPR {' + manifest.dpiScales.join(', ') + '} on Chromium.',
      '',
      '## Counts',
      '',
      '- Captures: ' + (dpiIdx?.count ?? 0),
      '- OK: ' + (dpiIdx?.ok ?? 0),
      '',
      '## Issues at high DPI',
      '',
      mdTable(
        ['Route', 'Viewport', 'DPR', 'overflowX', 'Error'],
        dpiFiles
          .filter((r) => r.error || r.metrics?.scroll?.overflowX > 1)
          .slice(0, 50)
          .map((r) => [
            r.slug,
            r.viewport?.w + 'x' + r.viewport?.h,
            String(r.dpr),
            String(r.metrics?.scroll?.overflowX ?? ''),
            String(r.error || '').slice(0, 80),
          ]),
      ),
      '',
      '## Notes',
      '',
      '`deviceScaleFactor` emulates Retina / high-DPI. Blurry assets and 1px hairline issues should be flagged in debt for Phase 2 visual polish — not fixed here.',
      '',
    ].join(nl),
  );

  write(
    'reports/ZOOM_REPORT.md',
    [
      '# Zoom Report',
      '',
      'Slice: Tier A × compat viewports × zoom {' +
        manifest.zoomLevels.map((z) => Math.round(z * 100) + '%').join(', ') +
        '} on Chromium.',
      '',
      '## Counts',
      '',
      '- Captures: ' + (zoomIdx?.count ?? 0),
      '- OK: ' + (zoomIdx?.ok ?? 0),
      '',
      '## Overflow / failures under zoom',
      '',
      mdTable(
        ['Route', 'Viewport', 'Zoom', 'overflowX', 'Error'],
        zoomFiles
          .filter((r) => r.error || r.metrics?.scroll?.overflowX > 1)
          .slice(0, 60)
          .map((r) => [
            r.slug,
            r.viewport?.w + 'x' + r.viewport?.h,
            Math.round((r.zoom || 1) * 100) + '%',
            String(r.metrics?.scroll?.overflowX ?? ''),
            String(r.error || '').slice(0, 80),
          ]),
      ),
      '',
    ].join(nl),
  );

  const typo = typographySummary(
    viewportFiles.filter((r) => r.viewport?.w === 1920 || r.viewport?.w === 390),
  );
  const typoSections = [];
  for (const [slug, samples] of Object.entries(typo).slice(0, 20)) {
    for (const s of samples) {
      const t = s.typography || {};
      typoSections.push(
        '### ' + slug + ' @ ' + s.viewport?.w + '×' + s.viewport?.h,
        '- h1: ' + (t.h1?.fontSize || '—') + ' / lh ' + (t.h1?.lineHeight || '—'),
        '- h2: ' + (t.h2?.fontSize || '—'),
        '- body: ' + (t.body?.fontSize || '—') + ' / lh ' + (t.body?.lineHeight || '—'),
        '- p: ' + (t.p?.fontSize || '—'),
        '- small: ' + (t.small?.fontSize || '—'),
        '',
      );
    }
  }

  write(
    'reports/TYPOGRAPHY_AUDIT.md',
    [
      '# Typography Audit',
      '',
      'Measured computed styles for first `h1–h4`, `body`, `p`, and small text samples at representative viewports (390 and 1920) from the viewport matrix.',
      '',
      '## Sample (auto)',
      '',
      ...typoSections,
      '## Observations for Phase 2',
      '',
      '- Document wrapping / truncation debt from overflow issues.',
      '- Contrast fixes deferred (measure via a11y notes).',
      '- Do not redesign type scale in Phase 1.',
      '',
    ].join(nl),
  );

  write(
    'reports/COMPONENT_INVENTORY.md',
    [
      '# Component Inventory (responsive surface)',
      '',
      'Inventory of UI surfaces measured by the layout probe — not a redesign list.',
      '',
      '| Surface | Probe selectors / notes |',
      '| --- | --- |',
      '| Cards | `.dashboard-card`, `[class*="card"]`, `[data-slot="card"]` |',
      '| Tables | `table`, `.responsive-table-shell` |',
      '| Charts | `canvas`, chart class hooks |',
      '| Navigation | `nav`, sticky/fixed samples |',
      '| Sidebar | `[data-slot="sidebar"]`, `aside` — collapses below `lg` (1024) |',
      '| Containers | `.page-container`, `.container`, `main` |',
      '| Forms / buttons | counted via focusable inventory |',
      '| Dialogs / sheets / toasts | present in product; capture when open state available (baseline closed) |',
      '| Touch targets | `--touch-min: 2.75rem`; sub-44px targets flagged as debt |',
      '',
      '## Shells',
      '',
      'See [../diagrams/layout-shells.md](../diagrams/layout-shells.md).',
      '',
    ].join(nl),
  );

  write(
    'reports/ACCESSIBILITY_NOTES.md',
    [
      '# Accessibility Notes (measure-only)',
      '',
      '## Method',
      '',
      'Layout probe samples:',
      '',
      '- Focusable control counts',
      '- Sub-44×44 touch targets',
      '- Missing accessible name samples on buttons/links/inputs',
      '',
      'No axe autofix. No product changes.',
      '',
      '## Aggregate (viewport matrix)',
      '',
      '- Captures with small touch targets: ' +
        viewportFiles.filter((r) => (r.metrics?.a11y?.smallTouchTargetCount || 0) > 0).length,
      '- Captures with missing label samples: ' +
        viewportFiles.filter((r) => (r.metrics?.a11y?.missingLabelSamples || []).length > 0).length,
      '',
      '## Highest small-target counts',
      '',
      mdTable(
        ['Route', 'Viewport', 'Small targets', 'Focusables'],
        viewportFiles
          .filter((r) => (r.metrics?.a11y?.smallTouchTargetCount || 0) > 0)
          .sort(
            (a, b) =>
              (b.metrics.a11y.smallTouchTargetCount || 0) - (a.metrics.a11y.smallTouchTargetCount || 0),
          )
          .slice(0, 30)
          .map((r) => [
            r.slug,
            r.viewport?.w + 'x' + r.viewport?.h,
            String(r.metrics.a11y.smallTouchTargetCount),
            String(r.metrics.a11y.focusableCount),
          ]),
      ),
      '',
      '## Phase 2 a11y focus',
      '',
      'Keyboard navigation, focus rings, contrast, and SR labels should be fixed from this evidence — not in Phase 1.',
      '',
    ].join(nl),
  );

  let resizeBody = ['_resize-perf.json not found — run `pnpm ui-audit:resize`._'];
  if (resize) {
    resizeBody = [];
    for (const r of resize.results) {
      const ok = (r.samples || []).filter((s) => !s.error);
      const maxShift = Math.max(0, ...ok.map((s) => s.shiftSum || 0));
      const maxLt = Math.max(0, ...ok.map((s) => s.longTaskMs || 0));
      resizeBody.push(
        '### `' + r.path + '`',
        '- Steps: ' + ok.length,
        '- Max cumulative layout-shift sample: **' + maxShift.toFixed(4) + '**',
        '- Max long-task ms sample: **' + Math.round(maxLt) + '**',
        '- Overflow-X after resize: ' + ok.filter((s) => s.overflowX > 1).length + ' steps',
        '',
      );
    }
  }

  write(
    'reports/PERFORMANCE_MEASUREMENTS.md',
    [
      '# Performance Measurements (resize / orientation)',
      '',
      'Measure-only. No optimization in Phase 1.',
      '',
      '## Resize / orientation harness',
      '',
      'Source: `tools/ui-audit/resize-perf.mjs` → `before/resize-perf.json`',
      '',
      ...resizeBody,
      '## Notes',
      '',
      '- Layout shift and long-task observers are best-effort in headless Chromium.',
      '- Paint/reflow deep profiling deferred to engineering CWV harness (`tools/audit/playwright-cwv.mjs`).',
      '',
    ].join(nl),
  );

  write(
    'reports/RESPONSIVE_DEBT_LIST.md',
    [
      '# Responsive Debt List',
      '',
      'Unique issues detected by the Phase 1 harness. **Do not fix in Phase 1.**',
      '',
      'Total: **' + debt.length + '**',
      '',
      mdTable(
        ['Severity', 'Type', 'Route', 'Viewport', 'Detail'],
        debt.slice(0, 200).map((d) => [
          d.severity,
          d.type,
          d.slug,
          d.viewport ? d.viewport.w + '×' + d.viewport.h : '—',
          JSON.stringify(d.detail).slice(0, 100).replace(/|/g, '/'),
        ]),
      ),
      '',
      debt.length > 200
        ? nl + '_… ' + (debt.length - 200) + ' more items in machine-readable `before/debt.json`._' + nl
        : '',
    ].join(nl),
  );

  fs.writeFileSync(path.join(OUT, 'before', 'debt.json'), JSON.stringify(debt, null, 2));

  const high = debt.filter((d) => d.severity === 'high').length;
  const med = debt.filter((d) => d.severity === 'medium').length;
  const low = debt.filter((d) => d.severity === 'low').length;

  write(
    'reports/PRIORITY_MATRIX.md',
    [
      '# Priority Matrix',
      '',
      '| Priority | Criteria | Count | Phase 2 action |',
      '| --- | --- | --- | --- |',
      '| P0 | High severity overflow / broken layout on core Tier A routes | ' + high + ' | Fix first — unblock mobile/laptop usability |',
      '| P1 | Medium overflow, table overflow, small touch targets on Tier A | ' + med + ' | Batch responsive fixes |',
      '| P2 | Low density/narrow-card / extreme scroll notes | ' + low + ' | Polish pass |',
      '| P3 | Browser/DPI/zoom-only quirks | (see slice reports) | Compat hardening |',
      '',
      '## P0 candidates',
      '',
      mdTable(
        ['Route', 'Viewport', 'Type', 'Detail'],
        debt
          .filter((d) => d.severity === 'high')
          .slice(0, 40)
          .map((d) => [
            d.slug,
            d.viewport ? d.viewport.w + '×' + d.viewport.h : '—',
            d.type,
            JSON.stringify(d.detail).slice(0, 80).replace(/|/g, '/'),
          ]),
      ),
      '',
    ].join(nl),
  );

  write(
    'reports/PHASE2_RECOMMENDATIONS.md',
    [
      '# Phase 2 Recommendations',
      '',
      'Phase 1 established evidence. Phase 2 should **fix** the highest-impact responsive debt without redesigning product architecture.',
      '',
      '## Recommended Phase 2 themes',
      '',
      '1. **Overflow eradication** — eliminate horizontal overflow on Tier A routes across the viewport matrix (P0).',
      '2. **Sidebar / navigation rules** — standardize collapse at `lg` (1024), bottom-nav safe areas, focus order.',
      '3. **Table & chart sizing** — enforce `.responsive-table-shell` and chart height tokens on analytics/dashboard.',
      '4. **Touch target floor** — honor `--touch-min` (2.75rem) on mobile controls.',
      '5. **Zoom resilience** — validate 110–150% zoom on forms and dialogs.',
      '6. **Screenshot regression gate** — introduce Playwright `toHaveScreenshot` for Tier A × {390, 768, 1920} only after baselines stabilize.',
      '',
      '## Explicitly not Phase 2 (yet)',
      '',
      '- Landing / marketing visual redesign',
      '- Motion / Experience engine changes',
      '- Dashboard architecture restructuring',
      '- Color / typography redesign',
      '',
      '## Inputs',
      '',
      '- [RESPONSIVE_DEBT_LIST.md](RESPONSIVE_DEBT_LIST.md)',
      '- [PRIORITY_MATRIX.md](PRIORITY_MATRIX.md)',
      '- [../RESPONSIVE_RULE_BOOK.md](../RESPONSIVE_RULE_BOOK.md)',
      '',
    ].join(nl),
  );

  write(
    'RESPONSIVE_RULE_BOOK.md',
    [
      '# Responsive Rule Book',
      '',
      '**Status:** Observed rules from code + Phase 1 measurements. Not a redesign.',
      '',
      '## Breakpoints',
      '',
      '| Name | Min width | Product meaning |',
      '| --- | --- | --- |',
      '| sm | 640 | Small phones → large phones |',
      '| md | 768 | Tablet portrait start |',
      '| lg | 1024 | **Desktop shell**; `isMobile = width < lg` |',
      '| xl | 1280 | Wide desktop |',
      '| 2xl | 1536 | Extra-wide |',
      '',
      'Source: `apps/web/src/lib/hooks/useBreakpoint.ts`.',
      '',
      '## Containers',
      '',
      '| Rule | Value |',
      '| --- | --- |',
      '| Maximum content width | `.page-container` → **1920px** |',
      '| CSS token | `--content-max: min(120rem, 100%)` |',
      '| Horizontal padding | `--dashboard-p` (clamped; tighter on small screens) |',
      '',
      '## Sidebar & navigation',
      '',
      '| Rule | Behavior |',
      '| --- | --- |',
      '| Sidebar width | `--sidebar-w` / `--sidebar-w-collapsed` |',
      '| Collapse | Below **lg (1024)** — mobile bottom nav / drawer patterns |',
      '| Safe areas | `--safe-*` + `.pb-safe` / `.pt-safe` / `.px-safe` |',
      '',
      '## Spacing & density',
      '',
      '| Token | Role |',
      '| --- | --- |',
      '| `--dashboard-p` | Page padding |',
      '| Utility grids | `.responsive-card-grid`, `.responsive-stat-grid` |',
      '',
      '## Typography scaling',
      '',
      '- Heading / body sizes measured per route in [reports/TYPOGRAPHY_AUDIT.md](reports/TYPOGRAPHY_AUDIT.md).',
      '- Phase 1 does **not** change the type scale.',
      '',
      '## Charts & tables',
      '',
      '| Surface | Rule |',
      '| --- | --- |',
      '| Tables | Prefer `.responsive-table-shell` horizontal scroll containment |',
      '| Charts | Height tokens `--chart-h-*` (inventory in globals.css); pause when off-viewport (Phase 4) |',
      '',
      '## Touch & accessibility floors',
      '',
      '| Rule | Value |',
      '| --- | --- |',
      '| Minimum touch | `--touch-min: 2.75rem` (~44px) |',
      '| Focus | Existing focus rings — verify visibility under zoom/DPI (debt) |',
      '',
      '## Grid rules',
      '',
      '- Marketing and dashboard use shell-specific grids; do not invent a new global grid in Phase 1.',
      '- Ultrawide (3440+) should keep content within 1920px container unless a deliberate full-bleed section exists.',
      '',
      '## Change policy',
      '',
      'Any Phase 2+ UI change must cite a debt ID or rule from this book and preserve screenshot baselines for Tier A viewports.',
      '',
    ].join(nl),
  );

  console.log('Report generation complete.');
}

main();
