'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
 AreaChart,
 Area,
 XAxis,
 YAxis,
 CartesianGrid,
 Tooltip,
 ResponsiveContainer,
 ReferenceLine,
} from 'recharts';
import {
 Activity,
 TrendingUp,
 AlertTriangle,
 CheckCircle2,
 Gauge,
 ArrowRight,
 ShieldCheck,
 TrendingDown,
 Zap,
 Target,
 Cpu,
 Sparkles,
} from '@/components/ui/icons';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// Stable mock data (no Math.random — prevents hydration issues)
const equityData = [
 { date: 'Mar 01', value: 100000, risk: 18000 },
 { date: 'Mar 03', value: 101200, risk: 19500 },
 { date: 'Mar 05', value: 103800, risk: 21000 },
 { date: 'Mar 07', value: 102400, risk: 22000 },
 { date: 'Mar 09', value: 105600, risk: 20500 },
 { date: 'Mar 11', value: 107200, risk: 19000 },
 { date: 'Mar 13', value: 106100, risk: 21500 },
 { date: 'Mar 15', value: 109400, risk: 17000 },
 { date: 'Mar 17', value: 111800, risk: 18500 },
 { date: 'Mar 19', value: 110300, risk: 22000 },
 { date: 'Mar 21', value: 113600, risk: 20000 },
 { date: 'Mar 23', value: 115900, risk: 23000 },
 { date: 'Mar 25', value: 114200, risk: 21000 },
 { date: 'Mar 27', value: 117800, risk: 19500 },
 { date: 'Mar 29', value: 120400, risk: 17500 },
];

const heatmapData = [
 {
 year: '2023',
 months: [
 { name: 'Jan', val: 2.4 }, { name: 'Feb', val: -1.2 }, { name: 'Mar', val: 4.8 }, { name: 'Apr', val: 0.5 },
 { name: 'May', val: 3.1 }, { name: 'Jun', val: -4.1 }, { name: 'Jul', val: 2.2 }, { name: 'Aug', val: 1.8 },
 { name: 'Sep', val: -0.8 }, { name: 'Oct', val: 5.2 }, { name: 'Nov', val: 3.9 }, { name: 'Dec', val: 2.7 },
 ],
 },
 {
 year: '2024',
 months: [
 { name: 'Jan', val: 8.4 }, { name: 'Feb', val: 12.3 }, { name: 'Mar', val: 10.1 }, { name: 'Apr', val: 6.5 },
 { name: 'May', val: 0 }, { name: 'Jun', val: 0 }, { name: 'Jul', val: 0 }, { name: 'Aug', val: 0 },
 { name: 'Sep', val: 0 }, { name: 'Oct', val: 0 }, { name: 'Nov', val: 0 }, { name: 'Dec', val: 0 },
 ],
 },
];

const kpis = [
 { label: 'Sharpe Ratio', value: '1.82', delta: '+0.12', desc: 'INSTITUTIONAL_STABLE', icon: Activity, color: 'text-p', bg: 'bg-p/10', border: 'border-p/20', glow: 'rgba(99,102,241,0.3)' },
 { label: 'Sortino Ratio', value: '2.14', delta: '+0.08', desc: 'ALPHA_ADJUSTED', icon: TrendingUp, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', glow: 'rgba(6,182,212,0.3)' },
 { label: 'Max Drawdown', value: '12.4%', delta: '-1.2%', desc: 'LOW_VARIANCE_CORE', icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20', glow: 'rgba(245,158,11,0.3)' },
 { label: 'Win Rate', value: '68.4%', delta: '+2.1%', desc: 'HIGH_FIDELITY_EXE', icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', glow: 'rgba(16,185,129,0.3)' },
 { label: 'Profit Factor', value: '2.14', delta: '+0.04', desc: 'NEURAL_STABILIZED', icon: Gauge, color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20', glow: 'rgba(139,92,246,0.3)' },
];

const containerVariants = {
 hidden: { opacity: 0 },
 visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const itemVariants = {
 hidden: { opacity: 0, y: 20 },
 visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

const HeatmapCell = ({ val, name }: { val: number; name: string }) => {
 const getBg = (v: number) => {
 if (v === 0) return 'bg-white/[0.02] border-white/5';
 if (v > 8) return 'bg-[#10b981] shadow-[0_0_30px_rgba(16,185,129,0.5)] border-[#10b981]/60';
 if (v > 3) return 'bg-[#10b981]/60 border-[#10b981]/30';
 if (v > 0) return 'bg-[#10b981]/20 border-[#10b981]/10';
 if (v < -3) return 'bg-[#ef4444] shadow-[0_0_30px_rgba(239,68,68,0.4)] border-[#ef4444]/60';
 return 'bg-[#ef4444]/30 border-[#ef4444]/20';
 };
 return (
 <div className="flex flex-col items-center gap-1 group/cell w-full">
 <motion.div
 initial={{ opacity: 0, scale: 0.7 }}
 animate={{ opacity: 1, scale: 1 }}
 whileHover={{ scale: 1.2, zIndex: 50, rotate: -3 }}
 transition={{ type: 'spring', bounce: 0.3 }}
 className={cn(
 'w-full aspect-square rounded-xl border-2 flex items-center justify-center relative overflow-hidden cursor-pointer',
 getBg(val),
 val !== 0 && 'shadow-2xl'
 )}
 >
 <span className={cn('text-xs font-semibold ', Math.abs(val) > 5 ? 'text-white' : 'text-white/40')}>
 {val !== 0 ? `${val > 0 ? '+' : ''}${val}%` : ''}
 </span>
 <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover/cell:opacity-100 transition-opacity duration-300" />
 </motion.div>
 <span className="text-xs font-semibold text-white/10 uppercase tracking-wider">{name}</span>
 </div>
 );
};

const CustomTooltip = ({ active, payload, label }: any) => {
 if (active && payload && payload.length) {
 return (
 <div className="bg-[#08080c]/95 border-2 border-white/10 rounded-[24px] p-6 shadow-[0_40px_80px_rgba(0,0,0,0.9)] backdrop-blur-3xl">
 <p className="text-xs font-semibold text-p uppercase tracking-[0.4em] mb-3">{label}</p>
 {payload.map((p: any, i: number) => (
 <div key={i} className="flex items-center gap-3 mt-1">
 <div className="w-2 h-2 rounded-full" style={{ background: p.stroke }} />
 <span className="text-sm font-semibold text-white">
 ${Number(p.value).toLocaleString()}
 <span className="text-xs text-white/20 ml-2 uppercase tracking-widest font-normal">{p.dataKey}</span>
 </span>
 </div>
 ))}
 </div>
 );
 }
 return null;
};

export default function OverviewTab() {
 const [activePeriod, setActivePeriod] = React.useState('NEURAL_MAX');

 return (
 <motion.div
 variants={containerVariants}
 initial="hidden"
 animate="visible"
 className="space-y-[var(--section-gap)] pb-20"
 >
 {/* ── KPI Matrix ── */}
 <div 
 className="grid grid-cols-2 lg:grid-cols-5 gap-6"
 role="region" 
 aria-label="Key Performance Indicators"
 >
 {kpis.map((kpi, i) => (
 <motion.div key={i} variants={itemVariants}>
 <Card className="p-[var(--card-p)] border-2 border-white/5 bg-black/40 backdrop-blur-3xl shadow-[0_30px_60px_rgba(0,0,0,0.5)] relative overflow-hidden group hover:border-white/20 transition-all duration-700 rounded-[32px] h-full">
 <div className="absolute inset-0 rounded-[32px] opacity-0 group-hover:opacity-100 transition-opacity duration-700" style={{ boxShadow: `inset 0 0 60px ${kpi.glow}` }} />
 <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-[50px] -mr-12 -mt-12 group-hover:scale-150 transition-all duration-1000" style={{ background: kpi.glow }} />
 <div className="space-y-6 relative z-10">
 <div className="flex items-center justify-between">
 <div 
 className={cn('w-12 h-12 rounded-[18px] flex items-center justify-center border-2 group-hover:rotate-12 group-hover:scale-110 transition-all duration-700', kpi.bg, kpi.border)}
 aria-hidden="true"
 >
 <kpi.icon className={cn('w-6 h-6', kpi.color, 'drop-shadow-[0_0_8px_currentColor]')} />
 </div>
 <span className={cn('text-xs font-semibold px-3 py-1 rounded-full border', 
 kpi.delta.startsWith('+') ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-red-400 bg-red-500/10 border-red-500/20'
 )}>
 {kpi.delta}
 </span>
 </div>
 <div>
 <p className="text-xs font-semibold text-white/30 uppercase tracking-[0.3em]">{kpi.label}</p>
 <h3 className="text-2xl font-semibold text-white tracking-tight mt-1">{kpi.value}</h3>
 <p className="text-xs text-white/10 font-semibold uppercase tracking-[0.2em] mt-2">{kpi.desc}</p>
 </div>
 </div>
 </Card>
 </motion.div>
 ))}
 </div>

 {/* ── Equity Chart + Heatmap ── */}
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
 {/* Main Equity Chart */}
 <motion.div variants={itemVariants} className="lg:col-span-2">
 <Card className="p-[var(--card-p)] border-2 border-white/5 bg-black/40 backdrop-blur-3xl shadow-[0_50px_100px_rgba(0,0,0,0.8)] overflow-hidden relative group rounded-[40px] h-full">
 <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-p to-transparent opacity-70" />
 <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-8 mb-8 relative z-10">
 <div className="space-y-3">
 <div className="flex items-center gap-4">
 <div className="w-10 h-10 rounded-[14px] bg-p/10 border-2 border-p/20 flex items-center justify-center">
 <Sparkles className="w-5 h-5 text-p" />
 </div>
 <h3 className="text-xl font-semibold text-white uppercase tracking-tight">Equity_Lattice</h3>
 </div>
 <p className="text-xs text-white/20 font-semibold uppercase tracking-[0.4em] max-w-sm">
 Neural capital velocity tracking across cross-sectional regimes
 </p>
 </div>
 <div className="flex bg-black/60 p-1.5 rounded-[22px] border border-white/5 backdrop-blur-xl shrink-0">
 {['1M', '3M', '1Y', 'NEURAL_MAX'].map((p) => (
 <button
 key={p}
 onClick={() => setActivePeriod(p)}
 aria-label={`Switch timeline to ${p.replace('_', ' ')}`}
 aria-pressed={activePeriod === p}
 className={cn(
 'px-5 py-2 rounded-[18px] text-xs font-semibold uppercase tracking-[0.2em] transition-all duration-500 ',
 activePeriod === p
 ? 'bg-p text-white shadow-[0_8px_20px_rgba(99,102,241,0.4)]'
 : 'text-white/20 hover:text-white/50'
 )}
 >
 {p.replace('NEURAL_', '')}
 </button>
 ))}
 </div>
 </div>

 {/* Chart container with new height token */}
 <div className="w-full h-[var(--chart-h-lg)]">
 <ResponsiveContainer width="100%" height="100%">
 <AreaChart data={equityData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
 <defs>
 <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor="#6366f1" stopOpacity={0.5} />
 <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
 </linearGradient>
 <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
 <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
 </linearGradient>
 </defs>
 <CartesianGrid strokeDasharray="4 4" stroke="rgba(255,255,255,0.03)" vertical={false} />
 <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.15)', fontSize: 10, fontWeight: 900 }} dy={8} interval={2} />
 <YAxis axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.1)', fontSize: 10, fontWeight: 900 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} dx={-10} />
 <Tooltip content={<CustomTooltip />} />
 <ReferenceLine y={100000} stroke="rgba(255,255,255,0.05)" strokeDasharray="6 6" />
 <Area type="monotone" dataKey="value" name="equity" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#eqGrad)" dot={false} animationDuration={2000} />
 <Area type="monotone" dataKey="risk" name="risk_buffer" stroke="#06b6d4" strokeWidth={2} strokeDasharray="8 8" fillOpacity={1} fill="url(#riskGrad)" dot={false} animationDuration={2500} />
 </AreaChart>
 </ResponsiveContainer>
 </div>

 {/* Legend */}
 <div className="flex items-center gap-8 mt-4 pl-2 relative z-10">
 <div className="flex items-center gap-3">
 <div className="w-8 h-0.5 bg-p rounded-full" />
 <span className="text-xs font-semibold text-white/20 uppercase tracking-[0.3em]">Master_Equity</span>
 </div>
 <div className="flex items-center gap-3">
 <div className="w-8 h-0.5 bg-cyan-400 rounded-full" style={{ borderTop: '2px dashed #06b6d4', background: 'none' }} />
 <span className="text-xs font-semibold text-white/20 uppercase tracking-[0.3em]">Variance_Alpha</span>
 </div>
 <div className="ml-auto text-right">
 <p className="text-xs text-white/10 font-semibold uppercase tracking-[0.4em]">Total_P&L</p>
 <p className="text-lg font-semibold text-emerald-400 tracking-tight">+$20,400 <span className="text-xs text-emerald-400/50 uppercase tracking-widest">+20.4%</span></p>
 </div>
 </div>
 </Card>
 </motion.div>

 {/* Heatmap */}
 <motion.div variants={itemVariants}>
 <Card className="p-[var(--card-p)] border-2 border-white/5 bg-black/40 backdrop-blur-3xl shadow-[0_50px_100px_rgba(0,0,0,0.8)] h-full flex flex-col relative overflow-hidden group rounded-[40px]">
 <div className="absolute top-0 right-0 w-40 h-40 bg-p/5 rounded-full blur-[80px] -mr-20 -mt-20 group-hover:bg-p/10 transition-all duration-1000" />
 <div className="mb-6 relative z-10">
 <div className="flex items-center gap-4">
 <div className="w-10 h-10 rounded-[14px] bg-indigo-500/10 border-2 border-indigo-500/20 flex items-center justify-center">
 <Target className="w-5 h-5 text-indigo-400" />
 </div>
 <h4 className="text-lg font-semibold text-white uppercase tracking-tight">Neural_Yield_Map</h4>
 </div>
 <p className="text-xs text-white/20 font-semibold uppercase tracking-[0.3em] mt-3 leading-loose">
 Monthly P&L distribution heatmap
 </p>
 </div>
 <div className="space-y-6 flex-1 relative z-10">
 {heatmapData.map((yearData) => (
 <div key={yearData.year} className="space-y-3">
 <div className="flex items-center gap-4">
 <span className="text-xs font-semibold text-white/30 tracking-[0.5em] uppercase">{yearData.year}</span>
 <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
 </div>
 <div className="grid grid-cols-6 gap-2">
 {yearData.months.map((m, idx) => (
 <HeatmapCell key={idx} val={m.val} name={m.name} />
 ))}
 </div>
 </div>
 ))}
 </div>
 <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-5 relative z-10">
 <div className="flex items-center gap-3">
 <div className="w-3 h-3 rounded bg-red-500/80 shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
 <span className="text-xs font-semibold text-white/20 uppercase tracking-[0.3em]">Drawdown</span>
 </div>
 <div className="flex items-center gap-3">
 <span className="text-xs font-semibold text-white/20 uppercase tracking-[0.3em]">Alpha</span>
 <div className="w-3 h-3 rounded bg-emerald-500/80 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
 </div>
 </div>
 </Card>
 </motion.div>
 </div>

 {/* ── Intelligence Regime Analyzers ── */}
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
 {/* Alpha Regime */}
 <motion.div variants={itemVariants}>
 <Card className="p-[var(--card-p)] border-2 border-emerald-500/10 bg-emerald-500/[0.02] backdrop-blur-3xl relative overflow-hidden group hover:border-emerald-500/30 transition-all duration-700 rounded-[40px] shadow-[0_40px_80px_rgba(0,0,0,0.5)]">
 <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-[80px] -mr-24 -mt-24 group-hover:bg-emerald-500/10 transition-all" />
 <div className="absolute inset-0" style={{ backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.01) 0px, rgba(255,255,255,0.01) 1px, transparent 1px, transparent 40px)' }} />
 <div className="flex items-start justify-between relative z-10">
 <div className="space-y-4">
 <div className="flex items-center gap-3 px-4 py-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20 w-fit">
 <Zap className="w-4 h-4 text-emerald-400 animate-pulse" />
 <span className="text-xs font-semibold text-emerald-400 uppercase tracking-[0.4em]">Alpha_Regime_Peak</span>
 </div>
 <h5 className="text-4xl font-semibold text-white tracking-tight leading-tight">
 +12.34%
 <span className="text-white/20 text-sm font-bold uppercase ml-4 tracking-[0.2em]">Q1_MAX</span>
 </h5>
 </div>
 <div className="w-16 h-16 rounded-[22px] bg-emerald-500/10 flex items-center justify-center border-2 border-emerald-500/20 group-hover:rotate-[15deg] group-hover:scale-110 transition-all duration-1000">
 <Cpu className="w-8 h-8 text-emerald-400" />
 </div>
 </div>
 <div className="mt-8 pt-8 border-t border-white/5 space-y-5 relative z-10">
 {[
 { label: 'Alpha_Efficiency', val: 94, color: 'bg-emerald-500' },
 { label: 'Regime_Stability', val: 78, color: 'bg-cyan-500' },
 { label: 'Drawdown_Shield', val: 86, color: 'bg-p' },
 ].map((bar) => (
 <div key={bar.label} className="space-y-2">
 <div className="flex items-center justify-between">
 <span className="text-xs font-semibold text-white/30 uppercase tracking-[0.3em]">{bar.label}</span>
 <span className="text-xs font-semibold text-white/50">{bar.val}%</span>
 </div>
 <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
 <motion.div
 initial={{ width: 0 }}
 animate={{ width: `${bar.val}%` }}
 transition={{ duration: 1.5, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
 className={cn('h-full rounded-full', bar.color)}
 />
 </div>
 </div>
 ))}
 <button className="flex items-center gap-4 text-sm font-semibold text-emerald-400 uppercase tracking-[0.5em] group/btn hover:text-white transition-all mt-4">
 DIAGNOSE_PROTOCOL <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-3 transition-transform duration-500" />
 </button>
 </div>
 </Card>
 </motion.div>

 {/* Stress Lattice */}
 <motion.div variants={itemVariants}>
 <Card className="p-[var(--card-p)] border-2 border-p/10 bg-p/[0.02] backdrop-blur-3xl relative overflow-hidden group hover:border-p/30 transition-all duration-700 rounded-[40px] shadow-[0_40px_80px_rgba(0,0,0,0.5)]">
 <div className="absolute top-0 right-0 w-48 h-48 bg-p/5 rounded-full blur-[80px] -mr-24 -mt-24 group-hover:bg-p/10 transition-all" />
 <div className="absolute inset-0" style={{ backgroundImage: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.01) 0px, rgba(255,255,255,0.01) 1px, transparent 1px, transparent 40px)' }} />
 <div className="flex items-start justify-between relative z-10">
 <div className="space-y-4">
 <div className="flex items-center gap-3 px-4 py-2 bg-p/10 rounded-xl border border-p/20 w-fit">
 <Activity className="w-4 h-4 text-p animate-pulse" />
 <span className="text-xs font-semibold text-p uppercase tracking-[0.4em]">Stress_Lattice_Score</span>
 </div>
 <h5 className="text-4xl font-semibold text-white tracking-tight leading-tight">
 9.8<span className="text-white/20 text-xl">/10</span>
 <span className="text-white/20 text-sm font-bold uppercase ml-4 tracking-[0.2em]">RESILIENCE</span>
 </h5>
 </div>
 <div className="w-16 h-16 rounded-[22px] bg-p/10 flex items-center justify-center border-2 border-p/20 group-hover:-rotate-[15deg] group-hover:scale-110 transition-all duration-1000">
 <ShieldCheck className="w-8 h-8 text-p" />
 </div>
 </div>
 <div className="mt-8 pt-8 border-t border-white/5 space-y-5 relative z-10">
 {[
 { label: 'VaR_Containment', val: 92, color: 'bg-p' },
 { label: 'Correlation_Hedge', val: 65, color: 'bg-amber-500' },
 { label: 'Tail_Risk_Shield', val: 88, color: 'bg-violet-500' },
 ].map((bar) => (
 <div key={bar.label} className="space-y-2">
 <div className="flex items-center justify-between">
 <span className="text-xs font-semibold text-white/30 uppercase tracking-[0.3em]">{bar.label}</span>
 <span className="text-xs font-semibold text-white/50">{bar.val}%</span>
 </div>
 <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
 <motion.div
 initial={{ width: 0 }}
 animate={{ width: `${bar.val}%` }}
 transition={{ duration: 1.5, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
 className={cn('h-full rounded-full', bar.color)}
 />
 </div>
 </div>
 ))}
 <button className="flex items-center gap-4 text-sm font-semibold text-p uppercase tracking-[0.5em] group/btn hover:text-white transition-all mt-4">
 AUDIT_NEURAL_RISK_DNA <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-3 transition-transform duration-500" />
 </button>
 </div>
 </Card>
 </motion.div>
 </div>

 {/* ── Live Activity Stream ── */}
 <motion.div variants={itemVariants}>
 <Card className="p-[var(--card-p)] border-2 border-white/5 bg-black/40 backdrop-blur-3xl shadow-[0_40px_80px_rgba(0,0,0,0.6)] relative overflow-hidden group rounded-[40px]">
 <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-p/60 to-transparent" />
 <div className="flex items-center justify-between mb-8 relative z-10">
 <div className="flex items-center gap-4">
 <div className="w-10 h-10 rounded-[14px] bg-p/10 border-2 border-p/20 flex items-center justify-center">
 <Activity className="w-5 h-5 text-p animate-pulse" />
 </div>
 <div>
 <h4 className="text-lg font-semibold text-white uppercase tracking-tight">Live_Event_Ledger</h4>
 <p className="text-xs text-white/20 font-semibold uppercase tracking-[0.3em]">Real-time signal intelligence</p>
 </div>
 </div>
 <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
 <span className="text-xs font-semibold text-emerald-400 uppercase tracking-[0.3em]">LIVE</span>
 </div>
 </div>
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
 {[
 { time: '14:32:18', event: 'APEX_TREND signal triggered', type: 'BUY', asset: 'BTC/USDT', pnl: '+$842', status: 'FILLED', color: 'emerald' },
 { time: '14:29:04', event: 'SENTINEL risk gate activated', type: 'HEDGE', asset: 'ETH_PUT', pnl: '-$120', status: 'PROTECTED', color: 'amber' },
 { time: '14:21:55', event: 'DELTA_CORE rebalanced', type: 'SELL', asset: 'SPX_FUTURES', pnl: '+$2,140', status: 'CLOSED', color: 'p' },
 ].map((e, i) => (
 <motion.div
 key={i}
 initial={{ opacity: 0, x: -20 }}
 animate={{ opacity: 1, x: 0 }}
 transition={{ delay: 0.3 + i * 0.1 }}
 className={cn(
 'p-6 rounded-[28px] border-2 relative overflow-hidden group/event transition-all duration-500',
 e.color === 'emerald' ? 'bg-emerald-500/[0.04] border-emerald-500/10 hover:border-emerald-500/30' :
 e.color === 'amber' ? 'bg-amber-500/[0.04] border-amber-500/10 hover:border-amber-500/30' :
 'bg-p/[0.04] border-p/10 hover:border-p/30'
 )}
 >
 <div className="flex items-start justify-between gap-4 mb-4">
 <span className="text-xs font-semibold text-white/20 uppercase tracking-[0.3em] font-mono">{e.time}</span>
 <span className={cn(
 'text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ',
 e.color === 'emerald' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' :
 e.color === 'amber' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' :
 'text-p bg-p/10 border-p/20'
 )}>
 {e.status}
 </span>
 </div>
 <p className="text-sm font-semibold text-white uppercase tracking-tight leading-tight">{e.event}</p>
 <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
 <span className="text-xs font-semibold text-white/20 uppercase tracking-[0.3em]">{e.asset}</span>
 <span className={cn('text-sm font-semibold ', e.pnl.startsWith('+') ? 'text-emerald-400' : 'text-red-400')}>{e.pnl}</span>
 </div>
 </motion.div>
 ))}
 </div>
 </Card>
 </motion.div>
 </motion.div>
 );
}
