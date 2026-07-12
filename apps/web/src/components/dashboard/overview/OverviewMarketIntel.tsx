'use client';

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { EconomicCalendarEvent } from '@/lib/api/market';
import type { MarketNewsItem } from '@/lib/api/market';
import {
  isUsableNewsImageUrl,
  newsImageSrc,
  newsWithImages,
} from '@/lib/market/news-image';
import { relativeTime } from './overview-utils';

type Props = {
  events: EconomicCalendarEvent[];
  news: MarketNewsItem[];
  calendarLoading?: boolean;
  newsLoading?: boolean;
  calendarError?: boolean;
};

function impactClass(impact: string) {
  const i = impact.toLowerCase();
  if (i === 'high') return 'text-destructive';
  if (i === 'medium') return 'text-amber-600 dark:text-amber-400';
  return 'text-muted-foreground';
}

function formatEventTime(value: string) {
  try {
    const d = new Date(value.includes('T') ? value : value.replace(' ', 'T') + 'Z');
    return new Intl.DateTimeFormat('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Kolkata',
    }).format(d);
  } catch {
    return value.slice(11, 16) || value;
  }
}

function fmtNum(v: number | null) {
  if (v == null || !Number.isFinite(v)) return '—';
  return String(v);
}

export function OverviewMarketIntel({
  events,
  news,
  calendarLoading,
  newsLoading,
  calendarError,
}: Props) {
  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-[var(--card-border)] bg-card">
        <div className="flex items-center justify-between border-b border-[var(--card-border)] px-4 py-3.5 sm:px-5">
          <h2 className="text-sm font-semibold text-foreground">Economic Calendar</h2>
          <Link href="/markets" className="text-[11px] font-medium text-primary hover:underline">
            Markets
          </Link>
        </div>
        <div className="min-h-0 flex-1 overflow-auto">
          {calendarLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-8 animate-pulse rounded-lg bg-muted/40" />
              ))}
            </div>
          ) : calendarError || events.length === 0 ? (
            <p className="px-5 py-8 text-center text-xs text-muted-foreground">
              {calendarError
                ? 'Calendar unavailable on this plan. Check Markets for news.'
                : 'No upcoming events in this window.'}
            </p>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-card text-[10px] uppercase tracking-wider text-muted-foreground">
                <tr className="border-b border-[var(--card-border)]">
                  <th className="px-4 py-2 font-medium sm:px-5">Time</th>
                  <th className="px-2 py-2 font-medium">Event</th>
                  <th className="px-2 py-2 font-medium">Impact</th>
                  <th className="hidden px-2 py-2 font-medium text-right sm:table-cell">Act</th>
                  <th className="px-4 py-2 font-medium text-right sm:px-5">Fcst</th>
                </tr>
              </thead>
              <tbody>
                {events.slice(0, 6).map((e, idx) => (
                  <tr
                    key={`${e.event}-${e.time}-${idx}`}
                    className="border-b border-[var(--card-border)]/60 last:border-0"
                  >
                    <td className="px-4 py-2 tabular-nums text-muted-foreground sm:px-5">
                      {formatEventTime(e.time)}
                    </td>
                    <td className="max-w-[140px] truncate px-2 py-2 font-medium text-foreground">
                      {e.country ? `${e.country} ` : ''}
                      {e.event}
                    </td>
                    <td className={cn('px-2 py-2 font-semibold capitalize', impactClass(e.impact))}>
                      {e.impact || 'low'}
                    </td>
                    <td className="hidden px-2 py-2 text-right tabular-nums sm:table-cell">
                      {fmtNum(e.actual)}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums text-muted-foreground sm:px-5">
                      {fmtNum(e.estimate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-[var(--card-border)] bg-card">
        <div className="flex items-center justify-between border-b border-[var(--card-border)] px-4 py-3.5 sm:px-5">
          <h2 className="text-sm font-semibold text-foreground">Market News</h2>
          <Link href="/markets" className="text-[11px] font-medium text-primary hover:underline">
            View all
          </Link>
        </div>
        <div className="min-h-0 flex-1 space-y-1 overflow-auto p-2">
          {newsLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-xl bg-muted/40" />
            ))
          ) : newsWithImages(news).length === 0 ? (
            <p className="px-3 py-8 text-center text-xs text-muted-foreground">
              No photo headlines right now.
            </p>
          ) : (
            newsWithImages(news)
              .slice(0, 6)
              .map((item) => {
                const imageUrl = isUsableNewsImageUrl(item.image)
                  ? item.image!
                  : null;
                if (!imageUrl) return null;
                return (
                  <a
                    key={item.id}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex gap-2.5 rounded-xl px-2 py-2 transition-colors hover:bg-muted/40"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={newsImageSrc(imageUrl)}
                      alt=""
                      loading="lazy"
                      className="h-11 w-14 shrink-0 rounded-lg object-cover bg-muted"
                      onError={(e) => {
                        (
                          e.currentTarget.closest('a') as HTMLElement | null
                        )?.remove();
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="mb-0.5 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <span className="font-semibold uppercase tracking-wide text-primary/80">
                          {item.category || 'Market'}
                        </span>
                        <span>·</span>
                        <span>{item.source}</span>
                        <span>·</span>
                        <span>{relativeTime(item.datetime)}</span>
                      </div>
                      <p className="line-clamp-2 text-xs font-medium leading-snug text-foreground">
                        {item.headline}
                      </p>
                    </div>
                  </a>
                );
              })
          )}
        </div>
      </div>
    </div>
  );
}
