/**
 * Shared element / view-transition helpers.
 */

import { resolveTransition } from './motion-tokens';
import { getMotionQuality } from './motion-quality';

export type SharedTransitionId =
  | 'marketplace-strategy'
  | 'dashboard-coach'
  | 'analytics-trade';

/** CSS view-transition name helpers. */
export function sharedViewTransitionName(id: SharedTransitionId): string {
  return `pt-shared-${id}`;
}

/**
 * Run a document view transition when supported; otherwise run update sync.
 */
export function runSharedTransition(update: () => void): void {
  if (getMotionQuality() === 'minimal') {
    update();
    return;
  }
  const doc = typeof document !== 'undefined' ? document : null;
  const start = (
    doc as Document & {
      startViewTransition?: (cb: () => void) => { finished: Promise<void> };
    }
  )?.startViewTransition;
  if (typeof start === 'function') {
    start.call(doc, update);
    return;
  }
  update();
}

export function sharedTransitionDurationMs(): number {
  return resolveTransition('Navigation').durationMs;
}

export const motionTransitionsApi = {
  name: sharedViewTransitionName,
  run: runSharedTransition,
  durationMs: sharedTransitionDurationMs,
};
