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
import { useAuthStore } from '@/lib/stores/useAuthStore';

const RISK_STATS: {
  key: keyof Pick<
    RiskAnalytics,
    'var95' | 'maxConsecutiveLosses' | 'largestLoss' | 'bestSingleWin' | 'avgRiskReward' | 'calmarRatio'
  >;
  label: string;
  format: (v: number) => string;
  color: string;
}[] = [
  {
    key: 'var95',
    label: 'VaR 95%',
    format: (v) =>
      `$${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    color: 'text-destructive',
  },
  { key: 'maxConsecutiveLosses', label: 'Max Consec Losses', format: (v) => `${v}`, color: 'text-chart-4' },
  {
    key: 'largestLoss',
    label: 'Largest Loss',
    format: (v) =>
      `$${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    color: 'text-destructive',
  },
  {
    key: 'bestSingleWin',
    label: 'Best Single Win',
    format: (v) =>
      `$${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    color: 'text-chart-3',
  },
  {
    key: 'avgRiskReward',
    label: 'Avg Risk / Reward',
    format: (v) => v.toFixed(2),
    color: 'text-chart-5',
  },
  {
    key: 'calmarRatio',
    label: 'Calmar Ratio',
    format: (v) => v.toFixed(2),
    color: 'text-primary',
  },
];

export default function RiskAnalyticsPage() {
  const queryClient = useQueryClient();
  const [range, setRange] = React.useState<AnalyticsRange>('1m');
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isHydrating = useAuthStore((s) => s.isHydrating);
  const accessToken = useAuthStore((s) => s.accessToken);
  const sessionReady = isAuthenticated && !isHydrating && Boolean(accessToken);

  const riskQuery = useQuery({
    queryKey: ['analytics', 'risk', range],
    queryFn: () => analyticsApi.getRisk(range),
    staleTime: 120_000,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    enabled: sessionReady,
  });

  const risk =
    riskQuery.data?.source === 'metaapi' || riskQuery.data?.source === 'empty'
      ? riskQuery.data
      : undefined;
  const maxDrawdownPct =
    risk?.maxDrawdown != null && risk.maxDrawdown > 0
      ? risk.maxDrawdown
      : risk?.drawdownCurve?.length
        ? Math.max(...risk.drawdownCurve.map((d) => d.val))
        : null;
  const hasData = Boolean(
    risk?.source === 'metaapi' &&
      ((risk.drawdownCurve?.length ?? 0) > 1 ||
        risk.bestSingleWin > 0 ||
        risk.largestLoss > 0 ||
        risk.maxConsecutiveLosses > 0),
  );

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

  if (riskQuery.isPending || (riskQuery.isFetching && !risk)) {
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
          value={
            risk && hasData
              ? `$${risk.var95.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : '—'
          }
          icon={AlertTriangle}
          iconBg="bg-destructive/10 text-destructive"
          valueClass="text-destructive"
        />
        <StatCard
          label="Max Drawdown"
          value={hasData && maxDrawdownPct != null ? `${maxDrawdownPct.toFixed(1)}%` : '—'}
          icon={TrendingDown}
          iconBg="bg-destructive/10 text-destructive"
          valueClass="text-destructive"
          delay={0.05}
        />
        <StatCard
          label="Calmar Ratio"
          value={risk && hasData ? risk.calmarRatio.toFixed(2) : '—'}
          icon={Target}
          iconBg="bg-primary/10 text-primary"
          valueClass="text-primary"
          delay={0.1}
        />
        <StatCard
          label="Avg Risk / Reward"
          value={risk && hasData ? risk.avgRiskReward.toFixed(2) : '—'}
          icon={Activity}
          iconBg="bg-chart-5/10 text-chart-5"
          valueClass="text-chart-5"
          delay={0.15}
        />
      </div>

      {!hasData && !riskQuery.isLoading && (
        <AnalyticsInfoBanner message="Risk metrics populate once closed trades exist in your connected account history." />
      )}

      <div className="grid gap-3 lg:grid-cols-[2fr_1fr]">
        <ChartCard eyebrow="Drawdown" title="Drawdown Curve" delay={0.1}>
          <div className="h-[240px] relative">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{ width: 400, height: 250 }}>
              <AreaChart data={risk?.drawdownCurve ?? []} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="riskFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-bear)" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="var(--chart-bear)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} vertical={false} />
                <XAxis
                  dataKey="time"
                  tick={CHART_AXIS_TICK}
                  axisLine={false}
                  tickLine={false}
                  minTickGap={36}
                  tickFormatter={(v) => {
                    const d = new Date(Number(v));
                    if (Number.isNaN(d.getTime())) return '';
                    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                  }}
                />
                <YAxis
                  tick={CHART_AXIS_TICK}
                  axisLine={false}
                  tickLine={false}
                  width={44}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  content={
                    <ChartTooltip
                      formatter={(v) => `${Number(v).toFixed(2)}% DD`}
                    />
                  }
                />
                <Area
                  type="monotone"
                  dataKey="val"
                  stroke="var(--chart-bear)"
                  fill="url(#riskFill)"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
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
              const val = risk && hasData ? risk[key] : null;
              return (
                <MetricRow
                  key={key}
                  label={label}
                  value={val !== null && val !== undefined ? format(val) : '—'}
                  valueClass={val !== null && val !== undefined ? color : 'text-muted-foreground'}
                />
              );
            })}
            {!hasData && !riskQuery.isLoading && (
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
