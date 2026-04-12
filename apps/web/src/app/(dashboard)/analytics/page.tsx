'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { 
 Download, 
 Calendar, 
 ArrowRight,
 Sparkles
} from '@/components/ui/icons';
import { Button } from '@/components/ui/button';

// Components
import OverviewTab from '@/components/analytics/OverviewTab';
import PerformanceTab from '@/components/analytics/PerformanceTab';
import RiskTab from '@/components/analytics/RiskTab';
import TradeAnalysisTab from '@/components/analytics/TradeAnalysisTab';
import GlobalIntelligenceTab from '@/components/analytics/GlobalIntelligenceTab';

const TABS = [
 { id: 'overview', label: 'Overview' },
 { id: 'performance', label: 'Strategy Performance' },
 { id: 'risk', label: 'Risk Analysis' },
 { id: 'trade', label: 'Trade Analysis' },
 { id: 'global', label: 'Global Intelligence' },
] as const;

type TabId = typeof TABS[number]['id'];

function AnalyticsSkeleton() {
 return (
 <div className="space-y-[var(--section-gap)] pb-20 animate-pulse">
 {/* KPI Skeleton */}
 <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-6">
 {[...Array(5)].map((_, i) => (
 <div key={i} className="h-48 bg-white/5 rounded-[32px] border border-white/5" />
 ))}
 </div>
 
 {/* Chart Skeleton */}
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
 <div className="lg:col-span-2 h-[400px] bg-white/5 rounded-[40px] border border-white/5" />
 <div className="h-[400px] bg-white/5 rounded-[40px] border border-white/5" />
 </div>
 </div>
 );
}

export default function AnalyticsPage() {
 const [activeTab, setActiveTab] = React.useState<TabId>('overview');
 const [mounted, setMounted] = React.useState(false);

 React.useEffect(() => {
 setMounted(true);
 }, []);

 return (
 <div className="flex flex-col gap-[var(--section-gap)] min-h-full relative">
 {/* Background Ambient Glow */}
 <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-p/5 rounded-full blur-[120px] -mr-64 -mt-64 pointer-events-none" />
 
 {/* Page Header */}
 <motion.div 
 initial={{ opacity: 0, y: -20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
 className="flex flex-col md:flex-row md:items-end justify-between gap-8 relative z-10"
 >
 <div className="space-y-4">
 <div className="flex items-center gap-3">
 <div className="w-2 h-2 rounded-full bg-p animate-pulse shadow-[0_0_15px_#6366f1]" />
 <span className="text-sm font-semibold text-p uppercase tracking-[0.5em] leading-tight">Institutional Terminal v2.4</span>
 </div>
 <h1 className="text-5xl font-semibold text-white uppercase tracking-tight leading-tight">Analytics</h1>
 <p className="text-xs text-white/30 font-bold uppercase tracking-[0.2em]">Cross-sectional performance & risk intelligence suite</p>
 </div>

 <div className="flex items-center gap-6">
 <div className="flex items-center gap-4 px-6 py-3.5 rounded-[22px] bg-white/[0.03] border border-white/5 group hover:border-white/15 transition-all cursor-pointer shadow-2xl backdrop-blur-3xl">
 <Calendar className="w-4 h-4 text-white/40 group-hover:text-p transition-colors" />
 <div className="flex items-center gap-4 text-sm font-semibold text-white/60 uppercase tracking-[0.2em] font-jet-mono">
 <span className="hover:text-white transition-colors">JAN 01</span>
 <div className="w-8 h-[1px] bg-white/10" />
 <span className="hover:text-white transition-colors">MAR 30</span>
 </div>
 </div>
 <Button variant="ghost" className="h-[52px] px-8 rounded-[22px] border border-white/10 hover:bg-white/10 gap-4 group shadow-xl hover:shadow-p/10 transition-all duration-500">
 <Download className="w-5 h-5 text-white/40 group-hover:text-white group-hover:scale-110 transition-all" />
 <span className="text-sm font-semibold text-white/40 group-hover:text-white uppercase tracking-[0.2em]">Export Dataset</span>
 </Button>
 </div>
 </motion.div>

 {/* Tab Navigation */}
 <motion.div 
 initial={{ opacity: 0, scale: 0.95 }}
 animate={{ opacity: 1, scale: 1 }}
 transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
 className="flex items-center p-2 rounded-[30px] bg-black/40 border border-white/5 w-fit backdrop-blur-3xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)]"
 >
 {TABS.map((tab) => (
 <button
 key={tab.id}
 onClick={() => setActiveTab(tab.id)}
 className={cn(
"relative px-10 py-4 rounded-[24px] text-sm font-semibold uppercase tracking-[0.2em] transition-all duration-500",
 activeTab === tab.id 
 ?"text-white" 
 :"text-white/20 hover:text-white/50 hover:bg-white/[0.02]"
 )}
 >
 <span className="relative z-10">{tab.label}</span>
 {activeTab === tab.id && (
 <motion.div
 layoutId="activeTabGlow"
 className="absolute inset-0 bg-gradient-to-br from-p to-indigo-700 shadow-[0_0_30px_rgba(99,102,241,0.5)] rounded-[24px]"
 transition={{ type:"spring", bounce: 0.2, duration: 0.7 }}
 />
 )}
 </button>
 ))}
 </motion.div>

 {/* Tab Content */}
 <div className="relative z-0">
 {!mounted ? (
 <AnalyticsSkeleton />
 ) : (
 <AnimatePresence mode="wait" initial={false}>
 <motion.div
 key={activeTab}
 initial={{ opacity: 0, x: 20, filter: 'blur(10px)' }}
 animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
 exit={{ opacity: 0, x: -20, filter: 'blur(10px)' }}
 transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
 >
 {activeTab === 'overview' && <OverviewTab />}
 {activeTab === 'performance' && <PerformanceTab />}
 {activeTab === 'risk' && <RiskTab />}
 {activeTab === 'trade' && <TradeAnalysisTab />}
 {activeTab === 'global' && <GlobalIntelligenceTab />}
 </motion.div>
 </AnimatePresence>
 )}
 </div>
 </div>
 );
}
