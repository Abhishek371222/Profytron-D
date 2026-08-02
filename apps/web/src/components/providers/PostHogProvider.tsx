'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import type { PostHogClient } from '@/lib/analytics/track';
import {
  getAnalyticsConsent,
  type AnalyticsConsent,
} from '@/components/cookie/CookieConsentBanner';

let posthogInitialized = false;

async function initPostHog() {
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

  useEffect(() => {
    scheduleAfterLoad(() => {
      void initPostHog();
    });

    const onConsent = (e: Event) => {
      const detail = (e as CustomEvent<AnalyticsConsent>).detail;
      if (detail === 'granted') {
        void initPostHog();
      } else if (window.posthog) {
        window.posthog.reset();
        posthogInitialized = false;
        window.posthog = undefined;
      }
    };
    window.addEventListener('profytron:analytics-consent', onConsent);
    return () => window.removeEventListener('profytron:analytics-consent', onConsent);
  }, []);

  useEffect(() => {
    if (!window.posthog || !pathname) return;
    if (getAnalyticsConsent() !== 'granted') return;
    const url = searchParams?.toString()
      ? `${pathname}?${searchParams.toString()}`
      : pathname;
    window.posthog.capture('$pageview', { $current_url: url });
  }, [pathname, searchParams]);

  return <>{children}</>;
}
