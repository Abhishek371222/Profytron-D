/**
 * Conflict resolution — who wins when two animations target the same property.
 * Priority: state (loading/success/error) > press > click > hover
 */

import { timelineTransition } from './motion-timeline';

export type MotionIntent =
  | 'hover'
  | 'click'
  | 'press'
  | 'loading'
  | 'success'
  | 'warning'
  | 'error'
  | 'refresh'
  | 'navigation'
  | 'modal'
  | 'toast'
  | 'counter'
  | 'decorative';

const INTENT_PRIORITY: Record<MotionIntent, number> = {
  decorative: 10,
  hover: 20,
  click: 40,
  press: 50,
  refresh: 55,
  counter: 60,
  toast: 65,
  navigation: 70,
  modal: 75,
  warning: 80,
  error: 85,
  loading: 90,
  success: 95,
};

type Ownership = {
  animationId: string;
  intent: MotionIntent;
  priority: number;
};

/** Key: `${elementKey}::${property}` */
const owners = new Map<string, Ownership>();

function key(elementKey: string, property: string) {
  return `${elementKey}::${property}`;
}

export type ConflictResult =
  | { action: 'proceed'; interruptedId?: string }
  | { action: 'defer' }
  | { action: 'drop' };

/**
 * Claim ownership of (element, property). Higher priority interrupts lower.
 */
export function claimMotionTarget(
  animationId: string,
  elementKey: string,
  property: string,
  intent: MotionIntent,
): ConflictResult {
  const k = key(elementKey, property);
  const priority = INTENT_PRIORITY[intent] ?? 0;
  const current = owners.get(k);

  if (!current) {
    owners.set(k, { animationId, intent, priority });
    return { action: 'proceed' };
  }

  if (current.animationId === animationId) {
    current.intent = intent;
    current.priority = priority;
    return { action: 'proceed' };
  }

  if (priority > current.priority) {
    const interruptedId = current.animationId;
    timelineTransition(interruptedId, 'interrupted');
    owners.set(k, { animationId, intent, priority });
    return { action: 'proceed', interruptedId };
  }

  if (priority === current.priority) {
    // Same tier: newer wins (replace).
    const interruptedId = current.animationId;
    timelineTransition(interruptedId, 'interrupted');
    owners.set(k, { animationId, intent, priority });
    return { action: 'proceed', interruptedId };
  }

  // Lower priority during state animations → drop; otherwise defer.
  if (current.priority >= INTENT_PRIORITY.loading) {
    return { action: 'drop' };
  }
  return { action: 'defer' };
}

export function releaseMotionTarget(
  animationId: string,
  elementKey: string,
  property: string,
) {
  const k = key(elementKey, property);
  const current = owners.get(k);
  if (current?.animationId === animationId) owners.delete(k);
}

export function clearMotionConflicts() {
  owners.clear();
}

export function conflictOwner(elementKey: string, property: string) {
  return owners.get(key(elementKey, property));
}

export const motionConflictsApi = {
  claim: claimMotionTarget,
  release: releaseMotionTarget,
  clear: clearMotionConflicts,
  owner: conflictOwner,
  priority: INTENT_PRIORITY,
};
