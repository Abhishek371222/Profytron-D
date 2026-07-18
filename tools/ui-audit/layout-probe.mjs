/**
 * Injected layout probe — measures overflow, containers, typography, a11y samples.
 * Runs in page context via page.evaluate.
 */
export function layoutProbeSource() {
  return `(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const doc = document.documentElement;
    const body = document.body;

    const overflowX = Math.max(0, Math.ceil(doc.scrollWidth - vw));
    const overflowY = Math.max(0, Math.ceil(doc.scrollHeight - vh));

    function sample(sel) {
      const el = document.querySelector(sel);
      if (!el) return null;
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return {
        selector: sel,
        width: Math.round(r.width),
        height: Math.round(r.height),
        fontSize: cs.fontSize,
        lineHeight: cs.lineHeight,
        fontWeight: cs.fontWeight,
        color: cs.color,
        display: cs.display,
        position: cs.position,
      };
    }

    const typography = {
      h1: sample('h1'),
      h2: sample('h2'),
      h3: sample('h3'),
      h4: sample('h4'),
      body: sample('body'),
      small: sample('small') || sample('.text-sm') || sample('[class*="text-xs"]'),
      p: sample('p'),
    };

    const containers = [];
    for (const sel of ['.page-container', '.container', 'main', '[data-slot="sidebar"]', 'aside', 'nav']) {
      const els = document.querySelectorAll(sel);
      els.forEach((el, i) => {
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        containers.push({
          selector: sel + (els.length > 1 ? '[' + i + ']' : ''),
          width: Math.round(r.width),
          height: Math.round(r.height),
          maxWidth: cs.maxWidth,
          paddingLeft: cs.paddingLeft,
          paddingRight: cs.paddingRight,
          position: cs.position,
        });
      });
    }

    const cards = Array.from(document.querySelectorAll('.dashboard-card, [class*="card"], [data-slot="card"]'))
      .slice(0, 12)
      .map((el, i) => {
        const r = el.getBoundingClientRect();
        return { i, width: Math.round(r.width), height: Math.round(r.height), minWidth: getComputedStyle(el).minWidth };
      });

    const tables = Array.from(document.querySelectorAll('table, .responsive-table-shell'))
      .slice(0, 6)
      .map((el, i) => {
        const r = el.getBoundingClientRect();
        return {
          i,
          width: Math.round(r.width),
          overflowX: Math.ceil(el.scrollWidth - el.clientWidth),
          tag: el.tagName.toLowerCase(),
        };
      });

    const charts = Array.from(document.querySelectorAll('canvas, .tv-lightweight-charts, [class*="chart"]'))
      .slice(0, 6)
      .map((el, i) => {
        const r = el.getBoundingClientRect();
        return { i, width: Math.round(r.width), height: Math.round(r.height), tag: el.tagName.toLowerCase() };
      });

    const focusables = Array.from(
      document.querySelectorAll('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'),
    );
    const smallTargets = focusables
      .map((el) => {
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        if (cs.visibility === 'hidden' || cs.display === 'none' || el.getAttribute('aria-hidden') === 'true') {
          return null;
        }
        return { w: Math.round(r.width), h: Math.round(r.height), tag: el.tagName.toLowerCase() };
      })
      .filter((t) => t && t.w >= 4 && t.h >= 4 && (t.w < 44 || t.h < 44));

    const missingLabels = focusables
      .filter((el) => {
        const tag = el.tagName.toLowerCase();
        if (!['button', 'a', 'input'].includes(tag)) return false;
        const has =
          el.getAttribute('aria-label') ||
          el.getAttribute('aria-labelledby') ||
          (el.textContent || '').trim() ||
          el.getAttribute('title') ||
          el.getAttribute('alt');
        return !has;
      })
      .slice(0, 20)
      .map((el) => el.tagName.toLowerCase() + (el.className ? '.' + String(el.className).split(' ')[0] : ''));

    const sticky = Array.from(document.querySelectorAll('*'))
      .filter((el) => {
        const p = getComputedStyle(el).position;
        return p === 'fixed' || p === 'sticky';
      })
      .slice(0, 15)
      .map((el) => {
        const r = el.getBoundingClientRect();
        return {
          tag: el.tagName.toLowerCase(),
          position: getComputedStyle(el).position,
          top: Math.round(r.top),
          height: Math.round(r.height),
          width: Math.round(r.width),
        };
      });

    const cssVars = {};
    try {
      const root = getComputedStyle(doc);
      for (const name of [
        '--content-max',
        '--dashboard-p',
        '--sidebar-w',
        '--sidebar-w-collapsed',
        '--touch-min',
        '--safe-top',
        '--safe-bottom',
      ]) {
        cssVars[name] = root.getPropertyValue(name).trim() || null;
      }
    } catch (_) {}

    const issues = [];
    if (overflowX > 1) issues.push({ type: 'overflow-x', severity: overflowX > 20 ? 'high' : 'medium', value: overflowX });
    if (overflowY > vh * 20) issues.push({ type: 'extreme-scroll-height', severity: 'low', value: overflowY });
    if (smallTargets.length > 0) {
      issues.push({ type: 'small-touch-targets', severity: 'medium', count: smallTargets.length, samples: smallTargets.slice(0, 5) });
    }
    for (const t of Object.values(tables)) {
      if (t.overflowX > 2) issues.push({ type: 'table-overflow-x', severity: 'medium', value: t.overflowX });
    }
    for (const c of cards) {
      if (c.width > 0 && c.width < 140 && vw >= 768) {
        issues.push({ type: 'narrow-card', severity: 'low', width: c.width });
      }
    }

    return {
      viewport: { w: vw, h: vh, dpr: window.devicePixelRatio || 1 },
      scroll: {
        scrollWidth: doc.scrollWidth,
        scrollHeight: doc.scrollHeight,
        clientWidth: doc.clientWidth,
        clientHeight: doc.clientHeight,
        overflowX,
        overflowY,
      },
      body: { width: body ? Math.round(body.getBoundingClientRect().width) : null },
      typography,
      containers,
      cards,
      tables,
      charts,
      sticky,
      cssVars,
      a11y: {
        focusableCount: focusables.length,
        smallTouchTargetCount: smallTargets.length,
        smallTouchTargets: smallTargets.slice(0, 8),
        missingLabelSamples: missingLabels,
      },
      issues,
      title: document.title,
      url: location.href,
    };
  })()`;
}
