'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
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

import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useTradingStore } from '@/lib/stores/useTradingStore';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi, type AnalyticsRange } from '@/lib/api/analytics';
import { useMutation } from '@tanstack/react-query';
import { useQueryClient } from '@tanstack/react-query';
import { tradingApi } from '@/lib/api/trading';
import { demoDashboardMetrics } from '@/lib/api/demoData';
import { toast } from 'sonner';
import { affiliatesApi, type AffiliateDashboardResponse } from '@/lib/api/affiliates';
import { TradingSimulator } from '@/lib/simulation/TradingSimulator';
import { Network as AffiliateNetwork, Users as AffiliateUsers, TrendingUp as AffiliateTrendingUp, Gift as AffiliateGift, ArrowRight as AffiliateArrowRight, Copy as AffiliateCopy, Send as AffiliateSend } from 'lucide-react';

const EquityChart = dynamic(
	() => import('@/components/charts/EquityChart').then((mod) => mod.EquityChart),
	{
		ssr: false,
		loading: () => <div className="h-[320px] w-full rounded-xl bg-white/5 animate-pulse" />,
	},
);

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

function RiskMeter({
 value,
 limit,
 onKillSwitch,
 isKilling,
}: {
 value: number;
 limit: number;
 onKillSwitch: () => void;
 isKilling: boolean;
}) {
 const percentage = (value / limit) * 100;
 
 return (
 <div className="card p-6 h-full flex flex-col justify-between">
 <div className="flex justify-between items-center mb-6">
 <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
 <Shield className="w-4 h-4 text-p" />
 Risk Monitor
 </h3>
 <Button
 variant="outline"
 size="sm"
 onClick={onKillSwitch}
 disabled={isKilling}
 className="h-7 px-3 border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white text-xs font-semibold uppercase"
 >
 {isKilling ? 'Stopping...' : 'Kill Switch'}
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
 <span className="text-xs font-mono text-white/60">$1,620 / $10,000</span>
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
 className="group grid grid-cols-7 items-center py-4 px-6 border-b border-white/3 hover:bg-white/2 cursor-pointer transition-all duration-200"
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
 <Button
 variant="ghost"
 size="sm"
 onClick={(event) => {
 event.stopPropagation();
 onExplain(trade);
 }}
 className="h-8 px-3 text-p hover:text-p hover:bg-p/10 gap-2 font-semibold uppercase tracking-widest"
 >
 <Brain className="w-3 h-3" />
 Explain
 </Button>
 </div>
 </motion.div>
 );
}

// --- Main Page Component ---

export default function DashboardPage() {
	const router = useRouter();
 const queryClient = useQueryClient();
 const [mounted, setMounted] = React.useState(false);
	const [chartRange, setChartRange] = React.useState<'1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL'>('1M');
 const [isExportingCsv, setIsExportingCsv] = React.useState(false);
	const [affiliateShareState, setAffiliateShareState] = React.useState<'idle' | 'copied' | 'tracked'>('idle');
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

 React.useEffect(() => {
  if (typeof window === 'undefined') {
   return;
  }

  const usedFallback = sessionStorage.getItem('oauth_sync_fallback') === '1';
  if (usedFallback) {
   sessionStorage.removeItem('oauth_sync_fallback');
   toast.success('Signed in with Google', {
	description: 'Account sync is delayed; local session is active for now.',
   });
  }
 }, []);

 const [selectedTrade, setSelectedTrade] = React.useState<any>(null);

 const rangeToApi: Record<'1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL', AnalyticsRange> = {
	 '1D': '1d',
	 '1W': '1w',
	 '1M': '1m',
	 '3M': '3m',
	 '1Y': '1y',
	 ALL: 'all',
 };

 const portfolioQuery = useQuery({
	 queryKey: ['portfolio', rangeToApi[chartRange]],
	 queryFn: () => analyticsApi.getPortfolio(rangeToApi[chartRange]),
	 staleTime: 30_000,
 });

	const affiliateQuery = useQuery<AffiliateDashboardResponse>({
		queryKey: ['affiliate-dashboard'],
		queryFn: () => affiliatesApi.getDashboard(),
		staleTime: 120_000,
	});

 const hasLivePortfolio = Boolean(portfolioQuery.data?.equityCurve && portfolioQuery.data.equityCurve.length > 0);

 React.useEffect(() => {
 	if (portfolioQuery.isError) {
 		toast.error('Portfolio telemetry unavailable', {
 			description: 'Showing fallback dashboard metrics while API recovers.',
 		});
 	}
 }, [portfolioQuery.isError]);

 const refreshPortfolio = () => {
 	queryClient.invalidateQueries({ queryKey: ['portfolio'] });
 	toast.success('Portfolio refresh queued');
 };

	const affiliateData = affiliateQuery.data;
	const affiliateReferralLink = affiliateData ? `${typeof window === 'undefined' ? '' : window.location.origin}/signup?ref=${affiliateData.referralCode}` : '';

	const copyAffiliateLink = async () => {
		if (!affiliateReferralLink) {
			toast.error('Affiliate link not ready');
			return;
		}

		await navigator.clipboard.writeText(affiliateReferralLink);
		setAffiliateShareState('copied');
		toast.success('Affiliate link copied');
	};

	const shareAffiliateLink = async () => {
		if (!affiliateReferralLink || !affiliateData) {
			toast.error('Affiliate link not ready');
			return;
		}

		try {
			const message = `Join Profytron with my referral link: ${affiliateReferralLink}`;
			if (navigator.share) {
				await navigator.share({ title: 'Profytron referral', text: message, url: affiliateReferralLink });
			} else {
				await navigator.clipboard.writeText(message);
			}
			await affiliatesApi.trackClick(affiliateData.referralCode);
			setAffiliateShareState('tracked');
			toast.success('Affiliate share tracked');
		} catch {
			toast.error('Could not share affiliate link');
		}
	};

 const killSwitchMutation = useMutation({
	 mutationFn: () => tradingApi.emergencyStop(),
	 onSuccess: (result) => {
		 const statusLabel = result.status === 'NO_OPEN_TRADES' ? 'No open trades found.' : `Closed ${result.closedTrades} open trade(s).`;
 toast.success('Emergency stop executed', { description: statusLabel });
	 },
	 onError: (error: any) => {
		 const message = error?.response?.data?.error || error?.message || 'Failed to trigger emergency stop.';
 toast.error('Emergency stop failed', { description: message });
	 },
 });

 const toCsvValue = (value: unknown) => {
	 if (value === null || value === undefined) return '';
	 const text = String(value);
	 if (text.includes(',') || text.includes('"') || text.includes('\n')) {
		 return `"${text.replace(/"/g, '""')}"`;
	 }
	 return text;
 };

 const handleExportCsv = async () => {
	 if (isExportingCsv) return;
	 setIsExportingCsv(true);
	 try {
		 const exportPayload = await analyticsApi.getTradeExport(rangeToApi[chartRange]);
		 if (!exportPayload.rows.length) {
		 toast.message('No trades available for this range.');
			 return;
		 }

		 const headers = [
			 'trade_id',
			 'symbol',
			 'direction',
			 'volume',
			 'open_price',
			 'close_price',
			 'profit',
			 'status',
			 'strategy_name',
			 'opened_at',
			 'closed_at',
		 ];

		 const lines = exportPayload.rows.map((row) =>
			 [
				 row.id,
				 row.symbol,
				 row.direction,
				 row.volume,
				 row.openPrice,
				 row.closePrice,
				 row.profit,
				 row.status,
				 row.strategyName,
				 row.openedAt,
				 row.closedAt,
			 ]
				 .map(toCsvValue)
				 .join(','),
		 );

		 const csv = [headers.join(','), ...lines].join('\n');
		 const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
		 const url = URL.createObjectURL(blob);
		 const anchor = document.createElement('a');
		 anchor.href = url;
		 anchor.download = `trades-${exportPayload.range}-${new Date().toISOString().slice(0, 10)}.csv`;
		 document.body.appendChild(anchor);
		 anchor.click();
		 anchor.remove();
		 URL.revokeObjectURL(url);
		toast.success('Trade export ready', {
			description: `CSV generated for ${chartRange}.`,
		});
	 } catch (error: any) {
		 const message = error?.response?.data?.error || error?.message || 'Failed to export CSV.';
	 toast.error('CSV export failed', { description: message });
	 } finally {
		 setIsExportingCsv(false);
	 }
 };

	 const handleManualClose = () => {
		if (!selectedTrade) {
			toast.message('Select a trade first');
			return;
		}

		toast.success('Manual close order queued', {
			description: `${selectedTrade.asset} close request submitted for review.`,
		});
		setSelectedTrade(null);
	 };

 return (
 <div className={cn("space-y-6", !mounted &&"animate-pulse")} suppressHydrationWarning>
 {!mounted ? (
 <>
 <div className="h-100 bg-white/5 rounded-4xl" />
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
 <p className="text-[10px] text-white/40 font-semibold uppercase tracking-[0.2em] mt-1">
 Data Mode: <span className={hasLivePortfolio ? 'text-emerald-300' : 'text-amber-300'}>{hasLivePortfolio ? 'Live' : 'Fallback'}</span>
 </p>
 </div>
 
 <div className="flex items-center gap-2">
 <Button variant="outline" size="sm" onClick={refreshPortfolio} className="h-8 px-3 text-white/70 border-white/20 bg-white/5 hover:bg-white/10 uppercase text-xs font-semibold">
 Refresh
 </Button>
 <div className="flex gap-1 rounded-lg border border-white/10 bg-white/5 p-1">
 {(['1D', '1W', '1M', '3M', '1Y', 'ALL'] as const).map((range) => (
 <button
 key={range}
 onClick={() => setChartRange(range)}
 className={cn(
 'px-3 py-1.5 text-xs rounded-md transition-colors',
 chartRange === range ? 'bg-indigo-500/30 text-indigo-200' : 'text-white/60 hover:bg-white/10',
 )}
 >
 {range}
 </button>
 ))}
 </div>
 </div>
 </div>
 
 <div className="h-[320px] w-full min-h-[320px]">
 <EquityChart
	 data={(portfolioQuery.data?.equityCurve && portfolioQuery.data.equityCurve.length > 0) ? portfolioQuery.data.equityCurve : demoDashboardMetrics.equityCurve}
	 rangeLabel={chartRange}
	 isLoading={portfolioQuery.isLoading}
 />
 </div>
 
 <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
 {[
 { label: 'All-time High', value: `$${(portfolioQuery.data?.allTimeHigh ?? demoDashboardMetrics.equityCurve[demoDashboardMetrics.equityCurve.length - 1]?.equity).toLocaleString()}` },
 { label: 'Max Drawdown', value: `${portfolioQuery.data?.maxDrawdown ?? demoDashboardMetrics.maxDrawdown}%` },
 { label: 'Sharpe Ratio', value: `${portfolioQuery.data?.sharpeRatio ?? demoDashboardMetrics.sharpeRatio}` },
 { label: 'Best Month', value: `+${(portfolioQuery.data?.bestMonth ?? demoDashboardMetrics.monthlyReturn).toLocaleString()}%` }
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
 <span className="text-xs font-bold text-white/40 uppercase">Win Rate</span>
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
 <RiskMeter
 value={3.4}
 limit={10}
 onKillSwitch={() => killSwitchMutation.mutate()}
 isKilling={killSwitchMutation.isPending}
 />
 </div>
 </div>

			<div className="card p-6 overflow-hidden relative">
				<div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.12),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.12),_transparent_30%)] pointer-events-none" />
				<div className="relative flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
					<div className="space-y-3 max-w-2xl">
						<div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-white/45">
							<AffiliateNetwork className="h-3.5 w-3.5 text-p" />
							Affiliate pulse
						</div>
						<h2 className="text-2xl font-bold font-display text-white tracking-tight">A compact affiliate widget keeps your referral engine visible on the dashboard.</h2>
						<p className="text-sm text-white/55 max-w-xl">It stays in sync with the backend, shows your referral code and payout snapshot, and gives you direct copy/share actions without leaving the home page.</p>
					</div>

					<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 xl:min-w-[640px]">
						{[
							  { label: 'Clicks', value: affiliateQuery.data?.stats.clicks ?? 0, icon: AffiliateUsers },
							  { label: 'Signups', value: affiliateQuery.data?.stats.signups ?? 0, icon: AffiliateGift },
							  { label: 'Conversions', value: affiliateQuery.data?.stats.conversions ?? 0, icon: AffiliateTrendingUp },
							  { label: 'Tier', value: affiliateQuery.data?.tier ?? 'STARTER', icon: AffiliateNetwork },
						].map((item, index) => {
							const Icon = item.icon;
							return (
								<div key={item.label} className="rounded-2xl border border-white/8 bg-black/20 p-4">
									<div className="flex items-center justify-between gap-3 text-white/55">
										<span className="text-[10px] font-semibold uppercase tracking-[0.22em]">{item.label}</span>
										<Icon className="h-4 w-4 text-p" />
									</div>
									<div className="mt-3 text-xl font-semibold text-white">{item.value.toLocaleString ? item.value.toLocaleString() : item.value}</div>
									<div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/8">
										<motion.div
											className={cn('h-full rounded-full bg-gradient-to-r', index === 0 ? 'from-cyan-400 to-indigo-400' : index === 1 ? 'from-emerald-400 to-teal-400' : index === 2 ? 'from-amber-400 to-orange-400' : 'from-violet-400 to-fuchsia-400')}
											initial={{ width: '18%' }}
											animate={{ width: ['18%', '84%', '18%'] }}
											transition={{ duration: 4 + index * 0.25, repeat: Infinity, ease: 'easeInOut' }}
										/>
									</div>
								</div>
							);
						})}
					</div>
				</div>

				<div className="relative mt-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
					<div className="rounded-3xl border border-white/8 bg-white/4 p-5">
						<div className="flex items-start justify-between gap-3">
							<div>
								<p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/30">Referral code</p>
								<p className="mt-2 text-2xl font-semibold text-white">{affiliateData?.referralCode ?? 'PROFYTRON-X7A9'}</p>
								<p className="mt-2 text-sm text-white/50">{affiliateQuery.isLoading ? 'Loading live affiliate feed…' : 'Backend sync ready.'}</p>
							</div>
							<div className="rounded-2xl border border-white/8 bg-black/20 p-3 text-cyan-300">
								<AffiliateCopy className="h-5 w-5" />
							</div>
						</div>

						<div className="mt-4 grid gap-3 sm:grid-cols-3">
							{[
								{ label: 'Payout pending', value: affiliateData?.stats.pendingPayout ?? 0, tone: 'text-amber-300', format: true },
								{ label: 'Commission rate', value: Math.round((affiliateData?.commissionRate ?? 0.35) * 100), tone: 'text-emerald-300', suffix: '%' },
								{ label: 'Conversion rate', value: affiliateData?.stats.conversionRate ?? 0, tone: 'text-cyan-300', suffix: '%' },
							].map((item) => (
								<div key={item.label} className="rounded-2xl border border-white/8 bg-black/20 p-4">
									<p className="text-[10px] uppercase tracking-[0.22em] text-white/30">{item.label}</p>
									<p className={cn('mt-2 text-xl font-semibold', item.tone)}>
										{item.format ? `$${Number(item.value).toLocaleString(undefined, { maximumFractionDigits: 2 })}` : `${item.value}${item.suffix ?? ''}`}
									</p>
								</div>
							))}
						</div>
					</div>

					<div className="rounded-3xl border border-white/8 bg-white/4 p-5">
						<p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/30">Quick actions</p>
						<div className="mt-4 flex flex-col gap-3">
							<Button onClick={copyAffiliateLink} variant="outline" className="justify-between border-white/15 bg-white/5 text-white hover:bg-white/10">
								<span>Copy referral link</span>
								<AffiliateCopy className="h-4 w-4" />
							</Button>
							<Button onClick={shareAffiliateLink} variant="outline" className="justify-between border-white/15 bg-white/5 text-white hover:bg-white/10">
								<span>Share and track</span>
								<AffiliateSend className="h-4 w-4" />
							</Button>
							<Button onClick={() => router.push('/affiliate/best')} className="justify-between rounded-2xl bg-white text-black hover:bg-white/90">
								<span>Open best affiliates</span>
								<AffiliateArrowRight className="h-4 w-4" />
							</Button>
						</div>

						<div className="mt-4 flex items-center gap-2 rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.24em] text-white/40">
							{affiliateShareState === 'tracked' ? 'Share tracked in backend' : affiliateShareState === 'copied' ? 'Link copied locally' : 'Ready to copy or share'}
						</div>
					</div>
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
 <Button
 variant="ghost"
 size="sm"
 onClick={handleExportCsv}
 disabled={isExportingCsv}
 className="h-8 px-3 text-white/40 hover:text-white uppercase text-xs font-semibold"
 >
 {isExportingCsv ? 'Exporting...' : 'Export CSV'}
 </Button>
 <Link href="/history" className="text-xs font-semibold text-p uppercase tracking-widest">View All →</Link>
 </div>
 </div>
 
 <div className="overflow-x-auto">
 <div className="min-w-250">
 <div className="grid grid-cols-7 px-6 py-3 border-b border-white/5 bg-white/1">
 {['Symbol', 'Type', 'Volume', 'Entry', 'Current P&L', 'Duration', 'Action'].map(head => (
 <span key={head} className="text-xs font-semibold text-white/30 uppercase tracking-[2px]">
 {head}
 </span>
 ))}
 </div>
 
 <div className="divide-y divide-white/3">
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
 <Button onClick={handleManualClose} className="w-full h-12 bg-white text-black hover:bg-white/90 rounded-2xl font-semibold uppercase tracking-widest">
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
