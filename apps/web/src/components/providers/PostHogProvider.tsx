'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import type { PostHogClient } from '@/lib/analytics/track';
import {
  REGISTRATION_FUNNEL_EVENTS,
  trackRegistrationFunnelOnce,
} from '@/lib/analytics/track';
import {
  getAnalyticsConsent,
  type AnalyticsConsent,
} from '@/lib/cookie/consent';

let posthogInitialized = false;
let lastCapturedPageviewUrl: string | null = null;
/** Latest SPA URL for deferred init / consent re-init */
let latestPageUrl = '';

function buildUrl(pathname: string | null, searchParams: URLSearchParams | null) {
  if (!pathname) {
    if (typeof window === 'undefined') return '';
    return `${window.location.pathname}${window.location.search}`;
  }
  const qs = searchParams?.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

function capturePageview(url: string) {
  if (!url || typeof window === 'undefined') return;
  if (getAnalyticsConsent() !== 'granted') return;
  if (!window.posthog) return;
  if (lastCapturedPageviewUrl === url) return;
  lastCapturedPageviewUrl = url;
  window.posthog.capture('$pageview', { $current_url: url });

  const pathOnly = url.split('?')[0] || '/';
  if (pathOnly === '/') {
    trackRegistrationFunnelOnce(
      'landing_viewed',
      REGISTRATION_FUNNEL_EVENTS.LANDING_VIEWED,
      { path: '/' },
    );
  }
}

async function initPostHog(preferredUrl?: string) {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key || posthogInitialized || typeof window === 'undefined') return;
  if (getAnalyticsConsent() !== 'granted') return;

  try {
    const posthog = (await import('posthog-js')).default;
    posthog.init(key, {
      api_host:
        process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
      capture_pageview: false,
      person_profiles: 'identified_only',
    });
    window.posthog = posthog as PostHogClient;
    posthogInitialized = true;
    // Idle/late init used to miss the first route — capture after init.
    capturePageview(
      preferredUrl ||
        latestPageUrl ||
        `${window.location.pathname}${window.location.search}`,
    );
  } catch {
    /* optional */
  }
}

function scheduleAfterLoad(fn: () => void) {
  const run = () => {
    if (typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(() => fn(), { timeout: 3500 });
    } else {
      setTimeout(fn, 1200);
    }
  };

  if (document.readyState === 'complete') {
    run();
    return;
  }

  window.addEventListener('load', run, { once: true });
}

export function PostHogProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const url = buildUrl(pathname, searchParams);

  useEffect(() => {
    latestPageUrl = url;
  }, [url]);

  useEffect(() => {
    scheduleAfterLoad(() => {
      void initPostHog(latestPageUrl || undefined);
    });

    const onConsent = (e: Event) => {
      const detail = (e as CustomEvent<AnalyticsConsent>).detail;
      if (detail === 'granted') {
        lastCapturedPageviewUrl = null;
        void initPostHog(latestPageUrl || undefined);
      } else if (window.posthog) {
        window.posthog.reset();
        posthogInitialized = false;
        lastCapturedPageviewUrl = null;
        window.posthog = undefined;
      }
    };
    window.addEventListener('profytron:analytics-consent', onConsent);
    return () => window.removeEventListener('profytron:analytics-consent', onConsent);
  }, []);

  useEffect(() => {
    capturePageview(url);
  }, [url]);

  return <>{children}</>;
}
