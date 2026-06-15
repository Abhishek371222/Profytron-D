'use client';

import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { analyticsApi, type AnalyticsRange } from '@/lib/api/analytics';
import { cn } from '@/lib/utils';
import { BarChart2, TrendingUp, Target, Zap } from 'lucide-react';
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
  StatCard,
} from '../_components/AnalyticsShared';

const MONTHS_BY_RANGE: Record<AnalyticsRange, number> = {
  '1d': 1,
  '1w': 1,
  '1m': 2,
  '3m': 3,
  '1y': 6,
  all: Number.POSITIVE_INFINITY,
};

export default function PerformanceAnalyticsPage() {
  const queryClient = useQueryClient();
  const [range, setRange] = React.useState<AnalyticsRange>('1m');

  const strategyQuery = useQuery({
    queryKey: ['analytics', 'strategy-comparison', range],
    queryFn: () => analyticsApi.getStrategyComparison(range),
    staleTime: 120_000,
    refetchOnWindowFocus: false,
  });

  const monthlyQuery = useQuery({
    queryKey: ['analytics', 'monthly-returns'],
    queryFn: () => analyticsApi.getMonthlyReturns(),
    staleTime: 300_000,
    refetchOnWindowFocus: false,
  });

  const strategy = strategyQuery.data;
  const strategyChartData = React.useMemo(
    () => (strategy?.strategies ?? []).map((item) => ({ ...item, netPnlK: Number((item.netPnl / 1000).toFixed(2)) })),
    [strategy],
  );

  const monthly = React.useMemo(() => {
    if (!monthlyQuery.data) return { months: [] };
    const monthLimit = MONTHS_BY_RANGE[range];
    return {
      ...monthlyQuery.data,
      months: Number.isFinite(monthLimit) ? monthlyQuery.data.months.slice(-monthLimit) : monthlyQuery.data.months,
    };
  }, [monthlyQuery.data, range]);

  const totalStrategies = strategy?.strategies.length ?? 0;
  const avgWinRate =
    totalStrategies > 0
      ? strategy!.strategies.reduce((s, x) => s + x.winRate, 0) / totalStrategies
      : 0;
  const totalNetPnl = strategy?.strategies.reduce((s, x) => s + x.netPnl, 0) ?? 0;
  const bestStrategy = strategy?.strategies.reduce(
    (best, s) => (s.netPnl > (best?.netPnl ?? -Infinity) ? s : best),
    strategy?.strategies[0],
  );
  const hasData = strategyChartData.length > 0 || monthly.months.length > 0;

  React.useEffect(() => {
    if (strategyQuery.isError || monthlyQuery.isError) {
      toast.error('Performance analytics unavailable', {
        description: 'Values populate after real closed trades are stored.',
      });
    }
  }, [monthlyQuery.isError, strategyQuery.isError]);

  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: ['analytics', 'strategy-comparison'] });
    queryClient.invalidateQueries({ queryKey: ['analytics', 'monthly-returns'] });
    toast.success('Performance refreshed');
  };

  return (
    <div className="space-y-5 pb-8">
      <AnalyticsPageHeader
        title="Performance Lab"
        description="Strategy comparisons, monthly return rhythm, and production-readiness scores."
        icon={BarChart2}
        iconBg="bg-chart-3/10 text-chart-3"
        onRefresh={refreshData}
      />

      <AnalyticsRangeSelector range={range} onChange={setRange} accent="chart-3" />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total Net PnL"
          value={`$${totalNetPnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={TrendingUp}
          iconBg="bg-chart-3/10 text-chart-3"
          valueClass={totalNetPnl >= 0 ? 'text-chart-3' : 'text-destructive'}
        />
        <StatCard
          label="Avg Win Rate"
          value={`${avgWinRate.toFixed(1)}%`}
          icon={Target}
          iconBg="bg-primary/10 text-primary"
          valueClass="text-primary"
          delay={0.05}
        />
        <StatCard
          label="Strategies"
          value={totalStrategies || '—'}
          icon={BarChart2}
          iconBg="bg-blue-500/10 text-blue-600"
          valueClass="text-blue-600"
          delay={0.1}
        />
        <StatCard
          label="Best Performer"
          value={bestStrategy ? bestStrategy.name.slice(0, 12) : '—'}
          icon={Zap}
          iconBg="bg-chart-4/10 text-chart-4"
          valueClass="text-foreground"
          delay={0.15}
        />
      </div>

      {!hasData && !strategyQuery.isLoading && !monthlyQuery.isLoading && (
        <AnalyticsInfoBanner message="Performance metrics populate once closed trades exist in your account history. Connecting MT5 alone does not create these values." />
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <ChartCard
          eyebrow="Strategy Performance"
          title="Performance Mix"
          subtitle="Bars = net PnL (k) · Line = win rate %"
          delay={0.1}
        >
          <div className="h-[280px] relative">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <ComposedChart data={strategyChartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} vertical={false} />
                <XAxis dataKey="name" tick={CHART_AXIS_TICK} axisLine={false} tickLine={false} />
                <YAxis
                  yAxisId="left"
                  tick={CHART_AXIS_TICK}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v}k`}
                  width={40}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[0, 100]}
                  tick={CHART_AXIS_TICK}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v}%`}
                  width={40}
                />
                <Tooltip
                  content={
                    <ChartTooltip
                      formatter={(v, n) => (n === 'netPnlK' ? `$${v}k` : `${Number(v).toFixed(1)}%`)}
                    />
                  }
                />
                <Bar yAxisId="left" dataKey="netPnlK" fill="#16A34A" radius={[6, 6, 0, 0]} opacity={0.85} />
                <Line
                  yAxisId="right"
                  dataKey="winRate"
                  stroke="#3B5BFF"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#3B5BFF' }}
                  activeDot={{ r: 5 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
            {strategyChartData.length === 0 && !strategyQuery.isLoading && (
              <EmptyChartOverlay
                title="No strategy data"
                description="Strategy comparisons appear after trades are linked to strategies."
              />
            )}
          </div>
        </ChartCard>

        <ChartCard
          eyebrow="Monthly Returns"
          title="Return Clarity"
          subtitle="Green = positive · Red = negative months"
          delay={0.15}
        >
          <div className="h-[280px] relative">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart data={monthly.months} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} vertical={false} />
                <XAxis dataKey="month" tick={CHART_AXIS_TICK} axisLine={false} tickLine={false} />
                <YAxis
                  tick={CHART_AXIS_TICK}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v}%`}
                  width={40}
                />
                <ReferenceLine y={0} stroke="rgba(15,23,42,0.12)" strokeDasharray="4 4" />
                <Tooltip content={<ChartTooltip formatter={(v) => `${Number(v).toFixed(2)}%`} />} />
                <Bar dataKey="returnPct" radius={[6, 6, 0, 0]}>
                  {monthly.months.map((item) => (
                    <Cell
                      key={`${item.month}-${item.year}`}
                      fill={item.returnPct >= 0 ? '#16A34A' : '#DC2626'}
                      fillOpacity={0.85}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            {monthly.months.length === 0 && !monthlyQuery.isLoading && (
              <EmptyChartOverlay
                title="No monthly data"
                description="Monthly returns appear after closed trades are recorded."
              />
            )}
          </div>
        </ChartCard>
      </div>

      {(strategy?.strategies ?? []).length > 0 && (
        <ChartCard eyebrow="Strategy Scorecard" title="All Strategies Overview" delay={0.2}>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {strategy!.strategies.map((s) => (
              <div
                key={s.id}
                className="rounded-xl border border-[var(--card-border)] bg-muted/20 p-4 space-y-2 hover:border-primary/20 transition-colors"
              >
                <p className="text-sm font-bold text-foreground truncate">{s.name}</p>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Win Rate</span>
                    <span className="text-chart-3 font-bold">{s.winRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Trades</span>
                    <span className="text-foreground font-bold">{s.trades}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Net PnL</span>
                    <span className={cn('font-bold', s.netPnl >= 0 ? 'text-chart-3' : 'text-destructive')}>
                      {s.netPnl >= 0 ? '+' : ''}${s.netPnl.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="h-1.5 rounded-full bg-primary/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${Math.min(100, s.winRate)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </ChartCard>
      )}
    </div>
  );
}
