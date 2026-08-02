/**
 * FPS monitor — PerformanceObserver + rAF.
 * FPS < 45 for 2s → degrade; recover ≥ 55 for 3s → step up.
 */

import { trackScene } from './scene-analytics';

export type DegradeLevel = 0 | 1 | 2 | 3;

type Listener = (level: DegradeLevel, fps: number) => void;

const LOW_FPS = 45;
const RECOVER_FPS = 55;
const LOW_MS = 2000;
const RECOVER_MS = 3000;

let degradeLevel: DegradeLevel = 0;
let running = false;
let raf = 0;
let frames = 0;
let lastSecond = 0;
let lowSince: number | null = null;
let recoverSince: number | null = null;
let currentFps = 60;
const listeners = new Set<Listener>();

function setLevel(next: DegradeLevel, fps: number) {
  if (next === degradeLevel) return;
  degradeLevel = next;
  trackScene('scene.degraded', { level: next, fps });
  for (const l of listeners) l(next, fps);
}

function tick(now: number) {
  frames += 1;
  if (!lastSecond) lastSecond = now;
  const elapsed = now - lastSecond;
  if (elapsed >= 1000) {
    currentFps = Math.round((frames * 1000) / elapsed);
    frames = 0;
    lastSecond = now;
    trackScene('scene.fps', { fps: currentFps, degrade: degradeLevel });

    if (currentFps < LOW_FPS) {
      recoverSince = null;
      if (lowSince == null) lowSince = now;
      else if (now - lowSince >= LOW_MS && degradeLevel < 3) {
        setLevel((degradeLevel + 1) as DegradeLevel, currentFps);
        lowSince = now;
      }
    } else if (currentFps >= RECOVER_FPS) {
      lowSince = null;
      if (degradeLevel > 0) {
        if (recoverSince == null) recoverSince = now;
        else if (now - recoverSince >= RECOVER_MS) {
          setLevel((degradeLevel - 1) as DegradeLevel, currentFps);
          recoverSince = now;
        }
      } else {
        recoverSince = null;
      }
    } else {
      lowSince = null;
      recoverSince = null;
    }
  }
  raf = requestAnimationFrame(tick);
}

export function startFpsMonitor() {
  if (typeof window === 'undefined' || running) return () => {};
  running = true;
  frames = 0;
  lastSecond = 0;
  raf = requestAnimationFrame(tick);
  return () => stopFpsMonitor();
}

export function stopFpsMonitor() {
  running = false;
  if (raf) cancelAnimationFrame(raf);
  raf = 0;
}

export function getDegradeLevel(): DegradeLevel {
  return degradeLevel;
}

export function getCurrentFps(): number {
  return currentFps;
}

export function subscribeDegrade(fn: Listener) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/** Map degrade level → effective LOD reduction and feature flags. */
export function degradePolicy(level: DegradeLevel = degradeLevel) {
  return {
    lodDelta: level as 0 | 1 | 2 | 3,
    particles: level === 0 ? 1 : level === 1 ? 0.5 : level === 2 ? 0.2 : 0,
    reflection: level < 2,
    animationQuality: level === 0 ? 1 : level === 1 ? 0.7 : level === 2 ? 0.4 : 0.2,
    allowAmbient: level < 2,
  };
}

export const fpsMonitorApi = {
  start: startFpsMonitor,
  stop: stopFpsMonitor,
  getLevel: getDegradeLevel,
  getFps: getCurrentFps,
  subscribe: subscribeDegrade,
  policy: degradePolicy,
};
