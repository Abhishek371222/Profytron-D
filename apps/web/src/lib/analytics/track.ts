type AnalyticsPayload = Record<string, string | number | boolean | undefined>;

export type PostHogClient = {
  init: (
    key: string,
    options?: {
      api_host?: string;
      capture_pageview?: boolean;
      person_profiles?: string;
    },
  ) => void;
  capture: (event: string, props?: Record<string, unknown>) => void;
  identify: (id: string, props?: Record<string, unknown>) => void;
  reset: () => void;
};

declare global {
  interface Window {
    posthog?: PostHogClient;
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackEvent(event: string, properties?: AnalyticsPayload) {
  if (typeof window === 'undefined') return;

  try {
    window.posthog?.capture(event, properties);
  } catch {
    /* optional */
  }

  try {
    window.gtag?.('event', event, properties);
  } catch {
    /* optional */
  }

  if (process.env.NODE_ENV !== 'production') {
    console.debug('[analytics]', event, properties);
  }
}

/** Sends product analytics to PostHog and the backend activation engine. */
export async function trackActivation(
  event: string,
  properties?: AnalyticsPayload,
) {
  trackEvent(event, properties);
  try {
    const { growthApi } = await import('@/lib/api/growth');
    await growthApi.track(event, properties);
  } catch {
    /* optional — user may be logged out */
  }
}

export const ACTIVATION_EVENTS = {
  FIRST_LOGIN: 'first_login',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  BROKER_CONNECTED: 'broker_connected',
  FIRST_PAPER_TRADE: 'first_paper_trade',
  FIRST_WALLET_DEPOSIT: 'first_wallet_deposit',
  FIRST_MARKETPLACE_SUB: 'first_marketplace_sub',
  SIGNUP: 'signup',
  PLAN_SELECTED: 'plan_selected',
  CHECKOUT_STARTED: 'checkout_started',
} as const;
