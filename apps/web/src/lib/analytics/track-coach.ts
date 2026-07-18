import { trackEvent } from '@/lib/analytics/track';
import { coachApi } from '@/lib/api/coach';

export const COACH_EVENTS = {
  SESSION_START: 'coach_session_start',
  SUGGESTION_IMPRESSION: 'coach_suggestion_impression',
  SUGGESTION_CLICKED: 'coach_suggestion_clicked',
  MESSAGE_SENT: 'coach_message_sent',
  INTENT_CLASSIFIED: 'coach_intent_classified',
  RESPONSE_RECEIVED: 'coach_response_received',
  RESPONSE_ERROR: 'coach_response_error',
  EVIDENCE_EXPANDED: 'coach_evidence_expanded',
  FEEDBACK: 'coach_feedback',
  TRADE_SELECTED: 'coach_trade_selected',
  CTA_OPEN_STRATEGY: 'coach_cta_open_strategy',
  CTA_OPEN_TRADE: 'coach_cta_open_trade',
  CONVERSATION_ABANDONED: 'coach_conversation_abandoned',
} as const;

export type CoachEventName = (typeof COACH_EVENTS)[keyof typeof COACH_EVENTS];

type CoachTrackProps = {
  conversationId?: string | null;
  intent?: string | null;
  questionPreview?: string | null;
  metadata?: Record<string, string | number | boolean | undefined | null>;
};

function flattenForPosthog(
  metadata?: CoachTrackProps['metadata'],
): Record<string, string | number | boolean | undefined> {
  if (!metadata) return {};
  const out: Record<string, string | number | boolean | undefined> = {};
  for (const [k, v] of Object.entries(metadata)) {
    if (v === null || v === undefined) continue;
    out[k] = v;
  }
  return out;
}

/** Dual-write: PostHog + first-party Coach Insights store. Fire-and-forget. */
export function trackCoachEvent(event: CoachEventName, props?: CoachTrackProps) {
  const metadata = props?.metadata || {};
  trackEvent(event, {
    conversationId: props?.conversationId || undefined,
    intent: props?.intent || undefined,
    ...flattenForPosthog(metadata),
  });

  void coachApi
    .trackInsight({
      event,
      conversationId: props?.conversationId,
      intent: props?.intent,
      questionPreview: props?.questionPreview,
      metadata: Object.fromEntries(
        Object.entries(metadata).filter(([, v]) => v !== undefined),
      ) as Record<string, unknown>,
    })
    .catch(() => {
      /* non-blocking */
    });
}
