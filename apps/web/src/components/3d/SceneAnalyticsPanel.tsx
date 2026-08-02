/**
 * Dev-only scene analytics summary when NEXT_PUBLIC_PLATFORM_METRICS=1.
 */

'use client';

import React, { useEffect, useState } from 'react';
import { sceneAnalyticsApi } from '@/platform/experience/scene-analytics';
import { fpsMonitorApi } from '@/platform/experience/fps-monitor';
import { gpuMemoryBudgetApi } from '@/platform/experience/gpu-memory-budget';

export function SceneAnalyticsPanel() {
  const [snap, setSnap] = useState(() => sceneAnalyticsApi.summary());
  const [fps, setFps] = useState(60);
  const [degrade, setDegrade] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setSnap(sceneAnalyticsApi.summary());
      setFps(fpsMonitorApi.getFps());
      setDegrade(fpsMonitorApi.getLevel());
    }, 1000);
    return () => clearInterval(id);
  }, []);

  if (process.env.NEXT_PUBLIC_PLATFORM_METRICS !== '1') return null;

  return (
    <div className="fixed bottom-3 right-3 z-[90] max-w-xs rounded-lg border border-border bg-card/95 p-3 text-[10px] font-mono shadow-lg backdrop-blur">
      <div className="mb-1 font-semibold text-foreground">Scene analytics</div>
      <div className="text-muted-foreground">
        FPS {fps} · degrade {degrade} · budget {gpuMemoryBudgetApi.budgetMb()}MB ·
        fallback {(snap.fallbackRate * 100).toFixed(0)}%
      </div>
      <pre className="mt-1 max-h-28 overflow-auto text-[9px] text-muted-foreground">
        {JSON.stringify(snap.counters, null, 0)}
      </pre>
    </div>
  );
}
