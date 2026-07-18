/**
 * Motion accessibility — reduced motion → opacity / instant / minimal scale.
 */

'use client';

import { useMotionAllowed } from '../animation';
import {
  getMotionQuality,
  adaptMotionQuality,
  setMotionQuality,
} from './motion-quality';

export { useMotionAllowed };

export function isReducedMotionPreferred(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Apply reduced-motion pin to Minimal quality. */
export function syncReducedMotionPolicy() {
  if (isReducedMotionPreferred()) {
    setMotionQuality('minimal');
    return 'minimal' as const;
  }
  return adaptMotionQuality({ reducedMotion: false });
}

/**
 * Transform a motion target for a11y:
 * - Minimal / reduced: keep opacity only, strip x/y/scale movement
 */
export function accessibleTarget<T extends Record<string, unknown>>(
  target: T,
): T {
  if (getMotionQuality() !== 'minimal') return target;
  const next = { ...target } as Record<string, unknown>;
  delete next.x;
  delete next.y;
  delete next.scale;
  delete next.rotate;
  if (next.opacity === undefined) next.opacity = 1;
  return next as T;
}

export function useMotionAccessibility() {
  const allowed = useMotionAllowed();
  return {
    allowed,
    quality: getMotionQuality(),
    reduced: !allowed || getMotionQuality() === 'minimal',
    accessibleTarget,
  };
}

export const motionAccessibilityApi = {
  useMotionAllowed,
  isReducedMotionPreferred,
  syncReducedMotionPolicy,
  accessibleTarget,
  useMotionAccessibility,
};
