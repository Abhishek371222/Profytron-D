/**
 * Named spring configurations — no arbitrary spring params in features.
 */

export const MOTION_SPRINGS = {
  snappy: { type: 'spring' as const, stiffness: 420, damping: 36, mass: 0.8 },
  modal: { type: 'spring' as const, stiffness: 320, damping: 34, mass: 1 },
  drawer: { type: 'spring' as const, stiffness: 280, damping: 32, mass: 1 },
  gentle: { type: 'spring' as const, stiffness: 180, damping: 28, mass: 1 },
  counter: { type: 'spring' as const, stiffness: 260, damping: 30, mass: 0.9 },
  hover: { type: 'spring' as const, stiffness: 400, damping: 28, mass: 0.7 },
} as const;

export type MotionSpringToken = keyof typeof MOTION_SPRINGS;

export function getSpring(token: MotionSpringToken) {
  return MOTION_SPRINGS[token];
}

export const motionSpringsApi = {
  springs: MOTION_SPRINGS,
  get: getSpring,
};
