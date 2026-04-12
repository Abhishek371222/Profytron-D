'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutGrid, List, Search, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { MarketplaceHero } from '@/components/marketplace/MarketplaceHero';
import { FeaturedRow } from '@/components/marketplace/FeaturedRow';
import { FilterSidebar } from '@/components/marketplace/FilterSidebar';
import { MarketplaceCard } from '@/components/marketplace/MarketplaceCard';
import { SubscriptionModal } from '@/components/marketplace/SubscriptionModal';
import { cn } from '@/lib/utils';
import { mockStrategies } from '@/lib/mocks/data';

export default function MarketplacePage() {
 const [isFilterOpen, setIsFilterOpen] = React.useState(true);
 const [viewType, setViewType] = React.useState<'grid' | 'list'>('grid');
 const [selectedStrategy, setSelectedStrategy] = React.useState<any>(null);
 const [searchQuery, setSearchQuery] = React.useState('');
 const [strategies, setStrategies] = React.useState<any[]>(mockStrategies);
 const [isLoading, setIsLoading] = React.useState(false);

 React.useEffect(() => {
 // Attempt to sync with API, but fail silently since we have local data
 fetch('/api/strategies')
 .then(res => res.json())
 .then(data => {
 if (data && Array.isArray(data)) {
 setStrategies(data);
 }
 })
 .catch(() => {
 // Fallback already active via initial state
 });
 }, []);

 const filteredStrategies = strategies.filter(s => 
 s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
 s.creator.toLowerCase().includes(searchQuery.toLowerCase())
 );

 return (
 <main className="flex-1 flex flex-col h-full bg-[#050508] overflow-hidden">
 <MarketplaceHero />
 
 <div className="flex-1 flex overflow-hidden">
 {/* Sidebar */}
 <FilterSidebar isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} />

 {/* Main Content Area */}
 <div className="flex-1 flex flex-col overflow-y-auto no-scrollbar pb-20">
 <FeaturedRow />

 <div className="px-8 mt-12 space-y-8">
 {/* Toolbar */}
 <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
 <div className="flex flex-col">
 <div className="flex items-center gap-3">
 <h2 className="text-xl font-bold text-white">All Strategies</h2>
 <div className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-white/40 uppercase">
 {filteredStrategies.length} results
 </div>
 </div>
 <p className="text-xs text-white/20 font-bold uppercase tracking-widest mt-1">Showing 47 of 52 available for trade</p>
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
 <button className="h-11 px-4 rounded-xl bg-white/5 border border-white/5 flex items-center gap-3 hover:bg-white/10 transition-colors">
 <span className="text-xs font-semibold text-white/40 uppercase tracking-widest">Trending</span>
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
 {isLoading ? (
 Array.from({ length: 6 }).map((_, i) => (
 <div key={i} className="h-80 rounded-[28px] bg-white/2 animate-pulse border border-white/5" />
 ))
 ) : (
 filteredStrategies.map((strategy) => (
 <MarketplaceCard 
 key={strategy.id} 
 strategy={strategy} 
 onSubscribe={(s) => setSelectedStrategy(s)}
 />
 ))
 )}
 </AnimatePresence>
 </div>
 </div>
 </div>
 </div>

 {/* Subscription Modal */}
 <SubscriptionModal 
 strategy={selectedStrategy}
 isOpen={!!selectedStrategy}
 onClose={() => setSelectedStrategy(null)}
 />
 </main>
 );
}
