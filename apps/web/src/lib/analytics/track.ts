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
  }

  try {
    window.gtag?.('event', event, properties);
  } catch {
  }

  if (process.env.NODE_ENV !== 'production') {
    console.debug('[analytics]', event, properties);
  }
}

/** Durable activation milestones — must match API ACTIVATION_EVENTS (UPPER_SNAKE). */
export async function trackActivation(
  event: string,
  properties?: AnalyticsPayload,
) {
  trackEvent(event.toLowerCase(), properties);
  try {
    const { growthApi } = await import('@/lib/api/growth');
    await growthApi.track(event, properties);
  } catch {
  }
}

export const ACTIVATION_EVENTS = {
  FIRST_LOGIN: 'FIRST_LOGIN',
  ONBOARDING_COMPLETED: 'ONBOARDING_COMPLETED',
  BROKER_CONNECTED: 'BROKER_CONNECTED',
  FIRST_PAPER_TRADE: 'FIRST_PAPER_TRADE',
  FIRST_WALLET_DEPOSIT: 'FIRST_WALLET_DEPOSIT',
  FIRST_MARKETPLACE_SUB: 'FIRST_MARKETPLACE_SUB',
  FIRST_REAL_TRADE: 'FIRST_REAL_TRADE',
  FIRST_COACH_INTERACTION: 'FIRST_COACH_INTERACTION',
  /** PostHog-only (not stored in UserActivationEvent) */
  SIGNUP: 'signup',
  PLAN_SELECTED: 'plan_selected',
  CHECKOUT_STARTED: 'checkout_started',
} as const;
