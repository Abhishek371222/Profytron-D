/**
 * Accessibility + device gates for scene mounting.
 * Poster → CSS depth → motion off when any gate fails.
 */

import { isReducedMotionPreferred } from '../motion/motion-accessibility';
import { getGpuQuality, gpuAllowsWebGL } from './gpu-quality';
import { gpuMemoryAllowsWebGL, detectIsMobileViewport } from './gpu-memory-budget';
import { lodFromQuality } from './lod-manager';
import { getDegradeLevel, degradePolicy } from './fps-monitor';
import type { SceneKey } from './scene-registry';
import { SceneRegistry } from './scene-registry';

export type SceneFallbackReason =
  | 'ok'
  | 'reduced-motion'
  | 'forced-colors'
  | 'battery-saver'
  | 'low-power'
  | 'mobile'
  | 'gpu-tier'
  | 'memory-budget'
  | 'lod'
  | 'no-webgl'
  | 'degraded'
  | 'missing-url';

export type SceneGateResult = {
  allowWebGL: boolean;
  reason: SceneFallbackReason;
  effectiveLod: number;
  particles: number;
  reflection: boolean;
  animationQuality: number;
  allowAmbient: boolean;
};

function isForcedColors(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(forced-colors: active)').matches;
}

function isBatteryConstrained(): boolean {
  if (typeof navigator === 'undefined') return false;
  const nav = navigator as Navigator & {
    connection?: { saveData?: boolean };
  };
  if (nav.connection?.saveData) return true;
  return false;
}

/** Async battery check — call once and cache via SceneManager. */
export async function probeLowPowerMode(): Promise<boolean> {
  try {
    const nav = navigator as Navigator & {
      getBattery?: () => Promise<{ charging: boolean; level: number }>;
    };
    if (!nav.getBattery) return false;
    const b = await nav.getBattery();
    return !b.charging && b.level <= 0.2;
  } catch {
    return false;
  }
}

let lowPowerCached = false;

export function setLowPowerCached(v: boolean) {
  lowPowerCached = v;
}

export function evaluateSceneGate(
  key: SceneKey,
  opts?: { lowPower?: boolean },
): SceneGateResult {
  const entry = SceneRegistry[key];
  const degrade = degradePolicy(getDegradeLevel());
  const baseLod = lodFromQuality();
  const effectiveLod = Math.max(0, baseLod - degrade.lodDelta) as 0 | 1 | 2 | 3;

  const base = {
    effectiveLod,
    particles: degrade.particles,
    reflection: degrade.reflection,
    animationQuality: degrade.animationQuality,
    allowAmbient: degrade.allowAmbient,
  };

  if (isReducedMotionPreferred()) {
    return { allowWebGL: false, reason: 'reduced-motion', ...base };
  }
  if (isForcedColors()) {
    return { allowWebGL: false, reason: 'forced-colors', ...base };
  }
  if (isBatteryConstrained()) {
    return { allowWebGL: false, reason: 'battery-saver', ...base };
  }
  if (opts?.lowPower ?? lowPowerCached) {
    return { allowWebGL: false, reason: 'low-power', ...base };
  }
  if (detectIsMobileViewport() || !gpuMemoryAllowsWebGL()) {
    return { allowWebGL: false, reason: 'mobile', ...base };
  }
  if (!gpuAllowsWebGL(getGpuQuality())) {
    return { allowWebGL: false, reason: 'gpu-tier', ...base };
  }
  if (effectiveLod < (entry?.lod ?? 1)) {
    return { allowWebGL: false, reason: 'lod', ...base };
  }
  if (!degrade.allowAmbient && entry?.priority === 'background') {
    return { allowWebGL: false, reason: 'degraded', ...base };
  }
  if (!entry?.url?.trim()) {
    return { allowWebGL: false, reason: 'missing-url', ...base };
  }

  return { allowWebGL: true, reason: 'ok', ...base };
}

export const sceneA11yApi = {
  evaluate: evaluateSceneGate,
  probeLowPower: probeLowPowerMode,
  setLowPower: setLowPowerCached,
};
