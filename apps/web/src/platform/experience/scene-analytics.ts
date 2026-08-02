/**
 * Scene analytics — load / fail / FPS / GPU / memory / fallback.
 */

import { metricsApi } from '../metrics';

function on() {
  return (
    typeof window !== 'undefined' &&
    process.env.NEXT_PUBLIC_PLATFORM_METRICS === '1'
  );
}

export type SceneAnalyticsEvent =
  | 'scene.loaded'
  | 'scene.failed'
  | 'scene.fps'
  | 'scene.gpu'
  | 'scene.memory'
  | 'scene.interaction'
  | 'scene.loadTime'
  | 'scene.fallback'
  | 'scene.evicted'
  | 'scene.prefetch'
  | 'scene.degraded'
  | 'scene.layer';

const counters: Record<string, number> = {};

function bump(key: string) {
  counters[key] = (counters[key] || 0) + 1;
}

export function trackScene(
  event: SceneAnalyticsEvent,
  detail?: Record<string, unknown>,
) {
  bump(event);
  metricsApi.mark(event, detail);
  if (on()) {
    // eslint-disable-next-line no-console
    console.debug('[scene.analytics]', event, detail);
  }
}

export function sceneFallbackRate(): number {
  const loaded = counters['scene.loaded'] || 0;
  const fallback = counters['scene.fallback'] || 0;
  const total = loaded + fallback;
  return total === 0 ? 0 : fallback / total;
}

export function sceneAnalyticsSummary() {
  return {
    counters: { ...counters },
    fallbackRate: sceneFallbackRate(),
  };
}

export const sceneAnalyticsApi = {
  track: trackScene,
  fallbackRate: sceneFallbackRate,
  summary: sceneAnalyticsSummary,
};
