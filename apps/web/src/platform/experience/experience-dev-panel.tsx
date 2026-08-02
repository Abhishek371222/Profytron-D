'use client';

import React from 'react';
import { experienceSnapshot } from './observability';
import { getGpuQuality, gpuDpr } from './gpu-quality';
import { lodFromQuality } from './lod-manager';
import { assetQueueSize } from './asset-streaming';
import { textureCount, textureMemoryBytes } from './texture-manager';
import { listShaders } from './shader-manager';
import { sceneAnalyticsApi } from './scene-analytics';
import { fpsMonitorApi } from './fps-monitor';
import { gpuMemoryBudgetApi } from './gpu-memory-budget';

/** Dev Experience Panel — gated by NEXT_PUBLIC_PLATFORM_METRICS. */
export function ExperienceDevPanel() {
  const [snap, setSnap] = React.useState(() => experienceSnapshot());
  const [scene, setScene] = React.useState(() => sceneAnalyticsApi.summary());
  const enabled =
    typeof process !== 'undefined' &&
    process.env.NEXT_PUBLIC_PLATFORM_METRICS === '1';

  React.useEffect(() => {
    if (!enabled) return;
    const id = window.setInterval(() => {
      setSnap(experienceSnapshot());
      setScene(sceneAnalyticsApi.summary());
    }, 500);
    return () => clearInterval(id);
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div
      data-slot="experience-dev-panel"
      className="pointer-events-none fixed bottom-3 right-3 z-[9999] max-w-xs rounded-lg border border-border bg-card/95 p-2 font-mono text-[10px] text-muted-foreground shadow-lg backdrop-blur"
    >
      <div className="mb-1 font-semibold text-foreground">Experience</div>
      <div>quality: {getGpuQuality()}</div>
      <div>DPR: {gpuDpr().toFixed(2)}</div>
      <div>LOD: {lodFromQuality()}</div>
      <div>hero: {snap.hero.state} / {snap.hero.layer}</div>
      <div>coach: {snap.coachEmotion}</div>
      <div>shaders: {listShaders().join(',') || '—'}</div>
      <div>textures: {textureCount()} ({(textureMemoryBytes() / 1024).toFixed(1)} KB)</div>
      <div>asset queue: {assetQueueSize()}</div>
      <div className="mt-1 border-t border-border pt-1 font-semibold text-foreground">Scenes</div>
      <div>FPS: {fpsMonitorApi.getFps()} · degrade: {fpsMonitorApi.getLevel()}</div>
      <div>GPU budget: {gpuMemoryBudgetApi.budgetMb()}MB ({gpuMemoryBudgetApi.tier()})</div>
      <div>fallback rate: {(scene.fallbackRate * 100).toFixed(0)}%</div>
      <div>events: {JSON.stringify(scene.counters)}</div>
    </div>
  );
}
