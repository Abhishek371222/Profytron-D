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
 Cell,
 LineChart,
 Line,
 Legend,
} from 'recharts';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Activity, Target, Zap, Cpu, Search, Sparkles, ArrowRight, TrendingUp, CheckCircle2 } from '@/components/ui/icons';

const strategyStats = [
 { name: 'ApexTrend', winRate: 68, return30d: 12.4, sharpe: 1.82, trades: 124, avgHold: '4.2h' },
 { name: 'Sentinel', winRate: 72, return30d: 15.2, sharpe: 2.14, trades: 98, avgHold: '8.5h' },
 { name: 'DeltaCore', winRate: 98, return30d: 4.8, sharpe: 3.10, trades: 45, avgHold: '2d' },
 { name: 'AlphaScaler', winRate: 54, return30d: 8.2, sharpe: 1.45, trades: 210, avgHold: '1.1h' },
];

const correlationMatrix = [
 ['1.00', '0.12', '-0.45', '0.23'],
 ['0.12', '1.00', '0.05', '-0.18'],
 ['-0.45', '0.05', '1.00', '0.42'],
 ['0.23', '-0.18', '0.42', '1.00'],
];
const strategyNames = ['ApexTrend', 'Sentinel', 'DeltaCore', 'AlphaScaler'];

// Stable time-heatmap data (pre-computed to avoid hydration issues)
const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const timeHeatmapData = [
 { day: 'Mon', hour: 0, val: 5 }, { day: 'Mon', hour: 1, val: 7.8 }, { day: 'Mon', hour: 2, val: 8.9 }, { day: 'Mon', hour: 3, val: 8.3 }, { day: 'Mon', hour: 4, val: 6.4 }, { day: 'Mon', hour: 5, val: 3.8 }, { day: 'Mon', hour: 6, val: 1.4 }, { day: 'Mon', hour: 7, val: -0.2 }, { day: 'Mon', hour: 8, val: -0.8 }, { day: 'Mon', hour: 9, val: -0.4 }, { day: 'Mon', hour: 10, val: 0.8 }, { day: 'Mon', hour: 11, val: 2.8 }, { day: 'Mon', hour: 12, val: 5.2 }, { day: 'Mon', hour: 13, val: 7.4 }, { day: 'Mon', hour: 14, val: 8.8 }, { day: 'Mon', hour: 15, val: 9.1 }, { day: 'Mon', hour: 16, val: 8.2 }, { day: 'Mon', hour: 17, val: 6.4 }, { day: 'Mon', hour: 18, val: 4.1 }, { day: 'Mon', hour: 19, val: 2.1 }, { day: 'Mon', hour: 20, val: 1.1 }, { day: 'Mon', hour: 21, val: 1.8 }, { day: 'Mon', hour: 22, val: 3.8 }, { day: 'Mon', hour: 23, val: 6.3 },
 { day: 'Tue', hour: 0, val: 8.5 }, { day: 'Tue', hour: 1, val: 9.8 }, { day: 'Tue', hour: 2, val: 9.6 }, { day: 'Tue', hour: 3, val: 8.1 }, { day: 'Tue', hour: 4, val: 5.9 }, { day: 'Tue', hour: 5, val: 3.4 }, { day: 'Tue', hour: 6, val: 1.4 }, { day: 'Tue', hour: 7, val: 0.2 }, { day: 'Tue', hour: 8, val: -0.4 }, { day: 'Tue', hour: 9, val: 0.2 }, { day: 'Tue', hour: 10, val: 1.8 }, { day: 'Tue', hour: 11, val: 4.2 }, { day: 'Tue', hour: 12, val: 6.8 }, { day: 'Tue', hour: 13, val: 8.9 }, { day: 'Tue', hour: 14, val: 9.8 }, { day: 'Tue', hour: 15, val: 9.4 }, { day: 'Tue', hour: 16, val: 7.8 }, { day: 'Tue', hour: 17, val: 5.4 }, { day: 'Tue', hour: 18, val: 3.1 }, { day: 'Tue', hour: 19, val: 1.4 }, { day: 'Tue', hour: 20, val: 0.8 }, { day: 'Tue', hour: 21, val: 1.8 }, { day: 'Tue', hour: 22, val: 4.2 }, { day: 'Tue', hour: 23, val: 7.2 },
 { day: 'Wed', hour: 0, val: 9.4 }, { day: 'Wed', hour: 1, val: 9.8 }, { day: 'Wed', hour: 2, val: 8.9 }, { day: 'Wed', hour: 3, val: 6.9 }, { day: 'Wed', hour: 4, val: 4.4 }, { day: 'Wed', hour: 5, val: 2.2 }, { day: 'Wed', hour: 6, val: 0.8 }, { day: 'Wed', hour: 7, val: 0.4 }, { day: 'Wed', hour: 8, val: 1.2 }, { day: 'Wed', hour: 9, val: 2.8 }, { day: 'Wed', hour: 10, val: 5.1 }, { day: 'Wed', hour: 11, val: 7.6 }, { day: 'Wed', hour: 12, val: 9.2 }, { day: 'Wed', hour: 13, val: 9.6 }, { day: 'Wed', hour: 14, val: 8.8 }, { day: 'Wed', hour: 15, val: 7.2 }, { day: 'Wed', hour: 16, val: 5.1 }, { day: 'Wed', hour: 17, val: 3.2 }, { day: 'Wed', hour: 18, val: 1.8 }, { day: 'Wed', hour: 19, val: 1.1 }, { day: 'Wed', hour: 20, val: 1.8 }, { day: 'Wed', hour: 21, val: 3.6 }, { day: 'Wed', hour: 22, val: 6.4 }, { day: 'Wed', hour: 23, val: 8.8 },
 { day: 'Thu', hour: 0, val: 10.2 }, { day: 'Thu', hour: 1, val: 10.1 }, { day: 'Thu', hour: 2, val: 8.8 }, { day: 'Thu', hour: 3, val: 6.4 }, { day: 'Thu', hour: 4, val: 3.8 }, { day: 'Thu', hour: 5, val: 1.4 }, { day: 'Thu', hour: 6, val: -0.2 }, { day: 'Thu', hour: 7, val: -0.8 }, { day: 'Thu', hour: 8, val: 0.2 }, { day: 'Thu', hour: 9, val: 1.8 }, { day: 'Thu', hour: 10, val: 4.2 }, { day: 'Thu', hour: 11, val: 6.8 }, { day: 'Thu', hour: 12, val: 8.9 }, { day: 'Thu', hour: 13, val: 9.8 }, { day: 'Thu', hour: 14, val: 9.4 }, { day: 'Thu', hour: 15, val: 7.8 }, { day: 'Thu', hour: 16, val: 5.4 }, { day: 'Thu', hour: 17, val: 3.1 }, { day: 'Thu', hour: 18, val: 1.2 }, { day: 'Thu', hour: 19, val: 0.2 }, { day: 'Thu', hour: 20, val: 0.8 }, { day: 'Thu', hour: 21, val: 2.8 }, { day: 'Thu', hour: 22, val: 5.8 }, { day: 'Thu', hour: 23, val: 9.1 },
 { day: 'Fri', hour: 0, val: 11.2 }, { day: 'Fri', hour: 1, val: 10.8 }, { day: 'Fri', hour: 2, val: 9.1 }, { day: 'Fri', hour: 3, val: 6.4 }, { day: 'Fri', hour: 4, val: 3.4 }, { day: 'Fri', hour: 5, val: 0.8 }, { day: 'Fri', hour: 6, val: -1.2 }, { day: 'Fri', hour: 7, val: -1.8 }, { day: 'Fri', hour: 8, val: -0.8 }, { day: 'Fri', hour: 9, val: 1.2 }, { day: 'Fri', hour: 10, val: 3.8 }, { day: 'Fri', hour: 11, val: 6.4 }, { day: 'Fri', hour: 12, val: 8.6 }, { day: 'Fri', hour: 13, val: 9.8 }, { day: 'Fri', hour: 14, val: 9.6 }, { day: 'Fri', hour: 15, val: 8.2 }, { day: 'Fri', hour: 16, val: 5.8 }, { day: 'Fri', hour: 17, val: 3.2 }, { day: 'Fri', hour: 18, val: 1.1 }, { day: 'Fri', hour: 19, val: -0.2 }, { day: 'Fri', hour: 20, val: -0.4 }, { day: 'Fri', hour: 21, val: 1.4 }, { day: 'Fri', hour: 22, val: 4.4 }, { day: 'Fri', hour: 23, val: 7.8 },
 { day: 'Sat', hour: 0, val: 10.2 }, { day: 'Sat', hour: 1, val: 10.8 }, { day: 'Sat', hour: 2, val: 10.1 }, { day: 'Sat', hour: 3, val: 8.2 }, { day: 'Sat', hour: 4, val: 5.4 }, { day: 'Sat', hour: 5, val: 2.4 }, { day: 'Sat', hour: 6, val: 0.2 }, { day: 'Sat', hour: 7, val: -1.2 }, { day: 'Sat', hour: 8, val: -1.8 }, { day: 'Sat', hour: 9, val: -0.8 }, { day: 'Sat', hour: 10, val: 1.2 }, { day: 'Sat', hour: 11, val: 3.8 }, { day: 'Sat', hour: 12, val: 6.4 }, { day: 'Sat', hour: 13, val: 8.6 }, { day: 'Sat', hour: 14, val: 9.8 }, { day: 'Sat', hour: 15, val: 9.4 }, { day: 'Sat', hour: 16, val: 7.6 }, { day: 'Sat', hour: 17, val: 4.8 }, { day: 'Sat', hour: 18, val: 2.1 }, { day: 'Sat', hour: 19, val: 0.2 }, { day: 'Sat', hour: 20, val: -0.4 }, { day: 'Sat', hour: 21, val: 0.4 }, { day: 'Sat', hour: 22, val: 2.8 }, { day: 'Sat', hour: 23, val: 6.2 },
 { day: 'Sun', hour: 0, val: 8.8 }, { day: 'Sun', hour: 1, val: 10.2 }, { day: 'Sun', hour: 2, val: 10.4 }, { day: 'Sun', hour: 3, val: 9.1 }, { day: 'Sun', hour: 4, val: 6.8 }, { day: 'Sun', hour: 5, val: 3.8 }, { day: 'Sun', hour: 6, val: 1.2 }, { day: 'Sun', hour: 7, val: -0.8 }, { day: 'Sun', hour: 8, val: -1.8 }, { day: 'Sun', hour: 9, val: -1.2 }, { day: 'Sun', hour: 10, val: 0.4 }, { day: 'Sun', hour: 11, val: 2.8 }, { day: 'Sun', hour: 12, val: 5.4 }, { day: 'Sun', hour: 13, val: 7.8 }, { day: 'Sun', hour: 14, val: 9.2 }, { day: 'Sun', hour: 15, val: 9.4 }, { day: 'Sun', hour: 16, val: 8.1 }, { day: 'Sun', hour: 17, val: 5.8 }, { day: 'Sun', hour: 18, val: 3.1 }, { day: 'Sun', hour: 19, val: 1.1 }, { day: 'Sun', hour: 20, val: 0.2 }, { day: 'Sun', hour: 21, val: 0.8 }, { day: 'Sun', hour: 22, val: 3.2 }, { day: 'Sun', hour: 23, val: 6.4 },
];

// Group data by day for rendering
const timeHeatmap = days.map((day) => 
 timeHeatmapData.filter((item) => item.day === day)
);

const containerVariants = {
 hidden: { opacity: 0 },
 visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
};
const itemVariants = {
 hidden: { opacity: 0, y: 20 },
 visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

const CustomBarTooltip = ({ active, payload, label }: any) => {
 if (active && payload && payload.length) {
 return (
 <div className="bg-[#08080c]/95 border-2 border-white/10 rounded-[20px] p-5 shadow-[0_30px_60px_rgba(0,0,0,0.9)] backdrop-blur-3xl">
 <p className="text-xs font-semibold text-white/30 uppercase tracking-[0.4em] mb-3">{label}</p>
 {payload.map((p: any, i: number) => (
 <div key={i} className="flex items-center gap-3 mt-1.5">
 <div className="w-2 h-2 rounded-full" style={{ background: p.fill }} />
 <span className="text-sm font-semibold text-white capitalize">
 {p.name}: <span className="text-white">{p.value}{p.name === 'winRate' ? '%' : p.name === 'return30d' ? '%' : ''}</span>
 </span>
 </div>
 ))}
 </div>
 );
 }
 return null;
};

export default function PerformanceTab() {
 const [activeMetric, setActiveMetric] = React.useState<'winRate' | 'return30d' | 'sharpe'>('winRate');

 return (
 <motion.div
 variants={containerVariants}
 initial="hidden"
 animate="visible"
 className="space-y-(--section-gap) pb-20"
 >
 {/* ── Strategy Cards ── */}
 <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
 {strategyStats.map((s, i) => (
 <motion.div key={i} variants={itemVariants}>
 <Card className="p-(--card-p) border-2 border-white/5 bg-black/40 backdrop-blur-3xl rounded-4xl relative overflow-hidden group hover:border-p/30 transition-all duration-700 shadow-[0_30px_60px_rgba(0,0,0,0.5)] h-full">
 <div className="absolute top-0 right-0 w-24 h-24 bg-p/5 rounded-full blur-[50px] -mr-12 -mt-12 group-hover:bg-p/10 transition-all" />
 <div className="space-y-5 relative z-10">
 <div className="flex items-center justify-between">
 <span className="text-xs font-semibold text-white/30 uppercase tracking-[0.4em]">{s.name}</span>
 <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
 </div>
 <div>
 <h3 className="text-2xl font-semibold text-white tracking-tight">{s.winRate}%</h3>
 <p className="text-xs text-white/20 font-semibold uppercase tracking-[0.2em] mt-1">Win_Rate</p>
 </div>
 <div className="space-y-2 pt-3 border-t border-white/5">
 <div className="flex justify-between text-xs">
 <span className="text-white/20 font-semibold uppercase tracking-wider">Return_30d</span>
 <span className="text-emerald-400 font-semibold">+{s.return30d}%</span>
 </div>
 <div className="flex justify-between text-xs">
 <span className="text-white/20 font-semibold uppercase tracking-wider">Sharpe_K</span>
 <span className="text-cyan-400 font-semibold">{s.sharpe}</span>
 </div>
 <div className="flex justify-between text-xs">
 <span className="text-white/20 font-semibold uppercase tracking-wider">Trades</span>
 <span className="text-white/60 font-semibold">{s.trades}</span>
 </div>
 </div>
 </div>
 </Card>
 </motion.div>
 ))}
 </div>

 {/* ── Benchmark Chart ── */}
 <motion.div variants={itemVariants}>
 <Card className="p-(--card-p) border-2 border-white/5 bg-black/40 backdrop-blur-3xl shadow-[0_50px_100px_rgba(0,0,0,0.8)] relative overflow-hidden group rounded-[40px]">
 <div className="absolute top-0 left-0 w-full h-0.5 bg-linear-to-r from-transparent via-indigo-500/60 to-transparent" />
 <div className="flex flex-col md:flex-row md:items-start justify-between gap-8 mb-8 relative z-10">
 <div className="space-y-3">
 <div className="flex items-center gap-4">
 <div className="w-10 h-10 rounded-[14px] bg-indigo-500/10 border-2 border-indigo-500/20 flex items-center justify-center">
 <Cpu className="w-5 h-5 text-indigo-400" />
 </div>
 <h3 className="text-xl font-semibold text-white uppercase tracking-tight">Strategy_Benchmark</h3>
 </div>
 <p className="text-xs text-white/20 font-semibold uppercase tracking-[0.4em] max-w-lg">
 Hardware-level performance validation across multi-core strategy infrastructure
 </p>
 </div>
 <div className="flex bg-black/60 p-1.5 rounded-[22px] border border-white/5 backdrop-blur-xl shrink-0">
 {(['winRate', 'return30d', 'sharpe'] as const).map((m) => (
 <button
 key={m}
 onClick={() => setActiveMetric(m)}
 aria-label={`Show ${m === 'winRate' ? 'Win Rate' : m === 'return30d' ? 'Yield' : 'Sharpe Ratio'}`}
 aria-pressed={activeMetric === m}
 className={cn(
 'px-5 py-2 rounded-[18px] text-xs font-semibold uppercase tracking-[0.2em] transition-all duration-500 ',
 activeMetric === m ? 'bg-p text-white shadow-[0_8px_20px_rgba(99,102,241,0.4)]' : 'text-white/20 hover:text-white/50'
 )}
 >
 {m === 'winRate' ? 'Win%' : m === 'return30d' ? 'Yield' : 'Sharpe'}
 </button>
 ))}
 </div>
 </div>
 {/* Explicit height — fixes Recharts warning and uses new density height */}
 <div className="w-full h-(--chart-h-lg)">
 <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={1}>
 <BarChart data={strategyStats} margin={{ top: 10, right: 20, left: 0, bottom: 10 }} barSize={48}>
 <CartesianGrid strokeDasharray="4 4" stroke="rgba(255,255,255,0.03)" vertical={false} />
 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 11, fontWeight: 900 }} dy={12} />
 <YAxis axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.1)', fontSize: 10, fontWeight: 900 }} dx={-10} />
 <Tooltip content={<CustomBarTooltip />} />
 <Bar dataKey={activeMetric} radius={[12, 12, 4, 4]} animationDuration={1500}>
 {strategyStats.map((_, index) => (
 <Cell
 key={`cell-${index}`}
 fill={['#6366f1', '#06b6d4', '#10b981', '#f59e0b'][index]}
 fillOpacity={0.85}
 />
 ))}
 </Bar>
 </BarChart>
 </ResponsiveContainer>
 </div>
 </Card>
 </motion.div>

 {/* ── 2-col: Correlation + Time Heatmap ── */}
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
 {/* Correlation Matrix */}
 <motion.div variants={itemVariants}>
 <Card className="p-(--card-p) border-2 border-white/5 bg-black/40 backdrop-blur-3xl shadow-[0_50px_100px_rgba(0,0,0,0.8)] relative overflow-hidden group h-full rounded-[40px]">
 <div className="absolute top-0 left-0 w-full h-0.5 bg-linear-to-r from-transparent via-cyan-500/40 to-transparent" />
 <div className="mb-8">
 <div className="flex items-center gap-4">
 <div className="w-10 h-10 rounded-[14px] bg-cyan-500/10 border-2 border-cyan-500/20 flex items-center justify-center">
 <Search className="w-5 h-5 text-cyan-400" />
 </div>
 <h4 className="text-lg font-semibold text-white uppercase tracking-tight">Correlation_Lattice</h4>
 </div>
 <p className="text-xs text-white/20 font-semibold uppercase tracking-[0.3em] mt-3">
 Pearson coefficient heat — modular diversification
 </p>
 </div>
 <div className="space-y-3">
 {/* Header row */}
 <div className="grid grid-cols-5 gap-3 pl-20">
 {strategyNames.map(n => (
 <div key={n} className="flex items-end justify-center h-16">
 <span className="text-xs font-semibold text-white/20 uppercase" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>{n}</span>
 </div>
 ))}
 </div>
 {correlationMatrix.map((row, i) => (
 <div key={i} className="grid grid-cols-5 gap-3 items-center">
 <span className="text-xs font-semibold text-white/20 uppercase truncate">{strategyNames[i].slice(0, 6)}</span>
 {row.map((val, j) => {
 const v = parseFloat(val);
 return (
 <motion.div
 key={j}
 whileHover={{ scale: 1.1, zIndex: 10 }}
 className={cn(
 'aspect-square rounded-2xl flex items-center justify-center border-2 transition-all duration-500 cursor-pointer',
 i === j
 ? 'bg-white/6 border-white/10'
 : v > 0.3
 ? 'bg-emerald-500/10 border-emerald-500/20'
 : v < -0.3
 ? 'bg-red-500/10 border-red-500/20'
 : 'bg-white/2 border-white/5'
 )}
 >
 <span className={cn(
 'text-sm font-semibold ',
 i === j ? 'text-white/40' : v > 0 ? 'text-emerald-400' : 'text-red-400'
 )}>
 {val}
 </span>
 </motion.div>
 );
 })}
 </div>
 ))}
 </div>
 </Card>
 </motion.div>

 {/* Temporal Heatmap */}
 <motion.div variants={itemVariants}>
 <Card className="p-(--card-p) border-2 border-white/5 bg-black/40 backdrop-blur-3xl shadow-[0_50px_100px_rgba(0,0,0,0.8)] h-full flex flex-col relative overflow-hidden group rounded-[40px]">
 <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/5 rounded-full blur-[80px] -mr-20 -mt-20 group-hover:bg-amber-500/10 transition-all" />
 <div className="mb-8">
 <div className="flex items-center gap-4">
 <div className="w-10 h-10 rounded-[14px] bg-amber-500/10 border-2 border-amber-500/20 flex items-center justify-center">
 <Zap className="w-5 h-5 text-amber-400" />
 </div>
 <h4 className="text-lg font-semibold text-white uppercase tracking-tight">Temporal_Gate_Density</h4>
 </div>
 <p className="text-xs text-white/20 font-semibold uppercase tracking-[0.3em] mt-3">
 P&L heat across 7-day × 24-hour session matrix
 </p>
 </div>
 <div className="flex flex-col gap-2 flex-1 relative z-10 overflow-hidden">
 {timeHeatmap.map((row, dIdx) => (
 <div key={days[dIdx]} className="flex gap-1.5 items-center">
 <span className="w-12 text-xs font-semibold text-white/20 uppercase shrink-0">{days[dIdx]}</span>
 <div className="flex gap-1 flex-1">
 {row.map((cell, hIdx) => {
 const v = cell.val;
 return (
 <div
 key={hIdx}
 title={`${days[dIdx]} ${hIdx}:00 → ${v.toFixed(1)}%`}
 className={cn(
 'flex-1 rounded-[4px] border transition-all duration-300 hover:scale-150 hover:z-50 cursor-crosshair',
 v > 10 ? 'bg-emerald-500 border-emerald-400/40' :
 v > 5 ? 'bg-emerald-500/60 border-emerald-400/20' :
 v > 0 ? 'bg-emerald-500/25 border-emerald-400/10' :
 v < -5 ? 'bg-red-500/50 border-red-400/20' :
 'bg-white/3 border-white/5'
 )}
 style={{ height: 24 }}
 />
 );
 })}
 </div>
 </div>
 ))}
 </div>
 <div className="flex items-center justify-between mt-6 pt-5 border-t border-white/5">
 <span className="text-xs font-semibold text-white/10 uppercase tracking-[0.4em]">00:00</span>
 <div className="flex items-center gap-6">
 <div className="flex items-center gap-2">
 <div className="w-3 h-3 rounded bg-emerald-500/70 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
 <span className="text-xs font-semibold text-white/20 uppercase tracking-[0.3em]">Growth</span>
 </div>
 <div className="flex items-center gap-2">
 <div className="w-3 h-3 rounded bg-red-500/50" />
 <span className="text-xs font-semibold text-white/20 uppercase tracking-[0.3em]">Risk</span>
 </div>
 </div>
 <span className="text-xs font-semibold text-white/10 uppercase tracking-[0.4em]">23:00</span>
 </div>
 </Card>
 </motion.div>
 </div>

 {/* ── Neural Optimizer CTA ── */}
 <motion.div variants={itemVariants}>
 <div className="p-10 rounded-[40px] border-2 border-p/20 bg-p/4 backdrop-blur-3xl flex flex-col md:flex-row items-center justify-between gap-10 relative overflow-hidden group shadow-[0_60px_120px_rgba(0,0,0,0.5)]">
 <div className="absolute top-0 right-0 w-80 h-80 bg-p/10 rounded-full blur-[120px] -mr-40 -mt-40 group-hover:bg-p/15 transition-all duration-1000" />
 <div className="flex items-center gap-8 relative z-10">
 <div className="w-20 h-20 rounded-[28px] bg-black border-2 border-p/30 flex items-center justify-center shadow-[0_20px_40px_rgba(0,0,0,0.5)] group-hover:scale-110 group-hover:rotate-12 transition-all duration-1000">
 <Sparkles className="w-10 h-10 text-p drop-shadow-[0_0_15px_currentColor] animate-pulse" />
 </div>
 <div>
 <h3 className="text-3xl font-semibold text-white tracking-tight uppercase">Neural_Recal_v4</h3>
 <p className="text-sm text-white/30 font-semibold mt-3 uppercase tracking-[0.4em] max-w-lg leading-relaxed">
 Hardware-level alpha stabilization. Optimize neural modules based on cross-sectional temporal efficiency buffers.
 </p>
 </div>
 </div>
 <motion.button
 whileHover={{ scale: 1.05 }}
 whileTap={{ scale: 0.95 }}
 className="h-16 px-12 rounded-3xl bg-p text-white text-[13px] font-semibold uppercase tracking-[0.5em] shadow-[0_20px_40px_rgba(99,102,241,0.4)] relative z-10 overflow-hidden group/btn shrink-0"
 >
 <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700" />
 Initialize_Optimizer
 </motion.button>
 </div>
 </motion.div>
 </motion.div>
 );
}
