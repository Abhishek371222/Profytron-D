'use client';

import React from 'react';
// RENAME_CACHE_BUST: 0xCF91_STABLE_RECOVERY_LIBRARY_PALETTE
import { Search, Activity, Settings2, Target, ShieldCheck, Box, Zap } from '@/components/ui/icons';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORIES = [
 { id: 'indicator', label: 'Indicators', icon: Activity, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
 { id: 'condition', label: 'Conditions', icon: Target, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
 { id: 'action', label: 'Actions', icon: Zap, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
 { id: 'risk', label: 'Risk Management', icon: ShieldCheck, color: 'text-amber-400', bg: 'bg-amber-500/10' },
] as const;

const NODE_TEMPLATES = [
 { 
 type: 'indicator', 
 label: 'RSI Optimizer', 
 category: 'indicator',
 params: { period: 14, overbought: 70, oversold: 30 },
 description: 'Relative Strength Index with adaptive smoothing' 
 },
 { 
 type: 'indicator', 
 label: 'EMA Crossover', 
 category: 'indicator',
 params: { fast: 9, slow: 21 },
 description: 'Trend detection via moving averages' 
 },
 { 
 type: 'condition', 
 label: 'Price Above', 
 category: 'condition',
 params: { offset: 0 },
 description: 'Trigger when price breaks level' 
 },
 { 
 type: 'action', 
 label: 'Market Order', 
 category: 'action',
 params: { size: 'auto' },
 description: 'Instant execution at market price' 
 },
] as const;

export function LibraryPalette() {
 const [activeCategory, setActiveCategory] = React.useState<string>('indicator');
 const [searchQuery, setSearchQuery] = React.useState('');

 const onDragStart = (event: React.DragEvent, nodeData: any) => {
 event.dataTransfer.setData('application/reactflow', JSON.stringify(nodeData));
 event.dataTransfer.effectAllowed = 'move';
 };

 return (
 <div className="w-80 border-r border-white/5 bg-[#0d0d12]/50 backdrop-blur-3xl flex flex-col shrink-0 relative z-20">
 <div className="p-8 space-y-8">
 <div className="space-y-2">
 <h3 className="text-sm font-semibold text-white uppercase tracking-[0.3em]">Library</h3>
 <p className="text-xs text-white/30 font-bold uppercase tracking-widest">Select logic modules</p>
 </div>

 <div className="relative group">
 <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3 h-3 text-white/20 group-focus-within:text-p transition-colors" />
 <input 
 type="text"
 placeholder="SEARCH MODULES..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="w-full h-11 bg-white/5 border border-white/5 rounded-2xl pl-10 pr-4 text-xs font-semibold tracking-widest text-white placeholder:text-white/10 outline-none focus:border-p/30 transition-all"
 />
 </div>

 <div className="grid grid-cols-4 gap-2">
 {CATEGORIES.map((cat) => (
 <button
 key={cat.id}
 onClick={() => setActiveCategory(cat.id)}
 className={cn(
"aspect-square rounded-xl flex items-center justify-center transition-all duration-500 relative group",
 activeCategory === cat.id ?"bg-white/10 shadow-2xl scale-95" :"hover:bg-white/5"
 )}
 >
 <cat.icon className={cn(
"w-4 h-4 transition-all duration-500",
 activeCategory === cat.id ?"text-white scale-110" :"text-white/20 group-hover:text-white/40"
 )} />
 {activeCategory === cat.id && (
 <motion.div 
 layoutId="activeCat"
 className="absolute -bottom-1 w-1 h-1 rounded-full bg-p"
 />
 )}
 </button>
 ))}
 </div>
 </div>

 <div className="flex-1 overflow-y-auto px-6 pb-8 custom-scrollbar space-y-2">
 {NODE_TEMPLATES.filter(n => n.category === activeCategory).map((node, i) => (
 <div
 key={i}
 draggable
 onDragStart={(e) => onDragStart(e, node)}
 className="p-4 rounded-2xl glass border border-white/5 hover:border-white/10 hover:bg-white/5 transition-all cursor-grab active:scale-95 group"
 >
 <div className="flex items-center gap-4">
 <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5 group-hover:border-p/30 transition-colors">
 <Box className="w-4 h-4 text-white/40 group-hover:text-p transition-colors" />
 </div>
 <div className="flex flex-col">
 <span className="text-xs font-semibold text-white uppercase tracking-widest">{node.label}</span>
 <span className="text-xs text-white/20 font-bold uppercase tracking-tight mt-0.5">{node.description}</span>
 </div>
 </div>
 </div>
 ))}
 </div>

 {/* Bottom Visual Cap */}
 <div className="p-6 bg-gradient-to-t from-black/40 to-transparent">
 <div className="p-4 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 flex items-center gap-4 group cursor-pointer hover:bg-indigo-500/10 transition-all">
 <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
 <Activity className="w-5 h-5 text-indigo-400" />
 </div>
 <div>
 <h4 className="text-xs font-semibold text-white uppercase tracking-widest leading-tight">Smart Template</h4>
 <p className="text-xs text-indigo-400/60 font-medium mt-1">Load EMA Cross Logic</p>
 </div>
 </div>
 </div>
 </div>
 );
}
