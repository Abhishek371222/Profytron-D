'use client';

import React from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { analyticsApi, type AnalyticsRange, type RiskAnalytics } from '@/lib/api/analytics';
import { cn } from '@/lib/utils';
import { Shield, AlertTriangle, TrendingDown, Target, Activity } from 'lucide-react';
import { toast } from 'sonner';
import {
  AnalyticsInfoBanner,
  AnalyticsPageHeader,
  AnalyticsRangeSelector,
  CHART_AXIS_TICK,
  CHART_GRID_STROKE,
  ChartCard,
  ChartTooltip,
  EmptyChartOverlay,
  MetricRow,
  StatCard,
} from '../_components/AnalyticsShared';
import { DashErrorState } from '@/components/dashboard/DashboardPrimitives';

const RISK_STATS: {
  key: keyof Pick<
    RiskAnalytics,
    'var95' | 'maxConsecutiveLosses' | 'largestLoss' | 'bestSingleWin' | 'avgRiskReward' | 'calmarRatio'
  >;
  label: string;
  format: (v: number) => string;
  color: string;
}[] = [
  { key: 'var95', label: 'VaR 95%', format: (v) => `$${v.toLocaleString()}`, color: 'text-destructive' },
  { key: 'maxConsecutiveLosses', label: 'Max Consec Losses', format: (v) => `${v}`, color: 'text-chart-4' },
  { key: 'largestLoss', label: 'Largest Loss', format: (v) => `$${v.toLocaleString()}`, color: 'text-destructive' },
  { key: 'bestSingleWin', label: 'Best Single Win', format: (v) => `$${v.toLocaleString()}`, color: 'text-chart-3' },
  { key: 'avgRiskReward', label: 'Avg Risk / Reward', format: (v) => `${v}`, color: 'text-chart-5' },
  { key: 'calmarRatio', label: 'Calmar Ratio', format: (v) => `${v}`, color: 'text-primary' },
];

export default function RiskAnalyticsPage() {
  const queryClient = useQueryClient();
  const [range, setRange] = React.useState<AnalyticsRange>('1m');

  const riskQuery = useQuery({
    queryKey: ['analytics', 'risk', range],
    queryFn: () => analyticsApi.getRisk(range),
    staleTime: 120_000,
    refetchOnWindowFocus: false,
  });

  const risk = riskQuery.data;
  const hasData = Boolean(risk?.drawdownCurve?.length);

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

  if (riskQuery.isLoading) {
    return (
      <div className="space-y-5 pb-8 animate-pulse">
        <div className="dashboard-card h-20" />
        <div className="dashboard-card h-10 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="dashboard-card h-24" />
          ))}
        </div>
        <div className="dashboard-card h-64" />
      </div>
    );
  }

  if (riskQuery.isError) {
    return (
      <div className="space-y-5 pb-8">
        <AnalyticsPageHeader
          title="Risk Radar"
          description="Scenario-aware drawdown tracking, exposure pressure, and capital protection intelligence."
          icon={Shield}
          iconBg="bg-destructive/10 text-destructive"
          onRefresh={refreshData}
        />
        <DashErrorState message="Couldn't load risk analytics." onRetry={refreshData} />
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-8">
      <AnalyticsPageHeader
        title="Risk Radar"
        description="Scenario-aware drawdown tracking, exposure pressure, and capital protection intelligence."
        icon={Shield}
        iconBg="bg-destructive/10 text-destructive"
        onRefresh={refreshData}
      />

      <AnalyticsRangeSelector range={range} onChange={setRange} accent="destructive" />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="VaR 95%"
          value={risk ? `$${risk.var95.toLocaleString()}` : '—'}
          icon={AlertTriangle}
          iconBg="bg-destructive/10 text-destructive"
          valueClass="text-destructive"
        />
        <StatCard
          label="Max Drawdown"
          value={risk?.drawdownCurve?.length ? `${Math.max(...risk.drawdownCurve.map((d) => d.val)).toFixed(1)}%` : '—'}
          icon={TrendingDown}
          iconBg="bg-destructive/10 text-destructive"
          valueClass="text-destructive"
          delay={0.05}
        />
        <StatCard
          label="Calmar Ratio"
          value={risk ? risk.calmarRatio : '—'}
          icon={Target}
          iconBg="bg-primary/10 text-primary"
          valueClass="text-primary"
          delay={0.1}
        />
        <StatCard
          label="Avg Risk / Reward"
          value={risk ? risk.avgRiskReward : '—'}
          icon={Activity}
          iconBg="bg-chart-5/10 text-chart-5"
          valueClass="text-chart-5"
          delay={0.15}
        />
      </div>

      {!hasData && !riskQuery.isLoading && (
        <AnalyticsInfoBanner message="Risk metrics populate once closed trades exist in your account history. Connecting MT5 alone does not create these values." />
      )}

      <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
        <ChartCard eyebrow="Drawdown" title="Drawdown Curve" delay={0.1}>
          <div className="h-[300px] relative">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <AreaChart data={risk?.drawdownCurve ?? []} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="riskFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-bear)" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="var(--chart-bear)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} vertical={false} />
                <XAxis dataKey="time" tick={CHART_AXIS_TICK} axisLine={false} tickLine={false} />
                <YAxis tick={CHART_AXIS_TICK} axisLine={false} tickLine={false} width={44} />
                <Tooltip content={<ChartTooltip formatter={(v) => `${Number(v).toFixed(2)}%`} />} />
                <Area
                  type="monotone"
                  dataKey="val"
                  stroke="var(--chart-bear)"
                  fill="url(#riskFill)"
                  strokeWidth={2}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
            {!hasData && !riskQuery.isLoading && (
              <EmptyChartOverlay
                title="No drawdown data"
                description="Drawdown curve appears after closed trades are recorded."
              />
            )}
          </div>
        </ChartCard>

        <ChartCard eyebrow="Risk Metrics" title="Core Risk Stats" delay={0.15}>
          <div className="space-y-2">
            {RISK_STATS.map(({ key, label, format, color }) => {
              const val = risk ? risk[key] : null;
              return (
                <MetricRow
                  key={key}
                  label={label}
                  value={val !== null && val !== undefined ? format(val) : '—'}
                  valueClass={val !== null && val !== undefined ? color : 'text-muted-foreground'}
                />
              );
            })}
            {!risk && !riskQuery.isLoading && (
              <div className="flex items-center gap-2 mt-3 px-3 py-2 rounded-xl border border-[color-mix(in_srgb,var(--info)_30%,var(--card-border))] bg-[color-mix(in_srgb,var(--info)_10%,transparent)]">
                <AlertTriangle className="h-3.5 w-3.5 text-[var(--info)] shrink-0" />
                <p className="text-xs text-foreground/80">No risk statistics yet.</p>
              </div>
            )}
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
