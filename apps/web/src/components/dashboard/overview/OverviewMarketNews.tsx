'use client';

import React from 'react';
import Link from 'next/link';
import { Newspaper } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MarketNewsCategory, MarketNewsItem } from '@/lib/api/market';
import { relativeTime } from './overview-utils';

const TABS: { id: MarketNewsCategory; label: string }[] = [
  { id: 'forex', label: 'Forex' },
  { id: 'crypto', label: 'Crypto' },
  { id: 'general', label: 'General' },
  { id: 'merger', label: 'M&A' },
];

type Props = {
  news: MarketNewsItem[];
  category: MarketNewsCategory;
  onCategoryChange: (c: MarketNewsCategory) => void;
  loading?: boolean;
};

export function OverviewMarketNews({
  news,
  category,
  onCategoryChange,
  loading,
}: Props) {
  return (
    <div className="flex h-full min-h-[280px] flex-col overflow-hidden rounded-xl border border-[var(--card-border)] bg-card">
      <div className="flex items-center justify-between border-b border-[var(--card-border)] px-4 py-3">
        <h2 className="text-sm font-semibold text-foreground">Market News</h2>
        <Link href="/markets" className="text-[11px] font-medium text-primary hover:underline">
          View All
        </Link>
      </div>

      <div className="flex gap-1 border-b border-[var(--card-border)] px-2 pt-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onCategoryChange(tab.id)}
            className={cn(
              'rounded-t-md px-2.5 py-2 text-[11px] font-semibold transition-colors',
              category === tab.id
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 space-y-0.5 overflow-auto p-2">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-muted/40" />
          ))
        ) : news.length === 0 ? (
          <p className="px-3 py-10 text-center text-xs text-muted-foreground">
            No headlines right now.
          </p>
        ) : (
          news.slice(0, 6).map((item) => (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex gap-2.5 rounded-xl px-2 py-2 transition-colors hover:bg-muted/40"
            >
              {item.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.image}
                  alt=""
                  className="h-11 w-14 shrink-0 rounded-lg object-cover bg-muted"
                />
              ) : (
                <div className="flex h-11 w-14 shrink-0 items-center justify-center rounded-lg bg-muted/50">
                  <Newspaper className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="mb-0.5 flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground">
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
          ))
        )}
      </div>
    </div>
  );
}
