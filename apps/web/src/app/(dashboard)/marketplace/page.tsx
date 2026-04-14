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
  selectedAssets: [] as string[],
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

 const strategies = React.useMemo(() => {
	const items = marketplaceQuery.data?.pages.flatMap((page) => page.items || []) || [];
	return items
	 .map((item: any) => ({
		id: item.strategyId,
		name: item.strategy.name,
		category: item.strategy.category,
		creator: item.strategy.creator?.fullName || 'Unknown',
		verified: item.strategy.isVerified,
		price: item.monthlyPrice,
		monthlyPrice: item.monthlyPrice,
		annualPrice: item.annualPrice,
		lifetimePrice: item.lifetimePrice,
		trialDays: item.trialDays,
		subscribers: item.strategy.copiesCount,
		returns: Number(item.strategy.performance?.[0]?.winRate || 0),
		risk: item.strategy.riskLevel,
		sharpe: Number(item.strategy.performance?.[0]?.sharpeRatio || 0),
	 }));
 }, [marketplaceQuery.data]);

 const savePreset = React.useCallback(() => {
  localStorage.setItem('marketplace-filters-preset', JSON.stringify(filters));
 }, [filters]);

 React.useEffect(() => {
  const preset = localStorage.getItem('marketplace-filters-preset');
  if (!preset) return;
  try {
   setFilters(JSON.parse(preset));
  } catch {
   // ignore malformed value
  }
 }, []);

 const featuredStrategies = React.useMemo(() => {
	const featured = featuredQuery.data || [];
	return featured.map((item: any) => ({
	 id: item.strategyId,
	 name: item.strategy.name,
	 returns: `+${Number(item.strategy.performance?.[0]?.winRate || 0).toFixed(1)}%`,
	 subscribers: `${item.strategy.copiesCount} traders`,
	 chartData: [{ val: 10 }, { val: 15 }, { val: 20 }, { val: 18 }, { val: 24 }, { val: 30 }],
	}));
 }, [featuredQuery.data]);

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
 <div className="flex-1 flex flex-col overflow-y-auto no-scrollbar pb-20">
 <FeaturedRow strategies={featuredStrategies} />

 <div className="px-8 mt-12 space-y-8">
 {/* Toolbar */}
 <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
 <div className="flex flex-col">
 <div className="flex items-center gap-3">
 <h2 className="text-xl font-bold text-white">All Strategies</h2>
 <div className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-white/40 uppercase">
 {strategies.length} results
 </div>
 </div>
 <p className="text-xs text-white/20 font-bold uppercase tracking-widest mt-1">Live marketplace feed</p>
 </div>

 <div className="flex items-center gap-3">
 {/* Search */}
 <div className="relative group">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-p transition-colors" />
 <input 
 type="text"
 placeholder="Search nexus..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="h-11 w-64 bg-white/5 border border-white/5 rounded-xl pl-10 pr-4 text-xs text-white placeholder:text-white/20 outline-none focus:border-p/30 focus:ring-1 focus:ring-p/20 transition-all font-dm-sans"
 />
 </div>

 <div className="h-8 w-px bg-white/10 mx-1" />

 {/* Sort */}
 <button
 className="h-11 px-4 rounded-xl bg-white/5 border border-white/5 flex items-center gap-3 hover:bg-white/10 transition-colors"
 onClick={() => {
  const idx = sortOrder.indexOf(sortBy);
  setSortBy(sortOrder[(idx + 1) % sortOrder.length]);
 }}
 >
 <span className="text-xs font-semibold text-white/40 uppercase tracking-widest">{sortBy}</span>
 <ChevronDown className="w-3 h-3 text-white/20" />
 </button>

 {/* Grid Toggle */}
 <div className="flex p-1 rounded-xl bg-white/5 border border-white/5">
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
"grid gap-6 transition-all duration-500",
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
