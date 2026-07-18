/**
 * Deterministic MT5 synchronization state machine.
 * Idle → Synchronizing → Fresh → Degraded → Recovering → Fresh
 */

export type Mt5SyncPhase =
  | 'idle'
  | 'synchronizing'
  | 'fresh'
  | 'degraded'
  | 'recovering';

/** Legacy badge labels mapped from phase. */
export type SyncStatusLabel = 'live' | 'degraded' | 'offline';

export type Mt5SyncState = {
  phase: Mt5SyncPhase;
  /** Derived for badge / Phase 2 compat */
  syncStatus: SyncStatusLabel;
  enteredAt: number;
  lastSyncedAt: number | null;
  lastErrorAt: number | null;
  lastAppliedVersion: number;
  source: 'cache' | 'api' | 'socket' | 'unknown';
};

const ALLOWED: Record<Mt5SyncPhase, Mt5SyncPhase[]> = {
  idle: ['synchronizing', 'fresh', 'degraded'],
  synchronizing: ['fresh', 'degraded', 'recovering'],
  fresh: ['synchronizing', 'degraded'],
  degraded: ['recovering', 'synchronizing', 'fresh'],
  recovering: ['fresh', 'degraded', 'synchronizing'],
};

function labelFor(phase: Mt5SyncPhase): SyncStatusLabel {
  if (phase === 'fresh') return 'live';
  if (phase === 'degraded' || phase === 'recovering') return 'degraded';
  if (phase === 'idle') return 'offline';
  return 'live'; // synchronizing — still show as live-ish; badge hides live
}

let syncState: Mt5SyncState = {
  phase: 'idle',
  syncStatus: 'offline',
  enteredAt: Date.now(),
  lastSyncedAt: null,
  lastErrorAt: null,
  lastAppliedVersion: 0,
  source: 'unknown',
};

const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

export function getMt5SyncState(): Mt5SyncState {
  return syncState;
}

export function subscribeMt5Sync(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function transitionMt5Sync(
  next: Mt5SyncPhase,
  patch?: Partial<
    Pick<Mt5SyncState, 'source' | 'lastSyncedAt' | 'lastErrorAt' | 'lastAppliedVersion'>
  >,
): boolean {
  const allowed = ALLOWED[syncState.phase];
  if (!allowed.includes(next) && next !== syncState.phase) {
    // Force recover path: any → degraded → recovering is always ok from fresh/sync
    if (next === 'degraded') {
      // allow from any
    } else if (!(syncState.phase === 'idle' && next === 'fresh')) {
      return false;
    }
  }

  const now = Date.now();
  syncState = {
    ...syncState,
    phase: next,
    syncStatus: labelFor(next),
    enteredAt: next === syncState.phase ? syncState.enteredAt : now,
    ...patch,
  };
  if (next === 'fresh' && patch?.lastSyncedAt == null) {
    syncState.lastSyncedAt = now;
  }
  if (next === 'degraded' && patch?.lastErrorAt == null) {
    syncState.lastErrorAt = now;
  }
  emit();
  return true;
}

/** Soft patch without phase change (e.g. version bump while fresh). */
export function patchMt5SyncState(
  patch: Partial<
    Pick<
      Mt5SyncState,
      'source' | 'lastSyncedAt' | 'lastErrorAt' | 'lastAppliedVersion'
    >
  >,
) {
  syncState = { ...syncState, ...patch };
  emit();
}

/** @deprecated use transitionMt5Sync — kept for Phase 2 call sites */
export function setMt5SyncState(patch: {
  syncStatus?: SyncStatusLabel;
  lastSyncedAt?: number | null;
  source?: Mt5SyncState['source'];
}) {
  if (patch.syncStatus === 'degraded') {
    transitionMt5Sync('degraded', {
      source: patch.source,
      lastSyncedAt: patch.lastSyncedAt ?? undefined,
    });
    return;
  }
  if (patch.syncStatus === 'offline') {
    transitionMt5Sync('idle', { source: patch.source });
    return;
  }
  if (patch.syncStatus === 'live') {
    transitionMt5Sync('fresh', {
      source: patch.source,
      lastSyncedAt: patch.lastSyncedAt ?? Date.now(),
    });
    return;
  }
  if (patch.lastSyncedAt != null || patch.source) {
    patchMt5SyncState({
      lastSyncedAt: patch.lastSyncedAt ?? undefined,
      source: patch.source,
    });
  }
}

export function shouldApplyVersion(version: number | undefined): boolean {
  if (version == null || !Number.isFinite(version)) return true;
  if (version <= syncState.lastAppliedVersion) return false;
  return true;
}

export function markVersionApplied(version: number) {
  if (version > syncState.lastAppliedVersion) {
    patchMt5SyncState({ lastAppliedVersion: version });
  }
}
