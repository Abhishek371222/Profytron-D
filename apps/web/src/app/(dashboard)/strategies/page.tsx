'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { strategiesApi, type Strategy } from '@/lib/api/strategies';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Search, Grid, List, Shield, Activity, Database } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { StrategyActivationModal } from '@/components/strategies/StrategyActivationModal';
import { DashErrorState } from '@/components/dashboard/DashboardPrimitives';
import {
  FilterPill,
  STRATEGY_CATEGORIES,
  StrategiesBreadcrumbs,
  StrategiesPageHeader,
} from './_components/StrategiesShared';
import { StrategyCard } from './_components/StrategyCard';

function useDebouncedValue<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function StrategiesPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = React.useState<'library' | 'my-strategies'>('library');
  const [searchQuery, setSearchQuery] = React.useState('');
  const debouncedSearch = useDebouncedValue(searchQuery);
  const [selectedCategory, setSelectedCategory] = React.useState('ALL');
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid');
  const [verifiedOnly, setVerifiedOnly] = React.useState(false);
  const [sortBy, setSortBy] = React.useState('createdAt');
  const [isActivationOpen, setIsActivationOpen] = React.useState(false);
  const [selectedStrategy, setSelectedStrategy] = React.useState<Strategy | null>(null);

  const {
    data: libraryData,
    isLoading: libraryLoading,
    isError: libraryError,
    refetch: refetchLibrary,
  } = useQuery({
    queryKey: ['strategies', selectedCategory, verifiedOnly, debouncedSearch, sortBy],
    queryFn: () =>
      strategiesApi.getStrategies({
        category: selectedCategory === 'ALL' ? undefined : selectedCategory,
        isVerified: verifiedOnly || undefined,
        search: debouncedSearch || undefined,
        sortBy: sortBy as 'winRate' | 'sharpeRatio' | 'copiesCount' | 'createdAt' | 'price',
      }),
    enabled: activeTab === 'library',
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const {
    data: myStrategies,
    isLoading: myLoading,
    isError: myStrategiesError,
    refetch: refetchMyStrategies,
  } = useQuery({
    queryKey: ['my-strategies'],
    queryFn: () => strategiesApi.getMyStrategies(),
    enabled: activeTab === 'my-strategies',
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  React.useEffect(() => {
    if (myStrategiesError) {
      toast.error('Could not load your bots');
    }
  }, [myStrategiesError]);

  React.useEffect(() => {
    if (libraryError) {
      toast.error('Could not load strategies');
    }
  }, [libraryError]);

  const getFilteredStrategies = (
    strategies: Strategy[],
    category: string,
    query: string,
    sort: string,
    verified: boolean,
  ) => {
    let filtered = [...strategies];
    if (category !== 'ALL') filtered = filtered.filter((s) => s.category === category);
    if (query) {
      const q = query.toLowerCase();
      filtered = filtered.filter(
        (s) => s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q),
      );
    }
    if (verified) filtered = filtered.filter((s) => s.isVerified);

    const perf = (s: Strategy) => s.latestPerformance ?? {};
    if (sort === 'winRate') filtered.sort((a, b) => (perf(b).winRate ?? 0) - (perf(a).winRate ?? 0));
    else if (sort === 'sharpeRatio') filtered.sort((a, b) => (perf(b).sharpeRatio ?? 0) - (perf(a).sharpeRatio ?? 0));
    else if (sort === 'copiesCount') filtered.sort((a, b) => b.copiesCount - a.copiesCount);
    else if (sort === 'createdAt') {
      filtered.sort(
        (a, b) =>
          new Date(String((b as Strategy & { createdAt?: string }).createdAt ?? 0)).getTime() -
          new Date(String((a as Strategy & { createdAt?: string }).createdAt ?? 0)).getTime(),
      );
    } else if (sort === 'price') filtered.sort((a, b) => a.monthlyPrice - b.monthlyPrice);

    return filtered;
  };

  const libraryStrategies = libraryData?.strategies ?? [];
  const myStrategyList = myStrategies ?? [];
  const displayedStrategies =
    activeTab === 'library'
      ? getFilteredStrategies(libraryStrategies, selectedCategory, debouncedSearch, sortBy, verifiedOnly)
      : getFilteredStrategies(myStrategyList, selectedCategory, debouncedSearch, sortBy, verifiedOnly);

  const isLoading = activeTab === 'library' ? libraryLoading : myLoading;
  // ERROR_GUIDE / EMPTY_STATE_GUIDE — inline error when list fails, not empty filters copy
  const listError = activeTab === 'library' ? libraryError : myStrategiesError;
  const refetchList = activeTab === 'library' ? refetchLibrary : refetchMyStrategies;

  return (
    <div className="space-y-5 pb-8">
      <StrategiesBreadcrumbs />
      <StrategiesPageHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onDeploy={() => router.push('/strategies/builder')}
      />

      <div className="dashboard-card p-4 lg:p-5 space-y-4">
        <div className="flex flex-wrap items-center gap-1.5">
          {STRATEGY_CATEGORIES.map((cat) => (
            <FilterPill key={cat} active={selectedCategory === cat} onClick={() => setSelectedCategory(cat)}>
              {cat === 'MEAN REVERT' ? 'Mean Revert' : cat.charAt(0) + cat.slice(1).toLowerCase()}
            </FilterPill>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1 min-w-0 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search bots or creators…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 rounded-xl border border-[var(--card-border)] bg-card pl-10 pr-3 text-sm outline-none focus:border-primary/40"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <div className="flex items-center gap-2 px-3 h-10 rounded-xl border border-[var(--card-border)] bg-card">
              <Switch checked={verifiedOnly} onCheckedChange={setVerifiedOnly} className="data-[state=checked]:bg-primary" />
              <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 whitespace-nowrap">
                <Shield className="w-3.5 h-3.5" />
                Verified only
              </span>
            </div>
            <Select defaultValue={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[160px] h-10 rounded-xl border-[var(--card-border)] bg-card text-xs font-medium">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="bg-card border-[var(--card-border)]">
                <SelectItem value="createdAt">Newest</SelectItem>
                <SelectItem value="winRate">Performance</SelectItem>
                <SelectItem value="sharpeRatio">Sharpe ratio</SelectItem>
                <SelectItem value="copiesCount">Subscribers</SelectItem>
                <SelectItem value="price">Price</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex p-0.5 rounded-xl border border-[var(--card-border)] bg-muted/30">
              <button type="button" onClick={() => setViewMode('grid')} className={cn('p-2 rounded-lg', viewMode === 'grid' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground')} aria-label="Grid">
                <Grid className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => setViewMode('list')} className={cn('p-2 rounded-lg', viewMode === 'list' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground')} aria-label="List">
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 pt-1 border-t border-[var(--card-border)]">
          <Activity className="w-3.5 h-3.5 text-primary shrink-0" />
          <span className="text-xs text-muted-foreground font-medium">
            {displayedStrategies.length} {displayedStrategies.length === 1 ? 'bot' : 'bots'} found
          </span>
        </div>
      </div>

      {isLoading ? (
        <div className={cn('grid gap-4', viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1')}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="dashboard-card h-80 animate-pulse bg-muted/30" />
          ))}
        </div>
      ) : listError ? (
        <DashErrorState
          message={
            activeTab === 'my-strategies'
              ? "Couldn't load your bots."
              : "Couldn't load strategies."
          }
          onRetry={() => {
            void refetchList();
          }}
        />
      ) : displayedStrategies.length === 0 ? (
        <div className="dashboard-card py-16 flex flex-col items-center text-center gap-3">
          <Database className="h-12 w-12 text-muted-foreground/40" />
          <h3 className="text-base font-semibold text-foreground">No bots found</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            {searchQuery || selectedCategory !== 'ALL' || verifiedOnly
              ? 'Try adjusting your filters or search.'
              : 'Create or import your first strategy — or browse the marketplace for beginner-friendly bots.'}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {(searchQuery || selectedCategory !== 'ALL' || verifiedOnly) && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('ALL');
                  setVerifiedOnly(false);
                }}
                className="text-sm text-primary hover:underline"
              >
                Reset filters
              </button>
            )}
            <a
              href="/marketplace"
              className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
            >
              Browse marketplace
            </a>
          </div>
        </div>
      ) : (
        <div className={cn('grid gap-4', viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1')}>
          {displayedStrategies.map((strategy, index) => (
            <StrategyCard
              key={strategy.id}
              strategy={strategy}
              index={index}
              viewMode={viewMode}
              onActivate={() => { setSelectedStrategy(strategy); setIsActivationOpen(true); }}
            />
          ))}
        </div>
      )}

      <StrategyActivationModal isOpen={isActivationOpen} onClose={() => setIsActivationOpen(false)} strategy={selectedStrategy} />
    </div>
  );
}
