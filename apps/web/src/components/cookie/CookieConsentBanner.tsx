'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import {
  getAnalyticsConsent,
  setAnalyticsConsent,
  type AnalyticsConsent,
} from '@/lib/cookie/consent';

export type { AnalyticsConsent };
export { getAnalyticsConsent, setAnalyticsConsent } from '@/lib/cookie/consent';

/**
 * PT-L02 — first-visit (and policy-version) consent for optional analytics (PostHog).
 * Necessary cookies (session) are unaffected.
 */
export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);
  const titleId = useId();
  const acceptRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Client-only: avoid SSR mismatch; banner never paints on server.
    setVisible(getAnalyticsConsent() === null);
  }, []);

  useEffect(() => {
    if (!visible) return;
    // Focus primary action for keyboard users without trapping the full page.
    const t = window.setTimeout(() => acceptRef.current?.focus(), 50);
    return () => window.clearTimeout(t);
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => {
      // Escape = deny optional analytics (prefer not tracking over forced accept).
      if (e.key === 'Escape') {
        e.preventDefault();
        setAnalyticsConsent('denied');
        setVisible(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [visible]);

  const choose = useCallback((value: AnalyticsConsent) => {
    setAnalyticsConsent(value);
    setVisible(false);
  }, []);

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby={titleId}
      className="fixed inset-x-0 bottom-0 z-[90] border-t border-[var(--card-border)] bg-card/95 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl backdrop-blur-md sm:p-5 sm:pb-[max(1.25rem,env(safe-area-inset-bottom))]"
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-1.5">
          <p id={titleId} className="text-sm font-semibold text-foreground">
            Cookie preferences
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            We use optional analytics cookies to improve Profytron. Strictly necessary cookies keep you
            signed in. Read our{' '}
            <Link
              href="/cookies"
              className="font-medium text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
            >
              Cookie Policy
            </Link>
            ,{' '}
            <Link
              href="/privacy"
              className="font-medium text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
            >
              Privacy Policy
            </Link>
            , and{' '}
            <Link
              href="/terms"
              className="font-medium text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
            >
              Terms of Service
            </Link>
            .
          </p>
        </div>
        <div className="flex flex-wrap gap-2 sm:shrink-0">
          <button
            type="button"
            onClick={() => choose('denied')}
            className="min-h-[44px] rounded-xl border border-[var(--card-border)] px-4 text-sm font-semibold text-foreground hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Reject optional
          </button>
          <button
            ref={acceptRef}
            type="button"
            onClick={() => choose('granted')}
            className="min-h-[44px] rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Accept analytics
          </button>
        </div>
      </div>
    </div>
  );
}
