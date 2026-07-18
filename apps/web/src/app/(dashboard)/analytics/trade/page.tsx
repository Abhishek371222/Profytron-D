'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { analyticsApi, type AnalyticsRange } from '@/lib/api/analytics';
import { cn } from '@/lib/utils';
import { Activity, TrendingUp, TrendingDown, Target, AlertTriangle } from 'lucide-react';
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

function PieTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number }>;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-[var(--card-border)] bg-card px-3 py-2 shadow-lg">
      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">{payload[0]?.name}</p>
      <p className="text-sm font-bold text-primary tabular-nums">{payload[0]?.value}</p>
    </div>
  );
}

export default function TradeAnalyticsPage() {
  const queryClient = useQueryClient();
  const [range, setRange] = React.useState<AnalyticsRange>('1m');
  const sessionReady = useAuthStore((s) => s.sessionReady);

  const tradeQuery = useQuery({
    queryKey: ['analytics', 'trades', range],
    queryFn: () => analyticsApi.getTrades(range),
    staleTime: 120_000,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    enabled: sessionReady,
  });

  const trade =
    tradeQuery.data?.source === 'database' ||
    tradeQuery.data?.source === 'snapshot' ||
    tradeQuery.data?.source === 'empty'
      ? tradeQuery.data
      : undefined;
  const hasData = Boolean(
    (trade?.symbolPerformance?.length ?? 0) > 0 ||
      (trade?.winLoss?.some((w) => w.value > 0) ?? false) ||
      (trade?.distribution?.some((d) => d.count > 0) ?? false),
  );
  const maxSymbolPnl = Math.max(
    ...(trade?.symbolPerformance ?? []).map((s) => Math.abs(s.pnl)),
    1,
  );

  const wins =
    trade?.winLoss?.find((w) => /^(win|wins)$/i.test(w.name))?.value ?? 0;
  const losses =
    trade?.winLoss?.find((w) => /^(loss|losses)$/i.test(w.name))?.value ?? 0;
  const total = wins + losses;
  const winRate = total > 0 ? ((wins / total) * 100).toFixed(1) : null;

  React.useEffect(() => {
    if (tradeQuery.isError) {
      toast.error('Trade analytics unavailable', {
        description: 'Trade data appears after real closed trades are recorded.',
      });
    }
  }, [tradeQuery.isError]);

  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: ['analytics', 'trades'] });
    toast.success('Trade analytics refreshed');
  };

  if (tradeQuery.isPending || (tradeQuery.isFetching && !trade)) {
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

  if (tradeQuery.isError) {
    return (
      <div className="space-y-5 pb-8">
        <AnalyticsPageHeader
          title="Trade Forensics"
          description="Distribution analytics, win-loss geometry, and symbol-level trade quality."
          icon={Activity}
          iconBg="bg-chart-5/10 text-chart-5"
          onRefresh={refreshData}
        />
        <DashErrorState message="Couldn't load trade analytics." onRetry={refreshData} />
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-8">
      <AnalyticsPageHeader
        title="Trade Forensics"
        description="Distribution analytics, win-loss geometry, and symbol-level trade quality."
        icon={Activity}
        iconBg="bg-chart-5/10 text-chart-5"
        onRefresh={refreshData}
      />

      <AnalyticsRangeSelector range={range} onChange={setRange} accent="primary" />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Wins"
          value={hasData ? wins : '?'}
          icon={TrendingUp}
          iconBg="bg-chart-3/10 text-chart-3"
          valueClass="text-chart-3"
        />
        <StatCard
          label="Losses"
          value={hasData ? losses : '?'}
          icon={TrendingDown}
          iconBg="bg-destructive/10 text-destructive"
          valueClass="text-destructive"
          delay={0.05}
        />
        <StatCard
          label="Win Rate"
          value={winRate ? `${winRate}%` : '?'}
          icon={Target}
          iconBg="bg-primary/10 text-primary"
          valueClass="text-primary"
          delay={0.1}
        />
        <StatCard
          label="Symbols Traded"
          value={hasData ? (trade?.symbolPerformance?.length ?? 0) : '?'}
          icon={Activity}
          iconBg="bg-chart-5/10 text-chart-5"
          valueClass="text-chart-5"
          delay={0.15}
        />
      </div>

      {!hasData && !tradeQuery.isLoading && (
        <AnalyticsInfoBanner message="Trade analytics populate once closed trades exist in your connected account history." />
      )}

      <div className="grid gap-3 lg:grid-cols-[3fr_2fr]">
        <ChartCard eyebrow="Distribution" title="Earnings Distribution" delay={0.1}>
          <div className="h-[240px] relative">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={1} initialDimension={{ width: 400, height: 240 }}>
              <BarChart data={trade?.distribution ?? []} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} vertical={false} />
                <XAxis dataKey="range" tick={CHART_AXIS_TICK} axisLine={false} tickLine={false} interval={0} angle={-20} textAnchor="end" height={48} />
                <YAxis allowDecimals={false} tick={CHART_AXIS_TICK} axisLine={false} tickLine={false} width={36} />
                <Tooltip content={<ChartTooltip formatter={(v) => `${v} trades`} />} />
                <Bar dataKey="count" radius={[5, 5, 0, 0]} maxBarSize={48} isAnimationActive={false}>
                  {(trade?.distribution ?? []).map((row, i) => (
                    <Cell
                      key={i}
                      fill={
                        String(row.range).startsWith('-') || String(row.range).startsWith('<')
                          ? 'var(--chart-bear)'
                          : 'var(--chart-bull)'
                      }
                      fillOpacity={0.85}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            {!trade?.distribution?.length && !tradeQuery.isLoading && (
              <EmptyChartOverlay
                title="No distribution data"
                description="Earnings distribution appears after closed trades are recorded."
              />
            )}
          </div>
        </ChartCard>

        <ChartCard eyebrow="Win vs Loss" title="Trade Outcome Split" delay={0.15}>
          <div className="h-[240px] relative flex items-center justify-center">
            {hasData && (trade?.winLoss ?? []).some((w) => w.value > 0) ? (
              <>
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={1} initialDimension={{ width: 400, height: 240 }}>
                  <PieChart>
                    <Pie
                      data={trade!.winLoss}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="46%"
                      innerRadius={58}
                      outerRadius={88}
                      paddingAngle={4}
                      strokeWidth={0}
                      isAnimationActive={false}
                    >
                      {trade!.winLoss.map((entry, idx) => (
                        <Cell
                          key={`${entry.name}-${idx}`}
                          fill={
                            /win/i.test(entry.name)
                              ? 'var(--chart-bull)'
                              : 'var(--chart-bear)'
                          }
                          fillOpacity={0.9}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute bottom-0 inset-x-0 flex items-center justify-center gap-5 pb-1">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-chart-3" />
                    <span className="text-xs text-muted-foreground font-medium">
                      Win ({wins})
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-destructive" />
                    <span className="text-xs text-muted-foreground font-medium">
                      Loss ({losses})
                    </span>
                  </div>
                </div>
              </>
            ) : (
              !tradeQuery.isLoading && (
                <EmptyChartOverlay title="No outcome data" description="Win/loss split appears after trades close." />
              )
            )}
          </div>
        </ChartCard>
      </div>

      <ChartCard eyebrow="Symbol Performance" title="Per-Symbol Breakdown" delay={0.2}>
        {(trade?.symbolPerformance ?? []).length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {trade!.symbolPerformance.map((item) => {
              const isPos = item.pnl >= 0;
              return (
                <div
                  key={item.symbol}
                  className={cn(
                    'rounded-xl border p-4 transition-colors',
                    isPos
                      ? 'border-chart-3/20 bg-chart-3/5 hover:border-chart-3/35'
                      : 'border-destructive/20 bg-destructive/5 hover:border-destructive/35',
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-bold text-foreground tracking-wide">{item.symbol}</p>
                    <span
                      className={cn(
                        'text-[10px] font-bold uppercase px-2 py-0.5 rounded-full',
                        isPos ? 'bg-chart-3/10 text-chart-3' : 'bg-destructive/10 text-destructive',
                      )}
                    >
                      {isPos ? 'Profit' : 'Loss'}
                    </span>
                  </div>
                  <p className={cn('text-lg font-bold tabular-nums', isPos ? 'text-chart-3' : 'text-destructive')}>
                    {isPos ? '+' : ''}$
                    {item.pnl.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{item.trades} trades</p>
                  <div className="h-1.5 rounded-full bg-primary/10 overflow-hidden mt-3">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${Math.min(100, (Math.abs(item.pnl) / maxSymbolPnl) * 100)}%`,
                      }}
                      transition={{ delay: 0.3, duration: 0.8, ease: 'easeOut' }}
                      className={cn('h-full rounded-full', isPos ? 'bg-chart-3' : 'bg-destructive')}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          !tradeQuery.isLoading && (
            <div className="flex w-fit max-w-full items-center gap-2 px-3 py-2 rounded-xl border border-[color-mix(in_srgb,var(--info)_30%,var(--card-border))] bg-[color-mix(in_srgb,var(--info)_10%,transparent)]">
              <AlertTriangle className="h-3.5 w-3.5 text-[var(--info)] shrink-0" />
              <p className="text-xs text-foreground/80">No symbol data yet. Values appear after closed trades are recorded.</p>
            </div>
          )
        )}
      </ChartCard>
    </div>
  );
}
