#!/usr/bin/env node
/**
 * Playwright + CDP audit harness for CWV, main-thread, network, memory samples.
 * Auth-gated routes are measured only when AUDIT_JWT cookie/storage can be set;
 * public routes always run.
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.env.WEB_BASE || 'http://localhost:3000';
const OUT_DIR = path.resolve('docs/audit/data/lighthouse');
const TRACE_DIR = path.resolve('docs/audit/data/traces');
fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(TRACE_DIR, { recursive: true });

const PUBLIC_ROUTES = ['/', '/login', '/marketplace', '/pricing'];
const AUTH_ROUTES = [
  '/dashboard',
  '/analytics',
  '/markets',
  '/settings/profile',
  '/alpha-coach',
  '/strategies/builder',
  '/connected-accounts',
];

async function measureRoute(browser, route, authed) {
  const context = await browser.newContext();
  const page = await context.newPage();
  const network = [];
  page.on('response', async (res) => {
    try {
      const req = res.request();
      const url = req.url();
      if (!url.includes('localhost') && !url.includes('/api/')) return;
      const timing = res.request().timing();
      network.push({
        url: url.slice(0, 180),
        status: res.status(),
        resourceType: req.resourceType(),
        durationMs: timing ? Math.round(timing.responseEnd) : null,
      });
    } catch {
      /* ignore */
    }
  });

  const client = await context.newCDPSession(page);
  await client.send('Performance.enable');
  await client.send('HeapProfiler.enable').catch(() => {});

  // Long tasks + paint observers
  await page.addInitScript(() => {
    window.__AUDIT__ = {
      longTasks: [],
      paints: {},
      vitals: {},
      renders: [],
    };
    try {
      new PerformanceObserver((list) => {
        for (const e of list.getEntries()) {
          window.__AUDIT__.longTasks.push({
            name: e.name,
            duration: e.duration,
            startTime: e.startTime,
          });
        }
      }).observe({ type: 'longtask', buffered: true });
    } catch {
      /* unsupported */
    }
    try {
      new PerformanceObserver((list) => {
        for (const e of list.getEntries()) {
          window.__AUDIT__.paints[e.name] = e.startTime;
        }
      }).observe({ type: 'paint', buffered: true });
    } catch {
      /* unsupported */
    }
  });

  if (authed) {
    const token = process.env.AUDIT_JWT || '';
    if (token) {
      await page.addInitScript((t) => {
        try {
          localStorage.setItem(
            'profytron-auth',
            JSON.stringify({
              state: {
                accessToken: t,
                sessionReady: true,
              },
              version: 0,
            }),
          );
        } catch {
          /* ignore */
        }
      }, token);
    }
  }

  const t0 = Date.now();
  let navError = null;
  try {
    await page.goto(`${BASE}${route}`, {
      waitUntil: 'networkidle',
      timeout: 90000,
    });
  } catch (e) {
    navError = String(e).slice(0, 200);
    try {
      await page.goto(`${BASE}${route}`, {
        waitUntil: 'domcontentloaded',
        timeout: 60000,
      });
    } catch (e2) {
      navError = String(e2).slice(0, 200);
    }
  }
  await page.waitForTimeout(2500);

  const metrics = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0];
    const resources = performance.getEntriesByType('resource');
    const mem = performance.memory
      ? {
          usedJSHeapSize: performance.memory.usedJSHeapSize,
          totalJSHeapSize: performance.memory.totalJSHeapSize,
        }
      : null;
    return {
      paints: window.__AUDIT__?.paints || {},
      longTasks: window.__AUDIT__?.longTasks || [],
      longTaskTotalMs: (window.__AUDIT__?.longTasks || []).reduce(
        (a, t) => a + t.duration,
        0,
      ),
      longTaskCount: (window.__AUDIT__?.longTasks || []).length,
      navigation: nav
        ? {
            domContentLoaded: nav.domContentLoadedEventEnd,
            loadEventEnd: nav.loadEventEnd,
            responseEnd: nav.responseEnd,
            transferSize: nav.transferSize,
            encodedBodySize: nav.encodedBodySize,
            type: nav.type,
          }
        : null,
      resourceCount: resources.length,
      resourceTransferKB: Math.round(
        resources.reduce((a, r) => a + (r.transferSize || 0), 0) / 1024,
      ),
      memory: mem,
      title: document.title,
      bodyTextLen: document.body?.innerText?.length || 0,
    };
  });

  let perfMetrics = null;
  try {
    perfMetrics = await client.send('Performance.getMetrics');
  } catch {
    /* ignore */
  }

  const screenshot = path.join(
    TRACE_DIR,
    `${route.replace(/\W+/g, '_') || 'home'}.png`,
  );
  await page.screenshot({ path: screenshot, fullPage: false }).catch(() => {});

  await context.close();
  return {
    route,
    authed,
    wallMs: Date.now() - t0,
    navError,
    metrics,
    perfMetrics: perfMetrics?.metrics
      ? Object.fromEntries(perfMetrics.metrics.map((m) => [m.name, m.value]))
      : null,
    networkSample: network.slice(0, 40),
    screenshot,
  };
}

const browser = await chromium.launch({ headless: true });
const results = [];
for (const route of PUBLIC_ROUTES) {
  console.log('measuring', route);
  results.push(await measureRoute(browser, route, false));
}
const token = process.env.AUDIT_JWT || '';
if (token) {
  for (const route of AUTH_ROUTES) {
    console.log('measuring auth', route);
    results.push(await measureRoute(browser, route, true));
  }
} else {
  console.log('skipping auth routes — no AUDIT_JWT');
}
await browser.close();

const outPath = path.join(OUT_DIR, 'playwright-cwv.json');
fs.writeFileSync(
  outPath,
  JSON.stringify({ at: new Date().toISOString(), base: BASE, results }, null, 2),
);
console.log('wrote', outPath);
for (const r of results) {
  console.log(
    r.route,
    'wall',
    r.wallMs,
    'longTasks',
    r.metrics.longTaskCount,
    'longMs',
    Math.round(r.metrics.longTaskTotalMs || 0),
    'resKB',
    r.metrics.resourceTransferKB,
    'heapMB',
    r.metrics.memory
      ? Math.round(r.metrics.memory.usedJSHeapSize / 1e6)
      : 'n/a',
  );
}
