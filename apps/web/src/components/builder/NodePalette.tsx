'use client';

import React from 'react';
// BUILD_SALT_RESET_V4: 0xCF91_STABLE_RECOVERY_FINAL_STABILITY
import { Search, Activity, Settings2, Target, ShieldCheck, Box } from 'lucide-react';
import { cn } from '@/lib/utils';

const NODE_CATEGORIES = [
 {
 id: 'indicators',
 name: 'Indicators',
 color: '#6366f1',
 glow: 'rgba(99,102,241,0.4)',
 icon: Activity,
 nodes: [
 { id: 'ma', label: 'Moving Average', description: 'Simple or Exponential MA', params: { period: 14, type: 'SMA' } },
 { id: 'rsi', label: 'RSI', description: 'Relative Strength Index', params: { period: 14, overbought: 70, oversold: 30 } },
 { id: 'macd', label: 'MACD', description: 'MA Conv/Div Oscillator', params: { fast: 12, slow: 26, signal: 9 } },
 ]
 },
 {
 id: 'conditions',
 name: 'Logic',
 color: '#06b6d4',
 glow: 'rgba(6,182,212,0.4)',
 icon: Settings2,
 nodes: [
 { id: 'gt', label: 'Greater Than', description: 'Value A > Value B', params: {} },
 { id: 'lt', label: 'Less Than', description: 'Value A < Value B', params: {} },
 { id: 'cross', label: 'Crosses Above', description: 'Signal crossing logic', params: {} },
 ]
 },
 {
 id: 'actions',
 name: 'Actions',
 color: '#10b981',
 glow: 'rgba(16,185,129,0.4)',
 icon: Target,
 nodes: [
 { id: 'buy', label: 'Open Long', description: 'Enter buy position', params: {} },
 { id: 'sell', label: 'Open Short', description: 'Enter sell position', params: {} },
 ]
 },
 {
 id: 'risk',
 name: 'Risk DNA',
 color: '#f59e0b',
 glow: 'rgba(245,158,11,0.4)',
 icon: ShieldCheck,
 nodes: [
 { id: 'sl', label: 'Stop Loss', description: 'Risk protection', params: { value: 20 } },
 { id: 'tp', label: 'Take Profit', description: 'Profit target', params: { value: 40 } },
 ]
 }
];

export function NodePalette() {
 const [search, setSearch] = React.useState('');
 const [collapsed, setCollapsed] = React.useState<string[]>([]);

 const onDragStart = (event: React.DragEvent, nodeType: string, label: string, category: string, params: any) => {
 event.dataTransfer.setData('application/reactflow', JSON.stringify({ type: nodeType, label, category, params }));
 event.dataTransfer.effectAllowed = 'move';
 };

 return (
 <aside className="w-[300px] h-full bg-[#0d0d12] border-r border-white/5 flex flex-col overflow-hidden relative z-20">
 {/* Glossy Header Overlay */}
 <div className="absolute inset-x-0 top-0 h-[200px] bg-gradient-to-b from-p/5 to-transparent pointer-events-none" />
 
 <div className="p-6 space-y-5 relative">
 <div className="flex items-center justify-between">
 <h2 className="text-sm font-semibold text-white uppercase tracking-[0.3em]">Node Library</h2>
 <Box className="w-4 h-4 text-white/20" />
 </div>
 
 <div className="relative group">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-p transition-colors" />
 <input 
 type="text"
 placeholder="Search blocks..."
 value={search}
 onChange={(e) => setSearch(e.target.value)}
 className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-white/20 focus:border-p focus:ring-4 focus:ring-p/10 outline-none transition-all font-medium"
 />
 </div>
 </div>

 <div className="flex-1 overflow-y-auto p-6 pt-0 space-y-8 custom-scrollbar relative">
 {NODE_CATEGORIES.map((cat) => {
 const catNodes = cat.nodes.filter(n => n.label.toLowerCase().includes(search.toLowerCase()));
 if (catNodes.length === 0) return null;

 return (
 <div key={cat.id} className="space-y-4">
 <div className="flex items-center gap-3">
 <div className="h-px flex-1 bg-linear-to-r from-transparent to-white/10" />
 <span className="text-xs font-bold text-white/30 uppercase tracking-[0.2em] whitespace-nowrap">
 {cat.name}
 </span>
 <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10" />
 </div>

 <div className="grid gap-3">
 {catNodes.map((node) => (
 <div
 key={node.id}
 draggable
 onDragStart={(e) => onDragStart(e, node.id, node.label, cat.id === 'risk' ? 'risk' : cat.id.slice(0, -1), node.params)}
 className="group relative"
 >
 {/* Hover Glow Effect */}
 <div 
 className="absolute -inset-0.5 rounded-2xl opacity-0 group-hover:opacity-100 blur-[8px] transition-all duration-500"
 style={{ backgroundColor: cat.color + '20' }}
 />
 
 <div className="relative p-4 rounded-xl bg-white/3 border border-white/5 group-hover:border-white/20 group-hover:bg-white/6 cursor-grab active:cursor-grabbing transition-all duration-300">
 <div className="flex items-center justify-between mb-1.5">
 <span className="text-sm font-bold text-white group-hover:text-white transition-colors tracking-tight">
 {node.label}
 </span>
 <div className="p-1.5 rounded-lg bg-white/5">
 <cat.icon className="w-3.5 h-3.5" style={{ color: cat.color }} />
 </div>
 </div>
 <p className="text-xs text-white/40 group-hover:text-white/60 transition-colors font-medium">
 {node.description}
 </p>
 </div>
 </div>
 ))}
 </div>
 </div>
 );
 })}
 </div>

 {/* Bottom Visual Cap */}
 <div className="p-6 bg-linear-to-t from-black/40 to-transparent">
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
 </aside>
 );
}
