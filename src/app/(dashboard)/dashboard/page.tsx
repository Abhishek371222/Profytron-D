'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
 TrendingUp, 
 TrendingDown, 
 Zap, 
 Shield, 
 ArrowUpRight, 
 Activity, 
 Clock, 
 Target,
 Sparkles,
 ChevronRight,
 MoreVertical,
 Briefcase,
 Lock,
 ArrowRight,
 Info,
 Brain,
 X
} from '@/components/ui/icons';
import Link from 'next/link';

import { EquityChart } from '@/components/charts/EquityChart';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { TradingSimulator } from '@/lib/simulation/TradingSimulator';
import { useTradingStore } from '@/lib/stores/useTradingStore';
import { cn } from '@/lib/utils';

// --- Custom Components for the Dashboard ---

function Counter({ value, prefix ="", suffix ="", decimals = 2 }: { value: number; prefix?: string; suffix?: string; decimals?: number }) {
 const [displayValue, setDisplayValue] = React.useState(value);
 
 React.useEffect(() => {
 const start = displayValue;
 const end = value;
 const duration = 1000;
 const startTime = performance.now();
 
 const update = (now: number) => {
 const elapsed = now - startTime;
 const progress = Math.min(elapsed / duration, 1);
 const current = start + (end - start) * progress;
 setDisplayValue(current);
 
 if (progress < 1) {
 requestAnimationFrame(update);
 }
 };
 
 requestAnimationFrame(update);
 }, [value]);

 return (
 <span>
 {prefix}{displayValue.toLocaleString('en-US', { 
 minimumFractionDigits: decimals, 
 maximumFractionDigits: decimals 
 })}{suffix}
 </span>
 );
}

function StatCard({ label, value, sub, icon: Icon, trend, sparkline: SparkData, loading = false }: any) {
 return (
 <motion.div 
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 whileHover={{ y: -4 }}
 className="card p-5 group relative overflow-hidden transition-all duration-200 hover:shadow-[0_0_20px_rgba(var(--p-rgb),0.1)]"
 >
 <div className="flex justify-between items-start mb-4">
 <p className="text-xs font-bold text-white/40 uppercase tracking-[2px]">{label}</p>
 <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20">
 <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
 <span className="text-xs font-bold text-green-500 uppercase tracking-widest">Live</span>
 </div>
 </div>
 
 <div className="flex flex-col mb-4">
 <h3 className="text-2xl font-semibold text-white font-mono tracking-tight">
 <Counter value={value} prefix={label.includes('VALUE') || label.includes('P&L') ?"$" :""} decimals={label.includes('RATE') ? 1 : 2} suffix={label.includes('RATE') ?"%" :""} />
 </h3>
 <div className={cn("flex items-center gap-1 mt-1 text-xs font-bold", trend > 0 ?"text-green-500" :"text-red-500")}>
 {trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
 <span>{trend > 0 ?"+" :""}{trend}% today</span>
 </div>
 </div>

 <div className="text-sm text-white/40 font-medium">
 {sub}
 </div>

 {/* Decorative Glow Pulse */}
 <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-p/20 blur-[60px] rounded-full group-hover:bg-p/30 transition-colors duration-500" />
 </motion.div>
 );
}

function RiskMeter({ value, limit }: { value: number; limit: number }) {
 const percentage = (value / limit) * 100;
 
 return (
 <div className="card p-6 h-full flex flex-col justify-between">
 <div className="flex justify-between items-center mb-6">
 <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
 <Shield className="w-4 h-4 text-p" />
 Risk Monitor
 </h3>
 <Button variant="outline" size="sm" className="h-7 px-3 border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white text-xs font-semibold uppercase">
 Kill Switch
 </Button>
 </div>

 <div className="relative flex items-center justify-center py-4">
 <svg className="w-32 h-32 transform -rotate-90">
 <circle
 cx="64"
 cy="64"
 r="58"
 stroke="currentColor"
 strokeWidth="8"
 fill="transparent"
 className="text-white/5"
 />
 <motion.circle
 cx="64"
 cy="64"
 r="58"
 stroke="currentColor"
 strokeWidth="8"
 fill="transparent"
 strokeDasharray={364.4}
 initial={{ strokeDashoffset: 364.4 }}
 animate={{ strokeDashoffset: 364.4 - (364.4 * percentage) / 100 }}
 className={cn(
 percentage > 80 ?"text-red-500" : percentage > 50 ?"text-amber-500" :"text-p"
 )}
 />
 </svg>
 <div className="absolute inset-0 flex flex-col items-center justify-center">
 <span className="text-2xl font-semibold text-white font-mono">{Math.round(percentage)}%</span>
 <span className="text-xs text-white/40 font-bold uppercase tracking-widest">of limit</span>
 </div>
 </div>

 <div className="space-y-4 mt-6">
 <div>
 <div className="flex justify-between items-center mb-2">
 <span className="text-xs font-bold text-white/40 uppercase tracking-widest">Daily Loss Cap</span>
 <span className="text-xs font-mono text-white/60">n1,620 / n10,000</span>
 </div>
 <Progress value={16.2} className="h-1" />
 </div>
 <div>
 <div className="flex justify-between items-center mb-2">
 <span className="text-xs font-bold text-white/40 uppercase tracking-widest">Max Drawdown</span>
 <span className="text-xs font-mono text-white/60">8.4% / 15.0%</span>
 </div>
 <Progress value={(8.4/15)*100} className="h-1 bg-white/10" />
 </div>
 </div>
 
 {percentage > 70 && (
 <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2 animate-pulse">
 <Info className="w-4 h-4 text-amber-500" />
 <p className="text-xs text-amber-500 font-bold uppercase tracking-tight">Warning: High risk exposure</p>
 </div>
 )}
 </div>
 );
}

function TradeRow({ trade, onExplain }: { trade: any; onExplain: (t: any) => void }) {
 return (
 <motion.div 
 initial={{ opacity: 0, x: -20 }}
 animate={{ opacity: 1, x: 0 }}
 className="group grid grid-cols-7 items-center py-4 px-6 border-b border-white/[0.03] hover:bg-white/[0.02] cursor-pointer transition-all duration-200"
 onClick={() => onExplain(trade)}
 >
 <div className="flex items-center gap-3">
 <span className="text-lg">🇪🇺</span>
 <span className="text-sm font-bold text-white">{trade.asset}</span>
 </div>
 
 <div>
 <span className={cn(
"text-xs font-semibold px-2 py-0.5 rounded-full border tracking-widest",
 trade.type === 'Long' ?"bg-green-500/10 text-green-500 border-green-500/20" :"bg-red-500/10 text-red-500 border-red-500/20"
 )}>
 {trade.type.toUpperCase()}
 </span>
 </div>
 
 <div className="text-xs font-mono text-white/60">{trade.amount} lots</div>
 
 <div className="text-xs font-mono text-white/40">{trade.entry}</div>
 
 <div className={cn("text-xs font-mono font-bold flex items-center gap-1", trade.pnl > 0 ?"text-green-500" :"text-red-500")}>
 {trade.pnl > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
 <Counter value={trade.pnl} prefix={trade.pnl > 0 ?"+" :""} />
 </div>
 
 <div className="text-xs font-bold text-white/40 flex items-center gap-1.5">
 <Clock className="w-3 h-3 opacity-50" />
 2h 14m
 </div>
 
 <div className="flex justify-end">
 <Button variant="ghost" size="sm" className="h-8 px-3 text-p hover:text-p hover:bg-p/10 gap-2 font-semibold uppercase tracking-widest">
 <Brain className="w-3 h-3" />
 Explain
 </Button>
 </div>
 </motion.div>
 );
}

// --- Main Page Component ---

export default function DashboardPage() {
 const [mounted, setMounted] = React.useState(false);
 const { 
 portfolioValue, 
 dailyChange, 
 dailyChangePercent, 
 activeTrades, 
 activeStrategies,
 winRate,
 unrealizedPnl,
 realizedPnl
 } = useTradingStore();

 React.useEffect(() => {
 setMounted(true);
 }, []);

 const [selectedTrade, setSelectedTrade] = React.useState<any>(null);

 return (
 <div className={cn("space-y-6", !mounted &&"animate-pulse")} suppressHydrationWarning>
 {!mounted ? (
 <>
 <div className="h-[400px] bg-white/5 rounded-[32px]" />
 <div className="grid grid-cols-4 gap-6">
 {[1,2,3,4].map(i => <div key={i} className="h-40 bg-white/5 rounded-3xl" />)}
 </div>
 </>
 ) : (
 <>
 <TradingSimulator />

 {/* Row 1: KPI Grid */}
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
 <StatCard 
 label="Portfolio Value"
 value={portfolioValue}
 trend={dailyChangePercent}
 sub="Institutional Neural Balanced"
 />
 <StatCard 
 label="Active Strategies"
 value={activeStrategies.length}
 trend={2.4}
 sub="Combined win rate: 67.4%"
 />
 <StatCard 
 label="Today's P&L"
 value={dailyChange}
 trend={5.2}
 sub={`Realized: $${realizedPnl} | Unrealized: $${unrealizedPnl}`}
 />
 <StatCard 
 label="Win Rate"
 value={winRate}
 trend={1.2}
 sub="185 Wins | 72 Losses (Ratio 2.57)"
 />
 </div>
 </>
 )}

 {/* Row 2: Equity Chart */}
 <div className="card p-6">
 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
 <div>
 <h2 className="text-xl font-bold font-display text-white tracking-tight">Institutional Performance Vector</h2>
 <p className="text-xs text-white/40 font-medium font-display uppercase tracking-widest mt-1">Real-time aggregate equity stream</p>
 </div>
 
 <Tabs defaultValue="1M">
 <TabsList>
 {['1D', '1W', '1M', '3M', '1Y', 'ALL'].map(range => (
 <TabsTrigger key={range} value={range}>{range}</TabsTrigger>
 ))}
 </TabsList>
 </Tabs>
 </div>
 
 <div className="h-[320px] w-full min-h-[320px]">
 <EquityChart />
 </div>
 
 <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
 {[
 { label: 'All-time High', value: '$132,450' },
 { label: 'Max Drawdown', value: '8.4%' },
 { label: 'Sharpe Ratio', value: '1.82' },
 { label: 'Best Month', value: '+12.3%' }
 ].map((stat, i) => (
 <div key={i} className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl">
 <p className="text-xs font-bold text-white/40 uppercase tracking-widest">{stat.label}</p>
 <p className="text-sm font-semibold text-white font-mono mt-0.5">{stat.value}</p>
 </div>
 ))}
 </div>
 </div>

 {/* Row 3: Strategies + Risk */}
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 <div className="lg:col-span-2 card p-6 overflow-hidden">
 <div className="flex justify-between items-center mb-6">
 <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
 <Target className="w-4 h-4 text-p" />
 Active Strategies
 </h3>
 <Link href="/strategies" className="text-xs font-semibold text-white/40 hover:text-p transition-colors uppercase tracking-widest">
 Manage All →
 </Link>
 </div>
 
 <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
 {activeStrategies.map((strat) => (
 <motion.div 
 key={strat.id}
 whileHover={{ y: -4 }}
 className="min-w-[280px] p-5 bg-white/5 border border-white/10 rounded-2xl relative group"
 >
 <div className="flex justify-between items-start mb-4">
 <div>
 <h4 className="font-bold text-white tracking-tight">{strat.name}</h4>
 <div className="flex items-center gap-1.5 mt-1">
 <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
 <span className="text-xs font-bold text-green-500 uppercase">Running</span>
 </div>
 </div>
 <MoreVertical className="w-4 h-4 text-white/20 cursor-pointer" />
 </div>
 
 <div className="space-y-4">
 <div className="flex justify-between items-baseline">
 <span className="text-xs font-bold text-white/40 uppercase">Daily P&L</span>
 <span className="text-lg font-semibold text-green-500 font-mono">+$842</span>
 </div>
 
 <div>
 <div className="flex justify-between mb-1.5">
 <span className="text-xs font-bold text-white/40 uppercase text-xs">Win Rate</span>
 <span className="text-xs font-bold text-white font-mono">{strat.winRate}%</span>
 </div>
 <Progress value={strat.winRate} className="h-1" />
 </div>
 
 <div className="flex items-center justify-between pt-2">
 <div className="flex -space-x-2">
 {[1, 2, 3].map(i => (
 <Avatar key={i} className="w-6 h-6 border-2 border-black">
 <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${strat.id}-${i}`} />
 <AvatarFallback>U</AvatarFallback>
 </Avatar>
 ))}
 </div>
 <div className="flex items-center gap-2">
 <div className={cn(
"w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold",
 strat.confidence > 70 ?"bg-green-500/20 text-green-500" :"bg-amber-500/20 text-amber-500"
 )}>
 {strat.confidence}
 </div>
 </div>
 </div>
 </div>
 </motion.div>
 ))}
 </div>
 </div>

 <div className="lg:col-span-1">
 <RiskMeter value={3.4} limit={10} />
 </div>
 </div>

 {/* Row 4: Recent Trades */}
 <div className="card overflow-hidden">
 <div className="p-6 border-b border-white/5 flex justify-between items-center">
 <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
 <Activity className="w-4 h-4 text-p" />
 Live Execution Feed
 </h2>
 <div className="flex items-center gap-4">
 <Button variant="ghost" size="sm" className="h-8 px-3 text-white/40 hover:text-white uppercase text-xs font-semibold">Export CSV</Button>
 <Link href="/history" className="text-xs font-semibold text-p uppercase tracking-widest">View All →</Link>
 </div>
 </div>
 
 <div className="overflow-x-auto">
 <div className="min-w-[1000px]">
 <div className="grid grid-cols-7 px-6 py-3 border-b border-white/5 bg-white/[0.01]">
 {['Symbol', 'Type', 'Volume', 'Entry', 'Current P&L', 'Duration', 'Action'].map(head => (
 <span key={head} className="text-xs font-semibold text-white/30 uppercase tracking-[2px]">
 {head}
 </span>
 ))}
 </div>
 
 <div className="divide-y divide-white/[0.03]">
 {activeTrades.map((trade) => (
 <TradeRow key={trade.id} trade={trade} onExplain={setSelectedTrade} />
 ))}
 </div>
 </div>
 </div>
 </div>

 {/* Slide-over Explanation Side Panel */}
 <AnimatePresence>
 {selectedTrade && (
 <>
 {/* Backdrop */}
 <motion.div 
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 onClick={() => setSelectedTrade(null)}
 className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
 />
 
 {/* Panel */}
 <motion.div
 initial={{ x:"100%" }}
 animate={{ x: 0 }}
 exit={{ x:"100%" }}
 transition={{ type:"spring", damping: 25, stiffness: 200 }}
 className="fixed top-0 right-0 h-full w-full max-w-[420px] bg-card border-l border-white/10 z-[101] shadow-2xl p-8 flex flex-col"
 >
 <div className="flex justify-between items-center mb-8">
 <h2 className="text-lg font-bold text-white uppercase tracking-widest flex items-center gap-3">
 <Brain className="w-5 h-5 text-p" />
 Neural Reasoning
 </h2>
 <button 
 onClick={() => setSelectedTrade(null)}
 className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all group"
 >
 <X className="w-5 h-5 text-white/40 group-hover:text-white group-hover:rotate-90 transition-all" />
 </button>
 </div>

 <div className="space-y-8 overflow-y-auto flex-1 pr-2 custom-scrollbar">
 {/* Summary Card */}
 <div className="p-6 rounded-3xl bg-white/5 border border-white/10 relative overflow-hidden">
 <div className="flex justify-between items-start mb-6">
 <div>
 <h3 className="text-2xl font-semibold text-white font-mono">{selectedTrade.asset}</h3>
 <p className="text-xs text-white/40 font-bold uppercase tracking-[2px] mt-1">{selectedTrade.type} EXECUTION</p>
 </div>
 <div className={cn(
"text-xl font-semibold font-mono",
 selectedTrade.pnl > 0 ?"text-green-500" :"text-red-500"
 )}>
 ${selectedTrade.pnl}
 </div>
 </div>
 
 <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
 <div>
 <p className="text-xs font-bold text-white/30 uppercase tracking-widest">Open Time</p>
 <p className="text-xs font-mono text-white/70 mt-1">22:14:05 UTC</p>
 </div>
 <div>
 <p className="text-xs font-bold text-white/30 uppercase tracking-widest">Strategy</p>
 <p className="text-xs font-bold text-p mt-1">MomentumApex v2</p>
 </div>
 </div>
 </div>

 {/* AI Confidence */}
 <div className="space-y-4">
 <div className="flex justify-between items-center">
 <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest">AI Confidence Score</h4>
 <span className="text-lg font-semibold text-green-500 font-mono">74/100</span>
 </div>
 <Progress value={74} className="h-2" />
 <p className="text-xs text-white/60 font-medium">"High conviction signal based on multi-timeframe divergence."</p>
 </div>

 {/* Reasoning List */}
 <div className="space-y-4">
 <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest">Execution Logic</h4>
 <ul className="space-y-4">
 {[
"RSI crossed below 30 (oversold signal confirmed)",
"Price bounced off institutional resistance at 1.0820",
"MACD histogram turning positive in lower timeframes",
"Orderbook volume shift detected (+24% buy pressure)"
 ].map((point, i) => (
 <li key={i} className="flex gap-4 group">
 <div className="w-1.5 h-1.5 rounded-full bg-p mt-1.5 shrink-0 group-hover:scale-150 transition-transform" />
 <span className="text-sm text-white/70 font-medium leading-relaxed">{point}</span>
 </li>
 ))}
 </ul>
 </div>

 {/* Risk Factors */}
 <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 space-y-3">
 <h4 className="text-xs font-bold text-amber-500 uppercase tracking-widest flex items-center gap-2">
 <Shield className="w-4 h-4" />
 Neural Guard: Risks Observed
 </h4>
 <ul className="space-y-2">
 <li className="text-sm text-amber-500/70 font-bold leading-normal">• Volatility expansion expected in 14m (Tier 1 Data)</li>
 <li className="text-sm text-amber-500/70 font-bold leading-normal">• Counter-trend momentum strengthening locally</li>
 </ul>
 </div>

 {/* Key Levels */}
 <div className="flex flex-wrap gap-2 pt-4">
 {[
 { l: 'Support', v: '1.0810' },
 { l: 'Target', v: '1.0880' },
 { l: 'Stop', v: '1.0795' }
 ].map((level, i) => (
 <div key={i} className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 flex items-center gap-2">
 <span className="text-xs font-bold text-white/30 uppercase">{level.l}</span>
 <span className="text-xs font-mono font-bold text-white">{level.v}</span>
 </div>
 ))}
 </div>
 </div>

 <div className="pt-8 mt-auto">
 <Button className="w-full h-12 bg-white text-black hover:bg-white/90 rounded-2xl font-semibold uppercase tracking-widest">
 Execute Manual Close
 </Button>
 </div>
 </motion.div>
 </>
 )}
 </AnimatePresence>
 </div>
 );
}
