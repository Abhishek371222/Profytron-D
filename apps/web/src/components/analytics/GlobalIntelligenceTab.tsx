'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { 
 Zap, 
 Sparkles, 
 Activity, 
 Target, 
 ShieldCheck, 
 Clock, 
 Info, 
 Globe, 
 Radio, 
 ArrowUpRight, 
 ArrowRight,
 ChevronRight,
 TrendingUp,
 Cpu
} from '@/components/ui/icons';

const categories = [
 { id: 'trend', label: 'Trend Follower', val: 78, color: 'bg-indigo-500', trend: '+12%', desc: 'MOMENTUM CORE' },
 { id: 'range', label: 'Mean Reversion', val: 45, color: 'bg-cyan-500', trend: '-2%', desc: 'STASIS VECTOR' },
 { id: 'scalping', label: 'High Frequency', val: 92, color: 'bg-emerald-500', trend: '+24%', desc: 'HFT LIQUIDITY' },
 { id: 'vol', label: 'Volatility Arb', val: 64, color: 'bg-amber-500', trend: '+8%', desc: 'GAMMA SHARP' },
];

const traders = [
 { rank: 1, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix', name: '@CryptoWhale', return: '242.4%', strategies: 12, tier: 'LEVIATHAN' },
 { rank: 2, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Anita', name: '@AnitaForex', return: '198.2%', strategies: 8, tier: 'PRIME' },
 { rank: 3, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Max', name: '@MaxAlpha', return: '174.5%', strategies: 15, tier: 'LEGACY' },
];

const news = [
 { event: 'Fed Open Market Operation', time: '18:00', impact: 'CRITICAL', impactColor: 'text-red-500 bg-red-500/10', desc: 'INSTITUTIONAL LIQUIDITY SHIFT DETECTED' },
 { event: 'Global GPU Index Spike', time: '13:30', impact: 'HIGH', impactColor: 'text-amber-500 bg-amber-500/10', desc: 'AI SECTOR MOMENTUM VALIDATED' },
 { event: 'Tokyo Core Inflation', time: '04:30', impact: 'MEDIUM', impactColor: 'text-indigo-400 bg-indigo-400/10', desc: 'YEN CARRY TRADE DYNAMICS SHIFTING' },
];

const containerVariants = {
 hidden: { opacity: 0 },
 visible: {
 opacity: 1,
 transition: {
 staggerChildren: 0.1,
 delayChildren: 0.2
 }
 }
};

const itemVariants = {
 hidden: { opacity: 0, scale: 0.98, y: 15 },
 visible: { 
 opacity: 1, 
 scale: 1,
 y: 0,
 transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] }
 }
};

const WorldMap = () => (
 <motion.div 
 variants={itemVariants}
 className="relative w-full h-(--chart-h-lg) min-h-100 bg-black/40 backdrop-blur-3xl rounded-[40px] overflow-hidden border border-white/5 shadow-2xl group shadow-[inset_0_0_50px_rgba(99,102,241,0.05)]"
 >
 {/* Background Grid Pattern */}
 <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20" />
 
 <div className="absolute top-10 left-12 z-20">
 <div className="flex items-center gap-4">
 <div className="w-10 h-10 rounded-xl bg-p/10 border border-p/20 flex items-center justify-center">
 <Globe className="w-5 h-5 text-p" />
 </div>
 <div>
 <h4 className="text-sm font-semibold text-white uppercase tracking-[0.5em]">Global Network Intel</h4>
 <p className="text-xs text-white/20 font-bold uppercase tracking-[0.3em] mt-1">Satellite Hub Synchronization Protocol v2.4</p>
 </div>
 </div>
 </div>

 {/* Map Decorative Overlay */}
 <div className="absolute inset-0 opacity-[0.03] grayscale invert pointer-events-none p-20">
 <svg viewBox="0 0 1000 500" className="w-full h-full">
 <path d="M150,150 Q250,50 350,150 T550,150 T750,50" fill="none" stroke="white" strokeWidth="2" strokeDasharray="10 10" />
 <path d="M200,350 Q400,250 600,350 T900,250" fill="none" stroke="white" strokeWidth="2" strokeDasharray="5 5" />
 </svg>
 </div>

 {/* Live Node Matrix */}
 <div className="absolute inset-0 z-10">
 {[
 { top: '32%', left: '18%', label: 'HQ-NORTH', city: 'CHICAGO', cluster: 'AX-04', color: 'bg-p' },
 { top: '48%', left: '75%', label: 'PRIME-SOUTH', city: 'MUMBAI', cluster: 'NX-92', hero: true, color: 'bg-emerald-500' },
 { top: '28%', left: '46%', label: 'RL-EUROPE', city: 'FRANKFURT', cluster: 'EX-12', color: 'bg-indigo-400' },
 { top: '55%', left: '82%', label: 'APAC-RELAY', city: 'SINGAPORE', cluster: 'PX-44', color: 'bg-cyan-500' },
 { top: '15%', left: '85%', label: 'CORE-ASIA', city: 'TOKYO', cluster: 'KX-08', color: 'bg-amber-500' },
 ].map((dot, i) => (
 <div key={i} className="absolute group" style={{ top: dot.top, left: dot.left }}>
 <div className={cn(
"w-4 h-4 rounded-full relative z-10 cursor-pointer shadow-[0_0_20px_currentColor] transition-all duration-500 group-hover:scale-125",
 dot.color,
 dot.hero ?"w-6 h-6 border-2 border-white/20" :"border border-white/10"
 )}>
 <div className={cn("absolute inset-0 animate-ping rounded-full opacity-40 [animation-duration:3s]", dot.color)} />
 <div className={cn("absolute inset-0 animate-ping rounded-full opacity-20 [animation-delay:1s] [animation-duration:4s]", dot.color)} />
 </div>
 
 {/* HUD Tooltip */}
 <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-8 p-6 rounded-4xl bg-[#08080c]/95 backdrop-blur-3xl border border-white/10 opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap scale-75 group-hover:scale-100 translate-y-4 group-hover:translate-y-0 transform origin-bottom z-50 shadow-[0_40px_80px_rgba(0,0,0,0.8)] border-p/20">
 <div className="flex items-center justify-between gap-10 mb-4">
 <div className="flex items-center gap-3">
 <Radio className="w-3.5 h-3.5 text-p animate-pulse" />
 <p className="text-xs font-semibold text-p uppercase tracking-[0.3em]">{dot.label}</p>
 </div>
 <span className="text-xs font-semibold text-white/20 uppercase tracking-widest">{dot.cluster} CLUSTER</span>
 </div>
 <p className="text-3xl font-semibold text-white tracking-tight uppercase">{dot.city}</p>
 <div className="h-px w-full bg-linear-to-r from-white/10 via-white/5 to-transparent my-4" />
 <div className="flex items-center gap-6">
 <div className="flex flex-col">
 <span className="text-xs font-semibold text-white/20 uppercase tracking-widest">Active nodes</span>
 <span className="text-sm font-semibold text-white font-jet-mono">1,248</span>
 </div>
 <div className="flex flex-col">
 <span className="text-xs font-semibold text-white/20 uppercase tracking-widest">Latency</span>
 <span className="text-sm font-semibold text-emerald-400 font-jet-mono">4.2ms</span>
 </div>
 </div>
 </div>
 </div>
 ))}
 </div>

 {/* Bottom Legend HUD */}
 <div className="absolute bottom-10 left-12 right-12 flex items-center justify-between z-20">
 <div className="flex items-center gap-8 bg-black/60 p-4 rounded-3xl border border-white/5 backdrop-blur-3xl">
 <div className="flex items-center gap-3">
 <div className="w-2 h-2 rounded-full bg-p shadow-[0_0_10px_#6366f1]" />
 <span className="text-xs font-semibold text-white/40 uppercase tracking-[0.2em]">Institutional Core</span>
 </div>
 <div className="w-[1px] h-3 bg-white/10" />
 <div className="flex items-center gap-3">
 <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]" />
 <span className="text-xs font-semibold text-white/40 uppercase tracking-[0.2em]">HFT Satellite</span>
 </div>
 </div>
 <div className="flex items-center gap-3 bg-p p-4 px-8 rounded-3xl shadow-2xl shadow-p/20 cursor-pointer hover:bg-indigo-500 transition-all">
 <span className="text-xs font-semibold text-white uppercase tracking-[0.4em]">Initialize Global Sync</span>
 <ArrowRight className="w-4 h-4 text-white" />
 </div>
 </div>
 </motion.div>
);

export default function GlobalIntelligenceTab() {
 return (
 <motion.div 
 variants={containerVariants}
 initial="hidden"
 animate="visible"
 className="space-y-(--section-gap) pb-24"
 >
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
 {/* Institutional Alpha Momentum hardware matrix */}
 <motion.div variants={itemVariants} className="lg:col-span-1">
 <Card className="p-(--card-p) border-2 border-white/5 bg-black/40 backdrop-blur-3xl shadow-[0_50px_100px_rgba(0,0,0,0.8)] space-y-16 h-full relative overflow-hidden group rounded-[40px]">
 <div className="absolute top-0 left-0 w-full h-0.75 bg-linear-to-r from-transparent via-p to-transparent opacity-60 animate-scanline" />
 <div className="absolute inset-0 bg-scanlines opacity-[0.03] pointer-events-none" />
 
 <div className="space-y-3 relative z-10">
 <div className="flex items-center gap-4">
 <div className="w-10 h-10 rounded-[14px] bg-p/10 border-2 border-p/20 flex items-center justify-center">
 <Activity className="w-5 h-5 text-p shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
 </div>
 <h4 className="text-xl font-semibold text-white uppercase tracking-tight leading-tight">Alpha_Regime_Vector</h4>
 </div>
 <p className="text-xs text-white/30 font-semibold uppercase tracking-[0.3em] leading-relaxed">Real-time recursive acceleration by algorithmic philosophy index.</p>
 </div>

 <div className="space-y-8 relative z-10">
 {categories.map((cat, i) => (
 <div key={cat.id} className="space-y-4 group/bar">
 <div className="flex items-center justify-between px-2">
 <div className="space-y-1.5">
 <span className="text-lg font-semibold text-white uppercase tracking-tight group-hover/bar:text-p transition-all leading-tight">{cat.label}</span>
 <p className="text-xs font-semibold text-white/10 uppercase tracking-[0.3em]">{cat.desc}_SYNC</p>
 </div>
 <div className={cn("px-4 py-2 rounded-2xl border-2 tabular-nums text-sm font-semibold", cat.trend.startsWith('+') ? 'text-emerald-400 border-emerald-500/10 bg-emerald-500/5 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'text-red-400 border-red-500/10 bg-red-500/5')}>
 {cat.trend}
 </div>
 </div>
 <div className="h-3 w-full bg-white/2 rounded-full overflow-hidden border-2 border-white/5 p-[1.5px] relative">
 <motion.div 
 initial={{ width: 0 }}
 animate={{ width: `${cat.val}%` }}
 transition={{ duration: 2.5, delay: i * 0.15, ease: [0.22, 1, 0.36, 1] }}
 className={cn("h-full rounded-full relative shadow-[0_0_30px_rgba(99,102,241,0.4)]", cat.color)}
 >
 <div className="absolute inset-0 bg-scanlines opacity-20" />
 </motion.div>
 </div>
 </div>
 ))}
 </div>

 {/* System Regime Status HUD */}
 <div className="pt-16 border-t-2 border-white/5 relative z-10">
 <div className="p-(--card-p) rounded-4xl border-2 border-white/10 bg-[#08080c] relative overflow-hidden group shadow-[0_40px_80px_rgba(0,0,0,0.8)]">
 <div className="absolute inset-0 bg-linear-to-br from-p/10 to-transparent opacity-40 group-hover:opacity-70 transition-opacity duration-1000" />
 <div className="w-3 h-3 rounded-full bg-p animate-pulse absolute top-8 right-10 shadow-[0_0_20px_#6366f1]" />
 
 <div className="relative z-10 space-y-10 flex flex-col items-center text-center">
 <span className="text-sm font-semibold text-p uppercase tracking-[0.6em]">CORE_REGIME_TELEMETRY</span>
 <div className="p-1.5 px-6 rounded-[28px] bg-white/3 border-2 border-white/5 group-hover:scale-110 transition-transform duration-1000 hover:rotate-2">
 <h3 className="text-5xl font-semibold text-white tracking-[0.1em] drop-shadow-[0_15px_20px_rgba(0,0,0,0.8)]">TRENDING</h3>
 </div>
 <div className="grid grid-cols-2 gap-12 w-full">
 <div className="flex flex-col gap-2">
 <span className="text-xs font-semibold text-white/20 uppercase tracking-[0.3em]">CONFIDENCE</span>
 <span className="text-2xl font-semibold text-emerald-400 tracking-tight">94.2%</span>
 </div>
 <div className="flex flex-col gap-2">
 <span className="text-xs font-semibold text-white/20 uppercase tracking-[0.3em]">BIAS_VECTOR</span>
 <span className="text-2xl font-semibold text-p tracking-tight">BULLISH</span>
 </div>
 </div>
 </div>
 </div>
 </div>
 </Card>
 </motion.div>

 {/* Cinematic World Map & Feeds */}
 <div className="lg:col-span-2 space-y-8">
 <WorldMap />

 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
 {/* Institutional Intelligence Hub Feed */}
 <motion.div variants={itemVariants}>
 <Card className="p-(--card-p) border-2 border-white/5 bg-black/40 backdrop-blur-3xl shadow-[0_50px_100px_rgba(0,0,0,0.8)] h-full group relative overflow-hidden rounded-[40px]">
 <div className="absolute top-0 right-0 w-48 h-48 bg-p/5 rounded-full blur-[80px] -mr-24 -mt-24 opacity-60" />
 <div className="absolute inset-0 bg-scanlines opacity-[0.03] pointer-events-none" />
 
 <div className="flex items-center justify-between mb-16 relative z-10">
 <div className="flex items-center gap-5">
 <div className="w-12 h-12 rounded-[18px] bg-p/10 border-2 border-p/20 flex items-center justify-center">
 <Radio className="w-6 h-6 text-p" />
 </div>
 <h4 className="text-xl font-semibold text-white uppercase tracking-tight leading-tight">Intelligence_Hub_Feed</h4>
 </div>
 <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
 <span className="text-xs font-semibold text-emerald-400 uppercase tracking-[0.4em]">LIVE_SYNC</span>
 </div>
 </div>

 <div className="space-y-12 relative z-10">
 {news.map((n, i) => (
 <div key={i} className="flex gap-10 group/item relative">
 <div className="flex flex-col items-center">
 <div className="w-20 py-3.5 rounded-2xl bg-white/3 border-2 border-white/5 text-sm font-semibold text-white group-hover/item:border-p/50 group-hover/item:text-p transition-all shadow-2xl text-center">
 {n.time}
 </div>
 {i !== news.length - 1 && <div className="w-0.5 flex-1 bg-white/5 my-6" />}
 </div>
 <div className="flex-1 space-y-4 pb-4">
 <div className="flex items-center justify-between gap-4">
 <span className="text-sm font-semibold text-white uppercase tracking-widest leading-tight">{n.event}</span>
 <span className={cn("text-xs font-semibold uppercase tracking-[0.4em] px-3 py-1.5 rounded-xl border-2 shrink-0", n.impactColor.split(' ')[1], n.impactColor.split(' ')[0])}>{n.impact}</span>
 </div>
 <p className="text-sm text-white/30 font-semibold uppercase tracking-[0.3em] leading-relaxed">{n.desc}</p>
 </div>
 </div>
 ))}
 </div>
 </Card>
 </motion.div>

 {/* Institutional Alpha Command Leaderboard */}
 <motion.div variants={itemVariants}>
 <Card className="p-(--card-p) border-2 border-white/5 bg-black/40 backdrop-blur-3xl shadow-[0_50px_100px_rgba(0,0,0,0.8)] h-full group relative overflow-hidden rounded-[40px]">
 <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[100px] -mr-32 -mt-32 opacity-60" />
 <div className="absolute inset-0 bg-scanlines opacity-[0.03] pointer-events-none" />
 
 <div className="flex items-center gap-5 mb-16 relative z-10">
 <div className="w-12 h-12 rounded-[18px] bg-emerald-500/10 border-2 border-emerald-500/20 flex items-center justify-center">
 <Target className="w-6 h-6 text-emerald-400" />
 </div>
 <h4 className="text-xl font-semibold text-white uppercase tracking-tight leading-tight">Alpha_Command_Registry</h4>
 </div>

 <div className="space-y-10 relative z-10">
 {traders.map((t, i) => (
 <div key={i} className="flex items-center justify-between group/leader p-6 rounded-[36px] hover:bg-white/4 border-2 border-transparent hover:border-white/5 transition-all duration-700">
 <div className="flex items-center gap-8">
 <div className="relative">
 <div className="absolute inset-0 bg-p/30 rounded-2xl blur-xl opacity-0 group-hover/leader:opacity-100 transition-opacity duration-1000" />
 <img src={t.avatar} alt="" className="w-16 h-16 rounded-[22px] border-2 border-white/10 group-hover/leader:border-p/50 transition-all relative z-10 object-cover shadow-2xl" />
 <div className="absolute -top-4 -right-4 w-9 h-9 rounded-xl bg-black border-2 border-white/10 flex items-center justify-center text-sm font-semibold text-white shadow-[0_10px_20px_rgba(0,0,0,0.8)] z-20 group-hover/leader:border-p group-hover/leader:text-p transition-colors">{t.rank}</div>
 </div>
 <div className="space-y-2">
 <span className="text-sm font-semibold text-white uppercase tracking-wide group-hover/leader:text-p transition-colors">{t.name}</span>
 <div className="flex items-center gap-4">
 <span className="text-xs font-semibold text-white/20 uppercase tracking-[0.2em]">{t.strategies}_NODES</span>
 <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
 <span className="text-xs font-semibold text-p uppercase tracking-[0.3em]">{t.tier}_TIER</span>
 </div>
 </div>
 </div>
 <div className="flex flex-col items-end gap-1">
 <span className="text-2xl font-semibold text-emerald-400 tracking-tight group-hover/leader:scale-125 transition-transform duration-700">{t.return}</span>
 <span className="text-xs font-semibold text-white/10 uppercase tracking-[0.2em]">MONTHLY_P&L</span>
 </div>
 </div>
 ))}
 </div>
 
 <motion.button 
 whileHover={{ scale: 1.02 }}
 whileTap={{ scale: 0.98 }}
 className="w-full mt-12 h-20 rounded-4xl bg-white/3 border-2 border-white/5 flex items-center justify-center gap-6 group hover:bg-white/6 hover:border-white/10 transition-all duration-500"
 >
 <span className="text-sm font-semibold text-white/30 uppercase tracking-[0.5em] group-hover:text-white transition-colors">Open_Explorer_Registry</span>
 <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-p group-hover:translate-x-3 transition-all duration-500" />
 </motion.button>
 </Card>
 </motion.div>
 </div>
 </div>
 </div>
 </motion.div>
 );
}
