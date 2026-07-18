/**
 * Shared Motion Contracts — allowed vs forbidden animated properties per component.
 */

export type MotionProperty =
  | 'opacity'
  | 'transform'
  | 'counter'
  | 'glow'
  | 'layout'
  | 'width'
  | 'height'
  | 'margin'
  | 'padding'
  | 'color'
  | 'filter';

export type MotionContract = {
  id: string;
  allowed: MotionProperty[];
  forbidden: MotionProperty[];
};

export const MOTION_CONTRACTS: Record<string, MotionContract> = {
  'metric-card': {
    id: 'metric-card',
    allowed: ['opacity', 'transform', 'counter', 'glow', 'color'],
    forbidden: ['layout', 'width', 'height', 'margin', 'padding'],
  },
  'trade-row': {
    id: 'trade-row',
    allowed: ['opacity', 'transform', 'counter', 'color'],
    forbidden: ['layout', 'width', 'height', 'margin'],
  },
  modal: {
    id: 'modal',
    allowed: ['opacity', 'transform', 'filter'],
    forbidden: ['layout', 'width', 'height', 'margin'],
  },
  toast: {
    id: 'toast',
    allowed: ['opacity', 'transform'],
    forbidden: ['layout', 'width', 'height', 'margin'],
  },
  button: {
    id: 'button',
    allowed: ['opacity', 'transform', 'color', 'glow'],
    forbidden: ['layout', 'width', 'height', 'margin'],
  },
  'form-field': {
    id: 'form-field',
    allowed: ['opacity', 'transform', 'color'],
    forbidden: ['layout', 'width', 'height', 'margin'],
  },
  chart: {
    id: 'chart',
    allowed: ['opacity', 'transform'],
    forbidden: ['layout', 'width', 'height', 'margin', 'glow'],
  },
  table: {
    id: 'table',
    allowed: ['opacity', 'transform'],
    forbidden: ['width', 'height', 'margin'],
  },
};

export function getMotionContract(id: string): MotionContract | undefined {
  return MOTION_CONTRACTS[id];
}

/** Dev-time assertion — no-op in production builds. */
export function assertMotionContract(
  contractId: string,
  property: MotionProperty,
) {
  if (process.env.NODE_ENV === 'production') return true;
  const c = MOTION_CONTRACTS[contractId];
  if (!c) return true;
  if (c.forbidden.includes(property)) {
    // eslint-disable-next-line no-console
    console.warn(
      `[motion.contract] Forbidden property "${property}" on "${contractId}"`,
    );
    return false;
  }
  if (!c.allowed.includes(property)) {
    // eslint-disable-next-line no-console
    console.warn(
      `[motion.contract] Unlisted property "${property}" on "${contractId}"`,
    );
    return false;
  }
  return true;
}

export const motionContractsApi = {
  all: MOTION_CONTRACTS,
  get: getMotionContract,
  assert: assertMotionContract,
};
