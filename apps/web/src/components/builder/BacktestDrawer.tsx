'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, BarChart3, TrendingUp, AlertTriangle, CheckCircle2, Loader2, Gauge } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const MOCK_BACKTEST_DATA = [
 { date: 'Jan', equity: 100000 },
 { date: 'Feb', equity: 105000 },
 { date: 'Mar', equity: 103000 },
 { date: 'Apr', equity: 112000 },
 { date: 'May', equity: 108000 },
 { date: 'Jun', equity: 121000 },
 { date: 'Jul', equity: 119000 },
 { date: 'Aug', equity: 134200 },
];

interface BacktestDrawerProps {
 isOpen: boolean;
 onClose: () => void;
}

export function BacktestDrawer({ isOpen, onClose }: BacktestDrawerProps) {
 const [isBacktesting, setIsBacktesting] = React.useState(false);
 const [showResults, setShowResults] = React.useState(false);

 const runBacktest = async () => {
 setIsBacktesting(true);
 setShowResults(false);
 await new Promise(r => setTimeout(r, 2000));
 setIsBacktesting(false);
 setShowResults(true);
 };

 return (
 <AnimatePresence>
 {isOpen && (
 <motion.div
 initial={{ y: '100%' }}
 animate={{ y: 0 }}
 exit={{ y: '100%' }}
 transition={{ type: 'spring', damping: 25, stiffness: 200 }}
 className="fixed bottom-0 left-0 right-0 h-[500px] glass-strong border-t border-white/10 z-[60] flex flex-col shadow-[0_-20px_50px_rgba(0,0,0,0.5)]"
 >
 {/* Header */}
 <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between">
 <div className="flex items-center gap-4">
 <div className="p-2.5 rounded-xl bg-amber-500/10">
 <BarChart3 className="w-6 h-6 text-amber-500" />
 </div>
 <div>
 <h3 className="text-xl font-bold text-white">Strategy Optimizer</h3>
 <p className="text-xs text-white/40 uppercase tracking-widest font-semibold">Historical Performance Analysis</p>
 </div>
 </div>
 <button 
 onClick={onClose}
 className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors"
 >
 <X className="w-6 h-6 text-white/40" />
 </button>
 </div>

 <div className="flex-1 flex overflow-hidden">
 {/* Config Side */}
 <div className="w-[340px] border-r border-white/5 p-8 space-y-8 bg-black/40">
 <div className="space-y-6">
 <div className="space-y-3">
 <label className="text-xs font-semibold text-white/30 uppercase tracking-widest">Simulation Symbol</label>
 <select className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-xs text-white outline-none">
 <option>XAUUSD (Gold)</option>
 <option>EURUSD</option>
 <option>BTCUSDT</option>
 </select>
 </div>
 <div className="space-y-3">
 <label className="text-xs font-semibold text-white/30 uppercase tracking-widest">Simulation Range</label>
 <div className="grid grid-cols-2 gap-3">
 <div className="h-11 bg-white/5 border border-white/10 rounded-xl px-4 flex items-center text-xs text-white/60">2024-01-01</div>
 <div className="h-11 bg-white/5 border border-white/10 rounded-xl px-4 flex items-center text-xs text-white/60">Today</div>
 </div>
 </div>
 </div>

 <Button 
 onClick={runBacktest}
 disabled={isBacktesting}
 className="w-full h-14 bg-linear-to-r from-amber-600 to-amber-500 text-white font-semibold text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-amber-600/20 group"
 >
 {isBacktesting ? (
 <Loader2 className="w-5 h-5 animate-spin" />
 ) : (
 <>
 <Play className="w-4 h-4 mr-2 fill-current" />
 Compute Backtest
 </>
 )}
 </Button>
 </div>

 {/* Results Canvas */}
 <div className="flex-1 p-8 bg-black/20 overflow-y-auto">
 {!isBacktesting && !showResults ? (
 <div className="h-full flex flex-col items-center justify-center space-y-6 opacity-20">
 <Gauge className="w-20 h-20" />
 <p className="text-xl font-bold">Ready to analyze performance...</p>
 </div>
 ) : isBacktesting ? (
 <div className="h-full flex flex-col items-center justify-center space-y-4">
 <Loader2 className="w-12 h-12 text-p animate-spin" />
 <p className="text-sm font-bold text-p uppercase tracking-widest animate-pulse">Analyzing 1,247 Historical Bars...</p>
 </div>
 ) : (
 <div className="grid grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
 {/* Stats Grid */}
 <div className="col-span-4 grid grid-cols-2 gap-4">
 {[
 { label: 'Total Return', value: '+34.2%', color: 'text-success', icon: TrendingUp },
 { label: 'Max Drawdown', value: '12.4%', color: 'text-rose-400', icon: AlertTriangle },
 { label: 'Win Rate', value: '68.4%', color: 'text-white', icon: CheckCircle2 },
 { label: 'Sharpe Ratio', value: '1.82', color: 'text-indigo-400', icon: Gauge },
 ].map((stat) => (
 <div key={stat.label} className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
 <stat.icon className={cn("w-4 h-4 mb-2 opacity-40", stat.color)} />
 <p className="text-xs text-white/30 uppercase font-semibold tracking-widest">{stat.label}</p>
 <p className={cn("text-xl font-bold font-jet-mono", stat.color)}>{stat.value}</p>
 </div>
 ))}
 </div>

 {/* Equity Chart */}
 <div className="col-span-8 h-[240px] bg-white/5 border border-white/5 rounded-3xl p-6 relative">
 <p className="text-xs font-semibold text-white/30 uppercase tracking-widest absolute top-6 left-6 z-10">Equity Curve Simulation</p>
 <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={1}>
 <AreaChart data={MOCK_BACKTEST_DATA}>
 <defs>
 <linearGradient id="backtestGrad" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
 <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
 </linearGradient>
 </defs>
 <XAxis dataKey="date" hide />
 <YAxis hide domain={['dataMin - 5000', 'dataMax + 5000']} />
 <Tooltip 
 contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} 
 />
 <Area 
 type="monotone" 
 dataKey="equity" 
 stroke="#f59e0b" 
 fillOpacity={1} 
 fill="url(#backtestGrad)" 
 strokeWidth={3}
 animationDuration={2000}
 />
 </AreaChart>
 </ResponsiveContainer>
 </div>
 </div>
 )}
 </div>
 </div>
 </motion.div>
 )}
 </AnimatePresence>
 );
}
