'use client';

import React from 'react';
import { coachApi, type CoachInsightsSummary } from '@/lib/api/coach';
import { toast } from 'sonner';
import { BarChart3, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

function pct(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return '—';
  return `${(n * 100).toFixed(1)}%`;
}

function KpiCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--card-border)] bg-card p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
        {value}
      </p>
      {hint ? (
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

export default function AdminCoachInsightsPage() {
  const [days, setDays] = React.useState(7);
  const [data, setData] = React.useState<CoachInsightsSummary | null>(null);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async (windowDays: number) => {
    setLoading(true);
    try {
      const summary = await coachApi.getInsightsSummary(windowDays);
      setData(summary);
    } catch {
      toast.error("Can't load Coach Insights");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load(days);
  }, [days, load]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-[#348398]">
            <BarChart3 className="h-5 w-5" />
            <span className="text-xs font-semibold uppercase tracking-wide">
              Product analytics
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            Coach Insights
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Adoption, trust, and outcome signals for Alpha Coach — prioritize the
            next build from usage evidence, not intuition.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {[7, 14, 30].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDays(d)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-sm font-medium',
                days === d
                  ? 'bg-[#348398] text-white'
                  : 'border border-[var(--card-border)] bg-card text-muted-foreground hover:text-foreground',
              )}
            >
              {d}d
            </button>
          ))}
          <button
            type="button"
            onClick={() => void load(days)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--card-border)] hover:bg-muted"
            aria-label="Refresh"
          >
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          </button>
        </div>
      </div>

      {loading && !data ? (
        <p className="text-sm text-muted-foreground">Loading insights…</p>
      ) : data ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard label="Coach WAU" value={String(data.kpis.coachWau)} />
            <KpiCard
              label="Suggestion CTR"
              value={pct(data.kpis.suggestionCtr)}
            />
            <KpiCard
              label="Follow-up rate"
              value={pct(data.kpis.followUpRate)}
            />
            <KpiCard
              label="Completion rate"
              value={pct(data.kpis.completionRate)}
            />
            <KpiCard
              label="Evidence-backed"
              value={pct(data.kpis.evidenceBackedRate)}
              hint="Grounded responses with citations"
            />
            <KpiCard
              label="Unsupported intents"
              value={pct(data.kpis.unsupportedIntentRate)}
              hint="Lower is better"
            />
            <KpiCard
              label="Low confidence"
              value={pct(data.kpis.lowConfidenceRate)}
            />
            <KpiCard
              label="Satisfaction"
              value={pct(data.kpis.satisfactionRate)}
              hint={`${(data.counts as any).feedbackUp ?? 0} up / ${(data.counts as any).feedbackDown ?? 0} down`}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <section className="rounded-xl border border-[var(--card-border)] bg-card p-4">
              <h2 className="text-sm font-semibold">Top questions</h2>
              <ul className="mt-3 max-h-80 space-y-2 overflow-auto text-sm">
                {data.topQuestions.length === 0 && (
                  <li className="text-muted-foreground">No questions yet.</li>
                )}
                {data.topQuestions.map((q) => (
                  <li
                    key={q.question}
                    className="flex items-start justify-between gap-3 border-b border-[var(--card-border)]/60 pb-2"
                  >
                    <span className="min-w-0 break-words text-foreground/90">
                      {q.question}
                    </span>
                    <span className="shrink-0 tabular-nums text-muted-foreground">
                      {q.count}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-xl border border-[var(--card-border)] bg-card p-4">
              <h2 className="text-sm font-semibold">Top intents</h2>
              <ul className="mt-3 max-h-80 space-y-2 overflow-auto text-sm">
                {data.topIntents.length === 0 && (
                  <li className="text-muted-foreground">No intents yet.</li>
                )}
                {data.topIntents.map((row) => (
                  <li
                    key={row.intent}
                    className="flex items-center justify-between gap-3 border-b border-[var(--card-border)]/60 pb-2"
                  >
                    <code className="text-xs text-foreground/90">{row.intent}</code>
                    <span className="tabular-nums text-muted-foreground">
                      {row.count}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-xl border border-[var(--card-border)] bg-card p-4">
              <h2 className="text-sm font-semibold">Suggested prompts clicked</h2>
              <ul className="mt-3 max-h-64 space-y-2 overflow-auto text-sm">
                {data.topSuggestions.length === 0 && (
                  <li className="text-muted-foreground">No clicks yet.</li>
                )}
                {data.topSuggestions.map((row) => (
                  <li
                    key={row.label}
                    className="flex items-start justify-between gap-3 border-b border-[var(--card-border)]/60 pb-2"
                  >
                    <span>{row.label}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {row.count}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-xl border border-[var(--card-border)] bg-card p-4">
              <h2 className="text-sm font-semibold">Failing tools</h2>
              <ul className="mt-3 max-h-64 space-y-2 overflow-auto text-sm">
                {data.failingTools.length === 0 && (
                  <li className="text-muted-foreground">No tool failures recorded.</li>
                )}
                {data.failingTools.map((row) => (
                  <li
                    key={row.tool}
                    className="flex items-center justify-between gap-3 border-b border-[var(--card-border)]/60 pb-2"
                  >
                    <code className="text-xs">{row.tool}</code>
                    <span className="tabular-nums text-muted-foreground">
                      {row.count}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-muted-foreground">
                Tool failure events in window:{' '}
                {data.kpis.toolFailureEvents} · Multi-day return users:{' '}
                {data.kpis.multiDayReturnUsers} (
                {pct(data.kpis.multiDayReturnRate)})
              </p>
            </section>
          </div>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">No insight data.</p>
      )}
    </div>
  );
}
