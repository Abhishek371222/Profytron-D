#!/usr/bin/env node
/**
 * Screenshot known empty-capable pages (strategies, notifications, marketplace).
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
const { user, admin } = tokens();
const token = user || admin;
const outDir = path.join(JOURNEYS_DIR, 'empty-states');
fs.mkdirSync(outDir, { recursive: true });

const TARGETS = [
  { id: 'strategies', path: '/strategies', auth: true },
  { id: 'notifications', path: '/settings/notifications', auth: true },
  { id: 'marketplace', path: '/marketplace', auth: true },
  { id: 'my_bots', path: '/my-bots', auth: true },
  { id: 'wallet', path: '/wallet', auth: true },
];

async function main() {
  const pages = [];
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
  } catch (e) {
    writeJson('empty-states.json', {
      capturedAt: new Date().toISOString(),
      error: String(e.message || e),
      pages: [],
    });
    console.log(JSON.stringify({ ok: false, reason: 'playwright' }));
    return;
  }

  for (const t of TARGETS) {
    if (t.auth && !token) {
      pages.push({
        id: t.id,
        path: t.path,
        status: 'Blocked',
        note: 'No AUDIT_JWT — empty-state probe skipped',
      });
      continue;
    }
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    if (t.auth && token) await ctx.addInitScript(authInitScript(), token);
    const page = await ctx.newPage();
    try {
      const resp = await page.goto(`${base}${t.path}`, {
        waitUntil: 'domcontentloaded',
        timeout: 20000,
      });
      await page.waitForTimeout(800);
      const content = await page.content().catch(() => '');
      const emptyCue =
        /no (strategies|bots|items|results|notifications|data)|empty|nothing here|get started/i.test(
          content,
        );
      const shotPath = path.join(outDir, `${t.id}.png`);
      await page.screenshot({ path: shotPath, fullPage: false }).catch(() => null);
      pages.push({
        id: t.id,
        path: t.path,
        status: 'Complete',
        httpStatus: resp ? resp.status() : 0,
        url: page.url(),
        emptyCueDetected: emptyCue,
        screenshot: fs.existsSync(shotPath)
          ? `journeys/empty-states/${t.id}.png`
          : null,
        note: emptyCue
          ? 'Empty-state copy/cue detected'
          : 'Page reachable; empty cue not detected (may have data)',
      });
    } catch (e) {
      pages.push({
        id: t.id,
        path: t.path,
        status: 'Missing',
        note: String(e.message || e),
      });
    }
    await ctx.close();
  }

  await browser.close().catch(() => {});

  writeJson('empty-states.json', {
    capturedAt: new Date().toISOString(),
    base,
    hasJwt: Boolean(token),
    pages,
  });
  console.log(
    JSON.stringify(
      {
        ok: true,
        pages: pages.length,
        complete: pages.filter((p) => p.status === 'Complete').length,
      },
      null,
      2,
    ),
  );
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 0;
});
