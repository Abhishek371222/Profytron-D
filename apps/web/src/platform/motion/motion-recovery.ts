/**
 * Motion recovery — Resume | Finish | Cancel-to-final.
 * Never leave partially animated UI.
 */

export type RecoveryMode = 'resume' | 'finish' | 'cancel';

export type Recoverable = {
  id: string;
  /** Snap / settle to final visual state. */
  finish: () => void;
  /** Cancel and revert or snap to last committed target. */
  cancel: () => void;
  /** Resume from current visual mid-state. */
  resume?: () => void;
};

const recoverables = new Map<string, Recoverable>();

export function registerRecoverable(r: Recoverable) {
  recoverables.set(r.id, r);
  return () => {
    recoverables.delete(r.id);
  };
}

export function recoverMotion(id: string, mode: RecoveryMode = 'finish') {
  const r = recoverables.get(id);
  if (!r) return;
  try {
    if (mode === 'resume' && r.resume) r.resume();
    else if (mode === 'cancel') r.cancel();
    else r.finish();
  } catch {
    /* ignore */
  }
}

/** Tab hidden / offscreen: finish interactive, cancel decorative. */
export function recoverAll(mode: RecoveryMode = 'finish') {
  for (const id of [...recoverables.keys()]) {
    recoverMotion(id, mode);
  }
}

export function recoverPolicyForLane(
  lane: string,
): RecoveryMode {
  if (lane === 'decorative' || lane === 'idle') return 'cancel';
  if (lane === 'critical' || lane === 'interaction') return 'finish';
  return 'finish';
}

export const motionRecoveryApi = {
  register: registerRecoverable,
  recover: recoverMotion,
  recoverAll,
  policyForLane: recoverPolicyForLane,
};
