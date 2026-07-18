#!/usr/bin/env node
/**
 * UI Excellence Phase 1B — Tier A runtime capture.
 * Every static route × {390,768,1920} × Chromium — CWV/network/images/layout/a11y samples.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import {
  runtimeInitScript,
  collectRuntimeSnapshot,
  sampleScrollJank,
} from './probes.mjs';
import { runProbe } from './run-probe.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../..');
const require = createRequire(path.join(ROOT, 'apps/web/package.json'));
const { chromium, firefox, webkit } = require('@playwright/test');

const OUT = path.resolve(ROOT, process.env.UI_AUDIT_OUT || 'docs/ui-audit/phase1b');
const BASE =
  process.env.WEB_BASE || process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
const MODE = (process.env.UI_AUDIT_RUNTIME_MODE || 'tierA').toLowerCase();
const LIMIT = process.env.UI_AUDIT_LIMIT ? Number(process.env.UI_AUDIT_LIMIT) : Infinity;
const PATH_FILTER = (process.env.UI_AUDIT_PATHS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const AUDIT_JWT = process.env.AUDIT_JWT || '';
const ADMIN_JWT = process.env.COMPAT_ADMIN_JWT || AUDIT_JWT || '';

const manifest = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../routes.json'), 'utf8'),
);

const VIEWPORTS = [
  { w: 390, h: 844, label: 'mobile-390' },
  { w: 768, h: 1024, label: 'tablet-768' },
  { w: 1920, h: 1080, label: 'desktop-1920' },
];

function ensureDirs() {
  for (const d of ['before', 'metrics', 'traces', 'reports', 'diagrams']) {
    fs.mkdirSync(path.join(OUT, d), { recursive: true });
  }
}

function resolvePath(route) {
  if (!route.dynamic) return route.path;
  const val = route.envKey ? process.env[route.envKey] : '';
  if (!val) return null;
  return route.path.replace(':id', val).replace(':slug', val);
}

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
            user: {
              id: 'ui-audit-rt',
              email: 'ui-audit-rt@profytron.test',
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

function selectRoutes(mode) {
  const routes = [];
  for (const route of manifest.routes) {
    if (PATH_FILTER.length && !PATH_FILTER.includes(route.path)) continue;
    const resolved = resolvePath(route);
    if (route.dynamic && !resolved) {
      routes.push({ route, resolvedPath: null, skip: true, skipReason: route.skipReason });
      continue;
    }
    if (mode === 'compat') {
      const isTierA = route.tier === 'A';
      const isSmoke = manifest.smokeRoutes.includes(route.path);
      if (!isTierA && !isSmoke) continue;
    }
    routes.push({ route, resolvedPath: resolved || route.path, skip: false });
  }
  return routes;
}

async function measurePage(browser, browserName, item, vp, { scroll = false } = {}) {
  const context = await browser.newContext({
    viewport: { width: vp.w, height: vp.h },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  const network = [];
  page.on('response', (res) => {
    try {
      const url = res.url();
      if (!/\/api\/|localhost:4000|127\.0\.0\.1:4000/.test(url)) return;
      network.push({
        url: url.slice(0, 200),
        status: res.status(),
        ok: res.ok(),
      });
    } catch (_) {}
  });

  await page.addInitScript(runtimeInitScript());
  const token = item.route.auth === 'admin' ? ADMIN_JWT : AUDIT_JWT;
  if (token && (item.route.auth === 'user' || item.route.auth === 'admin')) {
    await page.addInitScript(authInit(token), token);
  }

  const result = {
    slug: item.route.slug,
    path: item.resolvedPath,
    auth: item.route.auth,
    shell: item.route.shell,
    browser: browserName,
    viewport: vp,
    ok: false,
    status: null,
    error: null,
    metrics: null,
    networkLog: null,
    scroll: null,
    ts: new Date().toISOString(),
  };

  try {
    const res = await page.goto(BASE + item.resolvedPath, {
      waitUntil: 'domcontentloaded',
      timeout: 60_000,
    });
    result.status = res?.status() ?? null;
    await page.waitForTimeout(800);
    try {
      await page.waitForLoadState('networkidle', { timeout: 4_000 });
    } catch (_) {}
    // Best-effort INP: click first visible button
    try {
      const btn = page.locator('button:visible, a:visible').first();
      if (await btn.count()) {
        await btn.click({ timeout: 1500 }).catch(() => {});
        await page.waitForTimeout(200);
      }
    } catch (_) {}

    if (scroll) {
      result.scroll = await runProbe(page, sampleScrollJank(), 1800);
    }

    result.metrics = await page.evaluate(collectRuntimeSnapshot());
    result.networkLog = {
      responses: network.slice(0, 80),
      failed: network.filter((n) => !n.ok).length,
    };
    result.ok = true;
  } catch (e) {
    result.error = String(e.message || e);
  } finally {
    await context.close();
  }

  const name = `${item.route.slug}__${vp.w}x${vp.h}__${browserName}.json`;
  fs.writeFileSync(path.join(OUT, 'metrics', name), JSON.stringify(result, null, 2));
  return result;
}

async function runTierA() {
  const browser = await chromium.launch({ headless: true });
  const selected = selectRoutes('tierA');
  const results = [];
  let n = 0;
  for (const item of selected) {
    if (item.skip) {
      results.push({
        slug: item.route.slug,
        skipped: true,
        skipReason: item.skipReason,
      });
      continue;
    }
    for (const vp of VIEWPORTS) {
      if (n >= LIMIT) break;
      process.stdout.write(`[runtime A ${n + 1}] ${item.route.slug} ${vp.w}x${vp.h}\n`);
      results.push(
        await measurePage(browser, 'chromium', item, vp, {
          scroll: item.route.path === '/dashboard' || item.route.tier === 'A',
        }),
      );
      n += 1;
    }
    if (n >= LIMIT) break;
  }
  await browser.close();
  return results;
}

async function runCompat() {
  const selected = selectRoutes('compat');
  const results = [];
  let n = 0;
  for (const browserName of ['firefox', 'webkit']) {
    const launcher = browserName === 'firefox' ? firefox : webkit;
    const browser = await launcher.launch({ headless: true });
    const vp = VIEWPORTS[2];
    for (const item of selected) {
      if (item.skip) continue;
      if (n >= LIMIT) break;
      process.stdout.write(`[runtime C ${n + 1}] ${browserName} ${item.route.slug}\n`);
      results.push(await measurePage(browser, browserName, item, vp));
      n += 1;
    }
    await browser.close();
    if (n >= LIMIT) break;
  }
  return results;
}

function writeIndex(mode, results) {
  const summary = {
    mode,
    base: BASE,
    count: results.length,
    ok: results.filter((r) => r.ok).length,
    failed: results.filter((r) => r.error).length,
    skipped: results.filter((r) => r.skipped).length,
    authJwtPresent: Boolean(AUDIT_JWT),
    ts: new Date().toISOString(),
  };
  fs.writeFileSync(path.join(OUT, 'before', `runtime-${mode}.json`), JSON.stringify({ summary, results }, null, 2));
  return summary;
}

async function writeEnv() {
  const env = {
    date: new Date().toISOString(),
    base: BASE,
    host: { platform: process.platform, arch: process.arch, node: process.version },
    auth: { AUDIT_JWT: Boolean(AUDIT_JWT), COMPAT_ADMIN_JWT: Boolean(process.env.COMPAT_ADMIN_JWT) },
    note: 'Phase 1B runtime UX quality — measure only',
  };
  fs.writeFileSync(path.join(OUT, 'before', 'environment.json'), JSON.stringify(env, null, 2));
}

async function main() {
  ensureDirs();
  await writeEnv();
  console.log(`\n=== Phase 1B runtime: ${MODE} ===`);
  let results;
  if (MODE === 'compat' || MODE === 'tierc') results = await runCompat();
  else results = await runTierA();
  const summary = writeIndex(MODE === 'compat' || MODE === 'tierc' ? 'compat' : 'tierA', results);
  console.log(`Done: ${summary.ok}/${summary.count} ok`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
