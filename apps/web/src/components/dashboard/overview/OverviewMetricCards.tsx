'use client';

import React from 'react';
import Link from 'next/link';
import { Activity, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAnimatedNumber } from '@/platform/motion';
import {
  formatMoney,
  formatPct,
  formatSignedMoney,
  pnlClass,
} from './overview-utils';

function MiniSpark({
  data,
  positive,
}: {
  data: number[];
  positive: boolean;
}) {
  const id = React.useId();
  const w = 96;
  const h = 32;
  if (data.length < 2) return <div style={{ width: w, height: h }} />;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const color = positive ? 'var(--primary)' : 'var(--destructive)';
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`M ${pts.join(' L ')} L ${w},${h} L 0,${h} Z`} fill={`url(#${id})`} />
      <path
        d={`M ${pts.join(' L ')}`}
        fill="none"
        stroke={color}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ProgressBar({ value }: { value: number }) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/70">
      <div
        className="h-full rounded-full bg-primary transition-[width] duration-[var(--motion-slow,320ms)]"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[var(--card-border)] bg-card p-3 sm:p-3.5">
      {children}
    </div>
  );
}

export type OverviewAccountMetrics = {
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  currency: string;
  unrealizedPnl: number;
  realizedPnl24h: number;
  change24hPct: number;
  sparkline: number[];
  isPaper: boolean;
  loading?: boolean;
  refreshing?: boolean;
};

export function OverviewMetricCards({ metrics }: { metrics: OverviewAccountMetrics }) {
  const {
    balance,
    equity,
    margin,
    freeMargin,
    unrealizedPnl,
    realizedPnl24h,
    change24hPct,
    sparkline,
    isPaper,
    loading,
    refreshing,
  } = metrics;

  // Always USD on Overview — matches MT5 / Connected Accounts, no locale FX.
  const currency = 'USD';

  const marginUsedPct = equity > 0 ? (margin / equity) * 100 : 0;
  const marginLevel = margin > 0 ? (equity / margin) * 100 : 0;
  const freePct = equity > 0 ? Math.min(100, (freeMargin / equity) * 100) : 0;

  const balanceAnim = useAnimatedNumber({
    id: 'metric.balance',
    value: balance,
    kind: 'currency',
    currency,
    changeKey: 'overview.balance',
  });
  const equityAnim = useAnimatedNumber({
    id: 'metric.equity',
    value: equity,
    kind: 'currency',
    currency,
    changeKey: 'overview.equity',
  });
  const freeAnim = useAnimatedNumber({
    id: 'metric.freeMargin',
    value: freeMargin,
    kind: 'currency',
    currency,
  });
  const pnlAnim = useAnimatedNumber({
    id: 'metric.unrealizedPnl',
    value: unrealizedPnl,
    kind: 'currency',
    currency,
    changeKey: 'overview.pnl',
  });

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-[100px] animate-pulse rounded-xl border border-[var(--card-border)] bg-muted/30"
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
      aria-busy={refreshing || undefined}
    >
      <Card>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Total Balance
            </p>
            <p
              className={cn(
                'mt-1.5 text-xl font-semibold tracking-tight text-foreground tabular-nums truncate transition-colors duration-[var(--motion-fast,120ms)]',
                balanceAnim.highlight && 'text-primary',
              )}
              title={formatMoney(balance, currency)}
            >
              {balanceAnim.formatted}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {isPaper ? 'Paper' : 'Real'} · {currency}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className={cn('text-xs font-semibold tabular-nums', pnlClass(change24hPct))}>
              {formatPct(change24hPct)}
            </span>
            <p className="text-[9px] uppercase tracking-wide text-muted-foreground">Return</p>
            <MiniSpark data={sparkline} positive={change24hPct >= 0} />
          </div>
        </div>
      </Card>

      <Card>
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Equity
        </p>
        <p
          className={cn(
            'mt-1.5 text-xl font-semibold tracking-tight text-foreground tabular-nums truncate transition-colors duration-[var(--motion-fast,120ms)]',
            equityAnim.highlight && 'text-primary',
          )}
          title={formatMoney(equity, currency)}
        >
          {equityAnim.formatted}
        </p>
        <div className="mt-2 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Margin Used</span>
            <span className="font-medium tabular-nums text-foreground">
              {formatMoney(margin, currency)} · {marginUsedPct.toFixed(1)}%
            </span>
          </div>
          <ProgressBar value={marginUsedPct} />
        </div>
      </Card>

      <Card>
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Free Margin
        </p>
        <p
          className="mt-1.5 text-xl font-semibold tracking-tight text-foreground tabular-nums truncate"
          title={formatMoney(freeMargin, currency)}
        >
          {freeAnim.formatted}
        </p>
        <div className="mt-2 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Margin Level</span>
            <span className="font-medium tabular-nums text-foreground">
              {margin > 0 ? `${marginLevel.toFixed(2)}%` : '—'}
            </span>
          </div>
          <ProgressBar value={freePct} />
        </div>
      </Card>

      <Card>
        <div className="flex items-start justify-between gap-2">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Unrealized P/L
          </p>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Activity className="h-3.5 w-3.5" />
            <Clock className="h-3.5 w-3.5" />
          </div>
        </div>
        <p
          className={cn(
            'mt-1.5 text-xl font-semibold tracking-tight tabular-nums truncate transition-colors duration-[var(--motion-fast,120ms)]',
            pnlClass(unrealizedPnl),
            pnlAnim.highlight && 'ring-1 ring-primary/30 rounded-sm',
          )}
          title={formatSignedMoney(unrealizedPnl, currency)}
        >
          {formatSignedMoney(pnlAnim.visual, currency)}
        </p>
        <div className="mt-2 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Realized P/L (24h)</span>
          <span className={cn('font-medium tabular-nums', pnlClass(realizedPnl24h))}>
            {formatSignedMoney(realizedPnl24h, currency)}
          </span>
        </div>
        <Link
          href="/analytics"
          className="mt-2 inline-block text-[11px] font-medium text-primary hover:underline"
        >
          View Report
        </Link>
      </Card>
    </div>
  );
}
