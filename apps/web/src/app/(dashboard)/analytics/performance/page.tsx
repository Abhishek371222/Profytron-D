'use client';

import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
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
import { DashErrorState } from '@/components/dashboard/DashboardPrimitives';
import { useAuthStore } from '@/lib/stores/useAuthStore';

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
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isHydrating = useAuthStore((s) => s.isHydrating);
  const accessToken = useAuthStore((s) => s.accessToken);
  const sessionReady = isAuthenticated && !isHydrating && Boolean(accessToken);

  const portfolioQuery = useQuery({
    queryKey: ['analytics', 'portfolio', range],
    queryFn: () => analyticsApi.getPortfolio(range),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    enabled: sessionReady,
  });

  const botQuery = useQuery({
    queryKey: ['analytics', 'strategy-comparison', range],
    queryFn: () => analyticsApi.getStrategyComparison(range),
    staleTime: 120_000,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    enabled: sessionReady,
  });

  const monthlyQuery = useQuery({
    queryKey: ['analytics', 'monthly-returns'],
    queryFn: () => analyticsApi.getMonthlyReturns(),
    staleTime: 300_000,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    enabled: sessionReady,
  });

  const portfolio =
    portfolioQuery.data?.source === 'metaapi' || portfolioQuery.data?.source === 'empty'
      ? portfolioQuery.data
      : undefined;
  const bots =
    botQuery.data?.source === 'metaapi' || botQuery.data?.source === 'empty'
      ? botQuery.data
      : undefined;
  const botChartData = React.useMemo(
    () =>
      (bots?.strategies ?? []).map((item) => ({
        ...item,
        // Dollar scale for small accounts (not thousands).
        netPnlBar: Number(item.netPnl.toFixed(2)),
      })),
    [bots],
  );

  const monthly = React.useMemo(() => {
    if (!monthlyQuery.data) return { months: [] as NonNullable<typeof monthlyQuery.data>['months'] };
    const monthLimit = MONTHS_BY_RANGE[range];
    return {
      ...monthlyQuery.data,
      months: Number.isFinite(monthLimit)
        ? monthlyQuery.data.months.slice(-monthLimit)
        : monthlyQuery.data.months,
    };
  }, [monthlyQuery.data, range]);

  const totalBots = bots?.strategies.length ?? 0;
  const totalNetPnl = Number(portfolio?.totalProfit ?? 0);
  const avgWinRate = Number(portfolio?.winRate ?? 0);
  const bestBot = bots?.strategies.reduce(
    (best, s) => (s.netPnl > (best?.netPnl ?? -Infinity) ? s : best),
    bots?.strategies[0],
  );
  const hasData =
    (portfolio?.totalTrades ?? 0) > 0 ||
    botChartData.length > 0 ||
    monthly.months.length > 0;

  React.useEffect(() => {
    if (portfolioQuery.isError && botQuery.isError && monthlyQuery.isError) {
      toast.error('Performance analytics unavailable', {
        description: 'Values populate after real closed trades are stored.',
      });
    }
  }, [monthlyQuery.isError, botQuery.isError, portfolioQuery.isError]);

  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: ['analytics', 'portfolio'] });
    queryClient.invalidateQueries({ queryKey: ['analytics', 'strategy-comparison'] });
    queryClient.invalidateQueries({ queryKey: ['analytics', 'monthly-returns'] });
    toast.success('Performance refreshed');
  };

  const isLoading =
    portfolioQuery.isPending ||
    botQuery.isPending ||
    monthlyQuery.isPending ||
    (portfolioQuery.isFetching && !portfolio) ||
    (botQuery.isFetching && !bots);
  const isError =
    portfolioQuery.isError && botQuery.isError && monthlyQuery.isError;

  if (isLoading) {
    return (
      <div className="space-y-4 pb-8 animate-pulse">
        <div className="dashboard-card h-16" />
        <div className="dashboard-card h-10 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="dashboard-card h-20" />
          ))}
        </div>
        <div className="dashboard-card h-56" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-4 pb-8">
        <AnalyticsPageHeader
          title="Performance Lab"
          description="Bot comparisons, monthly return rhythm, and production-readiness scores."
          icon={BarChart2}
          iconBg="bg-chart-3/10 text-chart-3"
          onRefresh={refreshData}
        />
        <DashErrorState message="Couldn't load performance analytics." onRetry={refreshData} />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-8">
      <AnalyticsPageHeader
        title="Performance Lab"
        description="Bot comparisons, monthly return rhythm, and production-readiness scores."
        icon={BarChart2}
        iconBg="bg-chart-3/10 text-chart-3"
        onRefresh={refreshData}
      />

      <AnalyticsRangeSelector range={range} onChange={setRange} accent="chart-3" />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
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
          label="Bots"
          value={totalBots || '?'}
          icon={BarChart2}
          iconBg="bg-chart-5/10 text-chart-5"
          valueClass="text-chart-5"
          delay={0.1}
        />
        <StatCard
          label="Best Performer"
          value={bestBot ? bestBot.name.slice(0, 14) : '?'}
          icon={Zap}
          iconBg="bg-chart-4/10 text-chart-4"
          valueClass="text-foreground"
          delay={0.15}
        />
      </div>

      {!hasData && (
        <AnalyticsInfoBanner message="Performance metrics populate once closed trades exist in your connected account history." />
      )}

      <div className="grid gap-3 lg:grid-cols-2">
        <ChartCard
          eyebrow="Bot Performance"
          title="Performance Mix"
          subtitle="Bars = net PnL ($)"
          delay={0.1}
        >
          <div className="h-[240px] relative">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart data={botChartData} margin={{ top: 12, right: 8, left: 0, bottom: 4 }} barCategoryGap="28%">
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} vertical={false} />
                <XAxis dataKey="name" tick={CHART_AXIS_TICK} axisLine={false} tickLine={false} />
                <YAxis
                  tick={CHART_AXIS_TICK}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `$${Number(v).toFixed(0)}`}
                  width={48}
                />
                <Tooltip
                  content={
                    <ChartTooltip
                      formatter={(v) => `$${Number(v).toFixed(2)}`}
                    />
                  }
                />
                <Bar
                  dataKey="netPnlBar"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={56}
                  isAnimationActive={false}
                >
                  {botChartData.map((row) => (
                    <Cell
                      key={row.id ?? row.name}
                      fill={row.netPnlBar >= 0 ? 'var(--chart-bull)' : 'var(--chart-bear)'}
                      fillOpacity={0.88}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            {botChartData.length === 0 && !botQuery.isLoading && (
              <EmptyChartOverlay
                title="No bot data"
                description="Symbol-level bot comparisons appear after closed trades are recorded."
              />
            )}
          </div>
        </ChartCard>

        <ChartCard
          eyebrow="Monthly Returns"
          title="Return Clarity"
          subtitle="Green = positive ? Red = negative months"
          delay={0.15}
        >
          <div className="h-[240px] relative">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart data={monthly.months} margin={{ top: 12, right: 8, left: 0, bottom: 4 }} barCategoryGap="32%">
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} vertical={false} />
                <XAxis dataKey="name" tick={CHART_AXIS_TICK} axisLine={false} tickLine={false} />
                <YAxis
                  tick={CHART_AXIS_TICK}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v}%`}
                  width={44}
                />
                <ReferenceLine y={0} stroke="var(--border)" strokeDasharray="4 4" />
                <Tooltip content={<ChartTooltip formatter={(v) => `${Number(v).toFixed(2)}%`} />} />
                <Bar dataKey="returnPct" radius={[6, 6, 0, 0]} maxBarSize={64} isAnimationActive={false}>
                  {monthly.months.map((item) => (
                    <Cell
                      key={`${item.month}-${item.year}`}
                      fill={item.returnPct >= 0 ? 'var(--chart-bull)' : 'var(--chart-bear)'}
                      fillOpacity={0.9}
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

      {(bots?.strategies ?? []).length > 0 && (
        <ChartCard eyebrow="Bot Scorecard" title="All Bots Overview" delay={0.2}>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {bots!.strategies.map((s) => (
              <div
                key={s.id}
                className="rounded-xl border border-[var(--card-border)] bg-muted/20 p-3 space-y-2 hover:border-primary/20 transition-colors"
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
