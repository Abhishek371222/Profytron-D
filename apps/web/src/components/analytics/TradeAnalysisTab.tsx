'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
 BarChart, 
 Bar, 
 XAxis, 
 YAxis, 
 CartesianGrid, 
 Tooltip, 
 ResponsiveContainer,
 PieChart,
 Pie,
 Cell
} from 'recharts';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { History, Activity, TrendingUp, Layers, ArrowUpRight, ArrowDownRight, Clock } from '@/components/ui/icons';

const pnlDist = [
 { range: '< -5k', count: 4, fill: '#ef4444' },
 { range: '-5k to -2k', count: 12, fill: '#ef4444' },
 { range: '-2k to 0', count: 28, fill: '#ef4444' },
 { range: '0 to 2k', count: 44, fill: '#10b981' },
 { range: '2k to 5k', count: 68, fill: '#10b981' },
 { range: '> 5k', count: 22, fill: '#10b981' },
];

const durationData = [
 { range: '< 1H', count: 45, type: 'Scalp' },
 { range: '1-4H', count: 120, type: 'Intraday' },
 { range: '4-8H', count: 85, type: 'Intraday' },
 { range: '8-24H', count: 32, type: 'Swing' },
 { range: '1-3D', count: 18, type: 'Swing' },
 { range: '> 3D', count: 5, type: 'Position' },
];

const symbolRanking = [
 { symbol: 'BTCUSDT', pnl: 42500, trades: 142 },
 { symbol: 'ETHUSDT', pnl: 28400, trades: 98 },
 { symbol: 'SOLUSDT', pnl: 18900, trades: 156 },
 { symbol: 'EURUSD', pnl: 12400, trades: 45 },
 { symbol: 'GOLD', pnl: -4200, trades: 12 },
 { symbol: 'NASDAQ', pnl: -8600, trades: 34 },
];

const winLossData = [
 { name: 'Wins', value: 185, color: '#10b981' },
 { name: 'Losses', value: 72, color: '#ef4444' },
];

const containerVariants = {
 hidden: { opacity: 0 },
 visible: {
 opacity: 1,
 transition: {
 staggerChildren: 0.1,
 delayChildren: 0.1
 }
 }
};

const itemVariants = {
 hidden: { opacity: 0, y: 20 },
 visible: { 
 opacity: 1, 
 y: 0,
 transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
 }
};

export default function TradeAnalysisTab() {
 return (
 <motion.div 
 variants={containerVariants}
 initial="hidden"
 animate="visible"
 className="space-y-12 pb-24"
 >
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
 {/* Institutional Outcome hardware distribution */}
 <motion.div variants={itemVariants}>
 <Card className="p-12 border-2 border-white/5 bg-black/40 backdrop-blur-3xl shadow-[0_50px_100px_rgba(0,0,0,0.8)] relative overflow-hidden group rounded-[48px]">
 <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-transparent via-white/40 to-transparent animate-scanline" />
 <div className="absolute inset-0 bg-scanlines opacity-[0.03] pointer-events-none" />
 
 <div className="space-y-4 mb-16 relative z-10">
 <div className="flex items-center gap-5">
 <div className="w-12 h-12 rounded-[18px] bg-white/5 border-2 border-white/10 flex items-center justify-center">
 <Layers className="w-6 h-6 text-white/40" />
 </div>
 <h4 className="text-2xl font-semibold text-white uppercase tracking-tight leading-tight">Outcome_Lattice_Dist</h4>
 </div>
 <p className="text-sm text-white/30 font-semibold uppercase tracking-[0.4em] leading-relaxed">Trade frequency mapped across institutional P&L corridors.</p>
 </div>
 
 <div className="h-[400px] w-full relative z-10">
 <ResponsiveContainer width="100%" height="100%">
 <BarChart data={pnlDist} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
 <CartesianGrid strokeDasharray="6 6" stroke="rgba(255,255,255,0.03)" vertical={false} />
 <XAxis 
 dataKey="range" 
 axisLine={false} 
 tickLine={false} 
 tick={{ fill: 'rgba(255,255,255,0.15)', fontSize: 11, fontWeight: 900, fontFamily: 'Syne' }}
 dy={25}
 />
 <YAxis hide />
 <Tooltip 
 cursor={{ fill: 'rgba(255,255,255,0.05)', radius: 16 }} 
 contentStyle={{ 
 backgroundColor: 'rgba(13,13,18,0.9)', 
 border: '2px solid rgba(255,255,255,0.1)', 
 borderRadius: '32px',
 padding: '24px',
 boxShadow: '0 40px 80px rgba(0,0,0,0.8)',
 backdropFilter: 'blur(20px)'
 }}
 itemStyle={{ color: '#fff', fontSize: '14px', fontWeight: '900', fontStyle: '', fontFamily: 'Syne' }}
 labelStyle={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.3em', marginBottom: '12px' }}
 />
 <Bar 
 dataKey="count" 
 radius={[12, 12, 0, 0]} 
 barSize={48}
 animationDuration={2500}
 animationEasing="ease-out"
 >
 {pnlDist.map((entry, index) => (
 <Cell 
 key={`cell-${index}`} 
 fill={entry.fill} 
 fillOpacity={index < 3 ? 0.4 : 0.8}
 stroke={entry.fill}
 strokeWidth={index < 3 ? 2 : 0}
 className="drop-shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all duration-500 hover:fill-opacity-100"
 />
 ))}
 </Bar>
 </BarChart>
 </ResponsiveContainer>
 </div>
 </Card>
 </motion.div>

 {/* Institutional Execution hardware core */}
 <motion.div variants={itemVariants}>
 <Card className="p-12 border-2 border-white/5 bg-black/40 backdrop-blur-3xl shadow-[0_50px_100px_rgba(0,0,0,0.8)] flex flex-col items-center justify-center relative overflow-hidden rounded-[48px] group/core">
 <div className="absolute top-0 right-0 w-full h-[3px] bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent animate-scanline" />
 <div className="absolute inset-0 bg-scanlines opacity-[0.03] pointer-events-none" />
 
 <div className="absolute top-12 left-12 space-y-4 relative z-20 w-full">
 <div className="flex items-center gap-5">
 <div className="w-12 h-12 rounded-[18px] bg-emerald-500/10 border-2 border-emerald-500/20 flex items-center justify-center">
 <Activity className="w-6 h-6 text-emerald-400" />
 </div>
 <h4 className="text-2xl font-semibold text-white uppercase tracking-tight leading-tight">Execution_Core_Efficiency</h4>
 </div>
 <p className="text-sm text-white/30 font-semibold uppercase tracking-[0.4em] leading-relaxed">Real-time volume-weighted win/loss kernel telemetry.</p>
 </div>
 
 <div className="h-[420px] w-full relative mt-12 group/donut">
 <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent rounded-full blur-[120px] opacity-0 group-hover/core:opacity-100 transition-opacity duration-1000" />
 
 <ResponsiveContainer width="100%" height="100%">
 <PieChart>
 <Pie
 data={winLossData}
 cx="50%"
 cy="50%"
 innerRadius={120}
 outerRadius={165}
 paddingAngle={12}
 dataKey="value"
 stroke="none"
 animationDuration={2000}
 animationEasing="ease-out"
 >
 {winLossData.map((entry, index) => (
 <Cell 
 key={`cell-${index}`} 
 fill={entry.color} 
 fillOpacity={index === 0 ? 0.8 : 0.3}
 className="drop-shadow-[0_0_30px_rgba(16,185,129,0.2)] transition-all duration-700"
 />
 ))}
 </Pie>
 <Tooltip 
 contentStyle={{ 
 backgroundColor: 'rgba(10,10,15,0.95)', 
 border: '2px solid rgba(255,255,255,0.1)', 
 borderRadius: '32px',
 padding: '24px',
 backdropFilter: 'blur(20px)'
 }} 
 />
 </PieChart>
 </ResponsiveContainer>
 
 {/* Central Holographic Hardware Readout */}
 <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
 <motion.div 
 initial={{ scale: 0.8, opacity: 0 }}
 animate={{ scale: 1, opacity: 1 }}
 transition={{ duration: 1.5, delay: 0.5, type: 'spring' }}
 className="flex flex-col items-center"
 >
 <span className="text-8xl font-semibold text-white tracking-tight leading-tight shadow-[0_0_20px_rgba(255,255,255,0.2)]">72<span className="text-3xl text-white/30 ml-1">%</span></span>
 <span className="text-sm font-semibold text-white/20 uppercase tracking-[0.6em] mt-6">CORE_WIN_RATIO</span>
 <div className="mt-8 flex flex-col items-center">
 <div className="w-16 h-px bg-white/10 mb-4" />
 <div className="px-5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
 <span className="text-xs font-semibold text-emerald-400 uppercase tracking-[0.3em]">ALPHA_OPTIMIZED_STATE</span>
 </div>
 </div>
 </motion.div>
 </div>
 </div>

 <div className="flex justify-center gap-20 mt-10 relative z-20 w-full px-12">
 <div className="flex flex-col items-center gap-4 group/win">
 <div className="flex items-center gap-4">
 <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border-2 border-emerald-500/20 flex items-center justify-center group-hover/win:rotate-12 transition-transform">
 <ArrowUpRight className="w-5 h-5 text-emerald-400" />
 </div>
 <span className="text-4xl font-semibold text-white tracking-tight">185</span>
 </div>
 <span className="text-sm font-semibold text-white/20 uppercase tracking-[0.4em]">INSTITUTIONAL_WINS</span>
 </div>
 <div className="flex flex-col items-center gap-4 group/loss">
 <div className="flex items-center gap-4">
 <div className="w-10 h-10 rounded-xl bg-red-500/10 border-2 border-red-500/20 flex items-center justify-center group-hover/loss:-rotate-12 transition-transform">
 <ArrowDownRight className="w-5 h-5 text-red-500" />
 </div>
 <span className="text-4xl font-semibold text-white tracking-tight">72</span>
 </div>
 <span className="text-sm font-semibold text-white/20 uppercase tracking-[0.4em]">MARKET_FRICTION</span>
 </div>
 </div>
 </Card>
 </motion.div>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
 {/* Hardware Symbol Performance matrix */}
 <motion.div variants={itemVariants}>
 <Card className="p-12 border-2 border-white/5 bg-black/40 backdrop-blur-3xl shadow-[0_50px_100px_rgba(0,0,0,0.8)] h-full relative overflow-hidden group rounded-[48px]">
 <div className="absolute top-0 right-0 w-full h-[3px] bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent animate-scanline" />
 <div className="absolute inset-0 bg-scanlines opacity-[0.03] pointer-events-none" />
 
 <div className="space-y-4 mb-16 relative z-10">
 <div className="flex items-center gap-5">
 <div className="w-12 h-12 rounded-[18px] bg-cyan-500/10 border-2 border-cyan-500/20 flex items-center justify-center">
 <TrendingUp className="w-6 h-6 text-cyan-400" />
 </div>
 <h4 className="text-2xl font-semibold text-white uppercase tracking-tight leading-tight">Asset_Alpha_Kernel</h4>
 </div>
 <p className="text-sm text-white/30 font-semibold uppercase tracking-[0.4em] leading-relaxed">Recursive attribution matrix by primary instrument class.</p>
 </div>

 <div className="space-y-10 relative z-10">
 {symbolRanking.map((item, idx) => (
 <div key={item.symbol} className="space-y-4 group/item">
 <div className="flex items-end justify-between px-2">
 <div className="flex flex-col gap-1">
 <span className="text-lg font-semibold text-white tracking-widest uppercase group-hover/item:text-cyan-400 transition-all leading-tight">{item.symbol}</span>
 <span className="text-xs font-semibold text-white/20 uppercase tracking-[0.3em]">{item.trades}_EXECUTIONS_SYNCED</span>
 </div>
 <div className="flex flex-col items-end gap-1">
 <span className={cn("text-2xl font-semibold tracking-tight leading-tight shadow-sm", item.pnl > 0 ?"text-emerald-400" :"text-red-400")}>
 {item.pnl > 0 ? '+' : ''}${item.pnl.toLocaleString()}
 </span>
 <div className="h-0.5 w-12 bg-white/5" />
 </div>
 </div>
 <div className="h-3 rounded-full bg-white/[0.02] overflow-hidden border-2 border-white/[0.05] relative">
 <motion.div 
 initial={{ width: 0 }}
 animate={{ width: `${Math.abs(item.pnl) / 450}%` }}
 transition={{ duration: 2, delay: idx * 0.15, ease: [0.22, 1, 0.36, 1] }}
 className={cn("h-full rounded-full relative", item.pnl > 0 ?"bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.5)]" :"bg-gradient-to-r from-red-600 to-red-400 shadow-[0_0_20px_rgba(239,68,68,0.5)]")}
 >
 <div className="absolute inset-0 bg-scanlines opacity-20" />
 </motion.div>
 </div>
 </div>
 ))}
 </div>
 </Card>
 </motion.div>

 {/* Temporal Holding Duration Intelligence */}
 <motion.div variants={itemVariants}>
 <Card className="p-12 border-2 border-white/5 bg-black/40 backdrop-blur-3xl shadow-[0_50px_100px_rgba(0,0,0,0.8)] relative overflow-hidden rounded-[48px] group/temp">
 <div className="absolute top-0 right-0 w-64 h-64 bg-p/5 rounded-full blur-[120px] -mr-32 -mt-32 opacity-0 group-hover/temp:opacity-100 transition-opacity duration-1000" />
 <div className="absolute inset-0 bg-scanlines opacity-[0.03] pointer-events-none" />
 
 <div className="space-y-4 mb-20 relative z-10">
 <div className="flex items-center gap-5">
 <div className="w-12 h-12 rounded-[18px] bg-indigo-500/10 border-2 border-indigo-500/20 flex items-center justify-center">
 <Clock className="w-6 h-6 text-indigo-400" />
 </div>
 <h4 className="text-2xl font-semibold text-white uppercase tracking-tight leading-tight">Temporal_Holding_Profile</h4>
 </div>
 <p className="text-sm text-white/30 font-semibold uppercase tracking-[0.4em] leading-relaxed">Heuristic holding period density distribution by epoch.</p>
 </div>

 <div className="h-[380px] w-full relative z-10">
 <ResponsiveContainer width="100%" height="100%">
 <BarChart data={durationData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
 <CartesianGrid strokeDasharray="5 5" stroke="rgba(255,255,255,0.03)" vertical={false} />
 <XAxis 
 dataKey="range" 
 axisLine={false} 
 tickLine={false} 
 tick={{ fill: 'rgba(255,255,255,0.1)', fontSize: 11, fontWeight: 900, fontFamily: 'Syne' }}
 dy={25}
 />
 <YAxis hide />
 <Tooltip 
 cursor={{ fill: 'rgba(255,255,255,0.03)', radius: 16 }}
 contentStyle={{ 
 backgroundColor: 'rgba(13,13,18,0.95)', 
 border: '2px solid rgba(255,255,255,0.1)', 
 borderRadius: '32px', 
 padding: '24px',
 backdropFilter: 'blur(20px)'
 }}
 />
 <Bar 
 dataKey="count" 
 radius={[14, 14, 0, 0]} 
 barSize={48}
 animationDuration={2500}
 >
 {durationData.map((entry, index) => (
 <Cell 
 key={`cell-${index}`} 
 fill={index < 2 ? '#6366f1' : index < 4 ? '#06b6d4' : '#f59e0b'} 
 fillOpacity={0.85}
 className="drop-shadow-lg transition-all hover:fill-opacity-100"
 />
 ))}
 </Bar>
 </BarChart>
 </ResponsiveContainer>
 </div>
 
 <div className="mt-14 flex items-center justify-between border-t-2 border-white/5 pt-10 relative z-10">
 <div className="flex items-center gap-4 group/l1">
 <div className="w-4 h-4 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)] group-hover:scale-125 transition-transform" />
 <span className="text-xs font-semibold text-white/30 uppercase tracking-[0.3em]">EPOCH_SCALP</span>
 </div>
 <div className="flex items-center gap-4 group/l2">
 <div className="w-4 h-4 rounded-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)] group-hover:scale-125 transition-transform" />
 <span className="text-xs font-semibold text-white/30 uppercase tracking-[0.3em]">INTRADAY_LENS</span>
 </div>
 <div className="flex items-center gap-4 group/l3">
 <div className="w-4 h-4 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)] group-hover:scale-125 transition-transform" />
 <span className="text-xs font-semibold text-white/30 uppercase tracking-[0.3em]">LONG_EPOCH_SWING</span>
 </div>
 </div>
 </Card>
 </motion.div>
 </div>
 </motion.div>
 );
}
