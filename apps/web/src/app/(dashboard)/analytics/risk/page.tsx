'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { analyticsApi, type AnalyticsRange } from '@/lib/api/analytics';
import { cn } from '@/lib/utils';
import { RefreshCcw, Shield, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

const RANGE_OPTIONS: AnalyticsRange[] = ['1d', '1w', '1m', '3m', '1y', 'all'];

const RISK_STATS = [
  { key: 'var95', label: 'VaR 95%', format: (v: number) => `$${v.toLocaleString()}`, color: 'text-rose-400' },
  { key: 'maxConsecutiveLosses', label: 'Max Consec Losses', format: (v: number) => `${v}`, color: 'text-amber-400' },
  { key: 'largestLoss', label: 'Largest Loss', format: (v: number) => `$${v.toLocaleString()}`, color: 'text-rose-400' },
  { key: 'bestSingleWin', label: 'Best Single Win', format: (v: number) => `$${v.toLocaleString()}`, color: 'text-emerald-400' },
  { key: 'avgRiskReward', label: 'Avg Risk / Reward', format: (v: number) => `${v}`, color: 'text-cyan-400' },
  { key: 'calmarRatio', label: 'Calmar Ratio', format: (v: number) => `${v}`, color: 'text-violet-400' },
];

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-2xl border border-rose-400/25 bg-[#080d18]/95 p-3 shadow-2xl backdrop-blur-xl">
      <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/30 mb-1">{label}</p>
      <p className="text-sm font-bold text-rose-400">{Number(payload[0]?.value ?? 0).toFixed(2)}%</p>
    </div>
  );
}

export default function RiskAnalyticsPage() {
  const queryClient = useQueryClient();
  const [range, setRange] = React.useState<AnalyticsRange>('3m');

  const riskQuery = useQuery({
    queryKey: ['analytics', 'risk', range],
    queryFn: () => analyticsApi.getRisk(range),
    staleTime: 120_000,
    refetchInterval: 20_000,
  });

  const risk = riskQuery.data;

  React.useEffect(() => {
    if (riskQuery.isError) {
      toast.error('Risk analytics unavailable', {
        description: 'Risk values appear only after real closed trades exist.',
      });
    }
  }, [riskQuery.isError]);

  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: ['analytics', 'risk'] });
    toast.success('Risk refreshed');
  };

  return (
    <div className="space-y-5 pb-10">
      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[26px] border border-rose-500/20 bg-gradient-to-br from-rose-500/[0.05] to-transparent p-5 md:p-6"
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-rose-400/40 to-transparent" />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-2xl bg-rose-400/10 border border-rose-400/20 flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Risk Radar</h1>
              <p className="text-sm text-white/40 mt-0.5">
                Scenario-aware drawdown tracking, exposure pressure, and capital protection intelligence.
              </p>
            </div>
          </div>
          <button
            onClick={refreshData}
            className="flex items-center gap-2 h-9 px-4 rounded-xl border border-white/[0.08] bg-white/[0.03] text-[11px] font-bold uppercase tracking-[0.2em] text-white/40 hover:text-white hover:border-white/20 transition-all"
          >
            <RefreshCcw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {RANGE_OPTIONS.map((option) => (
            <button
              key={option}
              onClick={() => setRange(option)}
              className={cn(
                'px-3.5 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-[0.2em] border transition-all duration-300',
                range === option
                  ? 'bg-rose-400/15 text-rose-400 border-rose-400/40 shadow-[0_0_12px_rgba(251,113,133,0.15)]'
                  : 'bg-white/[0.03] text-white/30 border-white/[0.06] hover:text-white/60 hover:border-white/15',
              )}
            >
              {option}
            </button>
          ))}
        </div>
      </motion.div>

      {/* ── Charts + Stats ── */}
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        {/* Drawdown Curve */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative rounded-[22px] border border-white/[0.07] bg-white/[0.025] p-5 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-rose-500/[0.04] to-transparent pointer-events-none" />
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/30 mb-0.5">Drawdown</p>
          <p className="text-base font-bold text-white mb-4">Drawdown Curve</p>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={1}>
              <AreaChart data={risk?.drawdownCurve ?? []} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="riskFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fb7185" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#fb7185" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="time" tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 10 }} axisLine={false} tickLine={false} width={35} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="val" stroke="#fb7185" fill="url(#riskFill)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          {!riskQuery.isLoading && !risk && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <p className="text-xs text-white/15 uppercase tracking-[0.4em]">No drawdown data</p>
            </div>
          )}
        </motion.div>

        {/* Risk Stats */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-[22px] border border-white/[0.07] bg-white/[0.025] p-5 space-y-3"
        >
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/30 mb-0.5">Risk Metrics</p>
            <p className="text-base font-bold text-white">Core Risk Stats</p>
          </div>
          <div className="space-y-2.5 mt-4">
            {RISK_STATS.map(({ key, label, format, color }) => {
              const val = risk ? (risk as any)[key] : null;
              return (
                <div
                  key={key}
                  className="flex items-center justify-between p-3 rounded-[14px] border border-white/[0.05] bg-white/[0.02] hover:border-white/10 transition-all"
                >
                  <span className="text-[11px] font-semibold text-white/35 uppercase tracking-widest">{label}</span>
                  <span className={cn('text-sm font-bold', val !== null ? color : 'text-white/20')}>
                    {val !== null ? format(val) : '—'}
                  </span>
                </div>
              );
            })}
            {!risk && !riskQuery.isLoading && (
              <div className="flex items-center gap-2 mt-3 px-3 py-2 rounded-xl border border-amber-400/15 bg-amber-400/5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <p className="text-[10px] text-amber-300/70">No risk statistics yet.</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
