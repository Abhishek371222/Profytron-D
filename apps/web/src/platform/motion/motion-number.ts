/**
 * Interruptible number animation engine.
 * Continues from current visual value; never restarts from zero.
 * Supports currency, percentages, decimals, negatives, reduced-motion.
 */

import { MOTION_DURATION } from './motion-tokens';
import { getMotionQuality, qualityDurationScale } from './motion-quality';
import { registerMotion } from './motion-registry';
import { claimMotionTarget, releaseMotionTarget } from './motion-conflicts';
import { timelineTransition } from './motion-timeline';
import { markMotionDuration } from './motion-observability';
import { enqueueMotion } from './motion-queue';

export type NumberFormatKind = 'decimal' | 'currency' | 'percent' | 'integer';

export type AnimateNumberOptions = {
  id: string;
  from?: number;
  to: number;
  durationMs?: number;
  elementKey?: string;
  onUpdate: (value: number) => void;
  onComplete?: () => void;
  /** If true, skip queue and run immediately. */
  immediate?: boolean;
};

type Runner = {
  id: string;
  visual: number;
  target: number;
  raf: number;
  startVisual: number;
  startTs: number;
  durationMs: number;
  onUpdate: (v: number) => void;
  onComplete?: () => void;
  disposeReg?: () => void;
  paused: boolean;
  pauseTs: number;
};

const runners = new Map<string, Runner>();

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

function counterDuration(): number {
  const scale = qualityDurationScale();
  if (scale === 0 || getMotionQuality() === 'minimal') return 0;
  return MOTION_DURATION.Standard * scale;
}

function tick(runner: Runner, now: number) {
  if (runner.paused) return;
  const elapsed = now - runner.startTs;
  const dur = runner.durationMs;
  if (dur <= 0) {
    runner.visual = runner.target;
    runner.onUpdate(runner.visual);
    finishRunner(runner, true);
    return;
  }
  const t = Math.min(1, elapsed / dur);
  const e = easeOutCubic(t);
  runner.visual = runner.startVisual + (runner.target - runner.startVisual) * e;
  runner.onUpdate(runner.visual);
  if (t >= 1) {
    finishRunner(runner, true);
    return;
  }
  runner.raf = requestAnimationFrame((n) => tick(runner, n));
}

function finishRunner(runner: Runner, completed: boolean) {
  if (runner.raf) cancelAnimationFrame(runner.raf);
  runner.raf = 0;
  runner.visual = runner.target;
  runner.onUpdate(runner.visual);
  const elapsed = performance.now() - runner.startTs;
  markMotionDuration(runner.id, elapsed, MOTION_DURATION.Standard);
  timelineTransition(runner.id, completed ? 'completed' : 'interrupted');
  releaseMotionTarget(runner.id, runner.id, 'counter');
  runner.disposeReg?.();
  runners.delete(runner.id);
  runner.onComplete?.();
}

function startOrRetarget(opts: AnimateNumberOptions) {
  const existing = runners.get(opts.id);
  const from =
    opts.from ??
    existing?.visual ??
    opts.to;
  const durationMs = opts.durationMs ?? counterDuration();

  const conflict = claimMotionTarget(
    opts.id,
    opts.elementKey ?? opts.id,
    'counter',
    'counter',
  );
  if (conflict.action === 'drop') {
    opts.onUpdate(opts.to);
    return;
  }

  if (existing) {
    if (existing.raf) cancelAnimationFrame(existing.raf);
    existing.startVisual = existing.visual;
    existing.target = opts.to;
    existing.startTs = performance.now();
    existing.durationMs = durationMs;
    existing.onUpdate = opts.onUpdate;
    existing.onComplete = opts.onComplete;
    existing.paused = false;
    if (durationMs <= 0) {
      existing.visual = opts.to;
      existing.onUpdate(opts.to);
      finishRunner(existing, true);
      return;
    }
    existing.raf = requestAnimationFrame((n) => tick(existing, n));
    return;
  }

  const runner: Runner = {
    id: opts.id,
    visual: from,
    target: opts.to,
    raf: 0,
    startVisual: from,
    startTs: performance.now(),
    durationMs,
    onUpdate: opts.onUpdate,
    onComplete: opts.onComplete,
    paused: false,
    pauseTs: 0,
  };

  runner.disposeReg = registerMotion({
    id: opts.id,
    pause: () => {
      if (runner.paused) return;
      runner.paused = true;
      runner.pauseTs = performance.now();
      if (runner.raf) cancelAnimationFrame(runner.raf);
      runner.raf = 0;
    },
    resume: () => {
      if (!runner.paused) return;
      const pausedFor = performance.now() - runner.pauseTs;
      runner.startTs += pausedFor;
      runner.paused = false;
      runner.raf = requestAnimationFrame((n) => tick(runner, n));
    },
    dispose: () => {
      if (runner.raf) cancelAnimationFrame(runner.raf);
      runners.delete(opts.id);
    },
    finish: () => {
      runner.target = runner.target;
      runner.visual = runner.target;
      runner.onUpdate(runner.visual);
      finishRunner(runner, true);
    },
    cancel: () => {
      if (runner.raf) cancelAnimationFrame(runner.raf);
      runner.onUpdate(runner.visual);
      finishRunner(runner, false);
    },
  });

  runners.set(opts.id, runner);
  opts.onUpdate(from);

  if (durationMs <= 0 || from === opts.to) {
    runner.visual = opts.to;
    runner.onUpdate(opts.to);
    finishRunner(runner, true);
    return;
  }

  runner.raf = requestAnimationFrame((n) => tick(runner, n));
}

export function animateNumber(opts: AnimateNumberOptions) {
  const run = () => startOrRetarget(opts);
  if (opts.immediate) {
    run();
    return;
  }
  enqueueMotion(opts.id, 'feedback', run, {
    coalesceKey: `number:${opts.id}`,
  });
}

export function getVisualNumber(id: string): number | undefined {
  return runners.get(id)?.visual;
}

export function formatAnimatedNumber(
  value: number,
  kind: NumberFormatKind,
  opts?: { currency?: string; decimals?: number; locale?: string },
): string {
  const locale = opts?.locale ?? 'en-US';
  const decimals = opts?.decimals ?? (kind === 'integer' ? 0 : 2);
  if (kind === 'currency') {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: opts?.currency ?? 'USD',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  }
  if (kind === 'percent') {
    return new Intl.NumberFormat(locale, {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value / 100);
  }
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export const motionNumberApi = {
  animate: animateNumber,
  getVisual: getVisualNumber,
  format: formatAnimatedNumber,
};
