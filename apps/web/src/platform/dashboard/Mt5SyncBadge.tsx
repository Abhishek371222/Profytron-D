'use client';

import React from 'react';
import {
  getMt5SyncState,
  subscribeMt5Sync,
  type Mt5SyncState,
} from '@/platform/mt5-sync';

/** Subtle sync affordance — never blocks rendering of equity. */
export function useMt5SyncStatus(): Mt5SyncState {
  const [state, setState] = React.useState(getMt5SyncState);
  React.useEffect(
    () => subscribeMt5Sync(() => setState(getMt5SyncState())),
    [],
  );
  return state;
}

export function Mt5SyncBadge() {
  const { syncStatus, phase } = useMt5SyncStatus();
  if (syncStatus === 'live' || phase === 'synchronizing') return null;
  const label =
    phase === 'recovering'
      ? 'recovering'
      : phase === 'idle'
        ? 'offline'
        : syncStatus;
  return (
    <span
      className="text-[10px] uppercase tracking-wide text-amber-600 dark:text-amber-400"
      title="Broker sync is delayed; showing last known values"
    >
      Sync {label}
    </span>
  );
}
