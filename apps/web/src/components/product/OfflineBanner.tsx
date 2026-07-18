'use client';

import React from 'react';
import { WifiOff, X } from 'lucide-react';

/**
 * PRODUCT_DEBT / ERROR_GUIDE — surface offline state so failed actions aren't mysterious.
 */
export function OfflineBanner() {
  const [offline, setOffline] = React.useState(false);
  const [dismissed, setDismissed] = React.useState(false);

  React.useEffect(() => {
    const sync = () => {
      const next = typeof navigator !== 'undefined' && !navigator.onLine;
      setOffline(next);
      if (!next) setDismissed(false);
    };
    sync();
    window.addEventListener('online', sync);
    window.addEventListener('offline', sync);
    return () => {
      window.removeEventListener('online', sync);
      window.removeEventListener('offline', sync);
    };
  }, []);

  if (!offline || dismissed) return null;

  return (
    <div
      role="status"
      className="flex items-center gap-3 rounded-[var(--radius-card)] border border-chart-4/25 bg-chart-4/10 px-4 py-2.5 text-sm text-foreground"
    >
      <WifiOff className="h-4 w-4 shrink-0 text-chart-4" aria-hidden />
      <p className="min-w-0 flex-1 text-xs font-medium sm:text-sm">
        You&apos;re offline. Some actions may fail until you&apos;re back.
      </p>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
        aria-label="Dismiss offline banner"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
