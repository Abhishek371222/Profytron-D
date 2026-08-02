'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

const STORAGE_KEY = 'profytron_analytics_consent';

export type AnalyticsConsent = 'granted' | 'denied';

export function getAnalyticsConsent(): AnalyticsConsent | null {
  if (typeof window === 'undefined') return null;
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === 'granted' || v === 'denied') return v;
  } catch {
    /* ignore */
  }
  return null;
}

export function setAnalyticsConsent(value: AnalyticsConsent) {
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(
    new CustomEvent('profytron:analytics-consent', { detail: value }),
  );
}

/**
 * PT-L02 — first-visit consent for optional analytics (PostHog).
 * Necessary cookies (session) are unaffected.
 */
export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(getAnalyticsConsent() === null);
  }, []);

  const choose = useCallback((value: AnalyticsConsent) => {
    setAnalyticsConsent(value);
    setVisible(false);
  }, []);

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie preferences"
      className="fixed inset-x-0 bottom-0 z-[90] border-t border-[var(--card-border)] bg-card/95 p-4 shadow-2xl backdrop-blur-md sm:p-5"
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-relaxed text-muted-foreground">
          We use optional analytics cookies to improve Profytron. Strictly necessary cookies keep
          you signed in. See our{' '}
          <Link href="/cookies" className="font-medium text-primary underline-offset-2 hover:underline">
            cookie policy
          </Link>
          .
        </p>
        <div className="flex flex-wrap gap-2 sm:shrink-0">
          <button
            type="button"
            onClick={() => choose('denied')}
            className="min-h-[44px] rounded-xl border border-[var(--card-border)] px-4 text-sm font-semibold text-foreground hover:bg-muted/40"
          >
            Reject optional
          </button>
          <button
            type="button"
            onClick={() => choose('granted')}
            className="min-h-[44px] rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:brightness-110"
          >
            Accept analytics
          </button>
        </div>
      </div>
    </div>
  );
}
