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
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Shield, ShieldCheck, AlertTriangle, Zap, Gauge, Info, Activity, TrendingDown } from '@/components/ui/icons';

const drawdownData = [
 { time: 'T01', val: 0 }, { time: 'T02', val: -1.2 }, { time: 'T03', val: -0.5 },
 { time: 'T04', val: -2.8 }, { time: 'T05', val: -1.4 }, { time: 'T06', val: -4.2 },
 { time: 'T07', val: -3.1 }, { time: 'T08', val: -8.5 }, { time: 'T09', val: -12.4 },
 { time: 'T10', val: -9.2 }, { time: 'T11', val: -6.5 }, { time: 'T12', val: -3.0 },
 { time: 'T13', val: -1.1 }, { time: 'T14', val: 0 },
];

const riskMetrics = [
 { label: 'VaR 95%', val: '$8,240', sub: 'DAILY VALUE AT RISK', icon: Shield, color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
 { label: 'Max Consec Losses', val: '4', sub: 'HISTORICAL PEAK', icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
 { label: 'Largest Loss', val: '-$3,120', sub: 'NOV 12 LIQUIDITY EVENT', icon: TrendingDown, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
 { label: 'Best Single Win', val: '+$5,840', sub: 'DEC 05 VOL BREAKOUT', icon: ShieldCheck, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
 { label: 'Avg Risk/Reward', val: '1 : 2.4', sub: 'EXPECTED UTILITY SCORE', icon: Gauge, color: 'text-p', bg: 'bg-p/10', border: 'border-p/20' },
 { label: 'Calmar Ratio', val: '1.45', sub: 'EFFICIENCY MULTIPLIER', icon: Activity, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
];

const riskZones = [
 { label: 'CRITICAL', range: '>15%', color: '#ef4444', pct: 5 },
 { label: 'HIGH', range: '10–15%', color: '#f59e0b', pct: 15 },
 { label: 'MODERATE', range: '5–10%', color: '#eab308', pct: 30 },
 { label: 'LOW', range: '<5%', color: '#10b981', pct: 50 },
];

const containerVariants = {
 hidden: { opacity: 0 },
 visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
};
const itemVariants = {
 hidden: { opacity: 0, scale: 0.98, y: 15 },
 visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

const CustomTooltip = ({ active, payload, label }: any) => {
 if (active && payload?.[0]) {
 const v = payload[0].value as number;
 return (
 <div className="bg-[#0a0a0f]/95 border-2 border-red-500/20 rounded-[20px] p-5 shadow-[0_30px_60px_rgba(239,68,68,0.2)] backdrop-blur-3xl">
 <p className="text-xs font-semibold text-red-500/40 uppercase tracking-[0.4em] mb-2">{label}</p>
 <p className="text-xl font-semibold text-red-500">{v.toFixed(2)}% <span className="text-xs text-white/20 ml-2 font-normal uppercase tracking-wider">drawdown</span></p>
 </div>
 );
 }
 return null;
};

export default function RiskTab() {
 return (
 <motion.div
 variants={containerVariants}
 initial="hidden"
 animate="visible"
 className="space-y-10 pb-20"
 >
 {/* ── Top Row: Gauge + Drawdown Chart ── */}
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
 {/* VaR Gauge */}
 <motion.div variants={itemVariants}>
 <Card className="p-10 border-2 border-white/5 bg-black/40 backdrop-blur-3xl shadow-[0_50px_100px_rgba(0,0,0,0.8)] flex flex-col items-center h-full relative overflow-hidden group rounded-[40px]">
 <div className="absolute top-0 left-0 w-full h-0.5 bg-linear-to-r from-transparent via-amber-500/60 to-transparent" />
 <div className="w-full space-y-3 mb-10 relative z-10">
 <div className="flex items-center gap-4">
 <div className="w-10 h-10 rounded-[14px] bg-amber-500/10 border-2 border-amber-500/20 flex items-center justify-center">
 <Gauge className="w-5 h-5 text-amber-500" />
 </div>
 <h4 className="text-lg font-semibold text-white uppercase tracking-tight">Risk_Neural_Dial</h4>
 </div>
 <p className="text-xs text-white/20 font-semibold uppercase tracking-[0.3em] leading-relaxed">95% Confidence Interval — Daily VaR Probe</p>
 </div>

 {/* SVG Gauge */}
 <div className="relative w-64 h-36 mt-4 overflow-visible">
 <svg className="w-full h-full" viewBox="0 0 200 110">
 <defs>
 <linearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="0">
 <stop offset="0%" stopColor="#ef4444" />
 <stop offset="50%" stopColor="#f59e0b" />
 <stop offset="100%" stopColor="#10b981" />
 </linearGradient>
 </defs>
 {/* Background track */}
 <path d="M 20 95 A 80 80 0 0 1 180 95" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="14" strokeLinecap="round" />
 {/* Gradient fill */}
 <motion.path
 d="M 20 95 A 80 80 0 0 1 180 95"
 fill="none" stroke="url(#gaugeGrad)" strokeWidth="14" strokeLinecap="round"
 strokeDasharray="251.3"
 initial={{ strokeDashoffset: 251.3 }}
 animate={{ strokeDashoffset: 130 }}
 transition={{ duration: 2.5, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
 />
 {/* Tick marks */}
 {[...Array(9)].map((_, idx) => {
 const angle = -180 + idx * 22.5;
 const r = (angle * Math.PI) / 180;
 return (
 <line key={idx}
 x1={100 + 76 * Math.cos(r)} y1={95 + 76 * Math.sin(r)}
 x2={100 + 65 * Math.cos(r)} y2={95 + 65 * Math.sin(r)}
 stroke={idx % 2 === 0 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)'}
 strokeWidth={idx % 2 === 0 ? '2' : '1'}
 />
 );
 })}
 </svg>
 {/* Needle */}
 <motion.div
 initial={{ rotate: -90 }} animate={{ rotate: 10 }}
 transition={{ type: 'spring', damping: 15, stiffness: 40, delay: 0.7 }}
 style={{ originX: '50%', originY: '100%' }}
 className="absolute bottom-0 left-1/2 -ml-0.5 w-1 h-28 z-20"
 >
 <div className="h-full bg-linear-to-t from-white via-amber-400 to-transparent rounded-full shadow-[0_0_16px_rgba(245,158,11,0.6)]" />
 <div className="w-6 h-6 rounded-full bg-black border-4 border-amber-500 absolute -bottom-3 -left-2.5 shadow-[0_10px_30px_rgba(0,0,0,0.8)] flex items-center justify-center">
 <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
 </div>
 </motion.div>
 </div>

 <div className="text-center mt-8 space-y-4 relative z-10 w-full">
 <h2 className="text-5xl font-semibold text-white tracking-tight">$8,240</h2>
 <p className="text-xs font-semibold text-white/20 uppercase tracking-[0.4em]">MAX_LTM_EXPOSURE</p>
 <div className="px-6 py-3 rounded-[20px] bg-amber-500/10 border border-amber-500/20 w-fit mx-auto">
 <span className="text-xs font-semibold text-amber-500 uppercase tracking-[0.3em]">BUFFER: 85%_ACTIVE</span>
 </div>

 {/* Mini risk zone bars */}
 <div className="space-y-2 mt-6 text-left">
 {riskZones.map((z) => (
 <div key={z.label} className="space-y-1">
 <div className="flex items-center justify-between">
 <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: z.color }}>{z.label}</span>
 <span className="text-xs font-semibold text-white/20">{z.pct}%</span>
 </div>
 <div className="h-1 bg-white/5 rounded-full overflow-hidden">
 <motion.div
 initial={{ width: 0 }}
 animate={{ width: `${z.pct}%` }}
 transition={{ duration: 1.5, delay: 0.8 }}
 className="h-full rounded-full"
 style={{ background: z.color + 'cc' }}
 />
 </div>
 </div>
 ))}
 </div>
 </div>
 </Card>
 </motion.div>

 {/* Drawdown Chart */}
 <motion.div variants={itemVariants} className="lg:col-span-2">
 <Card className="p-10 border-2 border-white/5 bg-black/40 backdrop-blur-3xl shadow-[0_50px_100px_rgba(0,0,0,0.8)] h-full relative overflow-hidden group rounded-[40px]">
 <div className="absolute top-0 left-0 w-full h-0.5 bg-linear-to-r from-transparent via-red-500/50 to-transparent" />
 <div className="flex flex-col md:flex-row md:items-start justify-between gap-8 mb-8 relative z-10">
 <div className="space-y-3">
 <div className="flex items-center gap-4">
 <div className="w-10 h-10 rounded-[14px] bg-red-500/10 border-2 border-red-500/20 flex items-center justify-center">
 <Shield className="w-5 h-5 text-red-400" />
 </div>
 <h4 className="text-xl font-semibold text-white uppercase tracking-tight">Stress_Profile_Lattice</h4>
 </div>
 <p className="text-xs text-white/20 font-semibold uppercase tracking-[0.3em] leading-relaxed max-w-md">
 Underwater analytics relative to High-Water Mark. Visualizing drawdown recovery velocity.
 </p>
 </div>
 <div className="flex bg-red-500/5 px-6 py-4 rounded-3xl border border-red-500/20 shrink-0">
 <div className="flex flex-col items-end gap-1">
 <span className="text-xs font-semibold text-red-500/40 uppercase tracking-[0.3em]">PEAK_VARIANCE</span>
 <span className="text-2xl font-semibold text-red-500 tracking-tight">-12.48%</span>
 </div>
 </div>
 </div>

 {/* Explicit height */}
 <div style={{ width: '100%', height: 300 }}>
 <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={1}>
 <AreaChart data={drawdownData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
 <defs>
 <linearGradient id="ddGrad" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor="#ef4444" stopOpacity={0.5} />
 <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
 </linearGradient>
 </defs>
 <CartesianGrid strokeDasharray="4 4" stroke="rgba(255,255,255,0.03)" vertical={false} />
 <XAxis dataKey="time" hide />
 <YAxis axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.1)', fontSize: 10, fontWeight: 900 }} tickFormatter={(v) => `${v}%`} dx={-10} />
 <Tooltip content={<CustomTooltip />} />
 <ReferenceLine y={-12.4} stroke="rgba(239,68,68,0.3)" strokeDasharray="6 6" label={{ value: 'MAX DD', fill: 'rgba(239,68,68,0.4)', fontSize: 9, fontWeight: 900 }} />
 <Area type="monotone" dataKey="val" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#ddGrad)" animationDuration={2000} strokeLinecap="round" dot={false} />
 </AreaChart>
 </ResponsiveContainer>
 </div>

 <div className="mt-6 flex items-center gap-5 bg-white/2 p-5 rounded-3xl border border-white/5 relative z-10">
 <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
 <Info className="w-5 h-5 text-white/20 animate-pulse" />
 </div>
 <p className="text-sm text-white/30 font-semibold uppercase tracking-[0.3em] leading-relaxed">
 Recovery buffer estimated at <span className="text-white">12.4_TRADING_EPOCHS</span> based on current volatility regime indices.
 </p>
 </div>
 </Card>
 </motion.div>
 </div>

 {/* ── Risk Metrics Grid ── */}
 <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
 {riskMetrics.map((m, i) => (
 <motion.div key={i} variants={itemVariants}>
 <Card className="p-8 border-2 border-white/5 bg-black/40 backdrop-blur-3xl hover:border-white/20 transition-all duration-700 overflow-hidden relative group h-full rounded-4xl shadow-[0_30px_60px_rgba(0,0,0,0.5)]">
 <div className={cn('absolute top-0 left-0 w-full h-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-700', m.bg.replace('bg-', 'bg-').replace('/10', '/60'))} />
 <div className="flex items-center gap-6 relative z-10">
 <div className={cn('w-14 h-14 rounded-[18px] flex items-center justify-center border-2 group-hover:rotate-12 group-hover:scale-110 transition-all duration-700 shrink-0', m.bg, m.border)}>
 <m.icon className={cn('w-7 h-7', m.color, 'drop-shadow-[0_0_8px_currentColor]')} />
 </div>
 <div className="min-w-0">
 <p className="text-xs font-semibold text-white/30 uppercase tracking-[0.3em]">{m.label}</p>
 <h4 className="text-2xl font-semibold text-white tracking-tight mt-1">{m.val}</h4>
 <p className="text-xs text-white/10 font-semibold uppercase tracking-[0.2em] mt-1 truncate">{m.sub}</p>
 </div>
 </div>
 </Card>
 </motion.div>
 ))}
 </div>

 {/* ── Scenario Stress Tests ── */}
 <motion.div variants={itemVariants}>
 <Card className="p-10 border-2 border-white/5 bg-black/40 backdrop-blur-3xl shadow-[0_40px_80px_rgba(0,0,0,0.6)] relative overflow-hidden group rounded-[40px]">
 <div className="mb-8 relative z-10">
 <div className="flex items-center gap-4">
 <div className="w-10 h-10 rounded-[14px] bg-p/10 border-2 border-p/20 flex items-center justify-center">
 <Zap className="w-5 h-5 text-p animate-pulse" />
 </div>
 <h4 className="text-lg font-semibold text-white uppercase tracking-tight">Scenario_Stress_Matrix</h4>
 </div>
 <p className="text-xs text-white/20 font-semibold uppercase tracking-[0.3em] mt-3">Simulated portfolio impact under historical stress regimes</p>
 </div>
 <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative z-10">
 {[
 { scenario: 'Crypto Black Swan', impact: '-22.4%', prob: 'LOW', color: 'red' },
 { scenario: 'Fed Rate Shock +200bps', impact: '-8.7%', prob: 'MED', color: 'amber' },
 { scenario: 'Flash Crash Recovery', impact: '-14.1%', prob: 'LOW', color: 'red' },
 { scenario: 'Vol Squeeze Regime', impact: '+5.2%', prob: 'HIGH', color: 'emerald' },
 ].map((s, i) => (
 <div key={i} className={cn(
 'p-6 rounded-3xl border-2 relative overflow-hidden',
 s.color === 'red' ? 'bg-red-500/4 border-red-500/10' :
 s.color === 'amber' ? 'bg-amber-500/4 border-amber-500/10' :
 'bg-emerald-500/4 border-emerald-500/10'
 )}>
 <p className="text-xs font-semibold text-white/30 uppercase tracking-[0.3em] leading-relaxed">{s.scenario}</p>
 <p className={cn('text-2xl font-semibold tracking-tight mt-3',
 s.impact.startsWith('+') ? 'text-emerald-400' : 'text-red-400'
 )}>{s.impact}</p>
 <span className={cn(
 'text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border mt-2 inline-block',
 s.color === 'emerald' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' :
 s.color === 'red' ? 'text-red-400 bg-red-500/10 border-red-500/20' :
 'text-amber-400 bg-amber-500/10 border-amber-500/20'
 )}>
 {s.prob}_PROB
 </span>
 </div>
 ))}
 </div>
 </Card>
 </motion.div>
 </motion.div>
 );
}
