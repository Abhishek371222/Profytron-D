'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import type { PostHogClient } from '@/lib/analytics/track';

let posthogInitialized = false;

async function initPostHog() {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key || posthogInitialized || typeof window === 'undefined') return;

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
  }, []);

  useEffect(() => {
    if (!window.posthog || !pathname) return;
    const url = searchParams?.toString()
      ? `${pathname}?${searchParams.toString()}`
      : pathname;
    window.posthog.capture('$pageview', { $current_url: url });
  }, [pathname, searchParams]);

  return <>{children}</>;
}
