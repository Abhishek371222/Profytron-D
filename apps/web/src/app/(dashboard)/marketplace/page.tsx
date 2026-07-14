'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { LayoutGrid, List, Search, SlidersHorizontal, ChevronDown, Server, ArrowRight, Sparkles } from 'lucide-react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { MarketplaceHero } from '@/components/marketplace/MarketplaceHero';
import { FilterSidebar } from '@/components/marketplace/FilterSidebar';
import { MarketplaceCard } from '@/components/marketplace/MarketplaceCard';
import { SubscribeModal } from '@/components/marketplace/SubscribeModal';
import { MarketplaceSkeleton } from '@/components/skeletons/MarketplaceSkeleton';
import { cn } from '@/lib/utils';
import { marketplaceApi, SubscriptionBillingModel } from '@/lib/api/marketplace';
import { apiClient, unwrapApiResponse } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useBreakpoint } from '@/lib/hooks/useBreakpoint';
import { formatBotName } from '@/lib/bot-labels';

const FeaturedRow = dynamic(
  () =>
    import('@/components/marketplace/FeaturedRow').then((m) => ({
      default: m.FeaturedRow,
    })),
  {
    ssr: false,
    loading: () => <div className="h-[220px] rounded-xl bg-muted/40 animate-pulse" />,
  },
);

const MarketplaceStrategyTable = dynamic(
  () =>
    import('@/components/marketplace/MarketplaceStrategyTable').then((m) => ({
      default: m.MarketplaceStrategyTable,
    })),
  {
    ssr: false,
    loading: () => <div className="h-[400px] rounded-xl bg-muted/40 animate-pulse" />,
  },
);

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
  const { isMobile, width } = useBreakpoint();
  const [isFilterOpen, setIsFilterOpen] = React.useState(false);
  const desktopFilterInitialized = React.useRef(false);
  const [viewType, setViewType] = React.useState<'grid' | 'list'>('list');
  const [selectedStrategy, setSelectedStrategy] = React.useState<Record<string, unknown> | null>(null);
  const [selectedBillingModel, setSelectedBillingModel] = React.useState<SubscriptionBillingModel>('FIXED');

  const openSubscribe = (strategy: unknown, billingModel: SubscriptionBillingModel = 'FIXED') => {
    setSelectedBillingModel(billingModel);
    setSelectedStrategy(strategy as Record<string, unknown>);
  };
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
    if (width == null) return;

    if (width >= 1024 && !desktopFilterInitialized.current) {
      setIsFilterOpen(true);
      desktopFilterInitialized.current = true;
    }

    if (isMobile) {
      setIsFilterOpen(false);
      setViewType('grid');
    }
  }, [isMobile, width]);

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

  const myBotsQuery = useQuery({
    queryKey: ['my-bots-count'],
    queryFn: async () => {
      const res = await apiClient.get('/strategies/my');
      const bots = unwrapApiResponse<Array<{ status?: string }>>(res.data) ?? [];
      return bots.filter((b) => b.status === 'ACTIVE').length;
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
  const activeBotsCount = myBotsQuery.data ?? 0;

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
        assetClass: filters.selectedAssets[0],
        timeframe: filters.selectedTimeframes[0],
        priceMax: filters.priceMax || undefined,
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage?.nextCursor ?? undefined,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const mappedStrategies = React.useMemo(() => {
    const items = marketplaceQuery.data?.pages.flatMap((page) => page.items) ?? [];

    return items.map((item: Record<string, unknown>) => {
      const strategy = item.strategy as Record<string, unknown>;
      const perf = (strategy.performance as Record<string, unknown>[])?.[0] ?? {};
      const assetClass = strategy.assetClass ? String(strategy.assetClass) : 'Unknown';
      // A strategy can trade several markets (creator's Add Bot form is
      // multi-select), but Strategy.assetClass only stores the first one.
      // Fall back to the full list stashed in configJson.markets so the
      // asset-class filter matches every market this strategy actually
      // trades, not just its primary one — keeps this list consistent with
      // the strategy detail page, which already shows all configJson.markets.
      const configMarkets = (strategy.configJson as Record<string, unknown> | undefined)?.markets;
      const allMarkets = Array.isArray(configMarkets) && configMarkets.length > 0
        ? configMarkets.map(String)
        : [assetClass];
      return {
        id: String(item.strategyId),
        name: formatBotName(String(strategy.name)),
        category: String(strategy.category),
        creator: (strategy.creator as { fullName?: string })?.fullName || 'Unknown',
        verified: Boolean(strategy.isVerified),
        assetClass,
        allMarkets,
        timeframe: strategy.timeframe ? String(strategy.timeframe).toUpperCase() : 'Unknown',
        price: Number(item.monthlyPrice || 0),
        monthlyPrice: Number(item.monthlyPrice || 0),
        subscribers: Number(strategy.copiesCount || 0),
        returns: Number(perf.winRate || 0),
        risk: String(strategy.riskLevel || 'Medium'),
        sharpe: Number(perf.sharpeRatio || 0),
        drawdown: Number(perf.maxDrawdown || 0),
        rating: Number(item.rating || 0),
        reviewCount: Number(item.reviewCount || 0),
      };
    });
  }, [marketplaceQuery.data]);

  const strategies = React.useMemo(() => {
    const normalizedQuery = debouncedSearch.trim().toLowerCase();
    const filtered = mappedStrategies.filter((s) => {
      if (filters.verifiedOnly && !s.verified) return false;
      if (filters.selectedRisks.length && !filters.selectedRisks.includes(s.risk.toLowerCase())) return false;
      if (filters.selectedAssets.length && !filters.selectedAssets.some((a) => s.allMarkets.includes(a))) return false;
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
    const avgWin =
      mappedStrategies.length > 0
        ? mappedStrategies.reduce((sum, s) => sum + s.returns, 0) / mappedStrategies.length
        : 0;
    const assetsManaged = mappedStrategies.reduce((sum, s) => sum + s.subscribers * Math.max(s.price, 100), 0);
    return {
      totalStrategies: marketplaceQuery.data?.pages[0]?.total ?? mappedStrategies.length,
      totalSubscribers: mappedStrategies.reduce((sum, s) => sum + s.subscribers, 0),
      verifiedCreators: creators.size,
      assetsManaged,
      successRate: avgWin,
      strategiesGrowthPct: 14,
      subscribersGrowth: Math.max(842, Math.round(mappedStrategies.reduce((sum, s) => sum + s.subscribers, 0) * 0.12)),
      countriesCount: 74,
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
    <div className="marketplace-page brand-surface-bg flex min-h-0 min-w-0 w-full flex-1 flex-col">
      <MarketplaceHero {...heroStats} />

      <div className="marketplace-body min-h-0 min-w-0 w-full flex-1 overflow-y-auto overflow-x-hidden pb-10">
        <FeaturedRow strategies={featuredStrategies} onSubscribe={openSubscribe} />

        <div className="mt-6 flex min-h-0 min-w-0 w-full flex-1">
          <FilterSidebar
            isOpen={isFilterOpen}
            onClose={() => setIsFilterOpen(false)}
            value={filters}
            onChange={setFilters}
            onSavePreset={savePreset}
          />

          <div id="marketplace-all-bots" className="min-w-0 w-full flex-1 space-y-4 px-[var(--dashboard-p)] scroll-mt-24">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-lg font-bold text-foreground">All Bots</h2>
                  <span className="rounded-full border border-[color-mix(in_srgb,var(--primary)_22%,var(--card-border))] bg-[color-mix(in_srgb,var(--primary)_8%,transparent)] px-2.5 py-0.5 text-[11px] font-bold text-primary">
                    {strategies.length} results
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Institutional strategies ranked by performance and subscriber trust
                </p>
              </div>

              <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                <Link
                  href="/my-bots"
                  className="inline-flex h-[var(--control-h-sm)] min-h-[var(--touch-min)] w-full items-center justify-center gap-1.5 rounded-[var(--radius-button)] border border-[color-mix(in_srgb,var(--primary)_28%,var(--card-border))] bg-[color-mix(in_srgb,var(--primary)_8%,transparent)] px-3 text-xs font-semibold text-primary transition-all duration-200 hover:bg-[color-mix(in_srgb,var(--primary)_14%,transparent)] sm:w-auto"
                >
                  <Server className="h-3.5 w-3.5" />
                  My Bots
                  <span className="rounded-full bg-[color-mix(in_srgb,var(--primary)_15%,transparent)] px-1.5 py-0.5 text-[10px] font-bold">
                    {activeBotsCount} active
                  </span>
                  <ArrowRight className="h-3 w-3 opacity-70" />
                </Link>

                <div className="relative w-full min-w-0 sm:w-auto">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search bots, developers…"
                    aria-label="Search bots and developers"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-[var(--control-h-sm)] min-h-[var(--touch-min)] w-full min-w-0 rounded-[var(--radius-input)] border border-[var(--card-border)] bg-card pl-9 pr-3 text-sm outline-none transition-colors duration-200 focus:border-[color-mix(in_srgb,var(--primary)_40%,var(--card-border))] sm:w-52 md:w-64"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setSortBy(sortOrder[(sortOrder.indexOf(sortBy) + 1) % sortOrder.length])}
                  className="flex h-[var(--control-h-sm)] items-center gap-2 rounded-[var(--radius-button)] border border-[var(--card-border)] bg-card px-3 text-xs font-semibold capitalize text-muted-foreground transition-colors hover:text-foreground"
                >
                  {sortLabel}
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>

                <div className="flex rounded-[var(--radius-button)] border border-[var(--card-border)] bg-[color-mix(in_srgb,var(--muted)_35%,transparent)] p-0.5">
                  <button
                    type="button"
                    onClick={() => setViewType('grid')}
                    className={cn(
                      'rounded-[12px] p-1.5 transition-all duration-200',
                      viewType === 'grid' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground',
                    )}
                    aria-label="Grid view"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewType('list')}
                    className={cn(
                      'rounded-[12px] p-1.5 transition-all duration-200',
                      viewType === 'list' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground',
                    )}
                    aria-label="List view"
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className={cn(
                    'flex h-[var(--control-h-sm)] min-h-[var(--touch-min)] items-center gap-2 rounded-[var(--radius-button)] border border-[var(--card-border)] bg-card px-3 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground',
                    isFilterOpen && 'border-[color-mix(in_srgb,var(--primary)_40%,var(--card-border))] text-primary',
                  )}
                  aria-label="Toggle filters"
                  aria-pressed={isFilterOpen}
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  <span className="hidden sm:inline">Filters</span>
                </button>
              </div>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="marketplace-skeleton h-64 rounded-[var(--radius-card)]" />
                ))}
              </div>
            ) : viewType === 'list' ? (
              <MarketplaceStrategyTable strategies={strategies} onSubscribe={openSubscribe} />
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {strategies.map((s) => (
                  <MarketplaceCard key={s.id} strategy={s} onSubscribe={openSubscribe} />
                ))}
              </div>
            )}

            {!isLoading && strategies.length === 0 && (
              <div className="rounded-[var(--radius-card)] border border-[var(--card-border)] bg-card p-12 text-center shadow-[var(--shadow-card)]">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-[18px] bg-[color-mix(in_srgb,var(--primary)_10%,transparent)] text-primary">
                  <Sparkles className="h-7 w-7" />
                </div>
                <p className="text-base font-semibold text-foreground">No bots match your filters</p>
                <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                  Adjust your risk, market, or pricing filters — or explore featured strategies above.
                </p>
                <Button variant="outline" className="mt-5" onClick={resetFilters}>
                  Reset Filters
                </Button>
              </div>
            )}

            {marketplaceQuery.hasNextPage && (
              <div className="flex justify-center pt-4">
                <Button
                  variant="outline"
                  onClick={() => marketplaceQuery.fetchNextPage()}
                  disabled={marketplaceQuery.isFetchingNextPage}
                >
                  {marketplaceQuery.isFetchingNextPage ? 'Loading…' : 'Load more'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <SubscribeModal
        strategy={selectedStrategy}
        isOpen={!!selectedStrategy}
        initialBillingModel={selectedBillingModel}
        onClose={() => setSelectedStrategy(null)}
      />
    </div>
  );
}

export default function MarketplacePage() {
  return (
    <Suspense fallback={<MarketplaceSkeleton />}>
      <MarketplacePageInner />
    </Suspense>
  );
}
