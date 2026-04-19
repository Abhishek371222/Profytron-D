'use client';

import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { LayoutGrid, List, Search, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { MarketplaceHero } from '@/components/marketplace/MarketplaceHero';
import { FeaturedRow } from '@/components/marketplace/FeaturedRow';
import { FilterSidebar } from '@/components/marketplace/FilterSidebar';
import { MarketplaceCard } from '@/components/marketplace/MarketplaceCard';
import { SubscribeModal } from '@/components/marketplace/SubscribeModal';
import { cn } from '@/lib/utils';
import { marketplaceApi } from '@/lib/api/marketplace';
import { Button } from '@/components/ui/button';
import { demoFeaturedMarketplace, demoMarketplaceItems } from '@/lib/api/demoData';
import { toast } from 'sonner';

export default function MarketplacePage() {
 const router = useRouter();
 const searchParams = useSearchParams();
 const [isFilterOpen, setIsFilterOpen] = React.useState(true);
 const [viewType, setViewType] = React.useState<'grid' | 'list'>('grid');
 const [selectedStrategy, setSelectedStrategy] = React.useState<any>(null);
 const [searchQuery, setSearchQuery] = React.useState(searchParams.get('q') || '');
 const [sortBy, setSortBy] = React.useState<'trending' | 'top-rated' | 'newest' | 'price' | 'performance' | 'subscribers'>((searchParams.get('sort') as any) || 'trending');
 const sortOrder: Array<'trending' | 'top-rated' | 'newest' | 'price' | 'performance' | 'subscribers'> = ['trending', 'top-rated', 'newest', 'performance', 'subscribers', 'price'];
 const [filters, setFilters] = React.useState({
  priceMax: Number(searchParams.get('priceMax') || 5000),
  selectedRisks: searchParams.get('riskLevel') ? [searchParams.get('riskLevel')!.toLowerCase()] : [],
	selectedAssets: (searchParams.get('assets') || '')
	 .split(',')
	 .map((value) => value.trim())
	 .filter(Boolean),
	selectedTimeframes: (searchParams.get('tfs') || '')
	 .split(',')
	 .map((value) => value.trim().toUpperCase())
	 .filter(Boolean),
  verifiedOnly: searchParams.get('verified') === 'true',
 });

 React.useEffect(() => {
	const params = new URLSearchParams(searchParams.toString());
	if (searchQuery) {
	 params.set('q', searchQuery);
	} else {
	 params.delete('q');
	}
	params.set('sort', sortBy);
	if (filters.verifiedOnly) params.set('verified', 'true');
	else params.delete('verified');
	if (filters.selectedRisks[0]) params.set('riskLevel', filters.selectedRisks[0].toUpperCase());
	else params.delete('riskLevel');
	if (filters.selectedAssets.length > 0) params.set('assets', filters.selectedAssets.join(','));
	else params.delete('assets');
	if (filters.selectedTimeframes.length > 0) params.set('tfs', filters.selectedTimeframes.join(','));
	else params.delete('tfs');
	params.set('priceMax', String(filters.priceMax));
	router.replace(`/marketplace?${params.toString()}`);
 }, [searchQuery, sortBy, filters, router, searchParams]);

 const featuredQuery = useQuery({
	queryKey: ['marketplace-featured'],
	queryFn: () => marketplaceApi.getFeatured(),
 });

 const marketplaceQuery = useInfiniteQuery({
	queryKey: ['marketplace', searchQuery, sortBy, filters],
	queryFn: ({ pageParam }) =>
	 marketplaceApi.getMarketplace({
		limit: 12,
		cursor: pageParam || undefined,
		sort: sortBy,
		q: searchQuery || undefined,
		verified: filters.verifiedOnly || undefined,
		riskLevel: filters.selectedRisks[0]?.toUpperCase(),
		priceMax: filters.priceMax,
	 }),
	initialPageParam: null as string | null,
	getNextPageParam: (lastPage) => lastPage?.nextCursor ?? undefined,
 });

 const mappedStrategies = React.useMemo(() => {
	const items = (marketplaceQuery.data?.pages.flatMap((page) => page.items) && marketplaceQuery.data.pages.flatMap((page) => page.items).length > 0) 
		? marketplaceQuery.data.pages.flatMap((page) => page.items) 
		: demoMarketplaceItems;
	const defaultAssets = ['Forex', 'Crypto', 'Indices', 'Commodities'];
	const defaultTimeframes = ['M1', 'M5', 'M15', 'H1', 'H4', 'D1'];
	const getStableIndex = (seed: string, length: number) => {
		let hash = 0;
		for (let i = 0; i < seed.length; i += 1) {
			hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
		}
		return hash % length;
	};

	return items
	 .map((item: any) => ({
		id: item.strategyId,
		name: item.strategy.name,
		category: item.strategy.category,
		creator: item.strategy.creator?.fullName || 'Unknown',
		verified: item.strategy.isVerified,
		assetClass: item.strategy.assetClass || defaultAssets[getStableIndex(String(item.strategyId), defaultAssets.length)],
		timeframe: (item.strategy.timeframe || defaultTimeframes[getStableIndex(`tf-${item.strategyId}`, defaultTimeframes.length)]).toUpperCase(),
		price: Number(item.monthlyPrice || 0),
		monthlyPrice: Number(item.monthlyPrice || 0),
		annualPrice: Number(item.annualPrice || item.monthlyPrice || 0),
		lifetimePrice: Number(item.lifetimePrice || item.monthlyPrice || 0),
		trialDays: item.trialDays,
		subscribers: Number(item.strategy.copiesCount || 0),
		returns: Number(item.strategy.performance?.[0]?.winRate || 0),
		risk: item.strategy.riskLevel || 'Medium',
		sharpe: Number(item.strategy.performance?.[0]?.sharpeRatio || 0),
	 }));
 }, [marketplaceQuery.data]);

 const strategies = React.useMemo(() => {
	const normalizedQuery = searchQuery.trim().toLowerCase();
	const filtered = mappedStrategies.filter((strategy) => {
		if (filters.verifiedOnly && !strategy.verified) return false;
		if (filters.selectedRisks.length > 0 && !filters.selectedRisks.includes(String(strategy.risk).toLowerCase())) return false;
		if (filters.selectedAssets.length > 0 && !filters.selectedAssets.includes(strategy.assetClass)) return false;
		if (filters.selectedTimeframes.length > 0 && !filters.selectedTimeframes.includes(strategy.timeframe)) return false;
		if (strategy.price > filters.priceMax) return false;
		if (normalizedQuery) {
			const target = `${strategy.name} ${strategy.creator} ${strategy.category} ${strategy.assetClass} ${strategy.timeframe}`.toLowerCase();
			if (!target.includes(normalizedQuery)) return false;
		}
		return true;
	});

	const withScore = filtered.map((strategy) => ({
		...strategy,
		trendingScore: strategy.subscribers * 0.6 + strategy.returns * 10 + strategy.sharpe * 100,
	}));

	return withScore.sort((a, b) => {
		switch (sortBy) {
			case 'price':
				return a.price - b.price;
			case 'performance':
				return b.returns - a.returns;
			case 'subscribers':
				return b.subscribers - a.subscribers;
			case 'top-rated':
				return b.sharpe - a.sharpe;
			case 'newest':
				return String(b.id).localeCompare(String(a.id));
			case 'trending':
			default:
				return b.trendingScore - a.trendingScore;
		}
	});
 }, [filters, mappedStrategies, searchQuery, sortBy]);

 const savePreset = React.useCallback(() => {
  localStorage.setItem('marketplace-filters-preset', JSON.stringify(filters));
 }, [filters]);

 React.useEffect(() => {
  const preset = localStorage.getItem('marketplace-filters-preset');
  if (!preset) return;
  try {
	 const parsed = JSON.parse(preset);
	 setFilters((current) => ({
		...current,
		...parsed,
		selectedAssets: Array.isArray(parsed?.selectedAssets) ? parsed.selectedAssets : current.selectedAssets,
		selectedTimeframes: Array.isArray(parsed?.selectedTimeframes) ? parsed.selectedTimeframes : current.selectedTimeframes,
	 }));
  } catch {
   // ignore malformed value
  }
 }, []);

 const featuredStrategies = React.useMemo(() => {
	const featured = featuredQuery.data || demoFeaturedMarketplace.items;
	return featured.map((item: any) => ({
	 id: item.strategyId,
	 name: item.strategy.name,
	 returns: `+${Number(item.strategy.performance?.[0]?.winRate || 0).toFixed(1)}%`,
	 subscribers: `${item.strategy.copiesCount} traders`,
	 creator: item.strategy.creator?.fullName || 'Unknown',
	 category: item.strategy.category,
	 verified: item.strategy.isVerified,
	 price: Number(item.monthlyPrice || 0),
	 monthlyPrice: Number(item.monthlyPrice || 0),
	 annualPrice: Number(item.annualPrice || item.monthlyPrice || 0),
	 lifetimePrice: Number(item.lifetimePrice || item.monthlyPrice || 0),
	 trialDays: Number(item.trialDays || 0),
	 risk: item.strategy.riskLevel || 'Medium',
	 sharpe: Number(item.strategy.performance?.[0]?.sharpeRatio || 0),
	 returnsValue: Number(item.strategy.performance?.[0]?.winRate || 0),
	 subscribersValue: Number(item.strategy.copiesCount || 0),
	 chartData: [{ val: 10 }, { val: 15 }, { val: 20 }, { val: 18 }, { val: 24 }, { val: 30 }],
	}));
 }, [featuredQuery.data]);

 const sortLabel = sortBy.replace('-', ' ');

 React.useEffect(() => {
  if (marketplaceQuery.isError) {
   toast.error('Marketplace feed unavailable', {
	description: 'Showing fallback catalog data while the API recovers.',
   });
  }
 }, [marketplaceQuery.isError]);

 React.useEffect(() => {
  if (featuredQuery.isError) {
   toast.error('Featured feed unavailable', {
	description: 'Showing curated fallback featured strategies.',
   });
  }
 }, [featuredQuery.isError]);

 const resetFilters = () => {
  setSearchQuery('');
  setSortBy('trending');
  setFilters({
   priceMax: 5000,
   selectedRisks: [],
   selectedAssets: [],
   selectedTimeframes: [],
   verifiedOnly: false,
  });
  toast.success('Marketplace filters reset');
 };

 return (
 <main className="flex-1 flex flex-col h-full bg-[#050508] overflow-hidden">
 <MarketplaceHero />
 
 <div className="flex-1 flex overflow-hidden">
 {/* Sidebar */}
 <FilterSidebar
  isOpen={isFilterOpen}
  onClose={() => setIsFilterOpen(false)}
  value={filters}
  onChange={setFilters}
  onApply={() => marketplaceQuery.refetch()}
  onSavePreset={savePreset}
 />

 {/* Main Content Area */}
 <div className="flex-1 flex flex-col overflow-y-auto no-scrollbar pb-14">
 <FeaturedRow
  strategies={featuredStrategies}
  onSubscribe={(strategy) => setSelectedStrategy(strategy)}
 />

 <div className="px-5 md:px-8 mt-7 space-y-6">
 {/* Toolbar */}
 <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
 <div className="flex flex-col">
 <div className="flex items-center gap-3">
 <h2 className="text-xl font-bold text-white">All Strategies</h2>
 <div className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-white/40 uppercase">
 {strategies.length} results
 </div>
 </div>
 <p className="text-xs text-white/20 font-bold uppercase tracking-widest mt-1">Live marketplace feed</p>
 </div>

 <div className="flex items-center gap-2.5 flex-wrap lg:flex-nowrap">
 {/* Search */}
 <div className="relative group">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-p transition-colors" />
 <input 
 type="text"
 placeholder="Search nexus..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="h-10 w-56 md:w-64 bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 text-xs text-white placeholder:text-white/20 outline-none focus:border-p/30 focus:ring-1 focus:ring-p/20 transition-all font-dm-sans"
 />
 </div>

 <div className="h-8 w-px bg-white/10 mx-1 hidden md:block" />

 {/* Sort */}
 <button
 className="h-10 px-3.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2.5 hover:bg-white/10 transition-colors"
 onClick={() => {
  const idx = sortOrder.indexOf(sortBy);
  setSortBy(sortOrder[(idx + 1) % sortOrder.length]);
 }}
 >
 <span className="text-xs font-semibold text-white/55 uppercase tracking-[0.18em]">{sortLabel}</span>
 <ChevronDown className="w-3 h-3 text-white/20" />
 </button>

 {/* Grid Toggle */}
 <div className="flex p-1 rounded-xl bg-white/5 border border-white/10">
 <button 
 onClick={() => setViewType('grid')}
 className={cn(
"p-1.5 rounded-lg transition-all",
 viewType === 'grid' ?"bg-white/10 text-white shadow-lg" :"text-white/20 hover:text-white/40"
 )}
 >
 <LayoutGrid className="w-4 h-4" />
 </button>
 <button 
 onClick={() => setViewType('list')}
 className={cn(
"p-1.5 rounded-lg transition-all",
 viewType === 'list' ?"bg-white/10 text-white shadow-lg" :"text-white/20 hover:text-white/40"
 )}
 >
 <List className="w-4 h-4" />
 </button>
 </div>

 <button 
 onClick={() => setIsFilterOpen(!isFilterOpen)}
 className={cn(
"h-11 w-11 flex items-center justify-center rounded-xl border transition-all lg:hidden",
 isFilterOpen ?"bg-p/10 border-p/50 text-p" :"bg-white/5 border-white/5 text-white/40"
 )}
 >
 <SlidersHorizontal className="w-4 h-4" />
 </button>
 </div>
 </div>

 {/* Strategy Grid */}
 <div className={cn(
"grid gap-4 md:gap-6 transition-all duration-500",
 viewType === 'grid' 
 ?"grid-cols-1 md:grid-cols-2 xl:grid-cols-3" 
 :"grid-cols-1"
 )}>
 <AnimatePresence mode="popLayout">
 {marketplaceQuery.isLoading ? (
 Array.from({ length: 6 }).map((_, i) => (
 <div key={i} className="h-80 rounded-[28px] bg-white/2 animate-pulse border border-white/5" />
 ))
 ) : (
 strategies.map((strategy) => (
 <MarketplaceCard 
 key={strategy.id} 
 strategy={strategy} 
 onSubscribe={(s) => setSelectedStrategy(s)}
 />
 ))
 )}
 </AnimatePresence>
 </div>

 {strategies.length === 0 && !marketplaceQuery.isLoading && (
  <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
   <p className="text-sm font-semibold text-white">No strategies match the current filters.</p>
   <p className="mt-1 text-xs text-white/60">Try broadening your criteria or reset to defaults.</p>
   <Button
	onClick={resetFilters}
	variant="outline"
	className="mt-4 border-white/20 bg-white/5 text-white hover:bg-white/10"
   >
	Reset Filters
   </Button>
  </div>
 )}

 {marketplaceQuery.hasNextPage && (
  <div className="mt-8 flex justify-center">
   <Button
	variant="outline"
	className="border-white/20 bg-white/5 text-white hover:bg-white/10"
	onClick={() => marketplaceQuery.fetchNextPage()}
	disabled={marketplaceQuery.isFetchingNextPage}
   >
	{marketplaceQuery.isFetchingNextPage ? 'Loading...' : 'Load more'}
   </Button>
  </div>
 )}
 </div>
 </div>
 </div>

 {/* Subscription Modal */}
 <SubscribeModal 
 strategy={selectedStrategy}
 isOpen={!!selectedStrategy}
 onClose={() => setSelectedStrategy(null)}
 />
 </main>
 );
}
