'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, ShieldCheck, Sparkles, Star } from 'lucide-react';
import { marketplaceApi } from '@/lib/api/marketplace';
import { formatBotName } from '@/lib/bot-labels';
import { useCurrency } from '@/lib/hooks/useCurrency';

type RecommendedBotsProps = {
  ownedIds: Set<string>;
  enabled: boolean;
};

/**
 * Isolated chunk: marketplace recommend API + UI stay off the /my-bots critical path
 * until the parent arms `enabled` after idle.
 */
export function RecommendedBots({ ownedIds, enabled }: RecommendedBotsProps) {
  const { formatPrice } = useCurrency();

  const recommendedQuery = useQuery({
    queryKey: ['marketplace-recommended'],
    queryFn: () => marketplaceApi.getMarketplace({ limit: 9, sort: 'trending' }),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    enabled,
  });

  const recommended = ((recommendedQuery.data?.items ?? []) as Array<Record<string, unknown>>)
    .filter((item) => !ownedIds.has(String(item.strategyId)))
    .slice(0, 3)
    .map((item) => {
      const strategy = item.strategy as Record<string, unknown>;
      const perf = (strategy.performance as Record<string, unknown>[])?.[0] ?? {};
      return {
        id: String(item.strategyId),
        name: formatBotName(String(strategy.name)),
        category: String(strategy.category ?? ''),
        creator: (strategy.creator as { fullName?: string })?.fullName || 'Unknown',
        verified: Boolean(strategy.isVerified),
        winRate: Number(perf.winRate || 0),
        subscribers: Number(strategy.copiesCount || 0),
        monthlyPrice: Number(item.monthlyPrice || 0),
      };
    });

  if (!enabled) {
    return <div className="min-h-[13rem]" aria-hidden />;
  }

  if (recommendedQuery.isPending || recommendedQuery.isFetching) {
    return (
      <div className="space-y-4" aria-busy="true">
        <div className="h-5 w-48 rounded-lg bg-muted/60" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="marketplace-skeleton h-52 min-h-[13rem] rounded-[var(--radius-card)]"
            />
          ))}
        </div>
      </div>
    );
  }

  if (recommended.length === 0) {
    return <div className="min-h-0" aria-hidden />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Sparkles className="h-4 w-4 text-primary" />
          <h2 className="text-base font-bold text-foreground">Recommended for you</h2>
        </div>
        <Link
          href="/marketplace"
          className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
        >
          View all <ChevronRight className="h-3 w-3" />
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {recommended.map((rec) => (
          <div
            key={rec.id}
            className="flex min-h-[13rem] flex-col gap-3 rounded-[var(--radius-card)] border border-[var(--card-border)] bg-card p-5 shadow-[var(--shadow-card)] transition-shadow duration-[250ms] hover:-translate-y-1 hover:shadow-[var(--shadow-card-hover)]"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                  {rec.category || 'STRATEGY'}
                </p>
                <h3 className="truncate text-sm font-bold text-foreground">{rec.name}</h3>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">by {rec.creator}</p>
              </div>
              {rec.verified && (
                <span className="flex shrink-0 items-center gap-1 rounded-full bg-[color-mix(in_srgb,var(--primary)_10%,transparent)] px-2 py-0.5 text-[10px] font-bold uppercase text-primary">
                  <ShieldCheck className="h-3 w-3" /> Verified
                </span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2 rounded-[12px] bg-[color-mix(in_srgb,var(--muted)_35%,transparent)] p-3 text-center">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                  Win Rate
                </p>
                <p className="text-sm font-bold tabular-nums text-primary">
                  {rec.winRate.toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                  Subs
                </p>
                <p className="text-sm font-bold tabular-nums text-foreground">
                  {rec.subscribers.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                  Price
                </p>
                <p className="text-sm font-bold tabular-nums text-foreground">
                  {rec.monthlyPrice > 0 ? formatPrice(rec.monthlyPrice) : 'FREE'}
                </p>
              </div>
            </div>
            <Link
              href={`/marketplace/${rec.id}`}
              className="flex h-9 items-center justify-center gap-1.5 rounded-[10px] border border-[color-mix(in_srgb,var(--primary)_20%,var(--card-border))] bg-[color-mix(in_srgb,var(--primary)_8%,transparent)] text-xs font-bold text-primary transition-colors duration-200 hover:bg-[color-mix(in_srgb,var(--primary)_14%,transparent)]"
            >
              <Star className="h-3.5 w-3.5" /> View Strategy
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
