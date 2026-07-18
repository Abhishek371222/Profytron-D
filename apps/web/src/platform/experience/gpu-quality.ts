/**
 * GPU Quality Manager — Ultra → High → Medium → Low → Minimal.
 * Reads motion quality and maps to DPR / LOD / shader complexity.
 */

import {
  getMotionQuality,
  subscribeMotionQuality,
  type MotionQuality,
} from '../motion/motion-quality';

export type GpuQuality = 'ultra' | 'high' | 'medium' | 'low' | 'minimal';

const MOTION_TO_GPU: Record<MotionQuality, GpuQuality> = {
  ultra: 'ultra',
  high: 'high',
  medium: 'medium',
  minimal: 'minimal',
};

let current: GpuQuality = 'high';
const listeners = new Set<(q: GpuQuality) => void>();

function fromMotion(mq: MotionQuality): GpuQuality {
  return MOTION_TO_GPU[mq] ?? 'high';
}

export function getGpuQuality(): GpuQuality {
  return current;
}

export function setGpuQuality(q: GpuQuality) {
  if (q === current) return;
  current = q;
  for (const l of listeners) l(q);
}

export function syncGpuFromMotion() {
  setGpuQuality(fromMotion(getMotionQuality()));
  return current;
}

export function subscribeGpuQuality(fn: (q: GpuQuality) => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/** Device pixel ratio cap by quality. */
export function gpuDpr(q: GpuQuality = current): number {
  if (typeof window === 'undefined') return 1;
  const native = Math.min(window.devicePixelRatio || 1, 2.5);
  switch (q) {
    case 'ultra':
      return native;
    case 'high':
      return Math.min(native, 2);
    case 'medium':
      return Math.min(native, 1.5);
    case 'low':
      return 1;
    case 'minimal':
      return 1;
  }
}

/** Whether WebGL hero scene is allowed. */
export function gpuAllowsWebGL(q: GpuQuality = current): boolean {
  return q !== 'minimal' && q !== 'low';
}

/** Line/particle density scale 0–1. */
export function gpuDensityScale(q: GpuQuality = current): number {
  switch (q) {
    case 'ultra':
      return 1;
    case 'high':
      return 0.85;
    case 'medium':
      return 0.55;
    case 'low':
      return 0.3;
    case 'minimal':
      return 0;
  }
}

let unsubMotion: (() => void) | null = null;

export function wireGpuQualityFromMotion() {
  syncGpuFromMotion();
  if (unsubMotion) return;
  unsubMotion = subscribeMotionQuality(() => syncGpuFromMotion());
}

export const gpuQualityApi = {
  get: getGpuQuality,
  set: setGpuQuality,
  sync: syncGpuFromMotion,
  subscribe: subscribeGpuQuality,
  dpr: gpuDpr,
  allowsWebGL: gpuAllowsWebGL,
  densityScale: gpuDensityScale,
  wireFromMotion: wireGpuQualityFromMotion,
};
