'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { analyticsApi, type AnalyticsRange } from '@/lib/api/analytics';
import Link from 'next/link';
import {
  RefreshCcw,
  TrendingUp,
  BarChart2,
  Shield,
  Activity,
  Globe,
  ArrowUpRight,
  Info,
  LineChart,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { buildSparklinePoints } from '@/components/dashboard/DashboardMarketCards';

const AnalyticsEquityChart = dynamic(
  () =>
    import('@/components/analytics/AnalyticsEquityChart').then((m) => ({
      default: m.AnalyticsEquityChart,
    })),
  {
    ssr: false,
    loading: () => <div className="h-[280px] rounded-xl bg-muted/40 animate-pulse" />,
  },
);

const RANGE_OPTIONS: { key: AnalyticsRange; label: string }[] = [
  { key: '1d', label: '1D' },
  { key: '1w', label: '1W' },
  { key: '1m', label: '1M' },
  { key: '3m', label: '3M' },
  { key: '1y', label: '1Y' },
  { key: 'all', label: 'ALL' },
];

const RANGE_COMPARE: Record<AnalyticsRange, string> = {
  '1d': 'last 24 hours',
  '1w': 'last 7 days',
  '1m': 'last 30 days',
  '3m': 'last 90 days',
  '1y': 'last 12 months',
  all: 'all time',
};

const KPI_CONFIG = [
  {
    key: 'totalProfit',
    label: 'Total Profit',
    icon: TrendingUp,
    format: (v: number) => `$${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    iconBg: 'bg-chart-3/10 text-chart-3',
    valueClass: 'text-chart-3',
    sparkPositive: true,
    compareFormat: (v: number) => `${v >= 0 ? '' : ''}${v.toFixed(2)}%`,
  },
  {
    key: 'winRate',
    label: 'Win Rate',
    icon: BarChart2,
    format: (v: number) => `${v.toFixed(1)}%`,
    iconBg: 'bg-primary/10 text-primary',
    valueClass: 'text-primary',
    sparkPositive: true,
    compareFormat: (v: number) => `${v.toFixed(2)}%`,
  },
  {
    key: 'sharpeRatio',
    label: 'Sharpe Ratio',
    icon: Activity,
    format: (v: number) => v.toFixed(2),
    iconBg: 'bg-chart-5/10 text-chart-5',
    valueClass: 'text-chart-5',
    sparkPositive: true,
    compareFormat: (v: number) => v.toFixed(2),
  },
  {
    key: 'maxDrawdown',
    label: 'Max Drawdown',
    icon: Shield,
    format: (v: number) => `${v.toFixed(1)}%`,
    iconBg: 'bg-destructive/10 text-destructive',
    valueClass: 'text-destructive',
    sparkPositive: false,
    compareFormat: (v: number) => `${v.toFixed(2)}%`,
  },
] as const;

const NAV_SECTIONS = [
  {
    href: '/analytics/performance',
    title: 'Performance Lab',
    desc: 'Compare strategy quality and monthly edge',
    icon: BarChart2,
    iconBg: 'bg-chart-3/10 text-chart-3',
  },
  {
    href: '/analytics/risk',
    title: 'Risk Radar',
    desc: 'Monitor drawdown and stress indicators',
    icon: Shield,
    iconBg: 'bg-destructive/10 text-destructive',
  },
  {
    href: '/analytics/trade',
    title: 'Trade Forensics',
    desc: 'Inspect distributions and symbol outcomes',
    icon: Activity,
    iconBg: 'bg-chart-5/10 text-chart-5',
  },
  {
    href: '/analytics/global',
    title: 'Smart Analysis',
    desc: 'Track macro events and market regime',
    icon: Globe,
    iconBg: 'bg-primary/10 text-primary',
  },
];

function MiniSparkline({ data, positive }: { data: number[]; positive: boolean }) {
  const id = React.useId();
  if (data.length < 2) return <div className="h-8 w-full" />;
  const w = 120;
  const h = 32;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const color = positive ? 'var(--chart-bull)' : 'var(--chart-bear)';
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const line = `M ${pts.join(' L ')}`;
  const fill = `${line} L ${w},${h} L 0,${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-8 w-full" preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.15" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fill} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export default function AnalyticsPage() {
  const queryClient = useQueryClient();
  const [range, setRange] = React.useState<AnalyticsRange>('1m');
  const { isAuthenticated } = useAuthStore();

  const portfolioQuery = useQuery({
    queryKey: ['analytics', 'portfolio', range],
    queryFn: () => analyticsApi.getPortfolio(range),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    enabled: isAuthenticated,
    retry: 1,
  });

  const globalQuery = useQuery({
    queryKey: ['analytics', 'global'],
    queryFn: () => analyticsApi.getGlobal(),
    staleTime: 300_000,
    enabled: isAuthenticated,
  });

  const portfolio = portfolioQuery.data;
  const global = globalQuery.data;
  const isLoading = portfolioQuery.isLoading;
  const hasTrades = (portfolio?.totalTrades ?? 0) > 0;
  const equityCurve = portfolio?.equityCurve ?? [];

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['analytics'] });
    toast.success('Analytics refreshed');
  };

  const sparkFromEquity = equityCurve.map((p) => p.equity);

  return (
    <div className="space-y-5 pb-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-xl">
            Portfolio intelligence across performance, risk, trade quality, and macro context.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/analytics/global"
            className="inline-flex items-center gap-2 h-9 px-4 rounded-xl border border-[var(--card-border)] bg-card text-xs font-semibold text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
          >
            <Globe className="h-3.5 w-3.5" />
            Global
          </Link>
          <button
            type="button"
            onClick={handleRefresh}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-xl border border-[var(--card-border)] bg-card text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <RefreshCcw className="h-3.5 w-3.5" />
            Refresh
          </button>
        </div>
      </div>

      {/* Range selector */}
      <div className="flex flex-wrap gap-1.5">
        {RANGE_OPTIONS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setRange(key)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors',
              range === key
                ? 'bg-primary/10 text-primary border border-primary/25'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60 border border-transparent',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {KPI_CONFIG.map((kpi, idx) => {
          const rawVal = portfolio
            ? {
                totalProfit: portfolio.totalProfit,
                winRate: portfolio.winRate,
                sharpeRatio: portfolio.sharpeRatio,
                maxDrawdown: portfolio.maxDrawdown,
              }[kpi.key]
            : 0;
          const display = portfolio != null ? kpi.format(rawVal ?? 0) : null;
          const compareVal = rawVal ?? 0;
          const spark =
            sparkFromEquity.length >= 2
              ? sparkFromEquity
              : buildSparklinePoints(undefined, Math.max(compareVal, 1), compareVal >= 0 ? 0.5 : -0.5);

          return (
            <motion.div
              key={kpi.key}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05, duration: 0.35, ease: 'easeOut' }}
              whileHover={{ y: -4 }}
              className="group dashboard-card p-5 flex flex-col gap-3 dashboard-enter transition-shadow duration-300 hover:shadow-[var(--shadow-card-hover)]"
              style={{ animationDelay: `${idx * 0.05}s` }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className={cn('flex h-9 w-9 items-center justify-center rounded-xl', kpi.iconBg)}>
                  <kpi.icon className="h-4 w-4" />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{kpi.label}</p>
                {isLoading ? (
                  <div className="h-8 w-24 rounded-lg bg-muted animate-pulse mt-1" />
                ) : (
                  <p className={cn('text-2xl font-bold tabular-nums mt-0.5', kpi.valueClass)}>
                    {display ?? '$0.00'}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1 tabular-nums">
                  {kpi.compareFormat(compareVal)} vs {RANGE_COMPARE[range]}
                </p>
              </div>
              <div className="mt-auto pt-1">
                <MiniSparkline data={spark} positive={kpi.sparkPositive && compareVal >= 0} />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Info banner */}
      {!isLoading && !hasTrades && (
        <div className="rounded-xl border border-[color-mix(in_srgb,var(--info)_30%,var(--card-border))] bg-[color-mix(in_srgb,var(--info)_10%,transparent)] px-4 py-3 flex items-start gap-3">
          <Info className="h-4 w-4 text-[var(--info)] shrink-0 mt-0.5" />
          <p className="text-sm text-foreground/80 leading-relaxed">
            Analytics populate once closed trades exist in your account history. Connecting MT5 alone does not
            create these values.
          </p>
        </div>
      )}

      {/* Equity + sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5 items-start">
        <div className="dashboard-card p-5 relative overflow-hidden min-h-[360px] transition-shadow duration-300 hover:shadow-[var(--shadow-card-hover)]">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Equity Curve</p>
              <p className="text-base font-bold text-foreground mt-0.5">Portfolio Performance</p>
            </div>
            {portfolio && (
              <span className="inline-flex items-center gap-1 rounded-full bg-chart-3/10 border border-chart-3/20 px-2.5 py-1 text-[11px] font-bold text-chart-3">
                <TrendingUp className="h-3 w-3" />
                +{portfolio.bestMonth.toFixed(0)}% Best Month
              </span>
            )}
          </div>

          <div className="relative">
            <AnalyticsEquityChart data={equityCurve} />

            {!equityCurve.length && !isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-card/60 backdrop-blur-[1px]">
                <div className="text-center max-w-xs px-4">
                  <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-muted border border-[var(--card-border)]">
                    <LineChart className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-foreground">No trade history</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Your equity curve will appear here after closed trades are recorded.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {NAV_SECTIONS.map((s, idx) => (
            <motion.div
              key={s.href}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + idx * 0.05 }}
            >
              <Link
                href={s.href}
                className="dashboard-card flex items-center gap-3 p-4 group hover:border-primary/20 transition-colors"
              >
                <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', s.iconBg)}>
                  <s.icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                    {s.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{s.desc}</p>
                </div>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary shrink-0 transition-colors" />
              </Link>
            </motion.div>
          ))}

          <div className="dashboard-card p-4 space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Market Regime</p>
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-bold text-foreground uppercase">
                {global?.marketRegime.label ?? 'Trending'}
              </p>
              <span className="inline-flex items-center gap-1 rounded-full bg-chart-3/10 border border-chart-3/20 px-2 py-0.5 text-[10px] font-bold text-chart-3 uppercase">
                <span className="h-1.5 w-1.5 rounded-full bg-chart-3" />
                Live
              </span>
            </div>
            {global && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground uppercase tracking-wide">Confidence</span>
                  <span className="font-semibold tabular-nums text-foreground">
                    {global.marketRegime.confidence.toFixed(2)}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-primary/10 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${global.marketRegime.confidence}%` }}
                    transition={{ duration: 0.9, ease: 'easeOut' }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
