type Mark = { name: string; t: number; detail?: unknown };

const marks: Mark[] = [];
const MAX = 200;

export const metricsApi = {
  mark(name: string, detail?: unknown) {
    marks.push({ name, t: performance.now(), detail });
    if (marks.length > MAX) marks.shift();
    if (
      typeof window !== 'undefined' &&
      process.env.NEXT_PUBLIC_PLATFORM_METRICS === '1'
    ) {
      // eslint-disable-next-line no-console
      console.debug('[platform.metrics]', name, detail);
    }
  },

  getMarks() {
    return [...marks];
  },

  clear() {
    marks.length = 0;
  },

  /** Observe long tasks when available (dev/metrics mode). */
  observeLongTasks() {
    if (typeof PerformanceObserver === 'undefined') return () => {};
    try {
      const obs = new PerformanceObserver((list) => {
        for (const e of list.getEntries()) {
          this.mark('longtask', { duration: e.duration, start: e.startTime });
        }
      });
      obs.observe({ type: 'longtask', buffered: true } as PerformanceObserverInit);
      return () => obs.disconnect();
    } catch {
      return () => {};
    }
  },

  summary() {
    const byName: Record<string, number> = {};
    for (const m of marks) {
      byName[m.name] = (byName[m.name] || 0) + 1;
    }
    return { count: marks.length, byName, recent: marks.slice(-20) };
  },

  /** Sample FPS via rAF deltas (dev / metrics mode). */
  startFpsSampler(seconds = 5) {
    if (typeof window === 'undefined') return () => {};
    let frames = 0;
    let last = performance.now();
    let raf = 0;
    const samples: number[] = [];
    const loop = (now: number) => {
      frames += 1;
      const dt = now - last;
      if (dt >= 1000) {
        samples.push(frames);
        this.mark('fps.sample', { fps: frames });
        frames = 0;
        last = now;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    const stop = window.setTimeout(() => {
      cancelAnimationFrame(raf);
      const avg =
        samples.length > 0
          ? samples.reduce((a, b) => a + b, 0) / samples.length
          : 0;
      this.mark('fps.summary', { avg, samples });
    }, seconds * 1000);
    return () => {
      clearTimeout(stop);
      cancelAnimationFrame(raf);
    };
  },
};

export type MetricsApi = typeof metricsApi;
