/**
 * Dedicated render-lane scheduler — separate from RequestScheduler (network/sync).
 */
export type RenderPriority =
  | 'critical'
  | 'high'
  | 'medium'
  | 'low'
  | 'idle';

const ORDER: Record<RenderPriority, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  idle: 4,
};

type Job = {
  id: string;
  priority: RenderPriority;
  run: () => void;
};

const queue: Job[] = [];
const coalesce = new Map<string, Job>();
let raf = 0;
let draining = false;

function isEnabled() {
  if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_RENDER_ENGINE === '0') {
    return false;
  }
  return true;
}

function pump() {
  if (draining) return;
  draining = true;
  const runFrame = () => {
    raf = 0;
    try {
      // Critical always first within the frame budget (~8ms soft).
      const budgetEnd = performance.now() + 8;
      queue.sort((a, b) => ORDER[a.priority] - ORDER[b.priority]);
      while (queue.length && performance.now() < budgetEnd) {
        const job = queue.shift();
        if (!job) break;
        coalesce.delete(job.id);
        try {
          job.run();
        } catch {
          /* never break the frame */
        }
        if (job.priority === 'critical') {
          // Drain all critical before yielding
          while (queue[0]?.priority === 'critical') {
            const c = queue.shift();
            if (!c) break;
            coalesce.delete(c.id);
            try {
              c.run();
            } catch {
              /* ignore */
            }
          }
        }
      }
      if (queue.length) {
        schedulePump();
      }
    } finally {
      draining = false;
    }
  };

  if (typeof requestAnimationFrame !== 'undefined') {
    raf = requestAnimationFrame(runFrame);
  } else {
    runFrame();
  }
}

function schedulePump() {
  if (raf || draining) return;
  if (typeof requestAnimationFrame !== 'undefined') {
    raf = requestAnimationFrame(() => {
      raf = 0;
      pump();
    });
  } else {
    queueMicrotask(pump);
  }
}

export const renderSchedulerApi = {
  schedule(id: string, priority: RenderPriority, run: () => void) {
    if (!isEnabled()) {
      run();
      return;
    }
    const existing = coalesce.get(id);
    if (existing) {
      existing.run = run;
      existing.priority =
        ORDER[priority] < ORDER[existing.priority] ? priority : existing.priority;
      return;
    }
    const job = { id, priority, run };
    coalesce.set(id, job);
    queue.push(job);
    schedulePump();
  },

  /** Schedule when browser is idle (decorative / offscreen resume). */
  scheduleIdle(id: string, run: () => void) {
    if (!isEnabled()) {
      run();
      return;
    }
    const ric = (
      globalThis as unknown as {
        requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      }
    ).requestIdleCallback;
    if (ric) {
      ric(() => this.schedule(id, 'idle', run), { timeout: 2000 });
    } else {
      this.schedule(id, 'idle', run);
    }
  },

  clear(id: string) {
    coalesce.delete(id);
    const idx = queue.findIndex((j) => j.id === id);
    if (idx >= 0) queue.splice(idx, 1);
  },
};

export type RenderSchedulerApi = typeof renderSchedulerApi;
