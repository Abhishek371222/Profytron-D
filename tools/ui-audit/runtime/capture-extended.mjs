#!/usr/bin/env node
/**
 * Phase 1B extended suites:
 *   interactions | sessions | animation | mt5 | stress | all
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import {
  runtimeInitScript,
  collectRuntimeSnapshot,
  measureInteractionLatency,
  mt5SyntheticStorm,
  sampleScrollJank,
} from './probes.mjs';
import { runProbe } from './run-probe.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../..');
const require = createRequire(path.join(ROOT, 'apps/web/package.json'));
const { chromium } = require('@playwright/test');

const OUT = path.resolve(ROOT, process.env.UI_AUDIT_OUT || 'docs/ui-audit/phase1b');
const BASE =
  process.env.WEB_BASE || process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
const MODE = (process.env.UI_AUDIT_EXTENDED || 'all').toLowerCase();
const AUDIT_JWT = process.env.AUDIT_JWT || '';
const SCALE = Number(process.env.UI_AUDIT_SESSION_SCALE || '1');
const MT5_UPDATES = Number(process.env.UI_AUDIT_MT5_UPDATES || '1000');

fs.mkdirSync(path.join(OUT, 'before'), { recursive: true });
fs.mkdirSync(path.join(OUT, 'metrics'), { recursive: true });

function authInit(token) {
  return (t) => {
    try {
      sessionStorage.setItem('profytron_access', t);
      localStorage.setItem(
        'profytron-auth',
        JSON.stringify({
          state: {
            accessToken: t,
            isAuthenticated: true,
            sessionReady: true,
            isHydrating: false,
            user: { id: 'ui-audit-rt', onboardingCompleted: true },
          },
          version: 0,
        }),
      );
      document.cookie = 'onboarding_completed=1; path=/';
    } catch (_) {}
  };
}

async function newAuthedPage(browser, url, viewport = { width: 1920, height: 1080 }) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  await page.addInitScript(runtimeInitScript());
  if (AUDIT_JWT) await page.addInitScript(authInit(AUDIT_JWT), AUDIT_JWT);
  await page.goto(BASE + url, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await page.waitForTimeout(1000);
  try {
    await page.waitForLoadState('networkidle', { timeout: 4000 });
  } catch (_) {}
  return { context, page };
}

async function timeClick(page, locator, label) {
  const handle = typeof locator === 'string' ? page.locator(locator).first() : locator;
  if (!(await handle.count())) return { label, skipped: true, reason: 'not found' };
  const t0 = Date.now();
  try {
    await handle.click({ timeout: 3000 });
  } catch (e) {
    return { label, error: String(e.message || e) };
  }
  const mutate = await runProbe(page, measureInteractionLatency(), label);
  await page.waitForTimeout(150);
  return {
    label,
    wallClickMs: Date.now() - t0,
    ...mutate,
  };
}

async function runInteractions(browser) {
  const samples = [];
  const { context, page } = await newAuthedPage(browser, '/dashboard');

  samples.push(await timeClick(page, 'button:visible', 'button-click-visual-feedback'));
  samples.push(await timeClick(page, 'a[href="/analytics"]:visible, a[href*="analytics"]:visible', 'nav-to-analytics'));
  await page.waitForTimeout(800);
  samples.push({
    label: 'navigation-page-ready',
    ready: await page.evaluate(() => ({
      path: location.pathname,
      busy: !!document.querySelector('[aria-busy="true"]'),
      main: !!document.querySelector('#main-content'),
    })),
  });

  // Modal / dialog best-effort
  const dialogTriggers = [
    'button:has-text("Settings")',
    'button:has-text("Open")',
    '[data-slot="dialog-trigger"]',
    'button[aria-haspopup="dialog"]',
  ];
  for (const sel of dialogTriggers) {
    const r = await timeClick(page, sel, 'modal-open-attempt:' + sel);
    samples.push(r);
    if (!r.skipped && !r.error) {
      await page.keyboard.press('Escape').catch(() => {});
      samples.push({ label: 'modal-close-escape', wallClickMs: 0 });
      break;
    }
  }

  samples.push(await timeClick(page, '[data-slot="tooltip-trigger"], [aria-describedby]', 'tooltip'));
  samples.push(await timeClick(page, 'input[type="search"], input[placeholder*="Search" i]', 'search-focus'));
  try {
    const search = page.locator('input[type="search"], input[placeholder*="Search" i]').first();
    if (await search.count()) {
      const t0 = Date.now();
      await search.fill('btc');
      samples.push({ label: 'search-typing', wallMs: Date.now() - t0 });
    } else {
      samples.push({ label: 'search-typing', skipped: true, reason: 'no search input' });
    }
  } catch (e) {
    samples.push({ label: 'search-typing', error: String(e.message || e) });
  }

  samples.push(await timeClick(page, 'th button, button:has-text("Sort"), [aria-sort]', 'table-sort'));
  samples.push(await timeClick(page, 'button:has-text("Filter"), [data-slot="filter"]', 'filter'));
  samples.push(await timeClick(page, '[role="tab"]', 'tabs'));
  samples.push(await timeClick(page, '[data-slot="accordion-trigger"], details summary', 'accordion'));

  // Public pages
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(600);
  samples.push(await timeClick(page, 'a[href="/pricing"]', 'nav-home-to-pricing'));

  await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded' });
  samples.push(await timeClick(page, 'input[type="email"], input[name="email"]', 'login-email-focus'));

  const out = { ts: new Date().toISOString(), base: BASE, samples };
  fs.writeFileSync(path.join(OUT, 'before', 'interaction-latency.json'), JSON.stringify(out, null, 2));
  await context.close();
  return out;
}

async function runSessions(browser) {
  // Nominal: 30m, 1h, 4h — scaled by UI_AUDIT_SESSION_SCALE
  const profiles = [
    { name: '30min', minutes: 30 },
    { name: '1hour', minutes: 60 },
    { name: '4hour', minutes: 240 },
  ];
  const results = [];

  for (const p of profiles) {
    const durationMs = Math.max(5_000, Math.round(p.minutes * 60_000 * SCALE));
    const sampleEvery = Math.max(2_000, Math.min(30_000, Math.round(durationMs / 10)));
    process.stdout.write(`[session] ${p.name} scale=${SCALE} durationMs=${durationMs}\n`);
    const { context, page } = await newAuthedPage(browser, '/dashboard');
    const series = [];
    const tEnd = Date.now() + durationMs;
    while (Date.now() < tEnd) {
      const snap = await page.evaluate(collectRuntimeSnapshot());
      series.push({
        t: new Date().toISOString(),
        elapsedMs: durationMs - (tEnd - Date.now()),
        heap: snap.memory?.usedJSHeapSize ?? null,
        domNodes: snap.domNodes,
        cls: snap.cls,
        longTaskTotalMs: snap.longTaskTotalMs,
        avgFps: snap.animation?.avgFps ?? null,
        platformMarks: snap.animation?.consoleMetrics?.length ?? 0,
      });
      // Light interaction to keep page alive
      await page.mouse.wheel(0, 200).catch(() => {});
      await page.waitForTimeout(sampleEvery);
    }
    const scroll = await runProbe(page, sampleScrollJank(), 1200);
    const finalSnap = await page.evaluate(collectRuntimeSnapshot());
    results.push({
      profile: p.name,
      nominalMinutes: p.minutes,
      scale: SCALE,
      durationMs,
      samples: series.length,
      series,
      scroll,
      final: {
        heap: finalSnap.memory?.usedJSHeapSize,
        domNodes: finalSnap.domNodes,
        cls: finalSnap.cls,
        longTaskTotalMs: finalSnap.longTaskTotalMs,
      },
      heapGrowth:
        series.length >= 2 && series[0].heap != null && series[series.length - 1].heap != null
          ? series[series.length - 1].heap - series[0].heap
          : null,
    });
    await context.close();
  }

  const out = { ts: new Date().toISOString(), scale: SCALE, results };
  fs.writeFileSync(path.join(OUT, 'before', 'continuous-session.json'), JSON.stringify(out, null, 2));
  return out;
}

async function runAnimation(browser) {
  const { context, page } = await newAuthedPage(browser, '/');
  await page.waitForTimeout(2500);
  // Interrupt: navigate away mid-motion
  const t0 = Date.now();
  await page.goto(BASE + '/pricing', { waitUntil: 'domcontentloaded' }).catch(() => {});
  const interruptMs = Date.now() - t0;
  await page.waitForTimeout(1000);
  const homeStorm = await page.evaluate(collectRuntimeSnapshot());

  await page.goto(BASE + '/dashboard', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  const dash = await page.evaluate(collectRuntimeSnapshot());
  const scroll = await runProbe(page, sampleScrollJank(), 2000);

  const out = {
    ts: new Date().toISOString(),
    interruptNavMs: interruptMs,
    marketing: {
      avgFps: homeStorm.animation?.avgFps,
      droppedFrames: homeStorm.animation?.droppedFrames,
      marks: homeStorm.animation?.consoleMetrics?.slice(-30) || [],
    },
    dashboard: {
      avgFps: dash.animation?.avgFps,
      droppedFrames: dash.animation?.droppedFrames,
      marks: dash.animation?.consoleMetrics?.slice(-30) || [],
    },
    scroll,
    note: 'Queue depth / motion quality require NEXT_PUBLIC_PLATFORM_METRICS=1 (captured via console marks when present).',
  };
  fs.writeFileSync(path.join(OUT, 'before', 'animation-runtime.json'), JSON.stringify(out, null, 2));
  await context.close();
  return out;
}

async function runMt5(browser) {
  const { context, page } = await newAuthedPage(browser, '/dashboard');
  await page.waitForTimeout(1500);
  const before = await page.evaluate(collectRuntimeSnapshot());
  const storm = await runProbe(page, mt5SyntheticStorm(), MT5_UPDATES);
  const after = await page.evaluate(collectRuntimeSnapshot());
  const out = {
    ts: new Date().toISOString(),
    updatesRequested: MT5_UPDATES,
    before: {
      heap: before.memory?.usedJSHeapSize,
      longTaskTotalMs: before.longTaskTotalMs,
      cls: before.cls,
    },
    storm,
    after: {
      heap: after.memory?.usedJSHeapSize,
      longTaskTotalMs: after.longTaskTotalMs,
      cls: after.cls,
      avgFps: after.animation?.avgFps,
    },
  };
  fs.writeFileSync(path.join(OUT, 'before', 'mt5-runtime.json'), JSON.stringify(out, null, 2));
  await context.close();
  return out;
}

async function runStress(browser) {
  const results = { ts: new Date().toISOString(), steps: [] };

  // Multiple tabs
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const pages = [];
  for (const pathName of ['/', '/dashboard', '/marketplace', '/analytics']) {
    const p = await ctx.newPage();
    await p.addInitScript(runtimeInitScript());
    if (AUDIT_JWT) await p.addInitScript(authInit(AUDIT_JWT), AUDIT_JWT);
    await p.goto(BASE + pathName, { waitUntil: 'domcontentloaded', timeout: 60_000 }).catch((e) => {
      results.steps.push({ step: 'open-tab', path: pathName, error: String(e.message || e) });
    });
    pages.push(p);
  }
  results.steps.push({ step: 'multi-tab', tabs: pages.length, ok: true });

  const page = pages[1] || pages[0];

  // Resize repeatedly
  for (const vp of [
    { w: 1920, h: 1080 },
    { w: 768, h: 1024 },
    { w: 390, h: 844 },
    { w: 1440, h: 900 },
    { w: 1920, h: 1080 },
  ]) {
    await page.setViewportSize({ width: vp.w, height: vp.h });
    await page.waitForTimeout(200);
  }
  results.steps.push({
    step: 'resize-cycle',
    snapshot: await page.evaluate(collectRuntimeSnapshot()).then((s) => ({
      overflowX: s.layoutRuntime?.overflowX,
      cls: s.cls,
      longTaskTotalMs: s.longTaskTotalMs,
    })),
  });

  // Zoom via CDP
  try {
    const cdp = await ctx.newCDPSession(page);
    for (const z of [0.8, 1.25, 1.5, 1]) {
      await cdp.send('Emulation.setPageScaleFactor', { pageScaleFactor: z });
      await page.waitForTimeout(250);
    }
    results.steps.push({ step: 'zoom-cycle', ok: true });
  } catch (e) {
    results.steps.push({ step: 'zoom-cycle', error: String(e.message || e) });
  }

  // Background tab + return
  const other = pages[0];
  await other.bringToFront();
  await page.waitForTimeout(1500);
  await page.bringToFront();
  await page.waitForTimeout(500);
  results.steps.push({
    step: 'background-return',
    snapshot: await page.evaluate(collectRuntimeSnapshot()).then((s) => ({
      title: s.title,
      overflowX: s.layoutRuntime?.overflowX,
      avgFps: s.animation?.avgFps,
    })),
  });

  // Minimize/restore approximation: hide via CDP Target / page emulate visibility
  await page.evaluate(() => {
    document.dispatchEvent(new Event('visibilitychange'));
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.waitForTimeout(400);
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  results.steps.push({
    step: 'visibility-cycle',
    recovered: await page.evaluate(() => ({
      hidden: document.hidden,
      hasMain: !!document.querySelector('#main-content, body'),
    })),
  });

  results.final = await page.evaluate(collectRuntimeSnapshot());
  fs.writeFileSync(path.join(OUT, 'before', 'browser-stress.json'), JSON.stringify(results, null, 2));
  await ctx.close();
  return results;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const modes = MODE === 'all' ? ['interactions', 'sessions', 'animation', 'mt5', 'stress'] : [MODE];
  for (const m of modes) {
    console.log(`\n=== Phase 1B extended: ${m} ===`);
    if (m === 'interactions') await runInteractions(browser);
    else if (m === 'sessions') await runSessions(browser);
    else if (m === 'animation') await runAnimation(browser);
    else if (m === 'mt5') await runMt5(browser);
    else if (m === 'stress') await runStress(browser);
    else throw new Error('Unknown mode ' + m);
    console.log('Done', m);
  }
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
