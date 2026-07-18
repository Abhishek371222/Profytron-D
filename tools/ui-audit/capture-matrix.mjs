#!/usr/bin/env node
/**
 * UI Excellence Phase 1 — Responsive capture matrix.
 *
 * Modes:
 *   VIEWPORT (default) — all routes × full viewport matrix × chromium @ dpr1 zoom100
 *   BROWSER — tier A + smoke × compat viewports × chromium/firefox/webkit/(msedge)
 *   DPI — tier A × compat viewports × dpi scales × chromium
 *   ZOOM — tier A × compat viewports × zoom levels × chromium
 *
 * Env:
 *   WEB_BASE / PLAYWRIGHT_BASE_URL — default http://localhost:3000
 *   AUDIT_JWT — seed authed user routes
 *   COMPAT_ADMIN_JWT — seed admin routes
 *   UI_AUDIT_MODE — viewport | browser | dpi | zoom | all
 *   UI_AUDIT_LIMIT — optional max captures (smoke/debug)
 *   UI_AUDIT_DRY — 1 = metrics only, no PNGs
 *   UI_AUDIT_OUT — override output root (default docs/ui-audit/phase1)
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { layoutProbeSource } from './layout-probe.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const require = createRequire(path.join(ROOT, 'apps/web/package.json'));
const { chromium, firefox, webkit } = require('@playwright/test');
const OUT_ROOT = path.resolve(ROOT, process.env.UI_AUDIT_OUT || 'docs/ui-audit/phase1');
const BASE =
  process.env.WEB_BASE ||
  process.env.PLAYWRIGHT_BASE_URL ||
  'http://localhost:3000';

const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, 'routes.json'), 'utf8'));
const MODE = (process.env.UI_AUDIT_MODE || 'viewport').toLowerCase();
const LIMIT = process.env.UI_AUDIT_LIMIT ? Number(process.env.UI_AUDIT_LIMIT) : Infinity;
const DRY = process.env.UI_AUDIT_DRY === '1';
const AUDIT_JWT = process.env.AUDIT_JWT || '';
const ADMIN_JWT = process.env.COMPAT_ADMIN_JWT || AUDIT_JWT || '';

const allViewports = [
  ...manifest.viewports.mobile,
  ...manifest.viewports.tablet,
  ...manifest.viewports.desktop,
];

function ensureDirs() {
  for (const d of [
    'before',
    'screenshots',
    'viewport-matrix',
    'browser-matrix',
    'dpi-matrix',
    'zoom-matrix',
    'reports',
    'diagrams',
  ]) {
    fs.mkdirSync(path.join(OUT_ROOT, d), { recursive: true });
  }
}

function resolvePath(route) {
  if (!route.dynamic) return route.path;
  const key = route.envKey;
  const val = key ? process.env[key] : '';
  if (!val) return null;
  return route.path.replace(':id', val).replace(':slug', val);
}

function authInitScript(token) {
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
            user: {
              id: 'ui-audit',
              email: 'ui-audit@profytron.test',
              onboardingCompleted: true,
              role: 'user',
            },
          },
          version: 0,
        }),
      );
      document.cookie = 'onboarding_completed=1; path=/';
    } catch (_) {}
  };
}

function screenshotName({ slug, w, h, browser, dpr, zoom }) {
  const z = Math.round(zoom * 100);
  const d = String(dpr).replace('.', 'p');
  return `${slug}__${w}x${h}__${browser}__dpr${d}__z${z}.png`;
}

async function launchBrowser(name) {
  if (name === 'firefox') return firefox.launch({ headless: true });
  if (name === 'webkit') return webkit.launch({ headless: true });
  if (name === 'msedge') {
    try {
      return await chromium.launch({ headless: true, channel: 'msedge' });
    } catch (e) {
      return { error: String(e.message || e) };
    }
  }
  return chromium.launch({ headless: true });
}

async function captureOne({
  browserName,
  browser,
  route,
  resolvedPath,
  vp,
  dpr,
  zoom,
  matrixDir,
}) {
  const context = await browser.newContext({
    viewport: { width: vp.w, height: vp.h },
    deviceScaleFactor: dpr,
  });
  const page = await context.newPage();

  const token = route.auth === 'admin' ? ADMIN_JWT : AUDIT_JWT;
  if (token && (route.auth === 'user' || route.auth === 'admin')) {
    await page.addInitScript(authInitScript(token), token);
  }

  const result = {
    slug: route.slug,
    path: resolvedPath,
    auth: route.auth,
    shell: route.shell,
    tier: route.tier,
    browser: browserName,
    viewport: { w: vp.w, h: vp.h, label: vp.label },
    dpr,
    zoom,
    ok: false,
    status: null,
    skipped: false,
    skipReason: null,
    screenshot: null,
    metrics: null,
    error: null,
    ts: new Date().toISOString(),
  };

  try {
    if (zoom !== 1) {
      try {
        const cdp = await context.newCDPSession(page);
        await cdp.send('Emulation.setPageScaleFactor', { pageScaleFactor: zoom });
      } catch {
        await page.addInitScript((z) => {
          document.documentElement.style.zoom = String(z);
        }, zoom);
      }
    }

    const res = await page.goto(BASE + resolvedPath, {
      waitUntil: 'domcontentloaded',
      timeout: 45_000,
    });
    result.status = res?.status() ?? null;

    await page.waitForTimeout(400);
    try {
      await page.waitForLoadState('networkidle', { timeout: 2_500 });
    } catch {
      /* settle best-effort */
    }

    const metrics = await page.evaluate(layoutProbeSource());
    result.metrics = metrics;
    result.ok = true;

    if (!DRY) {
      const file = screenshotName({
        slug: route.slug,
        w: vp.w,
        h: vp.h,
        browser: browserName,
        dpr,
        zoom,
      });
      const shotPath = path.join(OUT_ROOT, 'screenshots', file);
      await page.screenshot({ path: shotPath, fullPage: true, animations: 'disabled' });
      result.screenshot = path.relative(ROOT, shotPath);
    }

    const jsonName = screenshotName({
      slug: route.slug,
      w: vp.w,
      h: vp.h,
      browser: browserName,
      dpr,
      zoom,
    }).replace(/\.png$/, '.json');
    const jsonPath = path.join(OUT_ROOT, matrixDir, jsonName);
    fs.writeFileSync(jsonPath, JSON.stringify(result, null, 2));
  } catch (e) {
    result.error = String(e.message || e);
    result.ok = false;
    const jsonName = screenshotName({
      slug: route.slug,
      w: vp.w,
      h: vp.h,
      browser: browserName,
      dpr,
      zoom,
    }).replace(/\.png$/, '.json');
    fs.writeFileSync(path.join(OUT_ROOT, matrixDir, jsonName), JSON.stringify(result, null, 2));
  } finally {
    await context.close();
  }

  return result;
}

function selectRoutes(mode) {
  const routes = [];
  for (const route of manifest.routes) {
    const resolved = resolvePath(route);
    if (route.dynamic && !resolved) {
      routes.push({ route, resolvedPath: null, skip: true, skipReason: route.skipReason });
      continue;
    }
    if (mode === 'browser' || mode === 'dpi' || mode === 'zoom') {
      const isTierA = route.tier === 'A';
      const isSmoke = manifest.smokeRoutes.includes(route.path);
      if (!isTierA && !(mode === 'browser' && isSmoke)) continue;
    }
    routes.push({ route, resolvedPath: resolved || route.path, skip: false });
  }
  return routes;
}

async function runViewport() {
  const browser = await chromium.launch({ headless: true });
  const selected = selectRoutes('viewport');
  const results = [];
  let n = 0;

  for (const item of selected) {
    if (item.skip) {
      results.push({
        slug: item.route.slug,
        skipped: true,
        skipReason: item.skipReason,
        path: item.route.path,
      });
      continue;
    }
    if (n >= LIMIT) break;

    const context = await browser.newContext({
      viewport: { width: allViewports[0].w, height: allViewports[0].h },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();
    const token = item.route.auth === 'admin' ? ADMIN_JWT : AUDIT_JWT;
    if (token && (item.route.auth === 'user' || item.route.auth === 'admin')) {
      await page.addInitScript(authInitScript(token), token);
    }

    let navStatus = null;
    try {
      const res = await page.goto(BASE + item.resolvedPath, {
        waitUntil: 'domcontentloaded',
        timeout: 45_000,
      });
      navStatus = res?.status() ?? null;
      await page.waitForTimeout(300);
      try {
        await page.waitForLoadState('networkidle', { timeout: 2_000 });
      } catch {
        /* settle */
      }
    } catch (e) {
      for (const vp of allViewports) {
        if (n >= LIMIT) break;
        results.push({
          slug: item.route.slug,
          path: item.resolvedPath,
          auth: item.route.auth,
          shell: item.route.shell,
          tier: item.route.tier,
          browser: 'chromium',
          viewport: { w: vp.w, h: vp.h, label: vp.label },
          dpr: 1,
          zoom: 1,
          ok: false,
          status: null,
          error: String(e.message || e),
          ts: new Date().toISOString(),
        });
        n += 1;
      }
      await context.close();
      continue;
    }

    for (const vp of allViewports) {
      if (n >= LIMIT) break;
      process.stdout.write(`[viewport ${n + 1}] ${item.route.slug} ${vp.w}x${vp.h}\n`);
      const result = {
        slug: item.route.slug,
        path: item.resolvedPath,
        auth: item.route.auth,
        shell: item.route.shell,
        tier: item.route.tier,
        browser: 'chromium',
        viewport: { w: vp.w, h: vp.h, label: vp.label },
        dpr: 1,
        zoom: 1,
        ok: false,
        status: navStatus,
        skipped: false,
        skipReason: null,
        screenshot: null,
        metrics: null,
        error: null,
        ts: new Date().toISOString(),
      };
      try {
        await page.setViewportSize({ width: vp.w, height: vp.h });
        await page.waitForTimeout(200);
        const metrics = await page.evaluate(layoutProbeSource());
        result.metrics = metrics;
        result.ok = true;
        if (!DRY) {
          const file = screenshotName({
            slug: item.route.slug,
            w: vp.w,
            h: vp.h,
            browser: 'chromium',
            dpr: 1,
            zoom: 1,
          });
          const shotPath = path.join(OUT_ROOT, 'screenshots', file);
          await page.screenshot({ path: shotPath, fullPage: true, animations: 'disabled' });
          result.screenshot = path.relative(ROOT, shotPath);
        }
      } catch (e) {
        result.error = String(e.message || e);
      }
      const jsonName = screenshotName({
        slug: item.route.slug,
        w: vp.w,
        h: vp.h,
        browser: 'chromium',
        dpr: 1,
        zoom: 1,
      }).replace(/\.png$/, '.json');
      fs.writeFileSync(path.join(OUT_ROOT, 'viewport-matrix', jsonName), JSON.stringify(result, null, 2));
      results.push(result);
      n += 1;
    }

    await context.close();
  }

  await browser.close();
  return results;
}

async function runBrowser() {
  const selected = selectRoutes('browser');
  const results = [];
  let n = 0;
  const gaps = [];

  for (const browserName of manifest.browsers) {
    const browserOrErr = await launchBrowser(browserName);
    if (browserOrErr.error) {
      gaps.push({ browser: browserName, reason: browserOrErr.error });
      continue;
    }
    const browser = browserOrErr;
    for (const item of selected) {
      if (item.skip) continue;
      for (const vp of manifest.compatViewports) {
        if (n >= LIMIT) break;
        process.stdout.write(`[browser ${n + 1}] ${browserName} ${item.route.slug} ${vp.w}x${vp.h}\n`);
        const r = await captureOne({
          browserName,
          browser,
          route: item.route,
          resolvedPath: item.resolvedPath,
          vp,
          dpr: 1,
          zoom: 1,
          matrixDir: 'browser-matrix',
        });
        results.push(r);
        n += 1;
      }
      if (n >= LIMIT) break;
    }
    await browser.close();
    if (n >= LIMIT) break;
  }

  fs.writeFileSync(
    path.join(OUT_ROOT, 'browser-matrix', 'gaps.json'),
    JSON.stringify({ gaps, ts: new Date().toISOString() }, null, 2),
  );
  return results;
}

async function runDpi() {
  const browser = await chromium.launch({ headless: true });
  const selected = selectRoutes('dpi');
  const results = [];
  let n = 0;

  for (const item of selected) {
    if (item.skip) continue;
    for (const vp of manifest.compatViewports) {
      for (const dpr of manifest.dpiScales) {
        if (n >= LIMIT) break;
        process.stdout.write(`[dpi ${n + 1}] ${item.route.slug} ${vp.w}x${vp.h} dpr${dpr}\n`);
        const r = await captureOne({
          browserName: 'chromium',
          browser,
          route: item.route,
          resolvedPath: item.resolvedPath,
          vp,
          dpr,
          zoom: 1,
          matrixDir: 'dpi-matrix',
        });
        results.push(r);
        n += 1;
      }
      if (n >= LIMIT) break;
    }
    if (n >= LIMIT) break;
  }

  await browser.close();
  return results;
}

async function runZoom() {
  const browser = await chromium.launch({ headless: true });
  const selected = selectRoutes('zoom');
  const results = [];
  let n = 0;

  for (const item of selected) {
    if (item.skip) continue;
    for (const vp of manifest.compatViewports) {
      for (const zoom of manifest.zoomLevels) {
        if (n >= LIMIT) break;
        process.stdout.write(`[zoom ${n + 1}] ${item.route.slug} ${vp.w}x${vp.h} z${zoom}\n`);
        const r = await captureOne({
          browserName: 'chromium',
          browser,
          route: item.route,
          resolvedPath: item.resolvedPath,
          vp,
          dpr: 1,
          zoom,
          matrixDir: 'zoom-matrix',
        });
        results.push(r);
        n += 1;
      }
      if (n >= LIMIT) break;
    }
    if (n >= LIMIT) break;
  }

  await browser.close();
  return results;
}

function writeIndex(mode, results) {
  const dir =
    mode === 'viewport'
      ? 'viewport-matrix'
      : mode === 'browser'
        ? 'browser-matrix'
        : mode === 'dpi'
          ? 'dpi-matrix'
          : 'zoom-matrix';
  const summary = {
    mode,
    base: BASE,
    count: results.length,
    ok: results.filter((r) => r.ok).length,
    failed: results.filter((r) => r.error).length,
    skipped: results.filter((r) => r.skipped).length,
    overflowX: results.filter((r) => r.metrics?.scroll?.overflowX > 1).length,
    authJwtPresent: Boolean(AUDIT_JWT),
    adminJwtPresent: Boolean(ADMIN_JWT),
    dry: DRY,
    ts: new Date().toISOString(),
    results: results.map((r) => ({
      slug: r.slug,
      path: r.path,
      browser: r.browser,
      viewport: r.viewport,
      dpr: r.dpr,
      zoom: r.zoom,
      ok: r.ok,
      status: r.status,
      overflowX: r.metrics?.scroll?.overflowX ?? null,
      screenshot: r.screenshot,
      error: r.error,
      skipped: r.skipped,
      skipReason: r.skipReason,
    })),
  };
  fs.writeFileSync(path.join(OUT_ROOT, dir, 'index.json'), JSON.stringify(summary, null, 2));
  return summary;
}

async function writeEnvironment() {
  const env = {
    date: new Date().toISOString(),
    base: BASE,
    host: {
      platform: process.platform,
      arch: process.arch,
      node: process.version,
      cwd: process.cwd(),
    },
    auth: {
      AUDIT_JWT: Boolean(AUDIT_JWT),
      COMPAT_ADMIN_JWT: Boolean(process.env.COMPAT_ADMIN_JWT),
    },
    matrix: {
      viewportCount: allViewports.length,
      routeCount: manifest.routes.length,
      dpiScales: manifest.dpiScales,
      zoomLevels: manifest.zoomLevels,
      browsers: manifest.browsers,
    },
    note: 'OS matrix uses lab host + Playwright device emulation; true multi-OS CI is out of band.',
  };
  fs.writeFileSync(path.join(OUT_ROOT, 'before', 'environment.json'), JSON.stringify(env, null, 2));
}

async function main() {
  ensureDirs();
  await writeEnvironment();

  const modes = MODE === 'all' ? ['viewport', 'browser', 'dpi', 'zoom'] : [MODE];
  const allSummaries = {};

  for (const mode of modes) {
    console.log(`\n=== UI Audit capture: ${mode} ===`);
    let results;
    if (mode === 'viewport') results = await runViewport();
    else if (mode === 'browser') results = await runBrowser();
    else if (mode === 'dpi') results = await runDpi();
    else if (mode === 'zoom') results = await runZoom();
    else throw new Error(`Unknown mode: ${mode}`);
    allSummaries[mode] = writeIndex(mode, results);
    console.log(
      `Done ${mode}: ${allSummaries[mode].ok}/${allSummaries[mode].count} ok, overflowX=${allSummaries[mode].overflowX}`,
    );
  }

  fs.writeFileSync(
    path.join(OUT_ROOT, 'before', 'capture-run.json'),
    JSON.stringify(allSummaries, null, 2),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
