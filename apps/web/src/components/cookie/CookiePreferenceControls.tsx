'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  getAnalyticsConsent,
  setAnalyticsConsent,
  type AnalyticsConsent,
} from '@/lib/cookie/consent';

/**
 * Inline controls on Cookie Policy so users can reopen / change analytics choice.
 */
export function CookiePreferenceControls() {
  const [choice, setChoice] = useState<AnalyticsConsent | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setChoice(getAnalyticsConsent());
  }, []);

  const apply = useCallback((value: AnalyticsConsent) => {
    setAnalyticsConsent(value);
    setChoice(value);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);
  }, []);

  return (
    <div
      id="manage-cookies"
      className="space-y-4 rounded-2xl border border-[var(--card-border)] bg-card/60 p-5"
    >
      <div>
        <h3 className="text-base font-bold text-foreground">Your preferences</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          Strictly necessary cookies always run. Optional analytics (PostHog, when configured) only run if
          you accept. Current choice:{' '}
          <span className="font-semibold text-foreground">
            {choice === 'granted'
              ? 'Analytics accepted'
              : choice === 'denied'
                ? 'Analytics rejected'
                : 'Not set yet'}
          </span>
          .
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => apply('denied')}
          className="min-h-[44px] rounded-xl border border-[var(--card-border)] px-4 text-sm font-semibold text-foreground hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Reject optional
        </button>
        <button
          type="button"
          onClick={() => apply('granted')}
          className="min-h-[44px] rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Accept analytics
        </button>
      </div>
      {saved && (
        <p className="text-xs font-medium text-primary" role="status">
          Preference saved on this device.
        </p>
      )}
    </div>
  );
}
