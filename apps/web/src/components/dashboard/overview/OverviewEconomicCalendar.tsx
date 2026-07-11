'use client';

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { EconomicCalendarEvent } from '@/lib/api/market';

type Props = {
  events: EconomicCalendarEvent[];
  loading?: boolean;
  error?: boolean;
};

function impactClass(impact: string) {
  const i = impact.toLowerCase();
  if (i === 'high') return 'bg-destructive/15 text-destructive';
  if (i === 'medium') return 'bg-amber-500/15 text-amber-600 dark:text-amber-400';
  return 'bg-muted text-muted-foreground';
}

function formatEventTime(value: string) {
  try {
    const d = new Date(value.includes('T') ? value : `${value.replace(' ', 'T')}Z`);
    return new Intl.DateTimeFormat('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Kolkata',
    }).format(d);
  } catch {
    return value.slice(11, 16) || value;
  }
}

function fmtCell(
  display: string | null | undefined,
  numeric: number | null,
) {
  if (display && display.trim()) return display.trim();
  if (numeric == null || !Number.isFinite(numeric)) return '—';
  return String(numeric);
}

export function OverviewEconomicCalendar({ events, loading, error }: Props) {
  return (
    <div className="flex h-full min-h-[280px] flex-col overflow-hidden rounded-xl border border-[var(--card-border)] bg-card">
      <div className="flex items-center justify-between border-b border-[var(--card-border)] px-4 py-3">
        <h2 className="text-sm font-semibold text-foreground">Economic Calendar</h2>
        <Link href="/markets" className="text-[11px] font-medium text-primary hover:underline">
          View All
        </Link>
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        {loading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-8 animate-pulse rounded-lg bg-muted/40" />
            ))}
          </div>
        ) : error || events.length === 0 ? (
          <p className="px-4 py-10 text-center text-xs text-muted-foreground">
            {error
              ? 'Unable to load calendar right now. Try Refresh.'
              : 'No upcoming events in this window.'}
          </p>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-card text-[10px] uppercase tracking-wider text-muted-foreground">
              <tr className="border-b border-[var(--card-border)]">
                <th className="px-4 py-2 font-medium">Time</th>
                <th className="px-2 py-2 font-medium">Event</th>
                <th className="px-2 py-2 font-medium">Impact</th>
                <th className="hidden px-2 py-2 font-medium text-right sm:table-cell">Actual</th>
                <th className="px-4 py-2 font-medium text-right">Forecast</th>
              </tr>
            </thead>
            <tbody>
              {events.slice(0, 8).map((e, idx) => (
                <tr
                  key={`${e.event}-${e.time}-${idx}`}
                  className="border-b border-[var(--card-border)]/50 last:border-0"
                >
                  <td className="px-4 py-2 tabular-nums text-muted-foreground">
                    {formatEventTime(e.time)}
                  </td>
                  <td className="max-w-[150px] truncate px-2 py-2 font-medium text-foreground">
                    {e.country ? `${e.country} ` : ''}
                    {e.event}
                  </td>
                  <td className="px-2 py-2">
                    <span
                      className={cn(
                        'inline-flex rounded-md px-1.5 py-0.5 text-[10px] font-semibold capitalize',
                        impactClass(e.impact),
                      )}
                    >
                      {e.impact || 'low'}
                    </span>
                  </td>
                  <td className="hidden px-2 py-2 text-right tabular-nums sm:table-cell">
                    {fmtCell(e.actualDisplay, e.actual)}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums text-muted-foreground">
                    {fmtCell(e.estimateDisplay, e.estimate)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
