/**
 * Motion Engine orchestrator — queue → quality → conflict → registry → timeline.
 */

import { adaptMotionQuality, wireBatteryQualitySignal } from './motion-quality';
import { syncReducedMotionPolicy } from './motion-accessibility';
import { observeMotionFrame, reportMotionMemory } from './motion-observability';
import { recoverAll } from './motion-recovery';
import { pauseAllMotion, resumeAllMotion } from './motion-registry';

let started = false;
let raf = 0;

function loop(now: number) {
  observeMotionFrame(now);
  raf = requestAnimationFrame(loop);
}

export function startMotionEngine() {
  if (started || typeof window === 'undefined') return;
  started = true;
  syncReducedMotionPolicy();
  wireBatteryQualitySignal();
  adaptMotionQuality();
  raf = requestAnimationFrame(loop);

  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  const onMq = () => syncReducedMotionPolicy();
  mq.addEventListener('change', onMq);

  const onVis = () => {
    if (document.visibilityState === 'hidden') {
      pauseAllMotion();
      recoverAll('finish');
    } else {
      resumeAllMotion();
      adaptMotionQuality();
    }
  };
  document.addEventListener('visibilitychange', onVis);

  // Memory sample every 15s in metrics mode
  const memTimer = window.setInterval(() => reportMotionMemory(), 15_000);

  return () => {
    cancelAnimationFrame(raf);
    mq.removeEventListener('change', onMq);
    document.removeEventListener('visibilitychange', onVis);
    clearInterval(memTimer);
    started = false;
  };
}

export function isMotionEngineStarted() {
  return started;
}

export const motionEngineApi = {
  start: startMotionEngine,
  isStarted: isMotionEngineStarted,
};
