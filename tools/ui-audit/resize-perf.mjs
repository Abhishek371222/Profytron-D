#!/usr/bin/env node
/**
 * Measure-only resize / orientation / layout-shift samples.
 * No optimizations — evidence for PERFORMANCE_MEASUREMENTS.md
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const require = createRequire(path.join(ROOT, 'apps/web/package.json'));
const { chromium } = require('@playwright/test');
const OUT = path.resolve(ROOT, process.env.UI_AUDIT_OUT || 'docs/ui-audit/phase1');
const BASE =
  process.env.WEB_BASE ||
  process.env.PLAYWRIGHT_BASE_URL ||
  'http://localhost:3000';

const ROUTES = ['/', '/pricing', '/login', '/dashboard', '/marketplace', '/analytics', '/alpha-coach'];
const AUDIT_JWT = process.env.AUDIT_JWT || '';

const RESIZE_STEPS = [
  { w: 1920, h: 1080 },
  { w: 1280, h: 720 },
  { w: 768, h: 1024 },
  { w: 390, h: 844 },
  { w: 390, h: 844, landscape: true },
  { w: 1920, h: 1080 },
];

async function measureRoute(browser, routePath) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();

  if (AUDIT_JWT && !['/', '/pricing', '/login'].includes(routePath)) {
    await page.addInitScript((t) => {
      sessionStorage.setItem('profytron_access', t);
      localStorage.setItem(
        'profytron-auth',
        JSON.stringify({
          state: {
            accessToken: t,
            isAuthenticated: true,
            sessionReady: true,
            isHydrating: false,
            user: { id: 'ui-audit', onboardingCompleted: true },
          },
          version: 0,
        }),
      );
      document.cookie = 'onboarding_completed=1; path=/';
    }, AUDIT_JWT);
  }

  await page.addInitScript(() => {
    window.__UI_AUDIT_PERF__ = { shifts: [], longTasks: [], resizeMarks: [] };
    try {
      new PerformanceObserver((list) => {
        for (const e of list.getEntries()) {
          window.__UI_AUDIT_PERF__.shifts.push({
            value: e.value,
            startTime: e.startTime,
          });
        }
      }).observe({ type: 'layout-shift', buffered: true });
    } catch (_) {}
    try {
      new PerformanceObserver((list) => {
        for (const e of list.getEntries()) {
          window.__UI_AUDIT_PERF__.longTasks.push({
            duration: e.duration,
            startTime: e.startTime,
          });
        }
      }).observe({ type: 'longtask', buffered: true });
    } catch (_) {}
  });

  const samples = [];
  try {
    await page.goto(BASE + routePath, { waitUntil: 'domcontentloaded', timeout: 45_000 });
    await page.waitForTimeout(500);

    for (const step of RESIZE_STEPS) {
      const w = step.landscape ? step.h : step.w;
      const h = step.landscape ? step.w : step.h;
      const t0 = Date.now();
      await page.setViewportSize({ width: w, height: h });
      await page.waitForTimeout(300);
      const probe = await page.evaluate((mark) => {
        const perf = window.__UI_AUDIT_PERF__;
        perf.resizeMarks.push({ ...mark, at: performance.now() });
        const doc = document.documentElement;
        return {
          overflowX: Math.max(0, doc.scrollWidth - window.innerWidth),
          scrollHeight: doc.scrollHeight,
          shiftCount: perf.shifts.length,
          shiftSum: perf.shifts.reduce((a, s) => a + (s.value || 0), 0),
          longTaskCount: perf.longTasks.length,
          longTaskMs: perf.longTasks.reduce((a, t) => a + (t.duration || 0), 0),
        };
      }, { w, h });
      samples.push({
        w,
        h,
        landscape: Boolean(step.landscape),
        elapsedMs: Date.now() - t0,
        ...probe,
      });
    }
  } catch (e) {
    samples.push({ error: String(e.message || e) });
  }

  await context.close();
  return { path: routePath, samples };
}

async function main() {
  fs.mkdirSync(path.join(OUT, 'before'), { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const results = [];
  for (const route of ROUTES) {
    process.stdout.write(`[resize-perf] ${route}\n`);
    results.push(await measureRoute(browser, route));
  }
  await browser.close();

  const outPath = path.join(OUT, 'before', 'resize-perf.json');
  fs.writeFileSync(
    outPath,
    JSON.stringify({ ts: new Date().toISOString(), base: BASE, results }, null, 2),
  );
  console.log(`Wrote ${outPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
