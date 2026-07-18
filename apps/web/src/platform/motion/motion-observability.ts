/**
 * Motion observability — duration, dropped frames, interrupted, queue, memory.
 * Dev-only via NEXT_PUBLIC_PLATFORM_METRICS.
 */

import { metricsApi } from '../metrics';
import { queueSize, motionQueueApi } from './motion-queue';
import { motionCount } from './motion-registry';
import { timelineCounts, timelineStats } from './motion-timeline';
import { adaptMotionQuality, getMotionQuality } from './motion-quality';

function metricsOn() {
  return process.env.NEXT_PUBLIC_PLATFORM_METRICS === '1';
}

let droppedFrames = 0;
let lastFrameTs = 0;
let fpsEma = 60;

export function observeMotionFrame(now: number) {
  if (lastFrameTs > 0) {
    const dt = now - lastFrameTs;
    if (dt > 0) {
      const fps = 1000 / dt;
      fpsEma = fpsEma * 0.9 + fps * 0.1;
      if (dt > 22) droppedFrames += 1;
      if (metricsOn() && droppedFrames % 30 === 0 && dt > 22) {
        metricsApi.mark('motion.dropped_frame', { dt, fpsEma });
      }
      // Feed quality manager periodically
      if (Math.floor(now / 2000) !== Math.floor(lastFrameTs / 2000)) {
        adaptMotionQuality({ fps: fpsEma });
      }
    }
  }
  lastFrameTs = now;
}

export function markMotionDuration(
  id: string,
  durationMs: number,
  budgetMs?: number,
) {
  if (!metricsOn()) return;
  metricsApi.mark('motion.duration', { id, durationMs, budgetMs });
  if (budgetMs != null && durationMs > budgetMs) {
    metricsApi.mark('motion.budget.exceeded', { id, durationMs, budgetMs });
  }
}

export function markMotionInterrupted(id: string, reason?: string) {
  if (!metricsOn()) return;
  metricsApi.mark('motion.interrupted', { id, reason });
}

export function motionSnapshot() {
  return {
    quality: getMotionQuality(),
    animationCount: motionCount(),
    queueSize: queueSize(),
    queueByLane: motionQueueApi.sizesByLane(),
    droppedDecorative: motionQueueApi.droppedDecorative(),
    timeline: timelineCounts(),
    stats: timelineStats(),
    fpsEma,
    droppedFrames,
  };
}

export function reportMotionMemory() {
  if (!metricsOn() || typeof performance === 'undefined') return;
  const mem = (
    performance as Performance & {
      memory?: { usedJSHeapSize: number; totalJSHeapSize: number };
    }
  ).memory;
  if (!mem) return;
  metricsApi.mark('motion.memory', {
    used: mem.usedJSHeapSize,
    total: mem.totalJSHeapSize,
    animations: motionCount(),
  });
}

export const motionObservabilityApi = {
  observeFrame: observeMotionFrame,
  markDuration: markMotionDuration,
  markInterrupted: markMotionInterrupted,
  snapshot: motionSnapshot,
  reportMemory: reportMotionMemory,
  getFpsEma: () => fpsEma,
  getDroppedFrames: () => droppedFrames,
};
