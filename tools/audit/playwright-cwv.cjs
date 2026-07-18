const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = process.env.WEB_BASE || 'http://localhost:3000';
const OUT_DIR = path.resolve('docs/audit/data/lighthouse');
const TRACE_DIR = path.resolve('docs/audit/data/traces');
fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(TRACE_DIR, { recursive: true });

const PUBLIC_ROUTES = ['/', '/login', '/marketplace', '/pricing'];
const AUTH_ROUTES = ['/dashboard', '/analytics', '/markets', '/settings/profile', '/alpha-coach', '/strategies/builder', '/connected-accounts'];

async function measureRoute(browser, route, authed) {
  const context = await browser.newContext();
  const page = await context.newPage();
  const network = [];
  page.on('response', async (res) => {
    try {
      const req = res.request();
      const url = req.url();
      if (!(url.includes('localhost') || url.includes('/api/'))) return;
      const timing = req.timing();
      network.push({ url: url.slice(0, 180), status: res.status(), resourceType: req.resourceType(), durationMs: timing ? Math.round(timing.responseEnd) : null });
    } catch {}
  });
  const client = await context.newCDPSession(page);
  await client.send('Performance.enable');

  await page.addInitScript(() => {
    window.__AUDIT__ = { longTasks: [], paints: {} };
    try {
      new PerformanceObserver((list) => {
        for (const e of list.getEntries()) window.__AUDIT__.longTasks.push({ duration: e.duration, startTime: e.startTime });
      }).observe({ type: 'longtask', buffered: true });
    } catch {}
    try {
      new PerformanceObserver((list) => {
        for (const e of list.getEntries()) window.__AUDIT__.paints[e.name] = e.startTime;
      }).observe({ type: 'paint', buffered: true });
    } catch {}
  });

  if (authed) {
    const token = process.env.AUDIT_JWT || '';
    const userJson = process.env.AUDIT_USER_JSON || '{}';
    await page.addInitScript(({ t, u }) => {
      try {
        sessionStorage.setItem('profytron_access', t);
        localStorage.setItem('profytron-auth', JSON.stringify({ state: { accessToken: t, user: u, isAuthenticated: true, sessionReady: true, isHydrating: false, isLoading: false }, version: 0 }));
        document.cookie = 'onboarding_completed=1; path=/; max-age=7776000; samesite=lax';
      } catch {}
    }, { t: token, u: JSON.parse(userJson) });
  }

  const t0 = Date.now();
  let navError = null;
  try {
    await page.goto(BASE + route, { waitUntil: 'networkidle', timeout: 90000 });
  } catch (e) {
    navError = String(e).slice(0, 200);
    try { await page.goto(BASE + route, { waitUntil: 'domcontentloaded', timeout: 60000 }); } catch (e2) { navError = String(e2).slice(0, 200); }
  }
  await page.waitForTimeout(3000);

  // Capture CDP performance trace sample for main thread
  let traceEvents = null;
  try {
    await client.send('Tracing.start', {
      categories: 'devtools.timeline,v8.execute,blink.user_timing,disabled-by-default-devtools.timeline,disabled-by-default-devtools.timeline.frame,latencyInfo',
      options: 'sampling-frequency=1000'
    });
    await page.waitForTimeout(2000);
    // scroll to force layout work
    await page.evaluate(() => window.scrollBy(0, 800));
    await page.waitForTimeout(500);
    const events = [];
    client.on('Tracing.dataCollected', (params) => { events.push(...(params.value || [])); });
    await new Promise((resolve) => {
      client.once('Tracing.tracingComplete', resolve);
      client.send('Tracing.end');
    });
    // summarize
    const byName = {};
    for (const e of events) {
      const n = e.name || 'unknown';
      byName[n] = (byName[n] || 0) + 1;
    }
    const top = Object.entries(byName).sort((a,b)=>b[1]-a[1]).slice(0, 40);
    traceEvents = { eventCount: events.length, topNames: top };
    fs.writeFileSync(path.join(TRACE_DIR, route.replace(/\W+/g,'_') || 'home' + '-trace-summary.json'), JSON.stringify(traceEvents, null, 2));
  } catch (e) {
    traceEvents = { error: String(e).slice(0, 200) };
  }

  const metrics = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0];
    const resources = performance.getEntriesByType('resource');
    const mem = performance.memory ? { usedJSHeapSize: performance.memory.usedJSHeapSize, totalJSHeapSize: performance.memory.totalJSHeapSize } : null;
    const cls = performance.getEntriesByType('layout-shift').reduce((a,e)=>a+(e.hadRecentInput?0:e.value),0);
    return {
      paints: window.__AUDIT__?.paints || {},
      longTasks: (window.__AUDIT__?.longTasks || []).slice(0, 50),
      longTaskTotalMs: (window.__AUDIT__?.longTasks || []).reduce((a,t)=>a+t.duration,0),
      longTaskCount: (window.__AUDIT__?.longTasks || []).length,
      cls,
      navigation: nav ? { domContentLoaded: nav.domContentLoadedEventEnd, loadEventEnd: nav.loadEventEnd, responseEnd: nav.responseEnd, transferSize: nav.transferSize, type: nav.type, ttfb: nav.responseStart } : null,
      resourceCount: resources.length,
      resourceTransferKB: Math.round(resources.reduce((a,r)=>a+(r.transferSize||0),0)/1024),
      memory: mem,
      title: document.title,
      bodyTextLen: document.body?.innerText?.length || 0,
      hydrationMarkers: performance.getEntriesByType('measure').filter(m=>/hydrat|react/i.test(m.name)).slice(0,20),
    };
  });

  let perfMetrics = null;
  try { const m = await client.send('Performance.getMetrics'); perfMetrics = Object.fromEntries(m.metrics.map(x=>[x.name,x.value])); } catch {}

  const screenshot = path.join(TRACE_DIR, (route.replace(/\W+/g,'_') || 'home') + '.png');
  await page.screenshot({ path: screenshot, fullPage: false }).catch(()=>{});
  await context.close();
  return { route, authed, wallMs: Date.now()-t0, navError, metrics, perfMetrics, networkSample: network.slice(0,50), screenshot, traceEvents };
}

(async () => {
  // fetch user for auth seed
  const token = process.env.AUDIT_JWT || '';
  if (token) {
    try {
      const res = await fetch('http://localhost:4000/v1/users/me', { headers: { Authorization: 'Bearer ' + token } });
      const json = await res.json();
      process.env.AUDIT_USER_JSON = JSON.stringify(json.data || json);
    } catch {}
  }
  const browser = await chromium.launch({ headless: true });
  const results = [];
  for (const route of PUBLIC_ROUTES) {
    console.log('measuring', route);
    results.push(await measureRoute(browser, route, false));
  }
  if (token) {
    for (const route of AUTH_ROUTES) {
      console.log('measuring auth', route);
      results.push(await measureRoute(browser, route, true));
    }
  }
  await browser.close();
  const outPath = path.join(OUT_DIR, 'playwright-cwv.json');
  fs.writeFileSync(outPath, JSON.stringify({ at: new Date().toISOString(), base: BASE, results }, null, 2));
  console.log('wrote', outPath);
  for (const r of results) {
    console.log(r.route, 'wall', r.wallMs, 'fcp', Math.round(r.metrics.paints['first-contentful-paint']||0), 'longTasks', r.metrics.longTaskCount, 'longMs', Math.round(r.metrics.longTaskTotalMs||0), 'resKB', r.metrics.resourceTransferKB, 'heapMB', r.metrics.memory ? Math.round(r.metrics.memory.usedJSHeapSize/1e6) : 'n/a', 'cls', +(r.metrics.cls||0).toFixed(3));
  }
})();
