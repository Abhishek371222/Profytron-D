#!/usr/bin/env node
/**
 * Error / recovery probes: 404, no-JWT authed route, offline context.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import {
  loadEnv,
  ensureDirs,
  webBase,
  tokens,
  authInitScript,
  writeJson,
  JOURNEYS_DIR,
  ROOT,
} from './lib.mjs';

const require = createRequire(path.join(ROOT, 'apps/web/package.json'));
const { chromium } = require('@playwright/test');

loadEnv();
ensureDirs();

const base = webBase();
const { user } = tokens();
const outDir = path.join(JOURNEYS_DIR, 'error_recovery');
fs.mkdirSync(outDir, { recursive: true });

const probes = [];

async function shot(page, name) {
  const p = path.join(outDir, `${name}.png`);
  await page.screenshot({ path: p, fullPage: false }).catch(() => null);
  return fs.existsSync(p)
    ? `journeys/error_recovery/${name}.png`
    : null;
}

async function main() {
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
  } catch (e) {
    writeJson('errors.json', {
      capturedAt: new Date().toISOString(),
      error: String(e.message || e),
      probes: [],
    });
    console.log(JSON.stringify({ ok: false, reason: 'playwright' }));
    return;
  }

  // 404
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const page = await ctx.newPage();
    let status = 0;
    try {
      const resp = await page.goto(`${base}/this-route-does-not-exist-product-audit`, {
        waitUntil: 'domcontentloaded',
        timeout: 20000,
      });
      status = resp ? resp.status() : 0;
      await page.waitForTimeout(500);
      const screenshot = await shot(page, 'not-found');
      probes.push({
        id: 'not_found',
        status: status === 404 || status === 200 ? 'Complete' : 'Partial',
        httpStatus: status,
        url: page.url(),
        screenshot,
        note: '404 / not-found surface reachability',
      });
    } catch (e) {
      probes.push({
        id: 'not_found',
        status: 'Missing',
        note: String(e.message || e),
      });
    }
    await ctx.close();
  }

  // 401 / no JWT on protected route
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const page = await ctx.newPage();
    try {
      await page.goto(`${base}/dashboard`, {
        waitUntil: 'domcontentloaded',
        timeout: 20000,
      });
      await page.waitForTimeout(800);
      const url = page.url();
      const gated = /login|register|auth/i.test(url);
      const screenshot = await shot(page, 'no-jwt-dashboard');
      probes.push({
        id: 'unauthorized_gate',
        status: gated || url.includes('/login') ? 'Complete' : 'Partial',
        url,
        screenshot,
        note: gated
          ? 'Unauthed dashboard redirected/gated'
          : 'Dashboard loaded without JWT (soft Partial)',
      });
    } catch (e) {
      probes.push({
        id: 'unauthorized_gate',
        status: 'Missing',
        note: String(e.message || e),
      });
    }
    await ctx.close();
  }

  // Offline
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    if (user) await ctx.addInitScript(authInitScript(), user);
    const page = await ctx.newPage();
    try {
      await page.goto(`${base}/`, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await ctx.setOffline(true);
      await page.reload({ waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
      await page.waitForTimeout(500);
      const content = await page.content().catch(() => '');
      const hasOfflineCue =
        /offline|network|connection|unavailable/i.test(content) ||
        (await page.locator('text=/offline/i').count().catch(() => 0)) > 0;
      const screenshot = await shot(page, 'offline');
      probes.push({
        id: 'offline',
        status: hasOfflineCue ? 'Complete' : 'Partial',
        screenshot,
        note: hasOfflineCue
          ? 'Offline cue detected'
          : 'No dedicated offline banner detected (browser offline set)',
      });
    } catch (e) {
      probes.push({
        id: 'offline',
        status: 'Blocked',
        note: String(e.message || e),
      });
    }
    await ctx.close();
  }

  await browser.close().catch(() => {});

  const summary = {
    complete: probes.filter((p) => p.status === 'Complete').length,
    partial: probes.filter((p) => p.status === 'Partial').length,
    blocked: probes.filter((p) => p.status === 'Blocked').length,
    missing: probes.filter((p) => p.status === 'Missing').length,
  };

  writeJson('errors.json', {
    capturedAt: new Date().toISOString(),
    base,
    hasJwt: Boolean(user),
    probes,
    summary,
  });
  console.log(JSON.stringify({ ok: true, ...summary }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 0;
});
