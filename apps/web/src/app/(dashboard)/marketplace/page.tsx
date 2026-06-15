'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { LayoutGrid, List, Search, SlidersHorizontal, ChevronDown, ChevronRight } from 'lucide-react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { MarketplaceHero } from '@/components/marketplace/MarketplaceHero';
import { FeaturedRow } from '@/components/marketplace/FeaturedRow';
import { FilterSidebar } from '@/components/marketplace/FilterSidebar';
import { MarketplaceCard } from '@/components/marketplace/MarketplaceCard';
import { MarketplaceStrategyTable } from '@/components/marketplace/MarketplaceStrategyTable';
import { SubscribeModal } from '@/components/marketplace/SubscribeModal';
import { MarketplaceSkeleton } from '@/components/skeletons/MarketplaceSkeleton';
import { cn } from '@/lib/utils';
import { marketplaceApi } from '@/lib/api/marketplace';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { formatBotName } from '@/lib/bot-labels';

function useDebouncedValue<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function MarketplacePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isFilterOpen, setIsFilterOpen] = React.useState(true);
  const [viewType, setViewType] = React.useState<'grid' | 'list'>('list');
  const [selectedStrategy, setSelectedStrategy] = React.useState<Record<string, unknown> | null>(null);

  const openSubscribe = (strategy: unknown) => setSelectedStrategy(strategy as Record<string, unknown>);
  const [searchQuery, setSearchQuery] = React.useState(searchParams.get('q') || '');
  const [sortBy, setSortBy] = React.useState<'trending' | 'top-rated' | 'newest' | 'price' | 'performance' | 'subscribers'>(
    (searchParams.get('sort') as 'trending') || 'trending',
  );
  const sortOrder: Array<'trending' | 'top-rated' | 'newest' | 'price' | 'performance' | 'subscribers'> = [
    'trending', 'top-rated', 'newest', 'performance', 'subscribers', 'price',
  ];
  const [filters, setFilters] = React.useState({
    priceMax: Number(searchParams.get('priceMax') || 0),
    selectedRisks: searchParams.get('riskLevel') ? [searchParams.get('riskLevel')!.toLowerCase()] : [] as string[],
    selectedAssets: (searchParams.get('assets') || '').split(',').map((v) => v.trim()).filter(Boolean),
    selectedTimeframes: (searchParams.get('tfs') || '').split(',').map((v) => v.trim().toUpperCase()).filter(Boolean),
    verifiedOnly: searchParams.get('verified') === 'true',
  });

  const lastUrlSync = React.useRef<string | null>(searchParams.toString() || '');
  const debouncedSearch = useDebouncedValue(searchQuery);

  React.useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set('q', debouncedSearch);
    params.set('sort', sortBy);
    if (filters.verifiedOnly) params.set('verified', 'true');
    if (filters.selectedRisks[0]) params.set('riskLevel', filters.selectedRisks[0].toUpperCase());
    if (filters.selectedAssets.length) params.set('assets', filters.selectedAssets.join(','));
    if (filters.selectedTimeframes.length) params.set('tfs', filters.selectedTimeframes.join(','));
    if (filters.priceMax > 0) params.set('priceMax', String(filters.priceMax));

    const next = params.toString();
    if (next === lastUrlSync.current) return;
    lastUrlSync.current = next;
    router.replace(next ? `/marketplace?${next}` : '/marketplace', { scroll: false });
  }, [debouncedSearch, sortBy, filters, router]);

  const featuredQuery = useQuery({
    queryKey: ['marketplace-featured'],
    queryFn: () => marketplaceApi.getFeatured(),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const marketplaceQuery = useInfiniteQuery({
    queryKey: ['marketplace', debouncedSearch, sortBy, filters],
    queryFn: ({ pageParam }) =>
      marketplaceApi.getMarketplace({
        limit: 20,
        cursor: pageParam || undefined,
        sort: sortBy,
        q: debouncedSearch || undefined,
        verified: filters.verifiedOnly || undefined,
        riskLevel: filters.selectedRisks[0]?.toUpperCase(),
        priceMax: filters.priceMax || undefined,
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage?.nextCursor ?? undefined,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const mappedStrategies = React.useMemo(() => {
    const items = marketplaceQuery.data?.pages.flatMap((page) => page.items) ?? [];
    const defaultAssets = ['Forex', 'Crypto', 'Indices', 'Commodities'];
    const defaultTimeframes = ['M1', 'M5', 'M15', 'H1', 'H4', 'D1'];
    const hash = (seed: string, len: number) => {
      let h = 0;
      for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
      return h % len;
    };

    return items.map((item: Record<string, unknown>) => {
      const strategy = item.strategy as Record<string, unknown>;
      const perf = (strategy.performance as Record<string, unknown>[])?.[0] ?? {};
      return {
        id: String(item.strategyId),
        name: formatBotName(String(strategy.name)),
        category: String(strategy.category),
        creator: (strategy.creator as { fullName?: string })?.fullName || 'Unknown',
        verified: Boolean(strategy.isVerified),
        assetClass: String(strategy.assetClass || defaultAssets[hash(String(item.strategyId), defaultAssets.length)]),
        timeframe: String(strategy.timeframe || defaultTimeframes[hash(`tf-${item.strategyId}`, defaultTimeframes.length)]).toUpperCase(),
        price: Number(item.monthlyPrice || 0),
        monthlyPrice: Number(item.monthlyPrice || 0),
        subscribers: Number(strategy.copiesCount || 0),
        returns: Number(perf.winRate || 0),
        risk: String(strategy.riskLevel || 'Medium'),
        sharpe: Number(perf.sharpeRatio || 0),
        drawdown: Number(perf.maxDrawdown || 0),
      };
    });
  }, [marketplaceQuery.data]);

  const strategies = React.useMemo(() => {
    const normalizedQuery = debouncedSearch.trim().toLowerCase();
    const filtered = mappedStrategies.filter((s) => {
      if (filters.verifiedOnly && !s.verified) return false;
      if (filters.selectedRisks.length && !filters.selectedRisks.includes(s.risk.toLowerCase())) return false;
      if (filters.selectedAssets.length && !filters.selectedAssets.includes(s.assetClass)) return false;
      if (filters.selectedTimeframes.length && !filters.selectedTimeframes.includes(s.timeframe)) return false;
      if (filters.priceMax > 0 && s.price > filters.priceMax) return false;
      if (normalizedQuery) {
        const target = `${s.name} ${s.creator} ${s.category}`.toLowerCase();
        if (!target.includes(normalizedQuery)) return false;
      }
      return true;
    });

    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'price': return a.price - b.price;
        case 'performance': return b.returns - a.returns;
        case 'subscribers': return b.subscribers - a.subscribers;
        case 'top-rated': return b.sharpe - a.sharpe;
        case 'newest': return String(b.id).localeCompare(String(a.id));
        default: return b.subscribers * 0.6 + b.returns * 10 - (a.subscribers * 0.6 + a.returns * 10);
      }
    });
  }, [filters, mappedStrategies, debouncedSearch, sortBy]);

  const heroStats = React.useMemo(() => {
    const creators = new Set(mappedStrategies.filter((s) => s.verified).map((s) => s.creator));
    return {
      totalStrategies: marketplaceQuery.data?.pages[0]?.total ?? mappedStrategies.length,
      totalSubscribers: mappedStrategies.reduce((sum, s) => sum + s.subscribers, 0),
      verifiedCreators: creators.size,
    };
  }, [mappedStrategies, marketplaceQuery.data]);

  const featuredStrategies = React.useMemo(() => {
    return (featuredQuery.data ?? []).map((item: Record<string, unknown>) => {
      const strategy = item.strategy as Record<string, unknown>;
      const perf = (strategy.performance as Record<string, unknown>[])?.[0] ?? {};
      const winRate = Number(perf.winRate || 0);
      return {
        id: String(item.strategyId),
        name: formatBotName(String(strategy.name)),
        returns: `+${winRate.toFixed(1)}%`,
        subscribers: `${Number(strategy.copiesCount || 0).toLocaleString()} traders`,
        creator: (strategy.creator as { fullName?: string })?.fullName || 'Unknown',
        category: String(strategy.category),
        verified: Boolean(strategy.isVerified),
        price: Number(item.monthlyPrice || 0),
        monthlyPrice: Number(item.monthlyPrice || 0),
        sharpe: Number(perf.sharpeRatio || 0),
        maxDrawdown: Number(perf.maxDrawdown || 0),
        returnsValue: winRate,
        subscribersValue: Number(strategy.copiesCount || 0),
        chartData: Array.from({ length: 10 }, (_, i) => ({ val: 10 + winRate * 0.4 + Math.sin(i) * 8 + i * 2 })),
      };
    });
  }, [featuredQuery.data]);

  const savePreset = () => {
    localStorage.setItem('marketplace-filters-preset', JSON.stringify(filters));
    toast.success('Filter preset saved');
  };

  React.useEffect(() => {
    const preset = localStorage.getItem('marketplace-filters-preset');
    if (!preset) return;
    try {
      const parsed = JSON.parse(preset);
      setFilters((c) => ({ ...c, ...parsed }));
    } catch { /* ignore */ }
  }, []);

  const resetFilters = () => {
    setSearchQuery('');
    setSortBy('trending');
    setFilters({ priceMax: 0, selectedRisks: [], selectedAssets: [], selectedTimeframes: [], verifiedOnly: false });
  };

  const isLoading = marketplaceQuery.isLoading && !marketplaceQuery.data;
  const sortLabel = sortBy.replace('-', ' ');

  return (
    <main className="flex-1 flex flex-col min-h-0 bg-[#F8F9FE]">
      <div className="px-5 md:px-6 pt-4 pb-0">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-primary">
          <Link href="/dashboard" className="hover:underline">Dashboard</Link>
          <ChevronRight className="h-3 w-3 text-muted-foreground" />
          <span className="text-foreground">Marketplace</span>
        </div>
      </div>

      <MarketplaceHero {...heroStats} />

      <div className="flex-1 flex min-h-0 overflow-hidden">
        <FilterSidebar
          isOpen={isFilterOpen}
          onClose={() => setIsFilterOpen(false)}
          value={filters}
          onChange={setFilters}
          onApply={() => marketplaceQuery.refetch()}
          onSavePreset={savePreset}
        />

        <div className="flex-1 overflow-y-auto min-h-0 pb-10">
          <FeaturedRow strategies={featuredStrategies} onSubscribe={openSubscribe} />

          <div className="px-5 md:px-6 mt-6 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-foreground">All Strategies</h2>
                  <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-bold">
                    {strategies.length} results
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search strategies..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-9 w-52 md:w-64 rounded-xl border border-[var(--card-border)] bg-card pl-9 pr-3 text-sm outline-none focus:border-primary/40"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setSortBy(sortOrder[(sortOrder.indexOf(sortBy) + 1) % sortOrder.length])}
                  className="h-9 px-3 rounded-xl border border-[var(--card-border)] bg-card flex items-center gap-2 text-xs font-semibold text-muted-foreground capitalize"
                >
                  {sortLabel}
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
                <div className="flex p-0.5 rounded-xl border border-[var(--card-border)] bg-muted0">
                  <button type="button" onClick={() => setViewType('grid')} className={cn('p-1.5 rounded-lg', viewType === 'grid' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground')} aria-label="Grid">
                    <LayoutGrid className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => setViewType('list')} className={cn('p-1.5 rounded-lg', viewType === 'list' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground')} aria-label="List">
                    <List className="h-4 w-4" />
                  </button>
                </div>
                <button type="button" onClick={() => setIsFilterOpen(!isFilterOpen)} className="lg:hidden h-9 w-9 rounded-xl border border-[var(--card-border)] bg-card flex items-center justify-center text-muted-foreground">
                  <SlidersHorizontal className="h-4 w-4" />
                </button>
              </div>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="dashboard-card h-64 animate-pulse bg-muted/40" />
                ))}
              </div>
            ) : viewType === 'list' ? (
              <MarketplaceStrategyTable strategies={strategies} onSubscribe={openSubscribe} />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {strategies.map((s) => (
                  <MarketplaceCard key={s.id} strategy={s} onSubscribe={openSubscribe} />
                ))}
              </div>
            )}

            {!isLoading && strategies.length === 0 && (
              <div className="dashboard-card p-8 text-center">
                <p className="text-sm font-semibold text-foreground">No strategies match your filters.</p>
                <Button variant="outline" className="mt-4 rounded-xl" onClick={resetFilters}>Reset Filters</Button>
              </div>
            )}

            {marketplaceQuery.hasNextPage && (
              <div className="flex justify-center pt-4">
                <Button variant="outline" className="rounded-xl" onClick={() => marketplaceQuery.fetchNextPage()} disabled={marketplaceQuery.isFetchingNextPage}>
                  {marketplaceQuery.isFetchingNextPage ? 'Loading…' : 'Load more'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <SubscribeModal strategy={selectedStrategy} isOpen={!!selectedStrategy} onClose={() => setSelectedStrategy(null)} />
    </main>
  );
}

export default function MarketplacePage() {
  return (
    <Suspense fallback={<MarketplaceSkeleton />}>
      <MarketplacePageInner />
    </Suspense>
  );
}
