'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { analyticsApi, type AnalyticsRange } from '@/lib/api/analytics';
import Link from 'next/link';
import {
  RefreshCcw,
  TrendingUp,
  BarChart2,
  Shield,
  Zap,
  Globe,
  Activity,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/lib/stores/useAuthStore';

const RANGE_OPTIONS: AnalyticsRange[] = ['1d', '1w', '1m', '3m', '1y', 'all'];

const KPI_CONFIG = [
  {
    key: 'totalProfit',
    label: 'Total Profit',
    icon: TrendingUp,
    format: (v: number) => `$${v.toLocaleString()}`,
    gradient: 'from-emerald-400/20 to-emerald-600/0',
    border: 'border-emerald-400/20',
    glow: 'hover:shadow-[0_0_30px_rgba(52,211,153,0.12)]',
    iconBg: 'bg-emerald-400/10 border-emerald-400/20',
    iconColor: 'text-emerald-400',
    valueColor: 'text-emerald-400',
    bar: 'from-emerald-400 to-emerald-600',
  },
  {
    key: 'winRate',
    label: 'Win Rate',
    icon: Zap,
    format: (v: number) => `${v.toFixed(1)}%`,
    gradient: 'from-cyan-400/20 to-cyan-600/0',
    border: 'border-cyan-400/20',
    glow: 'hover:shadow-[0_0_30px_rgba(34,211,238,0.12)]',
    iconBg: 'bg-cyan-400/10 border-cyan-400/20',
    iconColor: 'text-cyan-400',
    valueColor: 'text-cyan-400',
    bar: 'from-cyan-400 to-cyan-600',
  },
  {
    key: 'sharpeRatio',
    label: 'Sharpe Ratio',
    icon: Activity,
    format: (v: number) => v.toFixed(2),
    gradient: 'from-violet-400/20 to-violet-600/0',
    border: 'border-violet-400/20',
    glow: 'hover:shadow-[0_0_30px_rgba(167,139,250,0.12)]',
    iconBg: 'bg-violet-400/10 border-violet-400/20',
    iconColor: 'text-violet-400',
    valueColor: 'text-violet-400',
    bar: 'from-violet-400 to-violet-600',
  },
  {
    key: 'maxDrawdown',
    label: 'Max Drawdown',
    icon: Shield,
    format: (v: number) => `${v.toFixed(1)}%`,
    gradient: 'from-rose-400/20 to-rose-600/0',
    border: 'border-rose-400/20',
    glow: 'hover:shadow-[0_0_30px_rgba(251,113,133,0.12)]',
    iconBg: 'bg-rose-400/10 border-rose-400/20',
    iconColor: 'text-rose-400',
    valueColor: 'text-rose-400',
    bar: 'from-rose-400 to-rose-600',
  },
];

const NAV_SECTIONS = [
  {
    href: '/analytics/performance',
    title: 'Performance Lab',
    desc: 'Compare strategy quality and monthly edge',
    icon: BarChart2,
    border: 'border-emerald-500/15 hover:border-emerald-400/35',
    bg: 'hover:bg-emerald-500/5',
    dot: 'bg-emerald-400',
  },
  {
    href: '/analytics/risk',
    title: 'Risk Radar',
    desc: 'Monitor drawdown and stress indicators',
    icon: Shield,
    border: 'border-rose-500/15 hover:border-rose-400/35',
    bg: 'hover:bg-rose-500/5',
    dot: 'bg-rose-400',
  },
  {
    href: '/analytics/trade',
    title: 'Trade Forensics',
    desc: 'Inspect distributions and symbol outcomes',
    icon: Activity,
    border: 'border-cyan-500/15 hover:border-cyan-400/35',
    bg: 'hover:bg-cyan-500/5',
    dot: 'bg-cyan-400',
  },
  {
    href: '/analytics/global',
    title: 'Smart Analysis',
    desc: 'Track macro events and market regime',
    icon: Globe,
    border: 'border-violet-500/15 hover:border-violet-400/35',
    bg: 'hover:bg-violet-500/5',
    dot: 'bg-violet-400',
  },
];

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-2xl border border-cyan-400/30 bg-[#080d18]/95 p-3 shadow-2xl backdrop-blur-xl">
      <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/30 mb-1">{label}</p>
      <p className="text-sm font-bold text-cyan-400">${Number(payload[0]?.value ?? 0).toLocaleString()}</p>
    </div>
  );
}

export default function AnalyticsPage() {
  const queryClient = useQueryClient();
  const [range, setRange] = React.useState<AnalyticsRange>('1m');
  const { isAuthenticated } = useAuthStore();

  const portfolioQuery = useQuery({
    queryKey: ['analytics', 'portfolio', range],
    queryFn: () => analyticsApi.getPortfolio(range),
    staleTime: 30_000,
    refetchInterval: 15_000,
    enabled: isAuthenticated,
    retry: 1,
  });

  const globalQuery = useQuery({
    queryKey: ['analytics', 'global'],
    queryFn: () => analyticsApi.getGlobal(),
    staleTime: 300_000,
    refetchInterval: 60_000,
    enabled: isAuthenticated,
  });

  const portfolio = portfolioQuery.data;
  const global = globalQuery.data;
  const isLoading = portfolioQuery.isLoading;

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['analytics'] });
    toast.success('Analytics refreshed');
  };

  return (
    <div className="space-y-5 pb-10">
      {/* Ambient glows */}
      <div className="pointer-events-none fixed -top-40 left-1/4 h-96 w-96 rounded-full bg-cyan-500/6 blur-[120px]" />
      <div className="pointer-events-none fixed top-20 right-1/4 h-72 w-72 rounded-full bg-violet-500/6 blur-[100px]" />

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[28px] border border-white/[0.07] bg-white/[0.02] p-6 md:p-8"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/[0.06] via-transparent to-violet-500/[0.03]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />

        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
              <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-cyan-400/70">
                Live Analytics
              </span>
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Analytics</h1>
            <p className="text-sm text-white/40 max-w-md">
              Portfolio intelligence across performance, risk, trade quality, and macro context.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/analytics/global"
              className="flex items-center gap-2 h-10 px-4 rounded-xl border border-white/[0.08] bg-white/[0.03] text-[11px] font-bold uppercase tracking-[0.2em] text-white/45 hover:border-cyan-400/30 hover:text-cyan-400 transition-all duration-300"
            >
              <Globe className="w-3.5 h-3.5" />
              Global
            </Link>
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 h-10 px-4 rounded-xl border border-white/[0.08] bg-white/[0.03] text-[11px] font-bold uppercase tracking-[0.2em] text-white/45 hover:border-white/20 hover:text-white transition-all duration-300"
            >
              <RefreshCcw className="w-3.5 h-3.5" />
              Refresh
            </button>
          </div>
        </div>

        {/* Range selector */}
        <div className="relative mt-5 flex flex-wrap gap-2">
          {RANGE_OPTIONS.map((option) => (
            <button
              key={option}
              onClick={() => setRange(option)}
              className={cn(
                'px-3.5 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-[0.2em] border transition-all duration-300',
                range === option
                  ? 'bg-cyan-400/15 text-cyan-400 border-cyan-400/40 shadow-[0_0_12px_rgba(34,211,238,0.15)]'
                  : 'bg-white/[0.03] text-white/30 border-white/[0.06] hover:text-white/60 hover:border-white/15',
              )}
            >
              {option}
            </button>
          ))}
        </div>
      </motion.div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {KPI_CONFIG.map((kpi, idx) => {
          const rawVal = portfolio ? (portfolio as unknown as Record<string, number>)[kpi.key] : null;
          const display = rawVal !== null && rawVal !== undefined ? kpi.format(rawVal) : null;
          return (
            <motion.div
              key={kpi.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.07 }}
              className={cn(
                'relative overflow-hidden rounded-[22px] border bg-gradient-to-br p-5 transition-all duration-300 hover:-translate-y-0.5',
                kpi.gradient, kpi.border, kpi.glow,
              )}
            >
              <div className={cn('w-9 h-9 rounded-xl border flex items-center justify-center mb-4', kpi.iconBg)}>
                <kpi.icon className={cn('w-4 h-4', kpi.iconColor)} />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/30 mb-1">{kpi.label}</p>
              {isLoading ? (
                <div className="h-7 w-20 rounded-lg bg-white/5 animate-pulse" />
              ) : (
                <p className={cn('text-2xl font-bold tracking-tight', display ? kpi.valueColor : 'text-white/20')}>
                  {display ?? 'No data'}
                </p>
              )}
              {/* Micro bar */}
              <div className="mt-3 h-0.5 rounded-full bg-white/5 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: rawVal != null ? `${Math.min(100, Math.abs(rawVal / 100) * 100 + 30)}%` : '0%' }}
                  transition={{ duration: 1.2, delay: idx * 0.1, ease: 'easeOut' }}
                  className={cn('h-full rounded-full bg-gradient-to-r', kpi.bar)}
                />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ── No data notice ── */}
      {!isLoading && (!portfolio || portfolio.totalTrades === 0) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-4 flex items-center gap-3"
        >
          <div className="w-8 h-8 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-sm text-amber-100/70">
            Analytics populate once closed trades exist in your account history. Connecting MT5 alone does not create
            these values.
          </p>
        </motion.div>
      )}

      {/* ── Equity Curve + Navigation ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
        {/* Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative rounded-[24px] border border-white/[0.07] bg-white/[0.025] p-5 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/[0.03] to-transparent pointer-events-none" />
          <div className="mb-5 flex items-center justify-between relative">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/30">Equity Curve</p>
              <p className="text-base font-bold text-white mt-0.5">Portfolio Performance</p>
            </div>
            {portfolio && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-400/10 border border-emerald-400/20">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[10px] font-bold text-emerald-400">+{portfolio.bestMonth}% Best Month</span>
              </div>
            )}
          </div>

          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={1}>
              <AreaChart data={portfolio?.equityCurve ?? []} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                <defs>
                  <linearGradient id="eqFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#22d3ee" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 10, fontFamily: 'monospace' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 10, fontFamily: 'monospace' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  width={40}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="equity" stroke="#22d3ee" fill="url(#eqFill)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {!portfolio?.equityCurve?.length && !isLoading && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <p className="text-xs text-white/15 uppercase tracking-[0.4em]">No trade history</p>
            </div>
          )}
        </motion.div>

        {/* Nav + Regime */}
        <div className="flex flex-col gap-3">
          {NAV_SECTIONS.map((s, idx) => (
            <motion.div
              key={s.href}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + idx * 0.06 }}
            >
              <Link
                href={s.href}
                className={cn(
                  'group flex items-center gap-3 p-3.5 rounded-[18px] border bg-white/[0.02] transition-all duration-300 hover:-translate-y-0.5',
                  s.border, s.bg,
                )}
              >
                <div className="w-8 h-8 rounded-xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <s.icon className="w-3.5 h-3.5 text-white/35 group-hover:text-white/70 transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white/80 group-hover:text-white transition-colors">{s.title}</p>
                  <p className="text-[10px] text-white/25 mt-0.5">{s.desc}</p>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-white/15 group-hover:text-white/50 transition-colors shrink-0" />
              </Link>
            </motion.div>
          ))}

          {/* Market Regime card */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.42 }}
            className="rounded-[18px] border border-white/[0.07] bg-white/[0.02] p-4 space-y-3 flex-1"
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/25">Market Regime</p>
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-bold text-white">{global?.marketRegime.label ?? 'Unavailable'}</p>
              <span
                className={cn(
                  'px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest border',
                  portfolio
                    ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20'
                    : 'bg-white/5 text-white/25 border-white/10',
                )}
              >
                {portfolio ? 'Live' : 'Awaiting'}
              </span>
            </div>
            {global && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-white/25 uppercase tracking-widest">Confidence</span>
                  <span className="text-white/50 font-mono">{global.marketRegime.confidence}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${global.marketRegime.confidence}%` }}
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                    className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-400"
                  />
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
