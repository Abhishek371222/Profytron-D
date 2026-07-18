/**
 * Motion Quality Manager — Ultra → High → Medium → Minimal.
 * Feature code never branches on quality; presets adapt automatically.
 */

export type MotionQuality = 'ultra' | 'high' | 'medium' | 'minimal';

type QualitySignals = {
  fps?: number;
  longTaskMs?: number;
  hardwareConcurrency?: number;
  deviceMemoryGb?: number;
  reducedMotion?: boolean;
  saveData?: boolean;
  lowBattery?: boolean;
};

let currentQuality: MotionQuality = 'high';
const listeners = new Set<(q: MotionQuality) => void>();

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function readDeviceSignals(): QualitySignals {
  if (typeof navigator === 'undefined') return {};
  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean };
  };
  return {
    hardwareConcurrency: nav.hardwareConcurrency,
    deviceMemoryGb: nav.deviceMemory,
    saveData: nav.connection?.saveData === true,
    reducedMotion: prefersReducedMotion(),
  };
}

/** Map signals → quality. Reduced motion always pins Minimal. */
export function computeQuality(signals: QualitySignals): MotionQuality {
  if (signals.reducedMotion) return 'minimal';
  if (signals.saveData || signals.lowBattery) return 'minimal';

  const fps = signals.fps ?? 60;
  const longTask = signals.longTaskMs ?? 0;
  const cores = signals.hardwareConcurrency ?? 8;
  const mem = signals.deviceMemoryGb ?? 8;

  if (fps < 28 || longTask > 80 || cores <= 2 || mem <= 2) return 'minimal';
  if (fps < 45 || longTask > 50 || cores <= 4 || mem <= 4) return 'medium';
  if (fps < 55 || longTask > 30) return 'high';
  return 'ultra';
}

export function getMotionQuality(): MotionQuality {
  return currentQuality;
}

export function setMotionQuality(q: MotionQuality) {
  if (q === currentQuality) return;
  currentQuality = q;
  for (const l of listeners) l(q);
}

export function subscribeMotionQuality(fn: (q: MotionQuality) => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/** Recompute from live signals (call from observability / FPS sampler). */
export function adaptMotionQuality(partial: QualitySignals = {}) {
  const merged = { ...readDeviceSignals(), ...partial };
  setMotionQuality(computeQuality(merged));
  return currentQuality;
}

/** Duration multiplier by quality. */
export function qualityDurationScale(q: MotionQuality = currentQuality): number {
  switch (q) {
    case 'ultra':
      return 1;
    case 'high':
      return 0.92;
    case 'medium':
      return 0.7;
    case 'minimal':
      return 0;
  }
}

/** Whether glow / decorative motion is allowed. */
export function qualityAllowsDecorative(q: MotionQuality = currentQuality): boolean {
  return q === 'ultra' || q === 'high';
}

/** Whether springs are preferred over tween. */
export function qualityAllowsSpring(q: MotionQuality = currentQuality): boolean {
  return q === 'ultra' || q === 'high';
}

let batteryWired = false;

export function wireBatteryQualitySignal() {
  if (batteryWired || typeof navigator === 'undefined') return;
  type BatteryManager = {
    charging: boolean;
    level: number;
    addEventListener: (t: string, fn: () => void) => void;
  };
  const nav = navigator as Navigator & {
    getBattery?: () => Promise<BatteryManager>;
  };
  if (typeof nav.getBattery !== 'function') return;
  batteryWired = true;
  // Must call on navigator — unbound getBattery throws Illegal invocation in Chromium/Edge.
  void nav
    .getBattery()
    .then((b) => {
      const sync = () => {
        const low = !b.charging && b.level < 0.2;
        adaptMotionQuality({ lowBattery: low });
      };
      sync();
      b.addEventListener('levelchange', sync);
      b.addEventListener('chargingchange', sync);
    })
    .catch(() => {
      // Battery Status API unavailable or blocked — keep default quality.
    });
}

export const motionQualityApi = {
  get: getMotionQuality,
  set: setMotionQuality,
  adapt: adaptMotionQuality,
  compute: computeQuality,
  subscribe: subscribeMotionQuality,
  durationScale: qualityDurationScale,
  allowsDecorative: qualityAllowsDecorative,
  allowsSpring: qualityAllowsSpring,
  wireBattery: wireBatteryQualitySignal,
};
