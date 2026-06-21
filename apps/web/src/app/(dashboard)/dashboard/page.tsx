'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';

const PerformanceBarChart = dynamic(
  () => import('@/components/dashboard/DashboardPerformanceBarChart'),
  { ssr: false, loading: () => <div className="h-full w-full rounded-2xl bg-muted/30 animate-pulse" /> },
);
import {
  TrendingUp, TrendingDown, Zap, Shield, ArrowUpRight, ArrowDownRight,
  Activity, Clock, Target, Brain, X, Info,
  ChevronRight, Download, RefreshCcw, Wallet, Trophy,
} from '@/components/ui/icons';
import { Link2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { analyticsApi, type AnalyticsRange } from '@/lib/api/analytics';
import { tradingApi } from '@/lib/api/trading';
import { toast } from 'sonner';
import { useDashboardData } from '@/hooks/useDashboardData';
import { invalidateAccountQueries } from '@/lib/queries/account-queries';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { DashboardMarketCards } from '@/components/dashboard/DashboardMarketCards';
import { DashboardRightRail } from '@/components/dashboard/DashboardRightRail';
import { TradeActionsModal, type TradeActionMode, type ActionTrade } from '@/components/trading/TradeActionsModal';
import { ManualOrderModal } from '@/components/trading/ManualOrderModal';
import { PositionActionsMenu, BulkCloseBar } from '@/components/trading/PositionActions';
import { useTradeActions } from '@/hooks/useTradeActions';
import { Plus } from 'lucide-react';

const EquityChart = dynamic(
  () => import('@/components/charts/LiveCandlesChart').then((m) => m.LiveCandlesChart),
  { ssr: false, loading: () => <div className="h-full w-full rounded-2xl bg-foreground/5 animate-pulse" /> },
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
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--muted)" strokeWidth={sw} />
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
        <span className="text-base font-bold font-mono text-foreground leading-tight">{label}</span>
        {sub && <span className="text-xs text-muted-foreground mt-0.5">{sub}</span>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────
type AccentKey = 'cyan' | 'violet' | 'emerald' | 'rose' | 'amber';
const ACCENTS: Record<AccentKey, { iconBg: string; iconText: string; badge: string; glow: string }> = {
  cyan:    { iconBg: 'bg-chart-5/10',    iconText: 'text-chart-5',    badge: 'text-chart-5',    glow: '#22d3ee' },
  violet:  { iconBg: 'bg-chart-2/10',  iconText: 'text-chart-2',  badge: 'text-chart-2',  glow: '#818cf8' },
  emerald: { iconBg: 'bg-chart-3/10', iconText: 'text-chart-3', badge: 'text-chart-3', glow: '#34d399' },
  rose:    { iconBg: 'bg-destructive/10',    iconText: 'text-destructive',    badge: 'text-destructive',    glow: '#fb7185' },
  amber:   { iconBg: 'bg-chart-4/10',   iconText: 'text-chart-4',   badge: 'text-chart-4',   glow: '#fbbf24' },
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
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      className="group relative dashboard-card p-5 overflow-hidden cursor-default select-none card-lift transition-shadow duration-300 hover:shadow-card-premium"
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
          <span className="text-micro font-bold uppercase tracking-[0.22em] text-muted-foreground group-hover:text-foreground/60 transition-colors duration-300">{label}</span>
        </div>
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-chart-3/10 border border-chart-3/20">
          <motion.div
            animate={{ opacity: [1, 0.35, 1], scale: [1, 1.3, 1] }}
            transition={{ repeat: Infinity, duration: 2.4 }}
            className="w-1 h-1 rounded-full bg-chart-3"
            style={{ boxShadow: '0 0 4px #34d399' }}
          />
          <span className="text-micro font-bold text-chart-3 uppercase tracking-widest">Live</span>
        </div>
      </div>

      {/* Value — with subtle bottom border glow on hover */}
      <div className="relative mb-1.5">
        <h3 className="text-[1.75rem] font-bold text-foreground font-mono tracking-tight tabular-nums leading-none transition-all duration-300 group-hover:tracking-tighter">
          <Counter value={value} prefix={prefix} suffix={suffix} decimals={decimals} />
        </h3>
      </div>

      {/* Trend */}
      <div className={cn(
        'relative flex items-center gap-1 mb-4 transition-transform duration-300 group-hover:translate-x-0.5',
        isUp ? 'text-chart-3' : 'text-destructive',
      )}>
        <motion.span
          animate={{ y: isUp ? [0, -2, 0] : [0, 2, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        >
          {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        </motion.span>
        <span className="text-xs font-bold tabular-nums">{isUp ? '+' : ''}{trend.toFixed(2)}%</span>
        <span className="text-micro text-foreground/25 font-medium ml-0.5">{trendLabel}</span>
      </div>

      {/* Sparkline */}
      {sparkData && sparkData.length > 1 && (
        <div className="relative mb-3 transition-transform duration-300 group-hover:scale-[1.02] origin-left">
          <Sparkline data={sparkData} positive={isUp} width={104} height={28} />
        </div>
      )}

      {/* Sub */}
      <p className="relative text-caption text-foreground/30 font-medium leading-relaxed truncate group-hover:text-muted-foreground transition-colors duration-300">{sub}</p>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Trade row
// ─────────────────────────────────────────────────────────────────────────────
function TradeRow({ trade, onExplain, onAction }: { trade: any; onExplain: (t: any) => void; onAction: (t: any, mode: TradeActionMode) => void }) {
  const isLong = trade.type === 'Long';
  const isProfit = trade.pnl >= 0;
  // Compute trade age on the client after mount so render stays pure (no Date.now during render).
  const [age, setAge] = React.useState('—');
  React.useEffect(() => {
    if (!trade.timestamp) {
      setAge('—');
      return;
    }
    const compute = () => {
      const ms = Date.now() - new Date(trade.timestamp).getTime();
      const h = Math.floor(ms / 3_600_000);
      const m = Math.floor((ms % 3_600_000) / 60_000);
      setAge(h > 0 ? `${h}h ${m}m` : `${m}m`);
    };
    compute();
    const id = setInterval(compute, 60_000);
    return () => clearInterval(id);
  }, [trade.timestamp]);

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="group grid grid-cols-7 items-center py-3.5 px-5 border-b border-[var(--card-border)] hover:bg-muted/40 cursor-pointer transition-colors duration-150"
      onClick={() => onExplain(trade)}
    >
      {/* Asset */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-border flex items-center justify-center text-micro font-bold text-foreground/60">
          {trade.asset?.slice(0, 2)}
        </div>
        <div>
          <p className="text-xs font-bold text-foreground">{trade.asset}</p>
          <p className="text-micro text-foreground/25 uppercase tracking-wider">{trade.strategyId || 'Manual'}</p>
        </div>
      </div>

      {/* Direction */}
      <div>
        <span className={cn('text-micro font-bold px-2.5 py-1 rounded-full border uppercase tracking-widest',
          isLong ? 'bg-chart-3/10 text-chart-3 border-chart-3/20' : 'bg-destructive/10 text-destructive border-destructive/20')}>
          {trade.type}
        </span>
      </div>

      {/* Volume */}
      <div className="text-xs font-mono text-foreground/45">
        {typeof trade.amount === 'number' ? trade.amount.toFixed(2) : trade.amount}
        <span className="text-foreground/20 ml-1">lots</span>
      </div>

      {/* Entry */}
      <div className="text-xs font-mono text-foreground/45">{trade.entry}</div>

      {/* P&L */}
      <div className={cn('flex items-center gap-1', isProfit ? 'text-chart-3' : 'text-destructive')}>
        {isProfit ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
        <span className="text-xs font-bold font-mono tabular-nums">
          <Counter value={Math.abs(trade.pnl)} prefix={isProfit ? '+$' : '-$'} decimals={2} />
        </span>
      </div>

      {/* Duration */}
      <div className="flex items-center gap-1.5 text-foreground/25">
        <Clock className="w-3 h-3" />
        <span className="text-micro font-mono">{age}</span>
      </div>

      {/* Action */}
      <div className="flex justify-end items-center gap-1" onClick={(e) => e.stopPropagation()}>
        <Button
          variant="ghost" size="sm"
          onClick={(e) => { e.stopPropagation(); onExplain(trade); }}
          className="h-7 px-3 text-micro font-bold uppercase tracking-widest text-chart-2/60 hover:text-violet-200 hover:bg-chart-2/10 border border-transparent hover:border-chart-2/20 transition-all gap-1.5 rounded-lg"
        >
          <Brain className="w-3 h-3" />
          AI
        </Button>
        <PositionActionsMenu onAction={(mode) => onAction(trade, mode)} />
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Risk monitor
// ─────────────────────────────────────────────────────────────────────────────
function RiskMonitor({
  limitPct,
  dailyLossUsed,
  dailyLossCap,
  drawdownPct,
  maxDrawdownPct,
  onKill,
  isKilling,
  isLoading = false,
}: {
  limitPct: number;
  dailyLossUsed: number;
  dailyLossCap: number;
  drawdownPct: number;
  maxDrawdownPct: number;
  onKill: () => void;
  isKilling: boolean;
  isLoading?: boolean;
}) {
  const pct = Math.min(limitPct, 100);
  const color = pct > 80 ? '#DC2626' : pct > 50 ? '#F59E0B' : '#47a7aa';
  const dailyPct = dailyLossCap > 0 ? Math.min((dailyLossUsed / dailyLossCap) * 100, 100) : 0;
  const ddPct = maxDrawdownPct > 0 ? Math.min((drawdownPct / maxDrawdownPct) * 100, 100) : 0;

  return (
    <div className="dashboard-card p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <Shield className="w-3.5 h-3.5 text-primary" />
          </div>
          <span className="text-sm font-semibold text-foreground">Risk Monitor</span>
        </div>
        <Button
          onClick={onKill} disabled={isKilling}
          variant="destructive"
          size="sm"
          className="h-7 px-3 text-caption font-semibold rounded-lg"
        >
          {isKilling ? 'Stopping…' : 'Kill Switch'}
        </Button>
      </div>

      <div className="flex items-center justify-center py-2">
        {isLoading ? (
          <div className="h-28 w-28 rounded-full bg-muted animate-pulse" />
        ) : (
          <RadialRing
            value={pct} max={100} size={112} sw={10} color={color}
            label={`${Math.round(pct)}%`} sub="of limit"
          />
        )}
      </div>

      <div className="space-y-3 mt-4 flex-1">
        {[
          {
            label: 'Daily Loss Cap',
            pctVal: dailyPct,
            display: `$${dailyLossUsed.toLocaleString('en-US', { maximumFractionDigits: 0 })} / $${dailyLossCap.toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
          },
          {
            label: 'Max Drawdown',
            pctVal: ddPct,
            display: `${drawdownPct.toFixed(1)}% / ${maxDrawdownPct.toFixed(1)}%`,
          },
        ].map(({ label, pctVal, display }) => (
          <div key={label}>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-caption font-medium text-muted-foreground">{label}</span>
              <span className="text-caption font-mono text-foreground">{display}</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <motion.div
                className={cn('h-full rounded-full', pctVal > 75 ? 'bg-destructive' : pctVal > 50 ? 'bg-chart-4' : 'bg-primary')}
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
          className="mt-4 flex items-center gap-2 p-3 rounded-xl bg-chart-4/[0.08] border border-chart-4/20"
        >
          <Info className="w-3.5 h-3.5 text-chart-4 shrink-0" />
          <p className="text-micro font-bold text-chart-4/80 uppercase tracking-tight">High risk exposure</p>
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
  const router = useRouter();
  const [chartRange, setChartRange] = React.useState<'1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL'>('1M');
  const [isExportingCsv, setIsExportingCsv] = React.useState(false);
  const [selectedTrade, setSelectedTrade] = React.useState<any>(null);
  const [dateLabel, setDateLabel] = React.useState('');
  const [greeting, setGreeting] = React.useState('Good morning');
  const [actionTrade, setActionTrade] = React.useState<ActionTrade | null>(null);
  const [actionMode, setActionMode] = React.useState<TradeActionMode | null>(null);
  const [manualOrderOpen, setManualOrderOpen] = React.useState(false);

  const { closeTrade } = useTradeActions();

  const toActionTrade = (t: any): ActionTrade => ({
    id: t.id,
    asset: t.asset,
    type: t.type,
    amount: Number(t.amount) || 0,
    entry: Number(t.entry) || 0,
    pnl: Number(t.pnl) || 0,
  });

  const openTradeAction = (t: any, mode: TradeActionMode) => {
    setActionTrade(toActionTrade(t));
    setActionMode(mode);
  };

  const { data: currentUser } = useCurrentUser();

  const {
    quotes,
    wsConnected,
    marketQuotesWithSpark,
    portfolioQuery,
    winRate,
    bestMonth,
    openTrades: activeTrades,
    activeStrategies,
    performanceBars: performanceGraphData,
    risk,
    isLoading: isDashboardLoading,
    refreshAll,
    hasBrokerAccount,
    quotesLoading,
    portfolioValue,
    portfolio,
    defaultBrokerAccount,
    isPaper,
  } = useDashboardData(chartRange);

  const btcQuote = quotes.BTCUSDT;
  const portfolioMetrics = portfolioQuery.data ?? { sharpeRatio: 0, winRate: 0, maxDrawdown: 0, bestMonth: 0 };
  const bestMonthValue = bestMonth;
  const chartLive = wsConnected || !!btcQuote;

  const rangeToApi: Record<'1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL', AnalyticsRange> = {
    '1D': '1d', '1W': '1w', '1M': '1m', '3M': '3m', '1Y': '1y', ALL: 'all',
  };

  React.useEffect(() => {
    const hour = new Date().getHours();
    setGreeting(hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening');
    setDateLabel(
      new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
    );
  }, []);
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

  // ── Kill switch ────────────────────────────────────────────────────────────
  const killSwitchMutation = useMutation({
    mutationFn: () => tradingApi.emergencyStop(),
    onSuccess: (result) => {
      invalidateAccountQueries(queryClient);
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
    closeTrade.mutate(
      { id: selectedTrade.id },
      { onSettled: () => setSelectedTrade(null) },
    );
  };

  // ── Greeting ───────────────────────────────────────────────────────────────
  const firstName = currentUser?.fullName?.split(' ')[0] || currentUser?.name?.split(' ')[0] || 'Trader';

  return (
    <div className="space-y-6 pb-4" suppressHydrationWarning>

      {/* ── 1. GREETING ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 dashboard-enter">
        <div>
          <h1 className="dashboard-page-title text-2xl sm:text-3xl font-bold tracking-tight">
            {greeting},{' '}
            <span className="text-gradient-hero">{firstName}</span>
            <span className="ml-1">👋</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5 font-medium" suppressHydrationWarning>
            {dateLabel || 'Loading…'}
            {btcQuote && (
              <>
                {' · '}BTC{' '}
                <span className={btcQuote.change24hPct >= 0 ? 'text-chart-3 font-semibold' : 'text-destructive font-semibold'}>
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
              refreshAll();
              toast.success('Refreshing live data…');
            }}
            className="h-9 px-4 text-xs font-semibold gap-2"
          >
            <RefreshCcw className="w-3.5 h-3.5" />
            Refresh
          </Button>
        </div>
      </div>

      {!hasBrokerAccount && (
        <div className="dashboard-card border border-primary/20 bg-primary/[0.04] p-5 dashboard-enter">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center shrink-0">
                <Link2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Connect your first account</p>
                <p className="text-sm text-muted-foreground mt-1 max-w-xl">
                  Link a paper or live broker account once. Portfolio value, win rate, open positions, and analytics will all come from that account — no demo placeholders.
                </p>
              </div>
            </div>
            <Button
              onClick={() => router.push('/copy-trading')}
              className="shrink-0 gap-2"
            >
              <Zap className="w-4 h-4" />
              Connect Account
            </Button>
          </div>
        </div>
      )}

      {hasBrokerAccount && defaultBrokerAccount && (
        <p className="text-xs text-muted-foreground -mt-2 dashboard-enter">
          Data scoped to your {isPaper ? 'paper' : 'live'} account
          {defaultBrokerAccount.accountNumberLast4 ? ` ····${defaultBrokerAccount.accountNumberLast4}` : ''}
          {portfolioValue > 0 ? ` · Portfolio ${portfolioValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}` : ''}
        </p>
      )}

      {/* ── 2. MAIN GRID ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-6 items-start">
        <div className="space-y-5 min-w-0">
          <DashboardMarketCards
            quotes={marketQuotesWithSpark}
            isLoading={(isDashboardLoading && !btcQuote) || quotesLoading}
            live={wsConnected || !!btcQuote}
            showConnectHint={!hasBrokerAccount}
          />

          {/* Trading chart — mockup layout */}
          <div className="dashboard-card overflow-hidden dashboard-enter" style={{ animationDelay: '0.1s' }}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-4 border-b border-[var(--card-border)]">
              <div className="flex items-center gap-3 min-w-0">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-base font-bold text-foreground">Trading Chart</h2>
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-chart-3/10 border border-chart-3/20">
                      <motion.span
                        animate={{ opacity: [1, 0.4, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="w-1.5 h-1.5 rounded-full bg-chart-3"
                      />
                      <span className="text-[10px] font-bold text-chart-3 uppercase tracking-widest">Live</span>
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Bull & bear candles · Volume
                  </p>
                </div>
              </div>
            </div>
            <div className="h-[400px] sm:h-[420px] w-full px-4 pb-3 flex flex-col">
              <EquityChart embedded decoupleRange data={[]} rangeLabel="1M" />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-5 py-3 border-t border-[var(--card-border)] text-sm text-muted-foreground">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-chart-3" /> Bull candle</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-destructive" /> Bear candle</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-primary/50" /> Volume</span>
              </div>
              {chartLive && (
                <span className="flex items-center gap-1.5 text-caption font-medium text-chart-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-chart-3 animate-pulse" />
                  Live
                </span>
              )}
            </div>
          </div>

          {/* Risk + Open positions */}
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(240px,280px)_1fr] gap-5 items-stretch">
            <div className="dashboard-enter" style={{ animationDelay: '0.16s' }}>
              <RiskMonitor
                limitPct={risk?.limitPct ?? 0}
                dailyLossUsed={risk?.dailyLossUsed ?? 0}
                dailyLossCap={risk?.dailyLossCap ?? 10_000}
                drawdownPct={risk?.drawdownPct ?? 0}
                maxDrawdownPct={risk?.maxDrawdownPct ?? 15}
                isLoading={isDashboardLoading && !risk}
                onKill={() => killSwitchMutation.mutate()}
                isKilling={killSwitchMutation.isPending}
              />
            </div>

            <div className="dashboard-card overflow-hidden min-w-0 dashboard-enter" style={{ animationDelay: '0.2s' }}>
              <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--card-border)]">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Activity className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <span className="text-sm font-semibold text-foreground">Open Positions</span>
                  {activeTrades.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-primary/10 text-caption font-semibold text-primary">
                      {activeTrades.length}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setManualOrderOpen(true)}
                    className="gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    New Order
                  </Button>
                  <Link href="/history" className="text-caption font-medium text-primary hover:underline">
                    View All →
                  </Link>
                </div>
              </div>
              {activeTrades.length > 0 && <BulkCloseBar />}
              <div className="overflow-x-auto">
                <div className="min-w-[640px]">
                  <div className="grid grid-cols-7 px-5 py-2.5 bg-muted/40 border-b border-[var(--card-border)]">
                    {['Asset', 'Direction', 'Volume', 'Entry', 'P&L', 'Duration', 'Action'].map((h) => (
                      <span key={h} className="text-caption font-medium text-muted-foreground">{h}</span>
                    ))}
                  </div>
                  {activeTrades.length > 0 ? (
                    activeTrades.map((trade) => (
                      <TradeRow key={trade.id} trade={trade} onExplain={setSelectedTrade} onAction={openTradeAction} />
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                      <div className="w-12 h-12 rounded-2xl bg-muted border border-[var(--card-border)] flex items-center justify-center mb-3">
                        <Activity className="w-6 h-6 text-muted-foreground/40" />
                      </div>
                      <p className="text-sm font-medium text-muted-foreground">No open positions</p>
                      <p className="text-caption text-muted-foreground/80 mt-1 max-w-[240px]">
                        Connect a broker or place a trade to see live positions here
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="xl:hidden">
            <DashboardRightRail
              className="flex"
              isLoading={isDashboardLoading}
              winRate={winRate}
              sharpeRatio={portfolioMetrics.sharpeRatio}
              maxDrawdown={portfolioMetrics.maxDrawdown}
              bestMonth={bestMonthValue}
              performanceBars={performanceGraphData}
              activeStrategies={activeStrategies}
            />
          </div>
        </div>

        {/* Desktop right rail — sticky like mockup */}
        <DashboardRightRail
          isLoading={isDashboardLoading}
          winRate={winRate}
          sharpeRatio={portfolioMetrics.sharpeRatio}
          maxDrawdown={portfolioMetrics.maxDrawdown}
          bestMonth={bestMonthValue}
          performanceBars={performanceGraphData}
          activeStrategies={activeStrategies}
        />
      </div>

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
              className="fixed top-0 right-0 h-full w-full max-w-[420px] bg-card border-l border-border z-[101] shadow-2xl flex flex-col"
            >
              {/* Panel header */}
              <div className="flex items-center justify-between px-7 py-5 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-chart-2/15 flex items-center justify-center">
                    <Brain className="w-4 h-4 text-chart-2" />
                  </div>
                  <span className="text-sm font-bold text-foreground uppercase tracking-widest">AI Analysis</span>
                </div>
                <button
                  onClick={() => setSelectedTrade(null)}
                  className="w-9 h-9 rounded-xl bg-foreground/5 hover:bg-foreground/10 flex items-center justify-center transition-all group"
                >
                  <X className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </button>
              </div>

              {/* Panel body */}
              <div className="flex-1 overflow-y-auto p-7 space-y-6">

                {/* Trade summary */}
                <div className="rounded-2xl bg-muted/4 border border-border p-5 relative overflow-hidden">
                  <div className="pointer-events-none absolute top-0 right-0 w-24 h-24 bg-chart-2/10 blur-3xl" />
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-foreground font-mono">{selectedTrade.asset}</h3>
                      <span className={cn(
                        'text-micro font-bold px-2 py-0.5 rounded-full border uppercase tracking-widest mt-1.5 inline-block',
                        selectedTrade.type === 'Long'
                          ? 'bg-chart-3/10 text-chart-3 border-chart-3/20'
                          : 'bg-destructive/10 text-destructive border-destructive/20',
                      )}>
                        {selectedTrade.type}
                      </span>
                    </div>
                    <div className={cn('text-xl font-bold font-mono', selectedTrade.pnl >= 0 ? 'text-chart-3' : 'text-destructive')}>
                      {selectedTrade.pnl >= 0 ? '+' : ''}${selectedTrade.pnl.toFixed(2)}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border">
                    {[{ l: 'Entry', v: selectedTrade.entry }, { l: 'Strategy', v: selectedTrade.strategyId || 'Manual' }].map(({ l, v }) => (
                      <div key={l}>
                        <p className="text-micro font-bold text-foreground/22 uppercase tracking-widest">{l}</p>
                        <p className="text-xs font-mono text-foreground/65 mt-0.5">{v}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* AI Confidence */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-micro font-bold text-foreground/25 uppercase tracking-widest">AI Confidence Score</span>
                    <span className="text-base font-bold font-mono text-chart-3">74 / 100</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted/6 overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-chart-3 to-chart-5 rounded-full"
                      initial={{ width: 0 }} animate={{ width: '74%' }}
                      transition={{ duration: 0.9 }}
                    />
                  </div>
                  <p className="text-xs text-foreground/40 leading-relaxed">
                    "High conviction signal based on multi-timeframe divergence and institutional flow detection."
                  </p>
                </div>

                {/* Execution logic */}
                <div className="space-y-3">
                  <span className="text-micro font-bold text-foreground/25 uppercase tracking-widest">Execution Logic</span>
                  <ul className="space-y-3">
                    {[
                      'RSI crossed below 30 — oversold signal confirmed',
                      'Price bounced off institutional support at 1.0820',
                      'MACD histogram turning positive on lower timeframes',
                      'Order book shift: +24% buy pressure detected',
                    ].map((pt, i) => (
                      <li key={i} className="flex gap-3">
                        <div className="w-1 h-1 rounded-full bg-chart-5 mt-2 shrink-0" />
                        <span className="text-xs text-muted-foreground leading-relaxed">{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Risk factors */}
                <div className="p-4 rounded-2xl bg-chart-4/[0.05] border border-chart-4/14 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5 text-chart-4" />
                    <span className="text-micro font-bold text-chart-4 uppercase tracking-widest">Risk Factors</span>
                  </div>
                  {['Tier 1 data release in ~14 min — high volatility expected', 'Counter-trend momentum strengthening on 1H chart'].map((r, i) => (
                    <p key={i} className="text-xs text-chart-4/55 leading-relaxed">· {r}</p>
                  ))}
                </div>

                {/* Key levels */}
                <div className="grid grid-cols-3 gap-2">
                  {[{ l: 'Support', v: '1.0810' }, { l: 'Target', v: '1.0880' }, { l: 'Stop', v: '1.0795' }].map(({ l, v }) => (
                    <div key={l} className="rounded-xl bg-muted/4 border border-border p-3 text-center">
                      <p className="text-micro font-bold text-foreground/22 uppercase tracking-widest mb-1">{l}</p>
                      <p className="text-xs font-mono font-bold text-foreground">{v}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Panel footer */}
              <div className="px-7 py-5 border-t border-border">
                <Button
                  onClick={handleManualClose}
                  variant="destructive"
                  size="lg"
                  className="w-full"
                  isLoading={closeTrade.isPending}
                >
                  Execute Manual Close
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── TRADE ACTION MODALS ─────────────────────────────────────────────── */}
      <TradeActionsModal
        trade={actionTrade}
        mode={actionMode}
        onClose={() => {
          setActionTrade(null);
          setActionMode(null);
        }}
      />
      <ManualOrderModal open={manualOrderOpen} onOpenChange={setManualOrderOpen} />
    </div>
  );
}
