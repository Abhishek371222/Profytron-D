/**
 * Priority lanes: Critical > High > Medium > Low > Idle
 */
export type SchedulePriority =
  | 'critical'
  | 'high'
  | 'medium'
  | 'low'
  | 'idle';

const PRIORITY_ORDER: Record<SchedulePriority, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  idle: 4,
};

type Job = {
  id: string;
  priority: SchedulePriority;
  run: () => void | Promise<void>;
};

const queue: Job[] = [];
let draining = false;
const inflight = new Map<string, Promise<unknown>>();
const debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();

async function drain() {
  if (draining) return;
  draining = true;
  try {
    while (queue.length) {
      queue.sort(
        (a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority],
      );
      const job = queue.shift();
      if (!job) break;
      try {
        await job.run();
      } catch {
        /* scheduler must not crash the app */
      }
    }
  } finally {
    draining = false;
  }
}

export const schedulerApi = {
  /** Coalesce identical in-flight async work by key. */
  async coalesce<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const existing = inflight.get(key);
    if (existing) return existing as Promise<T>;
    const p = fn().finally(() => {
      inflight.delete(key);
    });
    inflight.set(key, p);
    return p;
  },

  schedule(id: string, priority: SchedulePriority, run: () => void | Promise<void>) {
    queue.push({ id, priority, run });
    void drain();
  },

  /** Debounced channel invalidation (replaces ad-hoc 400ms timers). */
  debounceChannel(
    channel: string,
    ms: number,
    run: () => void,
    priority: SchedulePriority = 'high',
  ) {
    const prev = debounceTimers.get(channel);
    if (prev) clearTimeout(prev);
    const t = setTimeout(() => {
      debounceTimers.delete(channel);
      this.schedule(`channel:${channel}`, priority, run);
    }, ms);
    debounceTimers.set(channel, t);
  },

  clearChannel(channel: string) {
    const prev = debounceTimers.get(channel);
    if (prev) clearTimeout(prev);
    debounceTimers.delete(channel);
  },
};

export type SchedulerApi = typeof schedulerApi;
