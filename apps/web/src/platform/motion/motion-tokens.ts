/**
 * Semantic motion tokens — the only approved duration/easing vocabulary.
 */

export const MOTION_DURATION = {
  Instant: 0,
  Fast: 120,
  Standard: 200,
  Slow: 320,
  Hero: 550,
  Background: 800,
} as const;

export type MotionDurationToken = keyof typeof MOTION_DURATION;

/** Seconds for framer-motion `transition.duration`. */
export function durationSeconds(token: MotionDurationToken): number {
  return MOTION_DURATION[token] / 1000;
}

export const MOTION_EASING = {
  /** Brand smooth — matches CSS --ease-smooth */
  Smooth: [0.22, 1, 0.36, 1] as const,
  /** Brand out — matches CSS --ease-out */
  Out: [0.23, 1, 0.32, 1] as const,
  /** Soft overshoot — matches CSS --ease-spring */
  SpringEase: [0.34, 1.56, 0.64, 1] as const,
  Linear: 'linear' as const,
  EaseOut: 'easeOut' as const,
} as const;

export type MotionEasingToken = keyof typeof MOTION_EASING;

/** Semantic transition intents. */
export const MOTION_TRANSITION = {
  Hover: { duration: 'Fast', easing: 'Out' },
  Focus: { duration: 'Fast', easing: 'Out' },
  Press: { duration: 'Instant', easing: 'Out' },
  Success: { duration: 'Standard', easing: 'Smooth' },
  Warning: { duration: 'Standard', easing: 'Out' },
  Error: { duration: 'Fast', easing: 'Out' },
  Loading: { duration: 'Slow', easing: 'Linear' },
  Refresh: { duration: 'Standard', easing: 'Smooth' },
  Navigation: { duration: 'Slow', easing: 'Smooth' },
  Modal: { duration: 'Standard', easing: 'Smooth' },
  Toast: { duration: 'Standard', easing: 'Out' },
  Tooltip: { duration: 'Fast', easing: 'Out' },
  Drawer: { duration: 'Slow', easing: 'Smooth' },
  Expansion: { duration: 'Standard', easing: 'Smooth' },
  Collapse: { duration: 'Fast', easing: 'Out' },
} as const satisfies Record<
  string,
  { duration: MotionDurationToken; easing: MotionEasingToken }
>;

export type MotionTransitionToken = keyof typeof MOTION_TRANSITION;

export function resolveTransition(token: MotionTransitionToken) {
  const t = MOTION_TRANSITION[token];
  return {
    duration: durationSeconds(t.duration),
    durationMs: MOTION_DURATION[t.duration],
    ease: MOTION_EASING[t.easing],
  };
}

export const motionTokensApi = {
  duration: MOTION_DURATION,
  easing: MOTION_EASING,
  transition: MOTION_TRANSITION,
  durationSeconds,
  resolveTransition,
};
