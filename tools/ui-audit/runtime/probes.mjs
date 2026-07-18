/**
 * Injected runtime probe — PerformanceObserver + layout/network/image samples.
 * No product code changes.
 */
export function runtimeInitScript() {
  return `(() => {
    if (window.__UI_AUDIT_RT__) return;
    const S = {
      paints: {},
      lcp: null,
      cls: 0,
      shifts: [],
      longTasks: [],
      inpCandidates: [],
      resources: [],
      marks: [],
      consoleMetrics: [],
      frames: [],
      started: performance.now(),
    };
    window.__UI_AUDIT_RT__ = S;

    const push = (arr, item, max) => {
      arr.push(item);
      if (arr.length > max) arr.shift();
    };

    try {
      new PerformanceObserver((list) => {
        for (const e of list.getEntries()) S.paints[e.name] = e.startTime;
      }).observe({ type: 'paint', buffered: true });
    } catch (_) {}

    try {
      new PerformanceObserver((list) => {
        for (const e of list.getEntries()) {
          S.lcp = { startTime: e.startTime, size: e.size, url: e.url || null };
        }
      }).observe({ type: 'largest-contentful-paint', buffered: true });
    } catch (_) {}

    try {
      new PerformanceObserver((list) => {
        for (const e of list.getEntries()) {
          if (e.hadRecentInput) continue;
          S.cls += e.value;
          push(S.shifts, { value: e.value, startTime: e.startTime }, 50);
        }
      }).observe({ type: 'layout-shift', buffered: true });
    } catch (_) {}

    try {
      new PerformanceObserver((list) => {
        for (const e of list.getEntries()) {
          push(S.longTasks, { duration: e.duration, startTime: e.startTime }, 200);
        }
      }).observe({ type: 'longtask', buffered: true });
    } catch (_) {}

    try {
      new PerformanceObserver((list) => {
        for (const e of list.getEntries()) {
          if (e.entryType === 'event' || e.name === 'event') {
            push(S.inpCandidates, { duration: e.duration, startTime: e.startTime, name: e.name }, 40);
          }
        }
      }).observe({ type: 'event', buffered: true, durationThreshold: 16 });
    } catch (_) {}

    try {
      new PerformanceObserver((list) => {
        for (const e of list.getEntries()) {
          if (e.initiatorType === 'xmlhttprequest' || e.initiatorType === 'fetch' || e.initiatorType === 'script' || e.initiatorType === 'img') {
            push(S.resources, {
              name: String(e.name).slice(0, 220),
              initiatorType: e.initiatorType,
              duration: e.duration,
              transferSize: e.transferSize || 0,
              encodedBodySize: e.encodedBodySize || 0,
              startTime: e.startTime,
            }, 300);
          }
        }
      }).observe({ type: 'resource', buffered: true });
    } catch (_) {}

    const origDebug = console.debug;
    console.debug = function (...args) {
      try {
        if (args[0] === '[platform.metrics]') {
          push(S.consoleMetrics, { name: args[1], detail: args[2], t: performance.now() }, 300);
        }
      } catch (_) {}
      return origDebug.apply(console, args);
    };

    let last = performance.now();
    let frames = 0;
    let acc = 0;
    const tick = (now) => {
      const dt = now - last;
      last = now;
      frames += 1;
      acc += dt;
      if (dt > 22) push(S.frames, { dt, t: now }, 120);
      if (acc >= 1000) {
        push(S.frames, { fps: frames, t: now }, 120);
        frames = 0;
        acc = 0;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  })()`;
}

export function collectRuntimeSnapshot() {
  return `(() => {
    const S = window.__UI_AUDIT_RT__ || {};
    const nav = performance.getEntriesByType('navigation')[0];
    const mem = performance.memory
      ? {
          usedJSHeapSize: performance.memory.usedJSHeapSize,
          totalJSHeapSize: performance.memory.totalJSHeapSize,
        }
      : null;

    const longTaskTotalMs = (S.longTasks || []).reduce((a, t) => a + t.duration, 0);
    const scripts = (S.resources || []).filter((r) => r.initiatorType === 'script');
    const imgs = (S.resources || []).filter((r) => r.initiatorType === 'img');
    const apiLike = (S.resources || []).filter(
      (r) => /\\/api\\/|localhost:4000|127\\.0\\.0\\.1:4000/.test(r.name),
    );

    const urlCounts = {};
    for (const r of apiLike) {
      const key = r.name.split('?')[0];
      urlCounts[key] = (urlCounts[key] || 0) + 1;
    }
    const duplicates = Object.entries(urlCounts)
      .filter(([, c]) => c > 1)
      .map(([url, count]) => ({ url: url.slice(0, 180), count }));

    const imageNodes = Array.from(document.images || []).slice(0, 40).map((img) => {
      const r = img.getBoundingClientRect();
      return {
        src: (img.currentSrc || img.src || '').slice(0, 160),
        naturalW: img.naturalWidth,
        naturalH: img.naturalHeight,
        displayW: Math.round(r.width),
        displayH: Math.round(r.height),
        loading: img.loading || null,
        oversize:
          img.naturalWidth > 0 && r.width > 0
            ? img.naturalWidth / Math.max(r.width, 1) >= 2
            : false,
        format: /\\.avif|image\\/avif/i.test(img.currentSrc || '')
          ? 'avif'
          : /\\.webp|image\\/webp/i.test(img.currentSrc || '')
            ? 'webp'
            : 'other',
      };
    });

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const doc = document.documentElement;
    const overflowX = Math.max(0, Math.ceil(doc.scrollWidth - vw));

    const cards = Array.from(document.querySelectorAll('.dashboard-card, [data-slot="card"]')).slice(0, 20);
    const clippedCards = cards.filter((el) => {
      const p = el.parentElement;
      if (!p) return false;
      return el.scrollWidth > p.clientWidth + 2;
    }).length;

    const tables = Array.from(document.querySelectorAll('table, .responsive-table-shell')).slice(0, 10);
    const overflowingTables = tables
      .map((el) => Math.max(0, el.scrollWidth - el.clientWidth))
      .filter((v) => v > 2);

    const buttons = Array.from(document.querySelectorAll('button, [role="button"]')).slice(0, 40);
    const truncatedButtons = buttons.filter((el) => el.scrollWidth > el.clientWidth + 1).length;

    const focusables = Array.from(
      document.querySelectorAll('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'),
    );
    const smallTargets = focusables.filter((el) => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none') return false;
      return r.width >= 4 && r.height >= 4 && (r.width < 44 || r.height < 44);
    }).length;

    const dialogs = Array.from(document.querySelectorAll('[role="dialog"], [aria-modal="true"]')).map((el) => {
      const r = el.getBoundingClientRect();
      const off =
        r.bottom < 0 || r.top > vh || r.right < 0 || r.left > vw || (r.width === 0 && r.height === 0);
      return { offScreen: off, w: Math.round(r.width), h: Math.round(r.height) };
    });

    // Overlap sample: first 12 interactive centers
    let overlaps = 0;
    for (const el of focusables.slice(0, 12)) {
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) continue;
      const x = r.left + r.width / 2;
      const y = r.top + r.height / 2;
      const topEl = document.elementFromPoint(x, y);
      if (topEl && topEl !== el && !el.contains(topEl) && !topEl.contains(el)) overlaps += 1;
    }

    const fpsSamples = (S.frames || []).filter((f) => f.fps != null).map((f) => f.fps);
    const avgFps = fpsSamples.length
      ? fpsSamples.reduce((a, b) => a + b, 0) / fpsSamples.length
      : null;
    const droppedFrames = (S.frames || []).filter((f) => f.dt > 22).length;

    const inpMax = (S.inpCandidates || []).reduce((m, e) => Math.max(m, e.duration || 0), 0);

    return {
      url: location.href,
      title: document.title,
      viewport: { w: vw, h: vh, dpr: window.devicePixelRatio || 1 },
      paints: S.paints || {},
      lcp: S.lcp,
      cls: S.cls || 0,
      inpProxyMs: inpMax || null,
      longTaskCount: (S.longTasks || []).length,
      longTaskTotalMs,
      tbtProxyMs: longTaskTotalMs,
      navigation: nav
        ? {
            domContentLoaded: nav.domContentLoadedEventEnd,
            loadEventEnd: nav.loadEventEnd,
            responseEnd: nav.responseEnd,
            transferSize: nav.transferSize,
          }
        : null,
      memory: mem,
      domNodes: document.getElementsByTagName('*').length,
      js: {
        scriptCount: scripts.length,
        scriptTransferKB: Math.round(scripts.reduce((a, r) => a + (r.transferSize || 0), 0) / 1024),
      },
      network: {
        apiCount: apiLike.length,
        duplicates: duplicates.slice(0, 20),
        sample: apiLike.slice(0, 30),
      },
      images: {
        resourceCount: imgs.length,
        nodes: imageNodes,
        oversizeCount: imageNodes.filter((i) => i.oversize).length,
        largestTransferKB: Math.round(
          Math.max(0, ...imgs.map((i) => i.transferSize || 0)) / 1024,
        ),
      },
      animation: {
        avgFps,
        droppedFrames,
        consoleMetrics: (S.consoleMetrics || []).slice(-40),
      },
      layoutRuntime: {
        overflowX,
        clippedCards,
        overflowingTables,
        truncatedButtons,
        overlaps,
        dialogs,
      },
      a11y: {
        focusableCount: focusables.length,
        smallTouchTargetCount: smallTargets,
      },
      settled: {
        main: !!document.querySelector('#main-content'),
        overview: !!document.querySelector('[data-tour="dashboard-overview"]'),
        ariaBusy: !!document.querySelector('[aria-busy="true"]'),
      },
      collectedAt: performance.now(),
    };
  })()`;
}

export function measureInteractionLatency(actionLabel) {
  return `async (label) => {
    const t0 = performance.now();
    let feedbackAt = null;
    const obs = new MutationObserver(() => {
      if (feedbackAt == null) feedbackAt = performance.now();
    });
    obs.observe(document.documentElement, { subtree: true, childList: true, attributes: true, characterData: true });
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const visualFeedbackMs = feedbackAt != null ? feedbackAt - t0 : null;
    obs.disconnect();
    const t1 = performance.now();
    return { label, clickToMutateMs: visualFeedbackMs, windowMs: t1 - t0 };
  }`;
}

export function sampleScrollJank(distance = 2400) {
  return `async (distance) => {
    const S = window.__UI_AUDIT_RT__;
    const startLong = (S?.longTasks || []).length;
    const startDrop = (S?.frames || []).filter((f) => f.dt > 22).length;
    const t0 = performance.now();
    const step = 120;
    let scrolled = 0;
    while (scrolled < distance) {
      window.scrollBy(0, step);
      scrolled += step;
      await new Promise((r) => requestAnimationFrame(r));
    }
    await new Promise((r) => setTimeout(r, 200));
    const fpsSamples = (S?.frames || []).filter((f) => f.fps != null && f.t >= t0).map((f) => f.fps);
    return {
      distance,
      durationMs: performance.now() - t0,
      avgFps: fpsSamples.length ? fpsSamples.reduce((a, b) => a + b, 0) / fpsSamples.length : null,
      longTasksDuring: (S?.longTasks || []).length - startLong,
      droppedFramesDuring: (S?.frames || []).filter((f) => f.dt > 22).length - startDrop,
      stickyFixed: Array.from(document.querySelectorAll('*')).filter((el) => {
        const p = getComputedStyle(el).position;
        return p === 'sticky' || p === 'fixed';
      }).length,
    };
  }`;
}

export function mt5SyntheticStorm(count = 1000) {
  return `async (count) => {
    const S = window.__UI_AUDIT_RT__;
    const t0 = performance.now();
    const heap0 = performance.memory ? performance.memory.usedJSHeapSize : null;
    const long0 = (S?.longTasks || []).length;
    const drop0 = (S?.frames || []).filter((f) => f.dt > 22).length;
    const paint0 = performance.getEntriesByType('paint').length;

    // Prefer live socket observation: count ws-like resource / custom flag
    let mode = 'synthetic';
    let applied = 0;

    const target =
      document.querySelector('[data-tour="dashboard-overview"]') ||
      document.querySelector('#main-content') ||
      document.body;

    // Try invoke any exposed debug hooks without importing app modules
    if (window.__PROFYPTRON_AUDIT_APPLY_EQUITY__) {
      mode = 'hook';
      for (let i = 0; i < count; i++) {
        window.__PROFYPTRON_AUDIT_APPLY_EQUITY__({ equity: 10000 + (i % 50), ts: Date.now() });
        applied += 1;
        if (i % 20 === 0) await new Promise((r) => requestAnimationFrame(r));
      }
    } else {
      // Synthetic DOM/text churn approximating live equity card updates
      let el = target.querySelector('[data-testid="equity"], .tabular-nums, h1, h2');
      if (!el) {
        el = document.createElement('div');
        el.setAttribute('data-ui-audit-storm', '1');
        el.style.cssText = 'position:fixed;left:0;top:0;opacity:0.01;pointer-events:none;';
        document.body.appendChild(el);
      }
      for (let i = 0; i < count; i++) {
        el.textContent = 'EQ ' + (10000 + (i % 97)).toFixed(2);
        el.style.transform = 'translateZ(0) translateY(' + (i % 3) + 'px)';
        applied += 1;
        if (i % 10 === 0) await new Promise((r) => requestAnimationFrame(r));
      }
    }

    await new Promise((r) => setTimeout(r, 300));
    const heap1 = performance.memory ? performance.memory.usedJSHeapSize : null;
    return {
      mode,
      updates: applied,
      durationMs: performance.now() - t0,
      longTasks: (S?.longTasks || []).length - long0,
      longTaskMs: (S?.longTasks || []).slice(long0).reduce((a, t) => a + t.duration, 0),
      droppedFrames: (S?.frames || []).filter((f) => f.dt > 22).length - drop0,
      heapDelta: heap0 != null && heap1 != null ? heap1 - heap0 : null,
      cls: S?.cls || 0,
      platformMarks: (S?.consoleMetrics || []).filter((m) =>
        String(m.name || '').includes('mt5') || String(m.name || '').includes('motion') || String(m.name || '').includes('commit'),
      ).slice(-50),
    };
  }`;
}
