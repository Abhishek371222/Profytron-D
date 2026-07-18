import { trackEvent } from '@/lib/analytics/track';
import { coachApi } from '@/lib/api/coach';

/** Funnel / adoption signals (first-party Coach Insights store + PostHog). */
export const ADOPTION_EVENTS = {
  STEP_VIEW: 'adoption_step_view',
  STEP_COMPLETE: 'adoption_step_complete',
  STEP_ABANDON: 'adoption_step_abandon',
  HELP_REQUEST: 'adoption_help_request',
  RETRY: 'adoption_retry',
  RECOVERY_SUCCESS: 'adoption_recovery_success',
  EMPTY_STATE_CTA: 'adoption_empty_state_cta',
} as const;

export type AdoptionEventName =
  (typeof ADOPTION_EVENTS)[keyof typeof ADOPTION_EVENTS];

export function trackAdoptionEvent(
  event: AdoptionEventName,
  props?: {
    step?: string;
    href?: string;
    metadata?: Record<string, string | number | boolean | undefined>;
  },
) {
  const metadata = {
    step: props?.step,
    href: props?.href,
    ...(props?.metadata || {}),
  };
  trackEvent(event, metadata);

  void coachApi
    .trackInsight({
      event,
      questionPreview: props?.step?.slice(0, 160),
      metadata: Object.fromEntries(
        Object.entries(metadata).filter(([, v]) => v !== undefined),
      ) as Record<string, unknown>,
    })
    .catch(() => {});
}
