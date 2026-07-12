'use client';

import React from 'react';
import Link from 'next/link';
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  YAxis,
} from 'recharts';
import { cn } from '@/lib/utils';
import { formatPct, pnlClass } from './overview-utils';

type Point = { date: string; equity: number };

type Props = {
  equityCurve: Point[];
  totalReturnPct: number;
  winRate: number;
  totalTrades: number;
  loading?: boolean;
};

export function OverviewPerformance({
  equityCurve,
  totalReturnPct,
  winRate,
  totalTrades,
  loading,
}: Props) {
  const data = equityCurve.slice(-30).map((p) => ({
    ...p,
    label: p.date.slice(5),
  }));

  return (
    <div className="flex h-full min-h-[220px] flex-col overflow-hidden rounded-xl border border-[var(--card-border)] bg-card">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--card-border)] px-3 py-2.5 sm:px-4">
        <h2 className="text-sm font-semibold text-foreground">Account Performance (30 Days)</h2>
        <Link href="/analytics" className="text-[11px] font-medium text-primary hover:underline">
          View report
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-2 border-b border-[var(--card-border)] px-3 py-2.5 sm:px-4">
        <Stat
          label="Total return"
          value={formatPct(totalReturnPct)}
          className={pnlClass(totalReturnPct)}
        />
        <Stat label="Win rate" value={`${winRate.toFixed(1)}%`} />
        <Stat label="Trades" value={String(totalTrades)} />
      </div>

      <div className="min-h-[120px] flex-1 px-2 pb-2 pt-2">
        {loading ? (
          <div className="mx-3 h-full min-h-[120px] animate-pulse rounded-xl bg-muted/40" />
        ) : data.length < 2 ? (
          <div className="flex h-full min-h-[120px] items-center justify-center text-xs text-muted-foreground">
            Equity curve appears after closed trades.
          </div>
        ) : (
          <div className="h-full min-h-[120px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={1}>
              <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="overviewEquityFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <YAxis
                  domain={['dataMin', 'dataMax']}
                  hide
                  width={0}
                />
                <Tooltip
                  contentStyle={{
                    background: 'var(--card)',
                    border: '1px solid var(--card-border)',
                    borderRadius: 10,
                    fontSize: 12,
                  }}
                  labelFormatter={(l) => String(l)}
                  formatter={(value) => [
                    Number(value).toLocaleString('en-US', { maximumFractionDigits: 2 }),
                    'Equity',
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="equity"
                  stroke="var(--primary)"
                  strokeWidth={1.75}
                  fill="url(#overviewEquityFill)"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={cn('mt-0.5 text-sm font-semibold tabular-nums text-foreground', className)}>
        {value}
      </p>
    </div>
  );
}
