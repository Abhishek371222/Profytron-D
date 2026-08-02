'use client';

import React from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, CircleHelp } from 'lucide-react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div
      className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 text-center"
      role="alert"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-destructive/20 bg-destructive/10">
        <AlertTriangle className="h-8 w-8 text-destructive" aria-hidden />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Something went wrong</h2>
        <p className="max-w-md text-sm text-muted-foreground">
          {error?.message || 'An unexpected error occurred. Please try again.'}
        </p>
        {error?.digest ? (
          <p className="text-xs text-muted-foreground/80">Reference: {error.digest}</p>
        ) : null}
      </div>
      <div className="flex flex-col items-center gap-3 sm:flex-row">
        <button
          type="button"
          onClick={reset}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <RefreshCw className="h-4 w-4" aria-hidden />
          Try again
        </button>
        <Link
          href="/help"
          className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-[var(--card-border)] bg-card px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <CircleHelp className="h-4 w-4" aria-hidden />
          Help Center
        </Link>
      </div>
    </div>
  );
}
