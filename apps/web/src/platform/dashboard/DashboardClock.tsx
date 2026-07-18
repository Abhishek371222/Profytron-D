'use client';

import React from 'react';
import { platform } from '@/platform';
import { Mt5SyncBadge } from '@/platform/dashboard/Mt5SyncBadge';

/**
 * Leaf clock — 1Hz ticks stay here and never re-render Metrics/Chart siblings.
 */
export function DashboardClock() {
  const [serverTime, setServerTime] = React.useState('');

  React.useEffect(() => {
    const tick = () => {
      setServerTime(
        new Intl.DateTimeFormat('en-IN', {
          weekday: 'short',
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          timeZone: 'Asia/Kolkata',
          timeZoneName: 'short',
        }).format(new Date()),
      );
    };
    tick();
    return platform.lifecycle().ownInterval('dashboard:server-clock', tick, 1000);
  }, []);

  return (
    <div className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--card-border)] bg-card px-2.5 py-1 text-[11px] tabular-nums text-muted-foreground">
      <span className="inline-flex items-center gap-1 font-medium text-foreground">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
        Live
      </span>
      <Mt5SyncBadge />
      <span className="text-muted-foreground/50">·</span>
      <span suppressHydrationWarning>{serverTime || '—'}</span>
    </div>
  );
}
