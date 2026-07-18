'use client';

import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { ExplainabilityResult } from '@profytron/ai-coach';
import { cn } from '@/lib/utils';

export function CoachExplainabilityCard({
  result,
}: {
  result: ExplainabilityResult;
}) {
  const [open, setOpen] = React.useState(false);
  const confColor =
    result.confidence === 'High'
      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
      : result.confidence === 'Medium'
        ? 'bg-amber-500/15 text-amber-800 dark:text-amber-200'
        : 'bg-muted text-muted-foreground';

  return (
    <div className="mt-3 space-y-2 rounded-xl border border-[var(--card-border)] bg-card/60 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={cn(
            'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide',
            confColor,
          )}
        >
          Confidence · {result.confidence}
        </span>
        {result.citations.map((c) => (
          <span
            key={c.id}
            className="inline-flex items-center rounded-full border border-[var(--card-border)] bg-muted/40 px-2 py-0.5 text-[11px] text-muted-foreground"
            title={c.source}
          >
            {c.label}
          </span>
        ))}
      </div>

      <button
        type="button"
        onClick={() => {
          const next = !open;
          setOpen(next);
          if (next) {
            void import('@/lib/analytics/track-coach').then(({ trackCoachEvent, COACH_EVENTS }) => {
              trackCoachEvent(COACH_EVENTS.EVIDENCE_EXPANDED, {
                intent: result.intent,
                metadata: {
                  confidence: result.confidence,
                  citationCount: result.citations.length,
                },
              });
            });
          }
        }}
        className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
      >
        {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        {open ? 'Hide evidence' : 'Show evidence'}
      </button>

      {open && (
        <pre className="max-h-48 overflow-auto rounded-lg bg-muted/50 p-2 text-[10px] leading-relaxed text-muted-foreground">
          {JSON.stringify(
            {
              intent: result.intent,
              toolsUsed: result.toolsUsed,
              evidence: {
                ...result.evidence,
                // keep payload readable
              },
            },
            null,
            2,
          )}
        </pre>
      )}
    </div>
  );
}
