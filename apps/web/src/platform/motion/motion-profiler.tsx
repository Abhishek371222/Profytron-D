'use client';

/**
 * Dev Motion Profiler overlay — gated by NEXT_PUBLIC_PLATFORM_METRICS.
 */

import React from 'react';
import { motionSnapshot } from './motion-observability';
import { getMotionQuality } from './motion-quality';

export function MotionProfilerOverlay() {
  const [snap, setSnap] = React.useState(() => motionSnapshot());
  const enabled =
    typeof process !== 'undefined' &&
    process.env.NEXT_PUBLIC_PLATFORM_METRICS === '1';

  React.useEffect(() => {
    if (!enabled) return;
    const id = window.setInterval(() => setSnap(motionSnapshot()), 500);
    return () => clearInterval(id);
  }, [enabled]);

  if (!enabled) return null;

  const { timeline, stats, fpsEma, droppedFrames, animationCount, queueSize } =
    snap;

  return (
    <div
      data-slot="motion-profiler"
      className="pointer-events-none fixed bottom-3 left-3 z-[9999] max-w-xs rounded-lg border border-border bg-card/95 p-2 font-mono text-[10px] text-muted-foreground shadow-lg backdrop-blur"
    >
      <div className="mb-1 font-semibold text-foreground">Motion Profiler</div>
      <div>quality: {getMotionQuality()}</div>
      <div>running: {timeline.running}</div>
      <div>queued: {timeline.queued + queueSize}</div>
      <div>interrupted: {timeline.interrupted}</div>
      <div>animations: {animationCount}</div>
      <div>avg ms: {stats.avgDurationMs.toFixed(1)}</div>
      <div>slowest ms: {stats.slowestMs.toFixed(1)}</div>
      <div>fps≈ {fpsEma.toFixed(0)}</div>
      <div>dropped frames: {droppedFrames}</div>
    </div>
  );
}
