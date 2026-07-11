'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import * as Sentry from '@sentry/nextjs';

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-destructive/20 bg-destructive/10">
        <AlertTriangle className="h-8 w-8 text-destructive" aria-hidden="true" />
      </div>
      <div className="space-y-2">
        <h1 className="text-xl font-semibold text-foreground">Something went wrong</h1>
        <p className="max-w-md text-sm text-foreground/50">
          {error?.message || 'An unexpected error occurred. Please try again.'}
        </p>
        {error?.digest ? (
          <p className="text-xs text-foreground/30">Reference: {error.digest}</p>
        ) : null}
      </div>
      <div className="flex flex-col items-center gap-3 sm:flex-row">
        <button
          onClick={reset}
          className="flex items-center gap-2 rounded-xl border border-border bg-foreground/5 px-5 py-2.5 text-sm text-foreground/80 transition hover:bg-foreground/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Try again
        </button>
        <Link
          href="/"
          className="flex items-center gap-2 rounded-xl border border-border bg-transparent px-5 py-2.5 text-sm text-foreground/60 transition hover:bg-foreground/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <Home className="h-4 w-4" aria-hidden="true" />
          Return home
        </Link>
      </div>
    </div>
  );
}
