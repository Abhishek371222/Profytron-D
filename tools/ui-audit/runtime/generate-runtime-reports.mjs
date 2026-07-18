#!/usr/bin/env node
/**
 * Aggregate Phase 1B metrics → markdown reports + debt + Phase 2 inputs.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../..');
const OUT = path.resolve(ROOT, process.env.UI_AUDIT_OUT || 'docs/ui-audit/phase1b');
const nl = '\n';

function loadJson(rel) {
  const p = path.join(OUT, rel);
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

function loadMetricFiles() {
  const dir = path.join(OUT, 'metrics');
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => {
      try {
        return JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

function write(rel, content) {
  const p = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content);
  console.log('Wrote', p);
}

function table(headers, rows) {
  if (!rows.length) return '_No rows._';
  return [
    '| ' + headers.join(' | ') + ' |',
    '| ' + headers.map(() => '---').join(' | ') + ' |',
    ...rows.map((r) => '| ' + r.join(' | ') + ' |'),
  ].join(nl);
}

function main() {
  const files = loadMetricFiles();
  const env = loadJson('before/environment.json') || {};
  const tierA = loadJson('before/runtime-tierA.json');
  const compat = loadJson('before/runtime-compat.json');
  const interactions = loadJson('before/interaction-latency.json');
  const sessions = loadJson('before/continuous-session.json');
  const animation = loadJson('before/animation-runtime.json');
  const mt5 = loadJson('before/mt5-runtime.json');
  const stress = loadJson('before/browser-stress.json');

  const debt = [];
  for (const r of files) {
    const m = r.metrics;
    if (!m) continue;
    if ((m.cls || 0) > 0.1) {
      debt.push({
        severity: m.cls > 0.25 ? 'high' : 'medium',
        type: 'cls',
        slug: r.slug,
        viewport: r.viewport,
        detail: 'cls=' + m.cls.toFixed(3),
      });
    }
    if ((m.longTaskTotalMs || 0) > 500) {
      debt.push({
        severity: m.longTaskTotalMs > 2000 ? 'high' : 'medium',
        type: 'long-tasks',
        slug: r.slug,
        viewport: r.viewport,
        detail: 'totalMs=' + Math.round(m.longTaskTotalMs),
      });
    }
    if ((m.layoutRuntime?.overflowX || 0) > 1) {
      debt.push({
        severity: m.layoutRuntime.overflowX > 20 ? 'high' : 'medium',
        type: 'overflow-x-runtime',
        slug: r.slug,
        viewport: r.viewport,
        detail: 'px=' + m.layoutRuntime.overflowX,
      });
    }
    if ((m.layoutRuntime?.overflowingTables || []).length) {
      debt.push({
        severity: 'medium',
        type: 'table-overflow-runtime',
        slug: r.slug,
        viewport: r.viewport,
        detail: 'counts=' + m.layoutRuntime.overflowingTables.length,
      });
    }
    if ((m.a11y?.smallTouchTargetCount || 0) > 10) {
      debt.push({
        severity: 'medium',
        type: 'small-touch-targets',
        slug: r.slug,
        viewport: r.viewport,
        detail: 'count=' + m.a11y.smallTouchTargetCount,
      });
    }
    if ((m.network?.duplicates || []).length) {
      debt.push({
        severity: 'low',
        type: 'duplicate-requests',
        slug: r.slug,
        viewport: r.viewport,
        detail: 'n=' + m.network.duplicates.length,
      });
    }
    if ((m.images?.oversizeCount || 0) > 0) {
      debt.push({
        severity: 'low',
        type: 'oversized-images',
        slug: r.slug,
        viewport: r.viewport,
        detail: 'count=' + m.images.oversizeCount,
      });
    }
    if ((m.layoutRuntime?.overlaps || 0) > 2) {
      debt.push({
        severity: 'medium',
        type: 'overlap-sample',
        slug: r.slug,
        viewport: r.viewport,
        detail: 'n=' + m.layoutRuntime.overlaps,
      });
    }
  }

  if (mt5?.storm?.longTaskMs > 1000) {
    debt.push({
      severity: 'high',
      type: 'mt5-storm-longtasks',
      slug: 'dashboard',
      detail: 'longTaskMs=' + Math.round(mt5.storm.longTaskMs) + ' mode=' + mt5.storm.mode,
    });
  }
  if (sessions?.results) {
    for (const s of sessions.results) {
      if (s.heapGrowth != null && s.heapGrowth > 20 * 1024 * 1024) {
        debt.push({
          severity: 'high',
          type: 'session-heap-growth',
          slug: 'dashboard',
          detail: s.profile + ' growthMB=' + (s.heapGrowth / 1e6).toFixed(1),
        });
      }
    }
  }

  fs.writeFileSync(path.join(OUT, 'before', 'runtime-debt.json'), JSON.stringify(debt, null, 2));

  const ok = files.filter((f) => f.ok).length;

  write(
    'reports/RUNTIME_AUDIT_REPORT.md',
    [
      '# Runtime Audit Report',
      '',
      '**Program:** UI Excellence — Phase 1B',
      '**Mode:** Measure-only',
      '**Date:** ' + (env.date || new Date().toISOString()),
      '**Base:** ' + (env.base || ''),
      '',
      '## Executive summary',
      '',
      table(
        ['Metric', 'Value'],
        [
          ['Tier A metric files', String(files.length)],
          ['OK', String(ok)],
          ['Debt items', String(debt.length)],
          ['Interactions capture', interactions ? 'yes' : 'missing'],
          ['Continuous sessions', sessions ? 'yes' : 'missing'],
          ['Animation runtime', animation ? 'yes' : 'missing'],
          ['MT5 storm', mt5 ? 'yes' : 'missing'],
          ['Browser stress', stress ? 'yes' : 'missing'],
          ['AUDIT_JWT', env.auth?.AUDIT_JWT ? 'yes' : 'no'],
        ],
      ),
      '',
      '## Domains covered',
      '',
      '- CWV / paint / CLS / long-task TBT proxy',
      '- Interaction latency',
      '- Continuous dashboard sessions (scaled durations supported)',
      '- Animation interrupt + FPS',
      '- MT5/update storm (live hook or synthetic)',
      '- Browser stress recovery',
      '- Network / images / memory / scroll / a11y / layout-runtime',
      '',
      '## Top long-task routes',
      '',
      table(
        ['Route', 'Viewport', 'LongTask ms', 'CLS'],
        files
          .filter((r) => r.metrics)
          .sort((a, b) => (b.metrics.longTaskTotalMs || 0) - (a.metrics.longTaskTotalMs || 0))
          .slice(0, 25)
          .map((r) => [
            r.slug,
            r.viewport?.w + '×' + r.viewport?.h,
            String(Math.round(r.metrics.longTaskTotalMs || 0)),
            (r.metrics.cls || 0).toFixed(3),
          ]),
      ),
      '',
    ].join(nl),
  );

  write(
    'reports/CWV_REPORT.md',
    [
      '# CWV Report',
      '',
      'Lab measurements (Playwright Chromium). INP uses Event Timing proxy + synthetic click.',
      '',
      table(
        ['Route', 'VP', 'FP', 'FCP', 'LCP', 'CLS', 'TBT proxy', 'INP proxy'],
        files
          .filter((r) => r.metrics && r.browser === 'chromium')
          .slice(0, 80)
          .map((r) => {
            const p = r.metrics.paints || {};
            return [
              r.slug,
              r.viewport?.w + '×' + r.viewport?.h,
              p['first-paint'] != null ? Math.round(p['first-paint']) : '—',
              p['first-contentful-paint'] != null ? Math.round(p['first-contentful-paint']) : '—',
              r.metrics.lcp?.startTime != null ? Math.round(r.metrics.lcp.startTime) : '—',
              (r.metrics.cls || 0).toFixed(3),
              String(Math.round(r.metrics.tbtProxyMs || 0)),
              r.metrics.inpProxyMs != null ? Math.round(r.metrics.inpProxyMs) : '—',
            ];
          }),
      ),
      '',
    ].join(nl),
  );

  write(
    'reports/INTERACTION_LATENCY.md',
    [
      '# Interaction Latency Report',
      '',
      'UX latency baseline — click → mutation / wall time. Skips are explicit.',
      '',
      interactions
        ? table(
            ['Action', 'Wall ms', 'Click→mutate ms', 'Notes'],
            (interactions.samples || []).map((s) => [
              s.label,
              s.wallClickMs != null ? String(s.wallClickMs) : s.wallMs != null ? String(s.wallMs) : '—',
              s.clickToMutateMs != null ? String(Math.round(s.clickToMutateMs)) : '—',
              s.skipped ? 'skip: ' + s.reason : s.error ? String(s.error).slice(0, 80) : 'ok',
            ]),
          )
        : '_Run `pnpm ui-audit:runtime:interactions`._',
      '',
    ].join(nl),
  );

  write(
    'reports/CONTINUOUS_SESSION_REPORT.md',
    [
      '# Continuous Session Report',
      '',
      'Dashboard left open for nominal **30 min / 1 hour / 4 hours**.',
      '',
      sessions
        ? 'Scale used: **' +
          sessions.scale +
          '** (set `UI_AUDIT_SESSION_SCALE=1` for full durations).' +
          nl +
          nl +
          table(
            ['Profile', 'Nominal', 'Actual ms', 'Samples', 'Heap growth', 'Final CLS', 'Final longTask ms'],
            sessions.results.map((r) => [
              r.profile,
              r.nominalMinutes + 'm',
              String(r.durationMs),
              String(r.samples),
              r.heapGrowth != null ? (r.heapGrowth / 1e6).toFixed(2) + ' MB' : '—',
              r.final?.cls != null ? Number(r.final.cls).toFixed(3) : '—',
              r.final?.longTaskTotalMs != null ? String(Math.round(r.final.longTaskTotalMs)) : '—',
            ]),
          )
        : '_Run `pnpm ui-audit:runtime:sessions`._',
      '',
      '## What is tracked',
      '',
      '- JS heap series',
      '- DOM node counts',
      '- Long tasks / CLS',
      '- FPS samples',
      '- Platform metric console marks (when `NEXT_PUBLIC_PLATFORM_METRICS=1`)',
      '- End-of-session scroll jank sample',
      '',
    ].join(nl),
  );

  write(
    'reports/ANIMATION_RUNTIME_REPORT.md',
    [
      '# Animation Runtime Report',
      '',
      animation
        ? [
            '- Interrupt nav (home→pricing) ms: **' + animation.interruptNavMs + '**',
            '- Marketing avg FPS: **' + (animation.marketing?.avgFps ?? '—') + '**',
            '- Marketing dropped frames: **' + (animation.marketing?.droppedFrames ?? '—') + '**',
            '- Dashboard avg FPS: **' + (animation.dashboard?.avgFps ?? '—') + '**',
            '- Dashboard dropped frames: **' + (animation.dashboard?.droppedFrames ?? '—') + '**',
            '- Scroll during animation sample avg FPS: **' + (animation.scroll?.avgFps ?? '—') + '**',
            '',
            animation.note || '',
            '',
            '### Recent platform marks (marketing)',
            '',
            '```json',
            JSON.stringify(animation.marketing?.marks || [], null, 2).slice(0, 4000),
            '```',
          ].join(nl)
        : '_Run `pnpm ui-audit:runtime:animation`._',
      '',
    ].join(nl),
  );

  write(
    'reports/MT5_RUNTIME_REPORT.md',
    [
      '# Live MT5 Runtime Report',
      '',
      'Target: **1000 updates → dashboard** measuring render/paint/long-task/heap pressure.',
      '',
      mt5
        ? [
            '- Updates requested: **' + mt5.updatesRequested + '**',
            '- Mode: **' + (mt5.storm?.mode || '—') + '** (`synthetic` unless live hook present)',
            '- Applied: **' + (mt5.storm?.updates || '—') + '**',
            '- Duration ms: **' + Math.round(mt5.storm?.durationMs || 0) + '**',
            '- Long tasks during storm: **' + (mt5.storm?.longTasks || 0) + '** / **' + Math.round(mt5.storm?.longTaskMs || 0) + '** ms',
            '- Dropped frames: **' + (mt5.storm?.droppedFrames || 0) + '**',
            '- Heap delta: **' +
              (mt5.storm?.heapDelta != null ? (mt5.storm.heapDelta / 1e6).toFixed(2) + ' MB' : '—') +
              '**',
            '- CLS after: **' + (mt5.after?.cls ?? '—') + '**',
            '',
            'For live MetaApi path, run with authenticated session + active trading socket; optional hook `window.__PROFYPTRON_AUDIT_APPLY_EQUITY__`.',
          ].join(nl)
        : '_Run `pnpm ui-audit:runtime:mt5`._',
      '',
    ].join(nl),
  );

  write(
    'reports/BROWSER_STRESS_REPORT.md',
    [
      '# Browser Stress Report',
      '',
      'Multi-tab, resize, zoom, background/return, visibility cycle — verify recovery.',
      '',
      stress
        ? table(
            ['Step', 'Result'],
            (stress.steps || []).map((s) => [
              s.step,
              s.error ? 'ERROR: ' + String(s.error).slice(0, 100) : s.ok === false ? 'fail' : 'ok / recorded',
            ]),
          ) +
          nl +
          nl +
          'Final overflowX: **' +
          (stress.final?.layoutRuntime?.overflowX ?? '—') +
          '** · CLS: **' +
          (stress.final?.cls ?? '—') +
          '**'
        : '_Run `pnpm ui-audit:runtime:stress`._',
      '',
    ].join(nl),
  );

  write(
    'reports/JS_MAIN_THREAD_REPORT.md',
    [
      '# JS Main Thread Report',
      '',
      table(
        ['Route', 'VP', 'Long tasks', 'Total ms', 'Script KB'],
        files
          .filter((r) => r.metrics)
          .sort((a, b) => (b.metrics.longTaskTotalMs || 0) - (a.metrics.longTaskTotalMs || 0))
          .slice(0, 40)
          .map((r) => [
            r.slug,
            r.viewport?.w + '×' + r.viewport?.h,
            String(r.metrics.longTaskCount || 0),
            String(Math.round(r.metrics.longTaskTotalMs || 0)),
            String(r.metrics.js?.scriptTransferKB ?? '—'),
          ]),
      ),
      '',
    ].join(nl),
  );

  write(
    'reports/NETWORK_REPORT.md',
    [
      '# Network Report',
      '',
      table(
        ['Route', 'API count', 'Failed (PW)', 'Duplicate URL groups'],
        files
          .filter((r) => r.metrics)
          .slice(0, 50)
          .map((r) => [
            r.slug,
            String(r.metrics.network?.apiCount ?? 0),
            String(r.networkLog?.failed ?? 0),
            String(r.metrics.network?.duplicates?.length ?? 0),
          ]),
      ),
      '',
    ].join(nl),
  );

  write(
    'reports/IMAGE_REPORT.md',
    [
      '# Image Report',
      '',
      table(
        ['Route', 'Img resources', 'Oversize nodes', 'Largest transfer KB'],
        files
          .filter((r) => r.metrics)
          .slice(0, 40)
          .map((r) => [
            r.slug,
            String(r.metrics.images?.resourceCount ?? 0),
            String(r.metrics.images?.oversizeCount ?? 0),
            String(r.metrics.images?.largestTransferKB ?? 0),
          ]),
      ),
      '',
    ].join(nl),
  );

  write(
    'reports/MEMORY_REPORT.md',
    [
      '# Memory Report',
      '',
      table(
        ['Route', 'VP', 'Heap MB', 'DOM nodes'],
        files
          .filter((r) => r.metrics?.memory)
          .slice(0, 40)
          .map((r) => [
            r.slug,
            r.viewport?.w + '×' + r.viewport?.h,
            (r.metrics.memory.usedJSHeapSize / 1e6).toFixed(1),
            String(r.metrics.domNodes),
          ]),
      ),
      '',
      sessions
        ? '## Session heap growth' +
          nl +
          table(
            ['Profile', 'Growth MB'],
            sessions.results.map((r) => [
              r.profile,
              r.heapGrowth != null ? (r.heapGrowth / 1e6).toFixed(2) : '—',
            ]),
          )
        : '',
      '',
    ].join(nl),
  );

  write(
    'reports/SCROLL_REPORT.md',
    [
      '# Scroll Report',
      '',
      table(
        ['Route', 'VP', 'Avg FPS', 'Long tasks', 'Dropped frames', 'Sticky/fixed'],
        files
          .filter((r) => r.scroll)
          .map((r) => [
            r.slug,
            r.viewport?.w + '×' + r.viewport?.h,
            r.scroll.avgFps != null ? r.scroll.avgFps.toFixed(1) : '—',
            String(r.scroll.longTasksDuring ?? '—'),
            String(r.scroll.droppedFramesDuring ?? '—'),
            String(r.scroll.stickyFixed ?? '—'),
          ]),
      ),
      '',
    ].join(nl),
  );

  write(
    'reports/ACCESSIBILITY_RUNTIME_REPORT.md',
    [
      '# Accessibility Runtime Report',
      '',
      'Measure-only (probe samples; axe-core optional follow-up).',
      '',
      table(
        ['Route', 'VP', 'Focusables', 'Small targets'],
        files
          .filter((r) => r.metrics?.a11y)
          .sort(
            (a, b) =>
              (b.metrics.a11y.smallTouchTargetCount || 0) -
              (a.metrics.a11y.smallTouchTargetCount || 0),
          )
          .slice(0, 40)
          .map((r) => [
            r.slug,
            r.viewport?.w + '×' + r.viewport?.h,
            String(r.metrics.a11y.focusableCount),
            String(r.metrics.a11y.smallTouchTargetCount),
          ]),
      ),
      '',
    ].join(nl),
  );

  write(
    'reports/LAYOUT_RUNTIME_REPORT.md',
    [
      '# Layout Runtime Report',
      '',
      'Live checks (not screenshot-only): overflow, clipped cards, tables, truncated buttons, overlaps, dialogs.',
      '',
      table(
        ['Route', 'VP', 'overflowX', 'Clipped cards', 'Table overflows', 'Trunc btn', 'Overlaps'],
        files
          .filter((r) => r.metrics?.layoutRuntime)
          .filter(
            (r) =>
              r.metrics.layoutRuntime.overflowX > 0 ||
              r.metrics.layoutRuntime.clippedCards > 0 ||
              (r.metrics.layoutRuntime.overflowingTables || []).length ||
              r.metrics.layoutRuntime.truncatedButtons > 0 ||
              r.metrics.layoutRuntime.overlaps > 0,
          )
          .slice(0, 60)
          .map((r) => [
            r.slug,
            r.viewport?.w + '×' + r.viewport?.h,
            String(r.metrics.layoutRuntime.overflowX),
            String(r.metrics.layoutRuntime.clippedCards),
            String((r.metrics.layoutRuntime.overflowingTables || []).length),
            String(r.metrics.layoutRuntime.truncatedButtons),
            String(r.metrics.layoutRuntime.overlaps),
          ]),
      ),
      '',
    ].join(nl),
  );

  write(
    'reports/REACT_COST_REPORT.md',
    [
      '# React Cost Report',
      '',
      'Phase 1B records hydration/nav proxies from Navigation Timing + settled shell flags.',
      '',
      table(
        ['Route', 'DCL ms', 'Load ms', 'Settled main', 'aria-busy'],
        files
          .filter((r) => r.metrics?.navigation)
          .slice(0, 40)
          .map((r) => [
            r.slug,
            String(Math.round(r.metrics.navigation.domContentLoaded || 0)),
            String(Math.round(r.metrics.navigation.loadEventEnd || 0)),
            r.metrics.settled?.main ? 'yes' : 'no',
            r.metrics.settled?.ariaBusy ? 'yes' : 'no',
          ]),
      ),
      '',
      'Component rerender histograms require an optional React Profiler bridge (not injected into product builds). Documented gap unless `NEXT_PUBLIC_PLATFORM_METRICS=1` commit marks appear in console capture.',
      '',
    ].join(nl),
  );

  write(
    'reports/RUNTIME_DEBT_LIST.md',
    [
      '# Runtime Debt List',
      '',
      '**Do not fix in Phase 1B.** Total: **' + debt.length + '**',
      '',
      table(
        ['Severity', 'Type', 'Route', 'Detail'],
        debt.slice(0, 200).map((d) => [d.severity, d.type, d.slug, String(d.detail).slice(0, 80)]),
      ),
      '',
    ].join(nl),
  );

  const high = debt.filter((d) => d.severity === 'high').length;
  const med = debt.filter((d) => d.severity === 'medium').length;
  const low = debt.filter((d) => d.severity === 'low').length;

  write(
    'reports/PRIORITY_MATRIX.md',
    [
      '# Priority Matrix (Phase 1B → future Phase 2)',
      '',
      table(
        ['Priority', 'Criteria', 'Count'],
        [
          ['P0', 'High: CLS storms, MT5 long tasks, session heap growth', String(high)],
          ['P1', 'Medium: long tasks, overflow runtime, overlaps, touch', String(med)],
          ['P2', 'Low: duplicate requests, oversized images', String(low)],
        ],
      ),
      '',
    ].join(nl),
  );

  write(
    'reports/PHASE2_INPUTS.md',
    [
      '# Phase 2 Inputs (evidence package)',
      '',
      'UI Phase 2 must **not** start until this package is reviewed.',
      '',
      '## Complete evidence base',
      '',
      '1. Phase 1 static/responsive — `docs/ui-audit/phase1/`',
      '2. Phase 1B runtime UX — this folder',
      '',
      '## Primary inputs for fix planning',
      '',
      '- [RUNTIME_DEBT_LIST.md](RUNTIME_DEBT_LIST.md)',
      '- [PRIORITY_MATRIX.md](PRIORITY_MATRIX.md)',
      '- [INTERACTION_LATENCY.md](INTERACTION_LATENCY.md)',
      '- [CONTINUOUS_SESSION_REPORT.md](CONTINUOUS_SESSION_REPORT.md)',
      '- [MT5_RUNTIME_REPORT.md](MT5_RUNTIME_REPORT.md)',
      '- [ANIMATION_RUNTIME_REPORT.md](ANIMATION_RUNTIME_REPORT.md)',
      '- [BROWSER_STRESS_REPORT.md](BROWSER_STRESS_REPORT.md)',
      '- Phase 1 [RESPONSIVE_DEBT_LIST.md](../../phase1/reports/RESPONSIVE_DEBT_LIST.md)',
      '',
      '## Discipline',
      '',
      'Every Phase 2 change should cite a debt ID / metric from Phase 1 or 1B — same as the engineering roadmap.',
      '',
    ].join(nl),
  );

  // Update IMPLEMENTATION_SUMMARY lightly
  write(
    'IMPLEMENTATION_SUMMARY.md',
    [
      '# Phase 1B — Implementation Summary',
      '',
      '**Status:** Harness implemented; run reports from latest capture',
      '**Date:** ' + new Date().toISOString(),
      '',
      '## Shipped',
      '',
      '- `tools/ui-audit/runtime/capture-runtime.mjs` — Tier A (+ compat)',
      '- `tools/ui-audit/runtime/capture-extended.mjs` — interactions, sessions, animation, mt5, stress',
      '- `tools/ui-audit/runtime/probes.mjs` — CWV/network/images/layout/scroll/mt5 probes',
      '- `tools/ui-audit/runtime/generate-runtime-reports.mjs`',
      '- Expanded reports including INTERACTION_LATENCY, CONTINUOUS_SESSION, ANIMATION_RUNTIME, MT5_RUNTIME, BROWSER_STRESS',
      '',
      '## Capture counts (this run)',
      '',
      '- Metric files: ' + files.length,
      '- Debt: ' + debt.length,
      '- Session scale: ' + (sessions?.scale ?? 'n/a'),
      '',
      '## Non-goals honored',
      '',
      'No product UI redesign. Phase 2 not started.',
      '',
    ].join(nl),
  );

  console.log('Phase 1B report generation complete.');
}

main();
