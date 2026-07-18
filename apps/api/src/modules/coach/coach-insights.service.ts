import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

const ALLOWED_EVENTS = new Set([
  'coach_session_start',
  'coach_suggestion_impression',
  'coach_suggestion_clicked',
  'coach_message_sent',
  'coach_intent_classified',
  'coach_response_received',
  'coach_response_error',
  'coach_evidence_expanded',
  'coach_feedback',
  'coach_trade_selected',
  'coach_cta_open_strategy',
  'coach_cta_open_trade',
  'coach_conversation_abandoned',
  'adoption_step_view',
  'adoption_step_complete',
  'adoption_step_abandon',
  'adoption_help_request',
  'adoption_retry',
  'adoption_recovery_success',
  'adoption_empty_state_cta',
]);

function truncatePreview(text?: string | null): string | null {
  if (!text) return null;
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (!cleaned) return null;
  return cleaned.slice(0, 160);
}

@Injectable()
export class CoachInsightsService {
  private readonly logger = new Logger(CoachInsightsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async track(
    userId: string,
    input: {
      event: string;
      conversationId?: string | null;
      intent?: string | null;
      questionPreview?: string | null;
      metadata?: Record<string, unknown> | null;
    },
  ): Promise<{ tracked: boolean }> {
    const event = String(input.event || '').trim();
    if (!ALLOWED_EVENTS.has(event)) {
      return { tracked: false };
    }

    try {
      await this.prisma.coachInsightEvent.create({
        data: {
          userId,
          event,
          conversationId: input.conversationId || null,
          intent: input.intent || null,
          questionPreview: truncatePreview(input.questionPreview),
          metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
        },
      });
      return { tracked: true };
    } catch (err) {
      this.logger.warn(`Coach insight track failed: ${err}`);
      return { tracked: false };
    }
  }

  async getSummary(days = 7) {
    const windowDays = Math.min(90, Math.max(1, days));
    const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);

    const rows = await this.prisma.coachInsightEvent.findMany({
      where: { createdAt: { gte: since } },
      select: {
        event: true,
        userId: true,
        intent: true,
        questionPreview: true,
        metadata: true,
        createdAt: true,
        conversationId: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 20_000,
    });

    const wau = new Set(rows.map((r) => r.userId)).size;

    const byEvent = new Map<string, number>();
    for (const r of rows) {
      byEvent.set(r.event, (byEvent.get(r.event) || 0) + 1);
    }

    const suggestionClicks = byEvent.get('coach_suggestion_clicked') || 0;
    const suggestionImpressions =
      byEvent.get('coach_suggestion_impression') || 0;
    const messages = rows.filter((r) => r.event === 'coach_message_sent');
    const followUps = messages.filter((r) => {
      const m = r.metadata as Record<string, unknown> | null;
      return Boolean(m?.isFollowUp);
    }).length;

    const classifications = rows.filter(
      (r) => r.event === 'coach_intent_classified',
    );
    const unsupported = classifications.filter((r) => {
      const m = r.metadata as Record<string, unknown> | null;
      return m?.supported === false || r.intent === 'unknown';
    }).length;

    const responses = rows.filter((r) => r.event === 'coach_response_received');
    const grounded = responses.filter((r) => {
      const m = r.metadata as Record<string, unknown> | null;
      return m?.mode === 'grounded';
    });
    const withCitations = grounded.filter((r) => {
      const m = r.metadata as Record<string, unknown> | null;
      return Number(m?.citationCount || 0) > 0;
    }).length;
    const lowConfidence = grounded.filter((r) => {
      const m = r.metadata as Record<string, unknown> | null;
      return m?.confidence === 'Low';
    }).length;
    const toolErrors = grounded.reduce((s, r) => {
      const m = r.metadata as Record<string, unknown> | null;
      return s + Number(m?.toolErrorCount || 0);
    }, 0);

    const feedback = rows.filter((r) => r.event === 'coach_feedback');
    const up = feedback.filter((r) => {
      const m = r.metadata as Record<string, unknown> | null;
      return m?.value === 'up';
    }).length;
    const down = feedback.filter((r) => {
      const m = r.metadata as Record<string, unknown> | null;
      return m?.value === 'down';
    }).length;

    const abandons = byEvent.get('coach_conversation_abandoned') || 0;
    const errors = byEvent.get('coach_response_error') || 0;
    const completedTurns = responses.length;
    const startedTurns = messages.length;
    const completionRate =
      startedTurns > 0 ? completedTurns / startedTurns : null;

    const intentCounts = new Map<string, number>();
    for (const r of classifications) {
      const key = r.intent || 'unknown';
      intentCounts.set(key, (intentCounts.get(key) || 0) + 1);
    }
    const topIntents = [...intentCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 25)
      .map(([intent, count]) => ({ intent, count }));

    const questionCounts = new Map<string, number>();
    for (const r of messages) {
      const q = (r.questionPreview || '').trim().toLowerCase();
      if (!q) continue;
      questionCounts.set(q, (questionCounts.get(q) || 0) + 1);
    }
    const topQuestions = [...questionCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 50)
      .map(([question, count]) => ({ question, count }));

    const suggestionClickCounts = new Map<string, number>();
    for (const r of rows.filter((x) => x.event === 'coach_suggestion_clicked')) {
      const m = r.metadata as Record<string, unknown> | null;
      const label = String(m?.label || r.questionPreview || 'unknown');
      suggestionClickCounts.set(
        label,
        (suggestionClickCounts.get(label) || 0) + 1,
      );
    }
    const topSuggestions = [...suggestionClickCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([label, count]) => ({ label, count }));

    // Return cadence: users with activity on ≥2 distinct UTC days
    const daysByUser = new Map<string, Set<string>>();
    for (const r of rows) {
      const day = r.createdAt.toISOString().slice(0, 10);
      if (!daysByUser.has(r.userId)) daysByUser.set(r.userId, new Set());
      daysByUser.get(r.userId)!.add(day);
    }
    const multiDayUsers = [...daysByUser.values()].filter((d) => d.size >= 2)
      .length;

    const toolFailByTool = new Map<string, number>();
    for (const r of grounded) {
      const m = r.metadata as Record<string, unknown> | null;
      const failed = m?.failedTools;
      if (Array.isArray(failed)) {
        for (const t of failed) {
          const key = String(t);
          toolFailByTool.set(key, (toolFailByTool.get(key) || 0) + 1);
        }
      }
    }

    return {
      windowDays,
      since: since.toISOString(),
      kpis: {
        coachWau: wau,
        suggestionCtr:
          suggestionImpressions > 0
            ? suggestionClicks / suggestionImpressions
            : null,
        followUpRate: messages.length > 0 ? followUps / messages.length : null,
        completionRate,
        evidenceBackedRate:
          grounded.length > 0 ? withCitations / grounded.length : null,
        unsupportedIntentRate:
          classifications.length > 0
            ? unsupported / classifications.length
            : null,
        lowConfidenceRate:
          grounded.length > 0 ? lowConfidence / grounded.length : null,
        toolFailureEvents: toolErrors,
        satisfactionRate: up + down > 0 ? up / (up + down) : null,
        multiDayReturnUsers: multiDayUsers,
        multiDayReturnRate: wau > 0 ? multiDayUsers / wau : null,
      },
      counts: {
        events: rows.length,
        byEvent: Object.fromEntries(byEvent),
        suggestionClicks,
        suggestionImpressions,
        messages: messages.length,
        followUps,
        responses: responses.length,
        grounded: grounded.length,
        abandons,
        errors,
        feedbackUp: up,
        feedbackDown: down,
      },
      topQuestions,
      topIntents,
      topSuggestions,
      failingTools: [...toolFailByTool.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15)
        .map(([tool, count]) => ({ tool, count })),
    };
  }
}
