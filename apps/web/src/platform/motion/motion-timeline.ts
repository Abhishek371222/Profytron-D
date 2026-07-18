/**
 * Motion Timeline — Created → Queued → Running → Interrupted → Completed → Disposed.
 */

import { metricsApi } from '../metrics';

export type MotionTimelineState =
  | 'created'
  | 'queued'
  | 'running'
  | 'interrupted'
  | 'completed'
  | 'disposed';

export type MotionTimelineEntry = {
  id: string;
  state: MotionTimelineState;
  lane?: string;
  intent?: string;
  createdAt: number;
  updatedAt: number;
  durationMs?: number;
};

const entries = new Map<string, MotionTimelineEntry>();
const MAX = 200;

const ALLOWED: Record<MotionTimelineState, MotionTimelineState[]> = {
  created: ['queued', 'running', 'disposed'],
  queued: ['running', 'interrupted', 'disposed'],
  running: ['interrupted', 'completed', 'disposed'],
  interrupted: ['running', 'completed', 'disposed'],
  completed: ['disposed'],
  disposed: [],
};

function isMetricsOn() {
  return (
    typeof process !== 'undefined' &&
    process.env.NEXT_PUBLIC_PLATFORM_METRICS === '1'
  );
}

export function timelineCreate(
  id: string,
  meta?: { lane?: string; intent?: string },
): MotionTimelineEntry {
  const now = performance.now();
  const entry: MotionTimelineEntry = {
    id,
    state: 'created',
    lane: meta?.lane,
    intent: meta?.intent,
    createdAt: now,
    updatedAt: now,
  };
  entries.set(id, entry);
  if (entries.size > MAX) {
    const first = entries.keys().next().value;
    if (first) entries.delete(first);
  }
  if (isMetricsOn()) {
    metricsApi.mark('motion.timeline', { id, state: 'created' });
  }
  return entry;
}

export function timelineTransition(
  id: string,
  next: MotionTimelineState,
): MotionTimelineEntry | undefined {
  const entry = entries.get(id);
  if (!entry) return undefined;
  const allowed = ALLOWED[entry.state];
  if (!allowed.includes(next)) return entry;
  entry.state = next;
  entry.updatedAt = performance.now();
  if (next === 'completed' || next === 'interrupted') {
    entry.durationMs = entry.updatedAt - entry.createdAt;
  }
  if (isMetricsOn()) {
    metricsApi.mark('motion.timeline', {
      id,
      state: next,
      durationMs: entry.durationMs,
    });
  }
  return entry;
}

export function timelineGet(id: string) {
  return entries.get(id);
}

export function timelineList() {
  return [...entries.values()];
}

export function timelineCounts() {
  const counts = {
    created: 0,
    queued: 0,
    running: 0,
    interrupted: 0,
    completed: 0,
    disposed: 0,
  };
  for (const e of entries.values()) counts[e.state] += 1;
  return counts;
}

export function timelineStats() {
  const done = [...entries.values()].filter(
    (e) => e.durationMs != null && (e.state === 'completed' || e.state === 'interrupted'),
  );
  const durations = done.map((e) => e.durationMs!);
  const avg =
    durations.length > 0
      ? durations.reduce((a, b) => a + b, 0) / durations.length
      : 0;
  const slowest = durations.length > 0 ? Math.max(...durations) : 0;
  return { avgDurationMs: avg, slowestMs: slowest, sampleSize: durations.length };
}

export function timelineClear() {
  entries.clear();
}

export const motionTimelineApi = {
  create: timelineCreate,
  transition: timelineTransition,
  get: timelineGet,
  list: timelineList,
  counts: timelineCounts,
  stats: timelineStats,
  clear: timelineClear,
};
