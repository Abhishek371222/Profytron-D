'use client';

import { useReportWebVitals } from 'next/web-vitals';

export function WebVitalsProvider() {
  useReportWebVitals((metric) => {
    if (process.env.NODE_ENV !== 'production') return;
    if (typeof window === 'undefined') return;

    // PostHog (when consent granted and client ready)
    try {
      window.posthog?.capture('web_vital', {
        name: metric.name,
        value: metric.value,
        rating: metric.rating,
        navigationType: metric.navigationType,
        path: window.location.pathname,
      });
    } catch {
      /* optional */
    }

    const endpoint = process.env.NEXT_PUBLIC_VITALS_ENDPOINT;
    if (!endpoint) return;

    const payload = {
      id: metric.id,
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      navigationType: metric.navigationType,
      path: window.location.pathname,
      ts: Date.now(),
    };

    const body = JSON.stringify(payload);
    if (navigator.sendBeacon) {
      navigator.sendBeacon(endpoint, body);
      return;
    }

    void fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    });
  });

  return null;
}
