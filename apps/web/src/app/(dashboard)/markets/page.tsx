'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { useQuery } from '@tanstack/react-query';
import { ExternalLink, Newspaper, RefreshCcw } from 'lucide-react';
import {
  DashboardPage,
  DashboardBreadcrumbs,
  DashboardPageHeader,
} from '@/components/dashboard/DashboardPrimitives';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  marketApi,
  type MarketNewsCategory,
  type MarketNewsItem,
} from '@/lib/api/market';

const TradingViewAdvancedChart = dynamic(
  () => import('@/components/charts/TradingViewAdvancedChart'),
  {
    ssr: false,
    loading: () => (
      <div className="h-[560px] w-full animate-pulse rounded-2xl bg-muted/40" />
    ),
  },
);

const NEWS_CATEGORIES: { id: MarketNewsCategory; label: string }[] = [
  { id: 'general', label: 'General' },
  { id: 'forex', label: 'Forex' },
  { id: 'crypto', label: 'Crypto' },
  { id: 'merger', label: 'M&A' },
];

function formatNewsTime(value: string) {
  try {
    return new Intl.DateTimeFormat('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'Asia/Kolkata',
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function NewsCard({ item }: { item: MarketNewsItem }) {
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex gap-3 rounded-2xl border border-[var(--card-border)] bg-card p-3.5 transition-colors hover:border-primary/30 hover:bg-muted/30"
    >
      {item.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.image}
          alt=""
          className="h-16 w-20 shrink-0 rounded-xl object-cover bg-muted"
        />
      ) : (
        <div className="flex h-16 w-20 shrink-0 items-center justify-center rounded-xl bg-muted/50">
          <Newspaper className="h-5 w-5 text-muted-foreground" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2 text-[11px] text-muted-foreground">
          <span className="font-semibold uppercase tracking-wide text-primary/80">
            {item.source}
          </span>
          <span>·</span>
          <span>{formatNewsTime(item.datetime)}</span>
        </div>
        <p className="line-clamp-2 text-sm font-semibold text-foreground group-hover:text-primary">
          {item.headline}
        </p>
        {item.summary ? (
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
            {item.summary}
          </p>
        ) : null}
      </div>
      <ExternalLink className="mt-1 h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
    </a>
  );
}

export default function MarketsPage() {
  const [category, setCategory] = React.useState<MarketNewsCategory>('general');

  const newsQuery = useQuery({
    queryKey: ['market-news', category],
    queryFn: () => marketApi.getNews({ category }),
    staleTime: 60_000,
    refetchInterval: 120_000,
  });

  return (
    <DashboardPage>
      <DashboardBreadcrumbs
        items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Markets' }]}
      />
      <DashboardPageHeader
        title="Markets"
        description="Live TradingView charts and Finnhub market news."
        icon={Newspaper}
        actions={
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => newsQuery.refetch()}
            disabled={newsQuery.isFetching}
            className="gap-2"
          >
            <RefreshCcw
              className={cn('h-3.5 w-3.5', newsQuery.isFetching && 'animate-spin')}
            />
            Refresh news
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.9fr)]">
        <section className="min-w-0">
          <TradingViewAdvancedChart height={620} symbol="OANDA:XAUUSD" />
        </section>

        <section className="min-w-0 flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            {NEWS_CATEGORIES.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setCategory(item.id)}
                className={cn(
                  'rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors',
                  category === item.id
                    ? 'border-primary/40 bg-primary/10 text-primary'
                    : 'border-[var(--card-border)] bg-card text-muted-foreground hover:text-foreground',
                )}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="flex max-h-[620px] flex-col gap-2.5 overflow-y-auto custom-scrollbar pr-1">
            {newsQuery.isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-[88px] animate-pulse rounded-2xl bg-muted/40"
                />
              ))
            ) : newsQuery.isError ? (
              <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                Couldn&apos;t load news right now. Check FINNHUB_API_KEY and try again.
              </div>
            ) : (newsQuery.data?.items?.length ?? 0) === 0 ? (
              <div className="rounded-2xl border border-[var(--card-border)] bg-card p-4 text-sm text-muted-foreground">
                No headlines for this category yet.
              </div>
            ) : (
              newsQuery.data?.items.map((item) => (
                <NewsCard key={`${item.id}-${item.url}`} item={item} />
              ))
            )}
          </div>
        </section>
      </div>
    </DashboardPage>
  );
}
