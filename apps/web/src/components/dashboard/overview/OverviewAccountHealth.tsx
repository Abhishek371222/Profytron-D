'use client';

import React from 'react';
import { cn } from '@/lib/utils';

type Props = {
  riskScoreLabel: string;
  drawdownPct: number;
  profitFactor: number;
  sharpeRatio: number;
  healthPct: number;
};

export function OverviewAccountHealth({
  riskScoreLabel,
  drawdownPct,
  profitFactor,
  sharpeRatio,
  healthPct,
}: Props) {
  const clamped = Math.min(100, Math.max(0, healthPct));
  const riskColorClass =
    riskScoreLabel === 'Elevated'
      ? 'text-destructive'
      : riskScoreLabel === 'Moderate'
        ? 'text-amber-500'
        : riskScoreLabel === 'No Data'
          ? 'text-muted-foreground'
          : 'text-[var(--chart-bull)]';

  return (
    <div className="rounded-xl border border-[var(--card-border)] bg-card p-3 sm:p-3.5">
      <h2 className="text-sm font-semibold text-foreground">Account Health</h2>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat
          label="Risk Score"
          value={riskScoreLabel}
          valueClass={riskColorClass}
        />
        <Stat label="Drawdown" value={`${drawdownPct.toFixed(2)}%`} />
        <Stat label="Profit Factor" value={profitFactor.toFixed(2)} />
        <Stat label="Sharpe Ratio" value={sharpeRatio.toFixed(2)} />
      </div>
      <div className="relative mt-4 h-2 overflow-hidden rounded-full bg-gradient-to-r from-[var(--chart-bull)] via-amber-400 to-destructive">
        <div
          className="absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full border-2 border-background bg-foreground shadow"
          style={{ left: `calc(${clamped}% - 7px)` }}
        />
      </div>
      <div className="mt-1.5 flex justify-between text-[10px] text-muted-foreground">
        <span>Healthy</span>
        <span>Elevated risk</span>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={cn('mt-0.5 text-sm font-semibold tabular-nums text-foreground', valueClass)}>
        {value}
      </p>
    </div>
  );
}
