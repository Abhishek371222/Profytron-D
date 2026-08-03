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

const ACTIVATION_T0_KEY = 'pf_activation_t0';
/** Lifetime once: dedicated time_to_first_broker event per browser profile. */
const TTFB_FIRED_KEY = 'pf_ttfb_fired';

/** Mark signup/verify funnel clock for PT-K03 time-to-first-broker. */
export function markActivationStart() {
  if (typeof window === 'undefined') return;
  try {
    if (!sessionStorage.getItem(ACTIVATION_T0_KEY)) {
      sessionStorage.setItem(ACTIVATION_T0_KEY, String(Date.now()));
    }
  } catch {
    /* private mode */
  }
}

/** Seconds from activation start to now; does not clear (call clear after fire). */
export function getTimeToFirstBrokerSeconds(): number | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const t0 = sessionStorage.getItem(ACTIVATION_T0_KEY);
    if (!t0) return undefined;
    const n = Number(t0);
    if (!Number.isFinite(n) || n <= 0) return undefined;
    return Math.max(0, Math.round((Date.now() - n) / 1000));
  } catch {
    return undefined;
  }
}

export function clearActivationStart() {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(ACTIVATION_T0_KEY);
  } catch {
    /* ignore */
  }
}

function hasFiredTimeToFirstBroker(): boolean {
  try {
    return localStorage.getItem(TTFB_FIRED_KEY) === '1';
  } catch {
    return false;
  }
}

function markTimeToFirstBrokerFired() {
  try {
    localStorage.setItem(TTFB_FIRED_KEY, '1');
  } catch {
    /* private mode */
  }
}

/**
 * Client analytics after a successful broker (or paper) connect.
 * Fires durable BROKER_CONNECTED + broker_connected; emits time_to_first_broker
 * once per browser when an activation clock exists.
 */
export function recordBrokerConnectSuccessAnalytics(properties: {
  mode: string;
  source?: string;
}) {
  const timeToFirstBrokerSeconds = getTimeToFirstBrokerSeconds();
  const timing =
    timeToFirstBrokerSeconds != null
      ? { time_to_first_broker_seconds: timeToFirstBrokerSeconds }
      : {};
  const payload = {
    mode: properties.mode,
    ...(properties.source ? { source: properties.source } : {}),
    ...timing,
  };

  void trackActivation(ACTIVATION_EVENTS.BROKER_CONNECTED, payload);
  trackEvent('broker_connected', payload);

  if (timeToFirstBrokerSeconds != null && !hasFiredTimeToFirstBroker()) {
    trackEvent('time_to_first_broker', {
      mode: properties.mode,
      seconds: timeToFirstBrokerSeconds,
      ...(properties.source ? { source: properties.source } : {}),
    });
    markTimeToFirstBrokerFired();
    clearActivationStart();
  } else if (timeToFirstBrokerSeconds != null) {
    clearActivationStart();
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

/**
 * Registration → activation funnel (PostHog + gtag via trackEvent).
 * Stable snake_case names for funnel builders; keep ACTIVATION_EVENTS.SIGNUP
 * as the durable "account created" milestone.
 */
export const REGISTRATION_FUNNEL_EVENTS = {
  LANDING_VIEWED: 'funnel_landing_viewed',
  SIGNUP_CTA_CLICKED: 'funnel_signup_cta_clicked',
  REGISTER_VIEWED: 'funnel_register_viewed',
  REGISTER_STARTED: 'funnel_register_started',
  REGISTER_VALIDATION_FAILED: 'funnel_register_validation_failed',
  /** Prefer ACTIVATION_EVENTS.SIGNUP for completion; alias for funnel clarity */
  REGISTER_COMPLETED: 'funnel_register_completed',
  OAUTH_STARTED: 'funnel_oauth_started',
  OAUTH_COMPLETED: 'funnel_oauth_completed',
  EMAIL_VERIFIED: 'funnel_email_verified',
  LOGIN_SUCCESS: 'funnel_login_success',
  DASHBOARD_VIEWED: 'funnel_dashboard_viewed',
  ONBOARDING_STARTED: 'funnel_onboarding_started',
  ONBOARDING_COMPLETED: 'funnel_onboarding_completed',
} as const;

/** Session-scoped once (reloads / Strict Mode double-mount still can fire twice if storage clears). */
export function trackEventOnce(
  onceKey: string,
  event: string,
  properties?: AnalyticsPayload,
) {
  if (typeof window === 'undefined') return;
  const storageKey = `pf_ph_once_${onceKey}`;
  try {
    if (sessionStorage.getItem(storageKey)) return;
    sessionStorage.setItem(storageKey, '1');
  } catch {
    /* private mode — still emit once per call site */
  }
  trackEvent(event, properties);
}

export function trackRegistrationFunnel(
  event: (typeof REGISTRATION_FUNNEL_EVENTS)[keyof typeof REGISTRATION_FUNNEL_EVENTS],
  properties?: AnalyticsPayload,
) {
  trackEvent(event, { funnel: 'registration', ...properties });
}

export function trackRegistrationFunnelOnce(
  onceKey: string,
  event: (typeof REGISTRATION_FUNNEL_EVENTS)[keyof typeof REGISTRATION_FUNNEL_EVENTS],
  properties?: AnalyticsPayload,
) {
  trackEventOnce(onceKey, event, { funnel: 'registration', ...properties });
}
