'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Activity,
  AlertTriangle,
  BadgeCheck,
  BarChart2,
  Download,
  ExternalLink,
  Shield,
  Target,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { marketplaceApi } from '@/lib/api/marketplace';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

type MetricCardProps = {
  label: string;
  value: string;
  hint: string;
  tone?: 'neutral' | 'positive' | 'negative' | 'warning';
};

function MetricCard({ label, value, hint, tone = 'neutral' }: MetricCardProps) {
  const toneClass =
    tone === 'positive'
      ? 'text-chart-3'
      : tone === 'negative'
        ? 'text-destructive'
        : tone === 'warning'
          ? 'text-chart-4'
          : 'text-foreground';

  return (
    <div className="rounded-[18px] border border-[var(--card-border)] bg-muted/25 p-4 hover:border-primary/20 transition-all">
      <p className="text-micro font-bold uppercase tracking-[0.28em] text-foreground/30">{label}</p>
      <p className={cn('mt-2 text-2xl font-bold tracking-tight', toneClass)}>{value}</p>
      <p className="mt-2 text-xs text-foreground/35 leading-relaxed">{hint}</p>
    </div>
  );
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-popover/95 p-3 shadow-2xl backdrop-blur-xl">
      <p className="text-micro font-bold uppercase tracking-[0.25em] text-foreground/30 mb-2">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-sm font-semibold" style={{ color: entry.color }}>
          {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
        </p>
      ))}
    </div>
  );
}

function metricTone(value: number, goodAbove?: number, badBelow?: number): MetricCardProps['tone'] {
  if (goodAbove != null && value >= goodAbove) return 'positive';
  if (badBelow != null && value <= badBelow) return 'negative';
  return 'neutral';
}

export function StrategyAnalyticsDashboard({ strategyId }: { strategyId: string }) {
  const [tradesPage, setTradesPage] = React.useState(1);
  const tradesLimit = 15;

  const analyticsQuery = useQuery({
    queryKey: ['marketplace-analytics', strategyId, tradesPage],
    queryFn: () =>
      marketplaceApi.getStrategyAnalytics(strategyId, { tradesPage, tradesLimit }),
    enabled: Boolean(strategyId),
    staleTime: 120_000,
  });

  const data = analyticsQuery.data;
  const analytics = data?.analytics;
  const core = analytics?.core;
  const advanced = analytics?.advanced;
  const charts = analytics?.charts;
  const verification = analytics?.verification;
  const recommendations = analytics?.recommendations;
  const tradeHistory = data?.tradeHistory;

  const equityData = React.useMemo(
    () =>
      (charts?.equityBalanceCurve ?? []).map((point: any) => ({
        ...point,
        label: point.date,
      })),
    [charts?.equityBalanceCurve],
  );

  const totalTradePages = Math.ceil((tradeHistory?.total ?? 0) / tradesLimit);

  if (analyticsQuery.isLoading) {
    return (
      <div className="premium-surface p-8 text-muted-foreground">
        Loading institutional analytics...
      </div>
    );
  }

  if (analyticsQuery.isError || !analytics) {
    return (
      <div className="rounded-3xl border border-chart-4/20 bg-chart-4/5 p-8 text-chart-4">
        Analytics unavailable for this strategy. Performance data will appear once trades are recorded.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[26px] border border-primary/20 bg-gradient-to-br from-primary/[0.06] to-transparent p-6"
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <BarChart2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Institutional Analytics</h2>
              <p className="text-sm text-foreground/40 mt-1">
                Performance, risk, verification, and execution transparency for due diligence.
              </p>
            </div>
          </div>
          {verification?.isVerified && (
            <div className="flex items-center gap-2 rounded-full border border-chart-3/30 bg-chart-3/10 px-4 py-2">
              <BadgeCheck className="w-4 h-4 text-chart-3" />
              <span className="text-caption font-bold uppercase tracking-[0.2em] text-chart-3">
                {verification.badgeLabel}
              </span>
            </div>
          )}
        </div>
      </motion.section>

      {/* Core metrics */}
      <section>
        <p className="text-micro font-bold uppercase tracking-[0.3em] text-foreground/30 mb-3">
          Core Performance & Risk
        </p>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          <MetricCard
            label="Total Return"
            value={`${core.totalReturnPct >= 0 ? '+' : ''}${core.totalReturnPct}%`}
            hint="Cumulative profit since inception relative to base equity."
            tone={metricTone(core.totalReturnPct, 5, -5)}
          />
          <MetricCard
            label="Monthly Return"
            value={`${core.monthlyReturnPct >= 0 ? '+' : ''}${core.monthlyReturnPct}%`}
            hint="Average monthly gain — sets consistency expectations."
            tone={metricTone(core.monthlyReturnPct, 2, 0)}
          />
          <MetricCard
            label="Max Drawdown"
            value={`${core.maxDrawdownPct}%`}
            hint="Largest peak-to-trough equity decline — capital preservation signal."
            tone={metricTone(-core.maxDrawdownPct, undefined, -15)}
          />
          <MetricCard
            label="Sharpe Ratio"
            value={String(core.sharpeRatio)}
            hint="Risk-adjusted return. Above 1.5 is strong; above 2.0 is exceptional."
            tone={metricTone(core.sharpeRatio, 1.5, 1)}
          />
          <MetricCard
            label="Profit Factor"
            value={String(core.profitFactor)}
            hint="Gross profits ÷ gross losses. Above 1.2 indicates healthy edge."
            tone={metricTone(core.profitFactor, 1.2, 1)}
          />
          <MetricCard
            label="Win Rate"
            value={`${core.winRate}%`}
            hint="Share of closed trades that finished profitable."
            tone="neutral"
          />
        </div>
      </section>

      {/* Advanced analytics */}
      <section className="rounded-[22px] border border-[var(--card-border)] bg-muted/20p-5">
        <p className="text-micro font-bold uppercase tracking-[0.3em] text-foreground/30 mb-1">
          Advanced Trading Analytics
        </p>
        <p className="text-base font-bold text-foreground mb-4">Execution Style & Edge Quality</p>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {[
            { label: 'Avg Trade Duration', value: advanced.avgTradeDuration, icon: Activity },
            { label: 'Profit/Loss Ratio', value: String(advanced.profitLossRatio), icon: Target },
            { label: 'Recovery Factor', value: String(advanced.recoveryFactor), icon: TrendingUp },
            { label: 'Expectancy', value: `$${advanced.expectancy.toLocaleString()}`, icon: Wallet },
            { label: 'Closed Trades', value: String(advanced.totalTrades), icon: BarChart2 },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-[16px] border border-[var(--card-border)] bg-muted/40 p-4 flex items-start gap-3"
            >
              <item.icon className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-micro font-bold uppercase tracking-[0.22em] text-foreground/30">{item.label}</p>
                <p className="mt-1 text-lg font-bold text-foreground">{item.value}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3 text-sm">
          <div className="rounded-xl border border-[var(--card-border)] bg-muted/20p-3">
            <span className="text-foreground/40">Avg Win</span>
            <span className="float-right font-semibold text-chart-3">${advanced.avgWin.toLocaleString()}</span>
          </div>
          <div className="rounded-xl border border-[var(--card-border)] bg-muted/20p-3">
            <span className="text-foreground/40">Avg Loss</span>
            <span className="float-right font-semibold text-destructive">${Math.abs(advanced.avgLoss).toLocaleString()}</span>
          </div>
          <div className="rounded-xl border border-[var(--card-border)] bg-muted/20p-3">
            <span className="text-foreground/40">Floating PnL</span>
            <span
              className={cn(
                'float-right font-semibold',
                advanced.floatingPnl >= 0 ? 'text-chart-3' : 'text-destructive',
              )}
            >
              ${advanced.floatingPnl.toLocaleString()}
            </span>
          </div>
        </div>
      </section>

      {/* Charts */}
      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-[22px] border border-[var(--card-border)] bg-muted/25 p-5">
          <p className="text-micro font-bold uppercase tracking-[0.3em] text-foreground/30">Equity vs Balance</p>
          <p className="text-base font-bold text-foreground mt-1 mb-1">Equity Curve</p>
          <p className="text-xs text-foreground/30 mb-4">
            Balance (closed PnL) vs equity (includes floating open positions).
          </p>
          <div className="h-[300px]" role="img" aria-label="Balance versus equity chart">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={1}>
              <LineChart data={equityData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  width={42}
                />
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, color: 'var(--muted-foreground)' }} />
                <Line type="monotone" dataKey="balance" name="Balance" stroke="var(--primary)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="equity" name="Equity" stroke="var(--chart-bull)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-[22px] border border-[var(--card-border)] bg-muted/25 p-5">
          <p className="text-micro font-bold uppercase tracking-[0.3em] text-foreground/30">Monthly Performance</p>
          <p className="text-base font-bold text-foreground mt-1 mb-4">Return Calendar</p>
          <div className="space-y-4">
            {(charts?.monthlyHeatmap ?? []).map((yearRow: any) => (
              <div key={yearRow.year}>
                <p className="text-xs font-bold text-foreground/40 mb-2">{yearRow.year}</p>
                <div className="grid grid-cols-12 gap-1">
                  {yearRow.months.map((month: any) => (
                    <div
                      key={`${yearRow.year}-${month.name}`}
                      title={`${month.name} ${yearRow.year}: ${month.val}%`}
                      className={cn(
                        'aspect-square rounded-md border border-[var(--card-border)] flex items-center justify-center text-micro font-bold',
                        month.val > 0
                          ? 'bg-chart-3/25 text-chart-3'
                          : month.val < 0
                            ? 'bg-destructive/25 text-destructive'
                            : 'bg-muted/30 text-foreground/20',
                      )}
                    >
                      {month.name.slice(0, 1)}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 h-[140px]" role="img" aria-label="Monthly returns chart">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={1}>
              <BarChart data={charts?.monthlyReturns ?? []} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: 'var(--muted-foreground)', fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--muted-foreground)', fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} width={32} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="returnPct" radius={[4, 4, 0, 0]}>
                  {(charts?.monthlyReturns ?? []).map((item: any, idx: number) => (
                    <Cell key={idx} fill={item.returnPct >= 0 ? 'var(--chart-bull)' : 'var(--chart-bear)'} fillOpacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* Asset distribution */}
      <section className="rounded-[22px] border border-[var(--card-border)] bg-muted/25 p-5">
        <p className="text-micro font-bold uppercase tracking-[0.3em] text-foreground/30">Volume / Asset Mix</p>
        <p className="text-base font-bold text-foreground mt-1 mb-4">Symbol Concentration</p>
        <div className="grid gap-6 lg:grid-cols-2 items-center">
          <div className="h-[260px]" role="img" aria-label="Symbol concentration chart">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={1}>
              <PieChart>
                <Pie
                  data={charts?.symbolDistribution ?? []}
                  dataKey="count"
                  nameKey="symbol"
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={105}
                  paddingAngle={3}
                  stroke="none"
                >
                  {(charts?.symbolDistribution ?? []).map((entry: any, index: number) => (
                    <Cell key={index} fill={entry.color} fillOpacity={0.85} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2">
            {(charts?.symbolDistribution ?? []).map((item: any) => (
              <div key={item.symbol} className="flex items-center justify-between rounded-xl border border-[var(--card-border)] bg-muted/20 px-4 py-2.5">
                <div className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
                  <span className="text-sm font-semibold text-foreground">{item.symbol}</span>
                </div>
                <span className="text-sm text-foreground/50">
                  {item.pct}% · {item.count} trades
                </span>
              </div>
            ))}
            {(charts?.symbolDistribution ?? []).length === 0 && (
              <p className="text-sm text-foreground/40">Symbol distribution populates from closed trade history.</p>
            )}
          </div>
        </div>
      </section>

      {/* Verification hub */}
      <section className="rounded-[22px] border border-chart-3/15 bg-chart-3/[0.03] p-5">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-5 h-5 text-chart-3" />
          <div>
            <p className="text-micro font-bold uppercase tracking-[0.3em] text-foreground/30">Backtest & Verification</p>
            <p className="text-base font-bold text-foreground">Transparency Hub</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[16px] border border-[var(--card-border)] bg-muted/40 p-4">
            <p className="text-xs text-foreground/40 uppercase tracking-widest">Modeling Quality</p>
            <p className="mt-2 text-lg font-bold text-foreground">{verification.modelingQuality}</p>
            <p className="mt-1 text-xs text-foreground/35">{verification.backtestPeriod}</p>
          </div>
          <div className="rounded-[16px] border border-[var(--card-border)] bg-muted/40 p-4">
            <p className="text-xs text-foreground/40 uppercase tracking-widest">Data Source</p>
            <p className="mt-2 text-lg font-bold text-foreground">{verification.dataSource}</p>
            <p className="mt-1 text-xs text-foreground/35">Since {verification.trackRecordSince}</p>
          </div>
          <div className="rounded-[16px] border border-[var(--card-border)] bg-muted/40 p-4">
            <p className="text-xs text-foreground/40 uppercase tracking-widest">Status</p>
            <p className="mt-2 text-lg font-bold text-foreground">{verification.verificationStatus}</p>
            <p className="mt-1 text-xs text-foreground/35">{verification.badgeLabel}</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          {verification.backtestReportUrl ? (
            <a
              href={verification.backtestReportUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2.5 text-sm font-semibold text-primary hover:bg-primary/20 transition-colors"
            >
              <Download className="w-4 h-4" />
              Download MT5 Backtest PDF
            </a>
          ) : (
            <div className="inline-flex items-center gap-2 rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm text-foreground/40">
              <Download className="w-4 h-4" />
              Backtest PDF available after strategy verification upload
            </div>
          )}
          {verification.externalVerificationUrl ? (
            <a
              href={verification.externalVerificationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-chart-3/30 bg-chart-3/10 px-4 py-2.5 text-sm font-semibold text-chart-3 hover:bg-chart-3/20 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              View Verified Track Record
            </a>
          ) : (
            <div className="inline-flex items-center gap-2 rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm text-foreground/40">
              <BadgeCheck className="w-4 h-4" />
              Live verification link connects via MetaAPI when master bot is linked
            </div>
          )}
        </div>
      </section>

      {/* Strategic recommendations */}
      <section className="rounded-[22px] border border-chart-4/15 bg-chart-4/[0.03] p-5">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="w-5 h-5 text-chart-4" />
          <div>
            <p className="text-micro font-bold uppercase tracking-[0.3em] text-foreground/30">Strategic Recommendations</p>
            <p className="text-base font-bold text-foreground">Capital & Leverage Guidance</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-[16px] border border-[var(--card-border)] bg-muted/40 p-4">
            <p className="text-xs text-foreground/40 uppercase tracking-widest">Minimum Recommended Capital</p>
            <p className="mt-2 text-2xl font-bold text-foreground">
              ${recommendations.minRecommendedCapital.toLocaleString()}
            </p>
            <p className="mt-2 text-sm text-foreground/45 leading-relaxed">{recommendations.riskNote}</p>
          </div>
          <div className="rounded-[16px] border border-[var(--card-border)] bg-muted/40 p-4">
            <p className="text-xs text-foreground/40 uppercase tracking-widest">Ideal Account Leverage</p>
            <p className="mt-2 text-2xl font-bold text-foreground">{recommendations.recommendedLeverage}</p>
            <p className="mt-2 text-sm text-foreground/45 leading-relaxed flex items-start gap-2">
              <TrendingDown className="w-4 h-4 text-chart-4 shrink-0 mt-0.5" />
              {recommendations.leverageWarning}
            </p>
          </div>
        </div>
      </section>

      {/* Trade history */}
      <section className="rounded-[22px] border border-[var(--card-border)] bg-muted/20p-5">
        <p className="text-micro font-bold uppercase tracking-[0.3em] text-foreground/30">Trading History</p>
        <p className="text-base font-bold text-foreground mt-1 mb-4">Closed Trades Log</p>
        <div className="overflow-x-auto rounded-xl border border-[var(--card-border)]">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-muted/30 text-micro uppercase tracking-[0.2em] text-foreground/35">
              <tr>
                <th className="px-4 py-3">Asset</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Open</th>
                <th className="px-4 py-3">Close</th>
                <th className="px-4 py-3">Opened</th>
                <th className="px-4 py-3">Closed</th>
                <th className="px-4 py-3 text-right">PnL</th>
              </tr>
            </thead>
            <tbody>
              {(tradeHistory?.items ?? []).map((trade: any) => (
                <tr key={trade.id} className="border-t border-[var(--card-border)] hover:bg-muted/20">
                  <td className="px-4 py-3 font-semibold text-foreground">{trade.asset}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-micro font-bold uppercase',
                        trade.type === 'Buy'
                          ? 'bg-chart-3/15 text-chart-3'
                          : 'bg-destructive/15 text-destructive',
                      )}
                    >
                      {trade.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-foreground/70">{trade.openPrice}</td>
                  <td className="px-4 py-3 text-foreground/70">{trade.closePrice ?? '—'}</td>
                  <td className="px-4 py-3 text-foreground/50 text-xs">
                    {trade.openedAt ? new Date(trade.openedAt).toLocaleString() : '—'}
                  </td>
                  <td className="px-4 py-3 text-foreground/50 text-xs">
                    {trade.closedAt ? new Date(trade.closedAt).toLocaleString() : '—'}
                  </td>
                  <td
                    className={cn(
                      'px-4 py-3 text-right font-semibold',
                      trade.pnl >= 0 ? 'text-chart-3' : 'text-destructive',
                    )}
                  >
                    ${Number(trade.pnl).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {(tradeHistory?.items ?? []).length === 0 && (
          <p className="mt-4 text-sm text-foreground/40">
            No closed trades logged yet. Metrics above are derived from verified performance records.
          </p>
        )}
        {totalTradePages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-xs text-foreground/40">
              Page {tradesPage} of {totalTradePages} · {tradeHistory?.total} trades
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={tradesPage <= 1}
                onClick={() => setTradesPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={tradesPage >= totalTradePages}
                onClick={() => setTradesPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
