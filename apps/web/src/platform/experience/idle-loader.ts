/**
 * Idle loader — viewport → requestIdleCallback → GPU idle → load.
 * Never blocks interaction.
 */

type IdleFn = () => void;

const INPUT_BUSY_MS = 120;
const IDLE_TIMEOUT_MS = 1200;

let lastInputAt = 0;

function wireInputSignals() {
  if (typeof window === 'undefined') return;
  const mark = () => {
    lastInputAt = performance.now();
  };
  window.addEventListener('pointerdown', mark, { passive: true });
  window.addEventListener('keydown', mark, { passive: true });
  window.addEventListener('wheel', mark, { passive: true, capture: true });
  window.addEventListener('touchstart', mark, { passive: true });
}

let wired = false;

function ensureWired() {
  if (wired || typeof window === 'undefined') return;
  wired = true;
  wireInputSignals();
}

function isGpuIdle(): boolean {
  return performance.now() - lastInputAt >= INPUT_BUSY_MS;
}

function ric(cb: IdleFn, timeout = IDLE_TIMEOUT_MS) {
  if (typeof window === 'undefined') return () => {};
  const w = window as Window & {
    requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
    cancelIdleCallback?: (id: number) => void;
  };
  if (typeof w.requestIdleCallback === 'function') {
    const id = w.requestIdleCallback(cb, { timeout });
    return () => w.cancelIdleCallback?.(id);
  }
  const id = window.setTimeout(cb, Math.min(200, timeout));
  return () => clearTimeout(id);
}

/**
 * Schedule work only when the browser is idle and recent input has settled.
 */
export function scheduleIdleLoad(fn: IdleFn, opts?: { timeout?: number }): () => void {
  ensureWired();
  let cancelled = false;
  let cancelRic: (() => void) | null = null;
  let retryTimer: number | null = null;

  const attempt = () => {
    if (cancelled) return;
    if (!isGpuIdle()) {
      retryTimer = window.setTimeout(attempt, INPUT_BUSY_MS);
      return;
    }
    cancelRic = ric(() => {
      if (cancelled) return;
      if (!isGpuIdle()) {
        retryTimer = window.setTimeout(attempt, INPUT_BUSY_MS);
        return;
      }
      fn();
    }, opts?.timeout ?? IDLE_TIMEOUT_MS);
  };

  attempt();

  return () => {
    cancelled = true;
    cancelRic?.();
    if (retryTimer != null) clearTimeout(retryTimer);
  };
}

export const idleLoaderApi = {
  schedule: scheduleIdleLoad,
};
