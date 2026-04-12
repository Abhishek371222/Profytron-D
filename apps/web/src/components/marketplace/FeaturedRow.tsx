'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface FeaturedStrategy {
 id: string;
 name: string;
 returns: string;
 subscribers: string;
 chartData: { val: number }[];
}

const FEATURED_DATA: FeaturedStrategy[] = [
 {
 id: 'f1',
 name: 'MomentumPro Ultra',
 returns: '+18.4%',
 subscribers: '1,247 traders',
 chartData: [
 { val: 10 }, { val: 25 }, { val: 15 }, { val: 40 }, { val: 35 }, { val: 60 }, { val: 55 }, { val: 80 }
 ]
 },
 {
 id: 'f2',
 name: 'Neural Nexus Alpha',
 returns: '+12.5%',
 subscribers: '847 traders',
 chartData: [
 { val: 20 }, { val: 18 }, { val: 35 }, { val: 30 }, { val: 45 }, { val: 42 }, { val: 55 }, { val: 58 }
 ]
 },
 {
 id: 'f3',
 name: 'Black Swan Shield',
 returns: '+8.2%',
 subscribers: '2,100 traders',
 chartData: [
 { val: 10 }, { val: 12 }, { val: 15 }, { val: 18 }, { val: 20 }, { val: 25 }, { val: 28 }, { val: 30 }
 ]
 }
];

interface FeaturedRowProps {
 strategies?: FeaturedStrategy[];
}

export function FeaturedRow({ strategies }: FeaturedRowProps) {
 const [isMounted, setIsMounted] = React.useState(false);

 React.useEffect(() => {
 setIsMounted(true);
 }, []);

 return (
 <div className="space-y-4 pt-8">
 <div className="flex items-center justify-between px-8">
 <h2 className="text-lg font-bold text-white uppercase tracking-wider">
 Featured Strategies
 </h2>
 <div className="flex gap-2">
 <div className="w-2 h-2 rounded-full bg-p animate-pulse" />
 <span className="text-xs font-semibold text-white/30 uppercase tracking-[0.2em]">Verified High Performers</span>
 </div>
 </div>

 <div className="flex gap-6 overflow-x-auto px-8 pb-8 no-scrollbar scroll-smooth snap-x">
 {(strategies && strategies.length > 0 ? strategies : FEATURED_DATA).map((strategy) => (
 <motion.div
 key={strategy.id}
 whileHover={{ y: -8, scale: 1.02 }}
 className="flex-shrink-0 w-[400px] h-[220px] rounded-4xl overflow-hidden relative group snap-start bg-[#0d0d12] border border-white/8"
 >
 {/* Background Equity Chart */}
 <div className="absolute inset-0 opacity-40 group-hover:opacity-60 transition-opacity duration-500">
 {isMounted && (
 <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={1}>
 <AreaChart data={strategy.chartData}>
 <defs>
 <linearGradient id={`gradient-${strategy.id}`} x1="0" y1="0" x2="0" y2="1">
 <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4} />
 <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
 </linearGradient>
 </defs>
 <Area
 type="monotone"
 dataKey="val"
 stroke="#6366f1"
 strokeWidth={3}
 fill={`url(#gradient-${strategy.id})`}
 animationDuration={2000}
 />
 </AreaChart>
 </ResponsiveContainer>
 )}
 </div>

 {/* Bottom Gradient Fade */}
 <div className="absolute inset-0 bg-linear-to-t from-black via-black/40 to-transparent" />

 {/* Badges */}
 <div className="absolute top-6 right-6">
 <div className="px-3 py-1 rounded-full bg-indigo-500 text-white text-xs font-semibold uppercase tracking-[0.2em] shadow-[0_0_15px_rgba(99,102,241,0.5)]">
 Featured
 </div>
 </div>

 {/* Content */}
 <div className="absolute bottom-0 left-0 right-0 p-8 flex items-end justify-between">
 <div className="flex flex-col gap-1">
 <div className="flex items-center gap-3">
 <h3 className="text-xl font-bold text-white tracking-tight">
 {strategy.name}
 </h3>
 <div className="px-2 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
 {strategy.returns}
 </div>
 </div>
 <div className="flex items-center gap-2 opacity-40">
 <span className="text-xs font-bold text-white uppercase tracking-widest">
 {strategy.subscribers}
 </span>
 </div>
 </div>

 <Button 
 variant="ghost" 
 className="h-10 px-6 rounded-xl glass border border-white/10 hover:border-white/20 text-white text-xs font-semibold uppercase tracking-[0.2em] transition-all group/btn"
 >
 Subscribe 
 <span className="ml-2 group-hover/btn:translate-x-1 transition-transform">→</span>
 </Button>
 </div>
 </motion.div>
 ))}
 </div>
 </div>
 );
}
