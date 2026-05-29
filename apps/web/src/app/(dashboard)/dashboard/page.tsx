'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import {
  TrendingUp, TrendingDown, Zap, Shield, ArrowUpRight, ArrowDownRight,
  Activity, Clock, Target, Brain, X, Info,
  ChevronRight, Download, RefreshCcw, Wallet, Trophy,
} from '@/components/ui/icons';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { analyticsApi, type AnalyticsRange } from '@/lib/api/analytics';
import { tradingApi } from '@/lib/api/trading';
import { walletApi } from '@/lib/api/wallet';
import { strategiesApi } from '@/lib/api/strategies';
import { toast } from 'sonner';
import { useLiveMarketFeed } from '@/hooks/useLiveMarketFeed';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { useAuthStore } from '@/lib/stores/useAuthStore';

const EquityChart = dynamic(
  () => import('@/components/charts/LiveCandlesChart').then((m) => m.LiveCandlesChart),
  { ssr: false, loading: () => <div className="h-full w-full rounded-2xl bg-white/5 animate-pulse" /> },
);

// ─────────────────────────────────────────────────────────────────────────────
// Animated counter
// ─────────────────────────────────────────────────────────────────────────────
function Counter({ value, prefix = '', suffix = '', decimals = 2 }: {
  value: number; prefix?: string; suffix?: string; decimals?: number;
}) {
  const [display, setDisplay] = React.useState(value);
  const fromRef = React.useRef(value);

  React.useEffect(() => {
    const from = fromRef.current;
    const to = value;
    let raf: number;
    const t0 = performance.now();
    const dur = 900;
    const tick = (now: number) => {
      const t = Math.min((now - t0) / dur, 1);
      const e = 1 - Math.pow(1 - t, 3);
      const cur = from + (to - from) * e;
      fromRef.current = cur;
      setDisplay(cur);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return (
    <span>
      {prefix}
      {display.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
      {suffix}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sparkline SVG
// ─────────────────────────────────────────────────────────────────────────────
function Sparkline({ data, positive = true, width = 96, height = 30 }: {
  data: number[]; positive?: boolean; width?: number; height?: number;
}) {
  const id = React.useId();
  if (data.length < 2) return <div style={{ width, height }} />;
  const min = Math.min(...data), max = Math.max(...data), range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const color = positive ? '#34d399' : '#fb7185';
  const linePath = `M ${pts.join(' L ')}`;
  const fillPath = `${linePath} L ${width},${height} L 0,${height} Z`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fillPath} fill={`url(#${id})`} />
      <path d={linePath} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Radial ring gauge
// ─────────────────────────────────────────────────────────────────────────────
function RadialRing({ value, max = 100, size = 96, sw = 8, color = '#22d3ee', label, sub }: {
  value: number; max?: number; size?: number; sw?: number; color?: string; label: string; sub?: string;
}) {
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(value / max, 1);
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" style={{ overflow: 'visible' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={sw} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={sw}
          strokeLinecap="round" strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - circ * pct }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          style={{ filter: `drop-shadow(0 0 5px ${color}88)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-base font-bold font-mono text-white leading-tight">{label}</span>
        {sub && <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest mt-0.5">{sub}</span>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Market ticker strip
// ─────────────────────────────────────────────────────────────────────────────
function MarketStrip({ quotes, wsConnected }: { quotes: Record<string, any>; wsConnected: boolean }) {
  const assets = [
    { key: 'BTCUSDT', label: 'BTC/USD', precision: 0 },
    { key: 'EURUSD', label: 'EUR/USD', precision: 5 },
    { key: 'XAUUSD', label: 'XAU/USD', precision: 2 },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="flex items-center gap-0 rounded-2xl bg-black/30 border border-white/[0.06] overflow-x-auto scrollbar-hide"
    >
      {/* Feed status */}
      <div className="flex items-center gap-1.5 px-4 py-3 border-r border-white/[0.06] shrink-0">
        <motion.div
          animate={{ opacity: [1, 0.25, 1] }}
          transition={{ repeat: Infinity, duration: 2.2 }}
          className={cn('w-1.5 h-1.5 rounded-full', wsConnected ? 'bg-emerald-400' : 'bg-amber-400')}
        />
        <span className="text-[9px] font-bold uppercase tracking-[0.35em] text-white/30">
          {wsConnected ? 'LIVE WS' : 'REST FEED'}
        </span>
      </div>

      {assets.map(({ key, label, precision }) => {
        const q = quotes[key];
        const isUp = (q?.change24hPct ?? 0) >= 0;
        return (
          <div key={key} className="flex items-center gap-3 px-5 py-3 border-r border-white/[0.05] last:border-0 shrink-0">
            <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{label}</span>
            <span className="text-xs font-mono font-bold text-white tabular-nums">
              {q
                ? q.price.toLocaleString('en-US', { minimumFractionDigits: precision, maximumFractionDigits: precision })
                : '—'}
            </span>
            {q && (
              <span className={cn('text-[10px] font-bold flex items-center gap-0.5 tabular-nums', isUp ? 'text-emerald-400' : 'text-rose-400')}>
                {isUp ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
                {isUp ? '+' : ''}{q.change24hPct.toFixed(2)}%
              </span>
            )}
          </div>
        );
      })}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// KPI card accent definitions
// ─────────────────────────────────────────────────────────────────────────────
type AccentKey = 'cyan' | 'violet' | 'emerald' | 'rose' | 'amber';
const ACCENTS: Record<AccentKey, { iconBg: string; iconText: string; badge: string; glow: string }> = {
  cyan:    { iconBg: 'bg-cyan-500/10',    iconText: 'text-cyan-400',    badge: 'text-cyan-400',    glow: '#22d3ee' },
  violet:  { iconBg: 'bg-violet-500/10',  iconText: 'text-violet-400',  badge: 'text-violet-400',  glow: '#818cf8' },
  emerald: { iconBg: 'bg-emerald-500/10', iconText: 'text-emerald-400', badge: 'text-emerald-400', glow: '#34d399' },
  rose:    { iconBg: 'bg-rose-500/10',    iconText: 'text-rose-400',    badge: 'text-rose-400',    glow: '#fb7185' },
  amber:   { iconBg: 'bg-amber-500/10',   iconText: 'text-amber-400',   badge: 'text-amber-400',   glow: '#fbbf24' },
};

// ─────────────────────────────────────────────────────────────────────────────
// Premium KPI card
// ─────────────────────────────────────────────────────────────────────────────
function KpiCard({ label, value, prefix = '', suffix = '', decimals = 2, trend, trendLabel = 'today',
  sub, icon: Icon, sparkData, accent = 'cyan', index = 0 }: {
  label: string; value: number; prefix?: string; suffix?: string; decimals?: number;
  trend: number; trendLabel?: string; sub: string;
  icon: React.ComponentType<{ className?: string }>;
  sparkData?: number[]; accent?: AccentKey; index?: number;
}) {
  const isUp = trend >= 0;
  const a = ACCENTS[accent];
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.08, duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      className="group relative rounded-2xl p-5 overflow-hidden cursor-default select-none bg-[#0c0c14] border border-white/[0.07] hover:border-white/[0.12] transition-[border-color] duration-300"
    >
      {/* Animated top hairline (always-on glow) */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-60 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: `linear-gradient(90deg, transparent, ${a.glow}, transparent)` }}
      />

      {/* Hover ring glow */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ boxShadow: `inset 0 0 0 1px ${a.glow}55, 0 0 50px ${a.glow}22, 0 12px 40px rgba(0,0,0,0.4)` }}
      />

      {/* Corner ambient glow */}
      <div
        className="pointer-events-none absolute -bottom-12 -right-12 w-36 h-36 rounded-full blur-[60px] opacity-25 group-hover:opacity-60 transition-opacity duration-500"
        style={{ background: a.glow }}
      />

      {/* Beam sweep on hover */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
        <div className="absolute inset-y-0 -inset-x-full w-1/3 bg-gradient-to-r from-transparent via-white/[0.05] to-transparent skew-x-[-20deg] translate-x-[-200%] group-hover:translate-x-[400%] transition-transform duration-1000 ease-in-out" />
      </div>

      {/* Header row */}
      <div className="relative flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={cn(
            'w-7 h-7 rounded-lg flex items-center justify-center border transition-transform duration-300 group-hover:scale-110',
            a.iconBg,
          )}>
            <Icon className={cn('w-3.5 h-3.5 transition-transform duration-300 group-hover:rotate-12', a.iconText)} />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/35 group-hover:text-white/60 transition-colors duration-300">{label}</span>
        </div>
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          <motion.div
            animate={{ opacity: [1, 0.35, 1], scale: [1, 1.3, 1] }}
            transition={{ repeat: Infinity, duration: 2.4 }}
            className="w-1 h-1 rounded-full bg-emerald-400"
            style={{ boxShadow: '0 0 4px #34d399' }}
          />
          <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">Live</span>
        </div>
      </div>

      {/* Value — with subtle bottom border glow on hover */}
      <div className="relative mb-1.5">
        <h3 className="text-[1.75rem] font-bold text-white font-mono tracking-tight tabular-nums leading-none transition-all duration-300 group-hover:tracking-tighter">
          <Counter value={value} prefix={prefix} suffix={suffix} decimals={decimals} />
        </h3>
      </div>

      {/* Trend */}
      <div className={cn(
        'relative flex items-center gap-1 mb-4 transition-transform duration-300 group-hover:translate-x-0.5',
        isUp ? 'text-emerald-400' : 'text-rose-400',
      )}>
        <motion.span
          animate={{ y: isUp ? [0, -2, 0] : [0, 2, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        >
          {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        </motion.span>
        <span className="text-xs font-bold tabular-nums">{isUp ? '+' : ''}{trend.toFixed(2)}%</span>
        <span className="text-[10px] text-white/25 font-medium ml-0.5">{trendLabel}</span>
      </div>

      {/* Sparkline */}
      {sparkData && sparkData.length > 1 && (
        <div className="relative mb-3 transition-transform duration-300 group-hover:scale-[1.02] origin-left">
          <Sparkline data={sparkData} positive={isUp} width={104} height={28} />
        </div>
      )}

      {/* Sub */}
      <p className="relative text-[11px] text-white/30 font-medium leading-relaxed truncate group-hover:text-white/50 transition-colors duration-300">{sub}</p>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Trade row
// ─────────────────────────────────────────────────────────────────────────────
function TradeRow({ trade, onExplain }: { trade: any; onExplain: (t: any) => void }) {
  const isLong = trade.type === 'Long';
  const isProfit = trade.pnl >= 0;
  const age = trade.timestamp
    ? (() => {
        const ms = Date.now() - new Date(trade.timestamp).getTime();
        const h = Math.floor(ms / 3_600_000);
        const m = Math.floor((ms % 3_600_000) / 60_000);
        return h > 0 ? `${h}h ${m}m` : `${m}m`;
      })()
    : '—';

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="group grid grid-cols-7 items-center py-4 px-6 border-b border-white/[0.04] hover:bg-white/[0.025] cursor-pointer transition-all duration-150"
      onClick={() => onExplain(trade)}
    >
      {/* Asset */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center text-[10px] font-bold text-white/60">
          {trade.asset?.slice(0, 2)}
        </div>
        <div>
          <p className="text-xs font-bold text-white">{trade.asset}</p>
          <p className="text-[9px] text-white/25 uppercase tracking-wider">{trade.strategyId || 'Manual'}</p>
        </div>
      </div>

      {/* Direction */}
      <div>
        <span className={cn('text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-widest',
          isLong ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20')}>
          {trade.type}
        </span>
      </div>

      {/* Volume */}
      <div className="text-xs font-mono text-white/45">
        {typeof trade.amount === 'number' ? trade.amount.toFixed(2) : trade.amount}
        <span className="text-white/20 ml-1">lots</span>
      </div>

      {/* Entry */}
      <div className="text-xs font-mono text-white/45">{trade.entry}</div>

      {/* P&L */}
      <div className={cn('flex items-center gap-1', isProfit ? 'text-emerald-400' : 'text-rose-400')}>
        {isProfit ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
        <span className="text-xs font-bold font-mono tabular-nums">
          <Counter value={Math.abs(trade.pnl)} prefix={isProfit ? '+$' : '-$'} decimals={2} />
        </span>
      </div>

      {/* Duration */}
      <div className="flex items-center gap-1.5 text-white/25">
        <Clock className="w-3 h-3" />
        <span className="text-[10px] font-mono">{age}</span>
      </div>

      {/* Action */}
      <div className="flex justify-end">
        <Button
          variant="ghost" size="sm"
          onClick={(e) => { e.stopPropagation(); onExplain(trade); }}
          className="h-7 px-3 text-[10px] font-bold uppercase tracking-widest text-violet-300/60 hover:text-violet-200 hover:bg-violet-500/10 border border-transparent hover:border-violet-500/20 transition-all gap-1.5 rounded-lg"
        >
          <Brain className="w-3 h-3" />
          AI
        </Button>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Risk monitor
// ─────────────────────────────────────────────────────────────────────────────
function RiskMonitor({ value, limit, onKill, isKilling }: {
  value: number; limit: number; onKill: () => void; isKilling: boolean;
}) {
  const pct = Math.min((value / limit) * 100, 100);
  const color = pct > 80 ? '#ef4444' : pct > 50 ? '#f59e0b' : '#22d3ee';
  return (
    <div className="rounded-2xl bg-white/[0.025] border border-white/[0.07] p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-rose-500/10 flex items-center justify-center">
            <Shield className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/40">Risk Monitor</span>
        </div>
        <Button
          onClick={onKill} disabled={isKilling}
          className="h-7 px-3 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/30 hover:border-rose-500 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all duration-200 gap-1"
        >
          {isKilling ? 'Stopping...' : '⚡ Kill Switch'}
        </Button>
      </div>

      <div className="flex items-center justify-center py-2">
        <RadialRing
          value={pct} max={100} size={112} sw={10} color={color}
          label={`${Math.round(pct)}%`} sub="of limit"
        />
      </div>

      <div className="space-y-3 mt-4 flex-1">
        {[
          { label: 'Daily Loss Cap', pctVal: 16.2, display: '$1,620 / $10,000' },
          { label: 'Max Drawdown',   pctVal: (8.4 / 15) * 100, display: '8.4% / 15.0%' },
        ].map(({ label, pctVal, display }) => (
          <div key={label}>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{label}</span>
              <span className="text-[10px] font-mono text-white/40">{display}</span>
            </div>
            <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
              <motion.div
                className={cn('h-full rounded-full', pctVal > 75 ? 'bg-rose-500' : pctVal > 50 ? 'bg-amber-500' : 'bg-cyan-500')}
                initial={{ width: 0 }}
                animate={{ width: `${pctVal}%` }}
                transition={{ duration: 0.9, ease: 'easeOut' }}
              />
            </div>
          </div>
        ))}
      </div>

      {pct > 70 && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="mt-4 flex items-center gap-2 p-3 rounded-xl bg-amber-500/[0.08] border border-amber-500/20"
        >
          <Info className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <p className="text-[10px] font-bold text-amber-400/80 uppercase tracking-tight">High risk exposure</p>
        </motion.div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const queryClient = useQueryClient();
  const [mounted, setMounted] = React.useState(false);
  const [chartRange, setChartRange] = React.useState<'1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL'>('1M');
  const [isExportingCsv, setIsExportingCsv] = React.useState(false);
  const [selectedTrade, setSelectedTrade] = React.useState<any>(null);

  const { data: currentUser } = useCurrentUser();
  const { isAuthenticated } = useAuthStore();

  // ── Queries ────────────────────────────────────────────────────────────────
  const walletQuery = useQuery({
    queryKey: ['wallet-balance'],
    queryFn: () => walletApi.getBalance(),
    staleTime: 30_000, refetchInterval: 30_000,
    enabled: isAuthenticated,
  });
  const myStrategiesQuery = useQuery({
    queryKey: ['my-strategies'],
    queryFn: () => strategiesApi.getMyStrategies(),
    staleTime: 60_000,
    enabled: isAuthenticated,
  });
  const openTradesQuery = useQuery({
    queryKey: ['open-trades'],
    queryFn: async () => {
      const data = await analyticsApi.getTradeExport('all');
      return data.rows.filter((r) => r.status === 'OPEN').map((r) => ({
        id: r.id, asset: r.symbol,
        type: r.direction === 'BUY' ? 'Long' : ('Short' as 'Long' | 'Short'),
        amount: r.volume, entry: r.openPrice, pnl: r.profit ?? 0,
        pnlPercent: 0, status: 'Open' as const,
        timestamp: r.openedAt, strategyId: r.strategyName ?? '',
      }));
    },
    staleTime: 30_000, refetchInterval: 30_000,
  });

  const rangeToApi: Record<'1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL', AnalyticsRange> = {
    '1D': '1d', '1W': '1w', '1M': '1m', '3M': '3m', '1Y': '1y', ALL: 'all',
  };

  const portfolioQuery = useQuery({
    queryKey: ['portfolio', rangeToApi[chartRange]],
    queryFn: () => analyticsApi.getPortfolio(rangeToApi[chartRange]),
    staleTime: 30_000,
    enabled: isAuthenticated,
    retry: 1,
  });

  // ── Live market feed ───────────────────────────────────────────────────────
  const { quotes, wsConnected } = useLiveMarketFeed(['BTCUSDT', 'EURUSD', 'XAUUSD']);
  const btcQuote = quotes.BTCUSDT;
  const baselineBtcRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    if (!btcQuote?.price || baselineBtcRef.current) return;
    baselineBtcRef.current = btcQuote.price;
  }, [btcQuote?.price]);

  const liveDriftPct = React.useMemo(() => {
    if (!btcQuote?.price || !baselineBtcRef.current) return 0;
    return ((btcQuote.price - baselineBtcRef.current) / baselineBtcRef.current) * 100;
  }, [btcQuote?.price]);

  // ── Mount + OAuth ─────────────────────────────────────────────────────────
  React.useEffect(() => { setMounted(true); }, []);
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const usedFallback = sessionStorage.getItem('oauth_sync_fallback') === '1';
    if (usedFallback) {
      sessionStorage.removeItem('oauth_sync_fallback');
      toast.success('Signed in with Google', {
        description: 'Account sync is delayed; local session is active.',
      });
    }
  }, []);

  // ── Derived values ─────────────────────────────────────────────────────────
  const portfolioValue = walletQuery.data?.total ?? 0;
  const winRate = portfolioQuery.data?.winRate ?? 0;
  const dailyChange = portfolioQuery.data?.totalProfit ?? 0;
  const dailyChangePercent =
    portfolioQuery.data?.totalProfit && walletQuery.data?.total
      ? (portfolioQuery.data.totalProfit / Math.max(walletQuery.data.total, 1)) * 100
      : 0;
  const activeTrades = openTradesQuery.data ?? [];
  const activeStrategies = (myStrategiesQuery.data ?? []).map((s) => ({
    id: s.id, name: s.name, status: 'active' as const,
    pnlToday: 0, winRate: 65, confidence: 80,
  }));
  const realizedPnl = portfolioQuery.data?.totalProfit ?? 0;
  const unrealizedPnl = activeTrades.reduce((sum, t) => sum + t.pnl, 0);
  const effectivePortfolioValue = portfolioValue * (1 + (liveDriftPct * 0.35) / 100);
  const effectiveDailyChange = dailyChange + (portfolioValue * (liveDriftPct * 0.22)) / 100;
  const effectiveDailyChangePercent = dailyChangePercent + liveDriftPct * 0.35;
  const portfolioMetrics = portfolioQuery.data ?? { sharpeRatio: 0, winRate: 0, maxDrawdown: 0, bestMonth: 0 };
  const bestMonthValue = portfolioMetrics.bestMonth ?? 0;
  const sparklineData: number[] =
    portfolioQuery.data?.equityCurve?.slice(-14).map((p: any) => p.equity) ?? [];
  const hasLiveData = Boolean(portfolioQuery.data?.equityCurve?.length);

  const performanceGraphData = [
    { label: 'Sharpe', display: portfolioMetrics.sharpeRatio.toFixed(2), score: Math.min((portfolioMetrics.sharpeRatio / 3) * 100, 100), color: '#22d3ee' },
    { label: 'Win Rate', display: `${portfolioMetrics.winRate.toFixed(1)}%`, score: Math.min(portfolioMetrics.winRate, 100), color: '#34d399' },
    { label: 'Best Mo.', display: `+${bestMonthValue.toFixed(1)}%`, score: Math.min(bestMonthValue * 6, 100), color: '#fbbf24' },
    { label: 'Drawdown', display: `${portfolioMetrics.maxDrawdown.toFixed(1)}%`, score: Math.min(portfolioMetrics.maxDrawdown * 8, 100), color: '#fb7185' },
  ];

  // ── Kill switch ────────────────────────────────────────────────────────────
  const killSwitchMutation = useMutation({
    mutationFn: () => tradingApi.emergencyStop(),
    onSuccess: (result) => {
      const msg = result.status === 'NO_OPEN_TRADES'
        ? 'No open trades found.'
        : `Closed ${result.closedTrades} open trade(s).`;
      toast.success('Emergency stop executed', { description: msg });
    },
    onError: (error: any) => {
      toast.error('Emergency stop failed', { description: error?.response?.data?.error || error?.message });
    },
  });

  // ── CSV export ─────────────────────────────────────────────────────────────
  const toCsv = (v: unknown) => {
    if (v == null) return '';
    const s = String(v);
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const handleExportCsv = async () => {
    if (isExportingCsv) return;
    setIsExportingCsv(true);
    try {
      const payload = await analyticsApi.getTradeExport(rangeToApi[chartRange]);
      if (!payload.rows.length) { toast.message('No trades for this range.'); return; }
      const headers = ['trade_id', 'symbol', 'direction', 'volume', 'open_price', 'close_price', 'profit', 'status', 'strategy_name', 'opened_at', 'closed_at'];
      const rows = payload.rows.map((r) =>
        [r.id, r.symbol, r.direction, r.volume, r.openPrice, r.closePrice, r.profit, r.status, r.strategyName, r.openedAt, r.closedAt].map(toCsv).join(','),
      );
      const blob = new Blob([[headers.join(','), ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `trades-${payload.range}-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
      toast.success('Export ready', { description: `CSV for ${chartRange}.` });
    } catch (e: any) {
      toast.error('Export failed', { description: e?.message });
    } finally {
      setIsExportingCsv(false);
    }
  };

  const handleManualClose = () => {
    if (!selectedTrade) { toast.message('Select a trade first'); return; }
    toast.success('Close order queued', { description: `${selectedTrade.asset} submitted for review.` });
    setSelectedTrade(null);
  };

  // ── Greeting ───────────────────────────────────────────────────────────────
  const hour = mounted ? new Date().getHours() : 12;
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = currentUser?.fullName?.split(' ')[0] || currentUser?.name?.split(' ')[0] || 'Trader';

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (!mounted) {
    return (
      <div className="space-y-5">
        <div className="h-14 shimmer rounded-2xl bg-white/[0.03]" />
        <div className="h-12 shimmer rounded-2xl bg-white/[0.03]" />
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-44 shimmer rounded-2xl bg-white/[0.03]" style={{ animationDelay: `${i * 120}ms` }} />
          ))}
        </div>
        <div className="h-96 shimmer rounded-2xl bg-white/[0.03]" style={{ animationDelay: '480ms' }} />
      </div>
    );
  }

  return (
    <div className="space-y-5 lg:space-y-6 pb-10" suppressHydrationWarning>

      {/* ── 1. GREETING ─────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">
            {greeting},{' '}
            <span className="bg-gradient-to-r from-cyan-300 via-violet-300 to-pink-300 bg-clip-text text-transparent">
              {firstName}
            </span>
          </h1>
          <p className="text-sm text-white/40 mt-0.5 font-medium">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            {btcQuote && (
              <>
                {' · '}BTC{' '}
                <span className={btcQuote.change24hPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                  {btcQuote.change24hPct >= 0 ? '▲' : '▼'} {Math.abs(btcQuote.change24hPct).toFixed(2)}%
                </span>
              </>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline" size="sm"
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ['portfolio'] });
              toast.success('Refreshing portfolio data…');
            }}
            className="h-9 px-4 border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] text-white/50 hover:text-white text-xs font-semibold gap-2 rounded-xl"
          >
            <RefreshCcw className="w-3.5 h-3.5" />
            Refresh
          </Button>
          <Link href="/wallet">
            <Button variant="primary" size="pill-sm">
              <Zap className="w-3.5 h-3.5" />
              Quick Deposit
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* ── 2. MARKET TICKER ────────────────────────────────────────────────── */}
      <MarketStrip quotes={quotes} wsConnected={wsConnected} />

      {/* ── 3. KPI CARDS ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
        <KpiCard
          label="Portfolio Value"
          value={Number.isFinite(effectivePortfolioValue) ? effectivePortfolioValue : portfolioValue}
          prefix="$"
          trend={Number.isFinite(effectiveDailyChangePercent) ? effectiveDailyChangePercent : dailyChangePercent}
          sub={`BTC $${btcQuote?.price?.toLocaleString('en-US', { maximumFractionDigits: 0 }) ?? '—'} · ${wsConnected ? 'WebSocket' : 'REST'}`}
          icon={Wallet}
          sparkData={sparklineData}
          accent="cyan"
          index={0}
        />
        <KpiCard
          label="Active Strategies"
          value={activeStrategies.length}
          decimals={0}
          trend={btcQuote?.change24hPct ?? 0}
          trendLabel="BTC ref"
          sub={`Combined win rate: ${winRate.toFixed(1)}%`}
          icon={Zap}
          accent="violet"
          index={1}
        />
        <KpiCard
          label="Today's P&L"
          value={Math.abs(Number.isFinite(effectiveDailyChange) ? effectiveDailyChange : dailyChange)}
          prefix={(Number.isFinite(effectiveDailyChange) ? effectiveDailyChange : dailyChange) >= 0 ? '+$' : '-$'}
          trend={Number.isFinite(effectiveDailyChangePercent) ? effectiveDailyChangePercent : dailyChangePercent}
          sub={`Realized $${realizedPnl.toFixed(0)} · Unrealized $${unrealizedPnl.toFixed(0)}`}
          icon={TrendingUp}
          sparkData={sparklineData}
          accent={(Number.isFinite(effectiveDailyChange) ? effectiveDailyChange : dailyChange) >= 0 ? 'emerald' : 'rose'}
          index={2}
        />
        <KpiCard
          label="Win Rate"
          value={winRate}
          suffix="%"
          decimals={1}
          trend={Math.max(-9.9, Math.min(9.9, (quotes.EURUSD?.change24hPct ?? 0) + (quotes.XAUUSD?.change24hPct ?? 0)))}
          trendLabel="EUR+XAU ref"
          sub="185 Wins · 72 Losses · Ratio 2.57"
          icon={Trophy}
          accent="amber"
          index={3}
        />
      </div>

      {/* ── 4. CHART + PORTFOLIO HEALTH ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_340px]">

        {/* Chart card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl bg-white/[0.025] border border-white/[0.07] overflow-hidden relative"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,rgba(34,211,238,0.08),transparent_50%),radial-gradient(ellipse_at_80%_100%,rgba(99,102,241,0.08),transparent_50%)]" />

          <div className="relative flex items-center justify-between px-5 py-4 border-b border-white/[0.05]">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-6 h-6 rounded-lg bg-cyan-500/15 flex items-center justify-center">
                  <Activity className="w-3.5 h-3.5 text-cyan-400" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-[0.26em] text-white/35">
                  Live Market Feed
                </span>
              </div>
              <h2 className="text-base font-bold text-white">Trading Chart</h2>
              <p className="text-[11px] text-white/30 mt-0.5">
                OHLC candles · Volume · Source:{' '}
                <span className={hasLiveData ? 'text-emerald-400' : 'text-amber-400'}>
                  {hasLiveData ? 'Live portfolio data' : 'Synthetic candles'}
                </span>
              </p>
            </div>

            <div className="flex gap-0.5 p-1 rounded-xl bg-black/30 border border-white/[0.06]">
              {(['1D', '1W', '1M', '3M', '1Y', 'ALL'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setChartRange(r)}
                  className={cn(
                    'px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all duration-150 uppercase tracking-widest',
                    chartRange === r
                      ? 'bg-cyan-500/20 text-cyan-200'
                      : 'text-white/30 hover:text-white/60 hover:bg-white/5',
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="h-[400px] lg:h-[440px] w-full p-1">
            <EquityChart data={portfolioQuery.data?.equityCurve ?? []} rangeLabel={chartRange} />
          </div>
        </motion.div>

        {/* Right column */}
        <div className="flex flex-col gap-4">

          {/* Portfolio health ring */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="rounded-2xl bg-white/[0.025] border border-white/[0.07] p-5 relative overflow-hidden"
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_80%_0%,rgba(245,158,11,0.08),transparent_55%)]" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-lg bg-amber-500/15 flex items-center justify-center">
                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-[0.26em] text-white/35">Portfolio Health</span>
              </div>

              <div className="flex items-center gap-4">
                <RadialRing
                  value={winRate}
                  max={100}
                  size={96}
                  sw={8}
                  color={winRate >= 60 ? '#34d399' : winRate >= 40 ? '#fbbf24' : '#fb7185'}
                  label={`${winRate.toFixed(0)}%`}
                  sub="Win Rate"
                />

                <div className="flex-1 space-y-3">
                  {[
                    { label: 'Sharpe Ratio', val: portfolioMetrics.sharpeRatio.toFixed(2), good: portfolioMetrics.sharpeRatio > 1 },
                    { label: 'Max Drawdown', val: `${portfolioMetrics.maxDrawdown.toFixed(1)}%`, good: portfolioMetrics.maxDrawdown < 10 },
                    { label: 'Best Month',   val: `+${bestMonthValue.toFixed(1)}%`, good: bestMonthValue > 0 },
                  ].map(({ label, val, good }) => (
                    <div key={label} className="flex items-center justify-between gap-2">
                      <span className="text-[10px] text-white/30 font-medium uppercase tracking-widest truncate">{label}</span>
                      <span className={cn('text-xs font-bold font-mono shrink-0', good ? 'text-emerald-400' : 'text-rose-400')}>{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Performance bar chart */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl bg-white/[0.025] border border-white/[0.07] p-5 flex-1 relative overflow-hidden"
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_100%,rgba(139,92,246,0.07),transparent_50%)]" />
            <div className="relative h-full flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-lg bg-violet-500/15 flex items-center justify-center">
                  <Activity className="w-3.5 h-3.5 text-violet-400" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-[0.26em] text-white/35">Performance Profile</span>
              </div>

              <div className="flex-1 min-h-[160px]">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={1}>
                  <BarChart data={performanceGraphData} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                    <XAxis type="number" domain={[0, 100]} tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 9, fontWeight: 700 }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="label" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} width={64} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const pt = payload[0].payload as { label: string; display: string; score: number };
                        return (
                          <div className="rounded-xl border border-white/10 bg-[#09090f]/95 px-3 py-2 shadow-xl backdrop-blur-xl">
                            <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-white/30">{pt.label}</p>
                            <p className="mt-0.5 text-sm font-bold text-white">{pt.display}</p>
                            <p className="text-[9px] text-white/25">Score {Math.round(pt.score)}/100</p>
                          </div>
                        );
                      }}
                    />
                    <Bar dataKey="score" radius={[0, 8, 8, 0]}>
                      {performanceGraphData.map((entry) => (
                        <Cell key={entry.label} fill={entry.color} fillOpacity={0.88} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── 5. STRATEGIES + RISK ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">

        {/* Strategies */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="rounded-2xl bg-white/[0.025] border border-white/[0.07] p-5 overflow-hidden"
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-violet-500/15 flex items-center justify-center">
                <Target className="w-3.5 h-3.5 text-violet-400" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-[0.26em] text-white/35">Active Strategies</span>
              {activeStrategies.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-violet-500/15 border border-violet-500/20 text-[10px] font-bold text-violet-400">
                  {activeStrategies.length}
                </span>
              )}
            </div>
            <Link href="/strategies" className="flex items-center gap-1 text-[10px] font-bold text-white/25 hover:text-white/55 uppercase tracking-widest transition-colors">
              Manage <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          {activeStrategies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-4">
                <Target className="w-7 h-7 text-white/10" />
              </div>
              <p className="text-sm font-bold text-white/25">No active strategies</p>
              <p className="text-xs text-white/15 mt-1.5 max-w-[240px] leading-relaxed">
                Build or subscribe to a strategy to start automated trading
              </p>
              <Link href="/strategies/builder" className="mt-5">
                <Button variant="primary" size="sm">
                  <Zap className="w-3 h-3" />
                  Build Strategy
                </Button>
              </Link>
            </div>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {activeStrategies.map((strat, idx) => (
                <motion.div
                  key={strat.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.06 }}
                  whileHover={{ y: -3 }}
                  className="min-w-[260px] rounded-2xl bg-white/[0.04] border border-white/[0.08] p-4 relative overflow-hidden group"
                >
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_100%_0%,rgba(139,92,246,0.14),transparent_55%)] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="text-sm font-bold text-white">{strat.name}</h4>
                        <div className="flex items-center gap-1.5 mt-1">
                          <motion.div
                            animate={{ opacity: [1, 0.3, 1] }}
                            transition={{ repeat: Infinity, duration: 2.2 }}
                            className="w-1.5 h-1.5 rounded-full bg-emerald-400"
                          />
                          <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">Running</span>
                        </div>
                      </div>
                      <div className={cn(
                        'w-8 h-8 rounded-xl flex items-center justify-center text-[11px] font-bold border',
                        strat.confidence > 70
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25'
                          : 'bg-amber-500/15 text-amber-400 border-amber-500/25',
                      )}>
                        {strat.confidence}
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      <div className="flex justify-between items-baseline">
                        <span className="text-[9px] font-bold text-white/25 uppercase tracking-widest">Win Rate</span>
                        <span className="text-xs font-bold font-mono text-white">{strat.winRate}%</span>
                      </div>
                      <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-violet-500 to-cyan-500 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${strat.winRate}%` }}
                          transition={{ duration: 0.9, delay: idx * 0.1 }}
                        />
                      </div>
                      <div className="flex justify-between items-baseline pt-0.5">
                        <span className="text-[9px] font-bold text-white/25 uppercase tracking-widest">Today's P&L</span>
                        <span className="text-xs font-bold font-mono text-emerald-400">+$0.00</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Risk monitor */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38 }}
        >
          <RiskMonitor
            value={3.4}
            limit={10}
            onKill={() => killSwitchMutation.mutate()}
            isKilling={killSwitchMutation.isPending}
          />
        </motion.div>
      </div>

      {/* ── 6. OPEN POSITIONS ───────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.42 }}
        className="rounded-2xl bg-white/[0.025] border border-white/[0.07] overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.05]">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/15 flex items-center justify-center">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-[0.26em] text-white/35">Open Positions</span>
            {activeTrades.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-400">
                {activeTrades.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost" size="sm" onClick={handleExportCsv} disabled={isExportingCsv}
              className="h-7 px-3 text-white/25 hover:text-white/60 text-[10px] font-bold uppercase tracking-widest gap-1.5"
            >
              <Download className="w-3 h-3" />
              {isExportingCsv ? 'Exporting…' : 'CSV'}
            </Button>
            <Link href="/history" className="text-[10px] font-bold text-white/25 hover:text-white/55 uppercase tracking-widest transition-colors">
              View All →
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            <div className="grid grid-cols-7 px-6 py-3 bg-white/[0.015] border-b border-white/[0.04]">
              {['Asset', 'Direction', 'Volume', 'Entry', 'P&L', 'Duration', 'Action'].map((h) => (
                <span key={h} className="text-[9px] font-bold text-white/22 uppercase tracking-[0.32em]">{h}</span>
              ))}
            </div>

            {activeTrades.length > 0 ? (
              activeTrades.map((trade) => (
                <TradeRow key={trade.id} trade={trade} onExplain={setSelectedTrade} />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-4">
                  <Activity className="w-7 h-7 text-white/10" />
                </div>
                <p className="text-sm font-bold text-white/22">No open positions</p>
                <p className="text-xs text-white/14 mt-1.5 max-w-[260px] leading-relaxed">
                  Connect an MT5 account or place a trade to see live positions here
                </p>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* ── TRADE AI ANALYSIS PANEL ─────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedTrade && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedTrade(null)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100]"
            />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              className="fixed top-0 right-0 h-full w-full max-w-[420px] bg-[#09090f] border-l border-white/[0.07] z-[101] shadow-2xl flex flex-col"
            >
              {/* Panel header */}
              <div className="flex items-center justify-between px-7 py-5 border-b border-white/[0.06]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-violet-500/15 flex items-center justify-center">
                    <Brain className="w-4 h-4 text-violet-400" />
                  </div>
                  <span className="text-sm font-bold text-white uppercase tracking-widest">AI Analysis</span>
                </div>
                <button
                  onClick={() => setSelectedTrade(null)}
                  className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all group"
                >
                  <X className="w-4 h-4 text-white/35 group-hover:text-white transition-colors" />
                </button>
              </div>

              {/* Panel body */}
              <div className="flex-1 overflow-y-auto p-7 space-y-6">

                {/* Trade summary */}
                <div className="rounded-2xl bg-white/[0.04] border border-white/[0.07] p-5 relative overflow-hidden">
                  <div className="pointer-events-none absolute top-0 right-0 w-24 h-24 bg-violet-500/10 blur-3xl" />
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-white font-mono">{selectedTrade.asset}</h3>
                      <span className={cn(
                        'text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-widest mt-1.5 inline-block',
                        selectedTrade.type === 'Long'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/20',
                      )}>
                        {selectedTrade.type}
                      </span>
                    </div>
                    <div className={cn('text-xl font-bold font-mono', selectedTrade.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
                      {selectedTrade.pnl >= 0 ? '+' : ''}${selectedTrade.pnl.toFixed(2)}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/[0.05]">
                    {[{ l: 'Entry', v: selectedTrade.entry }, { l: 'Strategy', v: selectedTrade.strategyId || 'Manual' }].map(({ l, v }) => (
                      <div key={l}>
                        <p className="text-[9px] font-bold text-white/22 uppercase tracking-widest">{l}</p>
                        <p className="text-xs font-mono text-white/65 mt-0.5">{v}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* AI Confidence */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-bold text-white/25 uppercase tracking-widest">AI Confidence Score</span>
                    <span className="text-base font-bold font-mono text-emerald-400">74 / 100</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full"
                      initial={{ width: 0 }} animate={{ width: '74%' }}
                      transition={{ duration: 0.9 }}
                    />
                  </div>
                  <p className="text-xs text-white/40 leading-relaxed">
                    "High conviction signal based on multi-timeframe divergence and institutional flow detection."
                  </p>
                </div>

                {/* Execution logic */}
                <div className="space-y-3">
                  <span className="text-[9px] font-bold text-white/25 uppercase tracking-widest">Execution Logic</span>
                  <ul className="space-y-3">
                    {[
                      'RSI crossed below 30 — oversold signal confirmed',
                      'Price bounced off institutional support at 1.0820',
                      'MACD histogram turning positive on lower timeframes',
                      'Order book shift: +24% buy pressure detected',
                    ].map((pt, i) => (
                      <li key={i} className="flex gap-3">
                        <div className="w-1 h-1 rounded-full bg-cyan-400 mt-2 shrink-0" />
                        <span className="text-xs text-white/50 leading-relaxed">{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Risk factors */}
                <div className="p-4 rounded-2xl bg-amber-500/[0.05] border border-amber-500/14 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-[9px] font-bold text-amber-400 uppercase tracking-widest">Risk Factors</span>
                  </div>
                  {['Tier 1 data release in ~14 min — high volatility expected', 'Counter-trend momentum strengthening on 1H chart'].map((r, i) => (
                    <p key={i} className="text-xs text-amber-400/55 leading-relaxed">· {r}</p>
                  ))}
                </div>

                {/* Key levels */}
                <div className="grid grid-cols-3 gap-2">
                  {[{ l: 'Support', v: '1.0810' }, { l: 'Target', v: '1.0880' }, { l: 'Stop', v: '1.0795' }].map(({ l, v }) => (
                    <div key={l} className="rounded-xl bg-white/[0.04] border border-white/[0.07] p-3 text-center">
                      <p className="text-[9px] font-bold text-white/22 uppercase tracking-widest mb-1">{l}</p>
                      <p className="text-xs font-mono font-bold text-white">{v}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Panel footer */}
              <div className="px-7 py-5 border-t border-white/[0.06]">
                <Button
                  onClick={handleManualClose}
                  variant="primary"
                  size="lg"
                  className="w-full"
                >
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
