/**
 * Animation queue — Critical → Interaction → Feedback → Decorative → Idle.
 * Prevents animation storms during high-frequency MT5 updates.
 */

import { getMotionQuality } from './motion-quality';
import { timelineCreate, timelineTransition } from './motion-timeline';

export type MotionQueueLane =
  | 'critical'
  | 'interaction'
  | 'feedback'
  | 'decorative'
  | 'idle';

const LANE_ORDER: MotionQueueLane[] = [
  'critical',
  'interaction',
  'feedback',
  'decorative',
  'idle',
];

type QueuedJob = {
  id: string;
  lane: MotionQueueLane;
  run: () => void;
  coalesceKey?: string;
};

const queues = new Map<MotionQueueLane, QueuedJob[]>(
  LANE_ORDER.map((l) => [l, []]),
);

let pumping = false;
let droppedDecorative = 0;

function maxConcurrent(): number {
  const q = getMotionQuality();
  if (q === 'minimal') return 1;
  if (q === 'medium') return 3;
  if (q === 'high') return 6;
  return 10;
}

function shouldDropDecorative(): boolean {
  const q = getMotionQuality();
  return q === 'minimal' || q === 'medium';
}

function pump() {
  if (pumping) return;
  pumping = true;
  const budget = maxConcurrent();
  let ran = 0;
  outer: for (const lane of LANE_ORDER) {
    const list = queues.get(lane)!;
    while (list.length > 0 && ran < budget) {
      if (lane === 'decorative' && shouldDropDecorative() && list.length > 2) {
        const drop = list.shift()!;
        droppedDecorative += 1;
        timelineTransition(drop.id, 'disposed');
        continue;
      }
      const job = list.shift()!;
      timelineTransition(job.id, 'running');
      try {
        job.run();
      } catch {
        timelineTransition(job.id, 'interrupted');
      }
      ran += 1;
    }
    if (ran >= budget) break outer;
  }
  pumping = false;
  const remaining = LANE_ORDER.some((l) => (queues.get(l)?.length ?? 0) > 0);
  if (remaining) {
    if (typeof requestAnimationFrame !== 'undefined') {
      requestAnimationFrame(() => pump());
    } else {
      setTimeout(pump, 16);
    }
  }
}

export function enqueueMotion(
  id: string,
  lane: MotionQueueLane,
  run: () => void,
  opts?: { coalesceKey?: string },
) {
  timelineCreate(id, { lane });
  timelineTransition(id, 'queued');

  const list = queues.get(lane)!;
  if (opts?.coalesceKey) {
    const idx = list.findIndex((j) => j.coalesceKey === opts.coalesceKey);
    if (idx >= 0) {
      timelineTransition(list[idx].id, 'disposed');
      list.splice(idx, 1);
    }
  }
  list.push({ id, lane, run, coalesceKey: opts?.coalesceKey });
  pump();
}

export function queueSize(): number {
  let n = 0;
  for (const l of LANE_ORDER) n += queues.get(l)!.length;
  return n;
}

export function queueSizesByLane(): Record<MotionQueueLane, number> {
  const out = {} as Record<MotionQueueLane, number>;
  for (const l of LANE_ORDER) out[l] = queues.get(l)!.length;
  return out;
}

export function clearMotionQueue(lane?: MotionQueueLane) {
  if (lane) {
    queues.get(lane)!.length = 0;
    return;
  }
  for (const l of LANE_ORDER) queues.get(l)!.length = 0;
}

export const motionQueueApi = {
  enqueue: enqueueMotion,
  size: queueSize,
  sizesByLane: queueSizesByLane,
  clear: clearMotionQueue,
  droppedDecorative: () => droppedDecorative,
  lanes: LANE_ORDER,
};
