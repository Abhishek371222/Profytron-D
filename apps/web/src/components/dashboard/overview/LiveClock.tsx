'use client';

import React from 'react';

/**
 * Ticks once per second in complete isolation from the rest of the dashboard
 * tree. Previously this timer lived as `serverTime` state on DashboardPage
 * itself, which meant every single widget below it (charts, tables, market
 * watch) was reconciled 60 times/minute just to display a clock. Hoisting the
 * interval into its own leaf component means React only re-renders this
 * ~40-byte <span>, not the whole page.
 */
export function LiveClock() {
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
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  return <span suppressHydrationWarning>{serverTime || '—'}</span>;
}
