'use client';

import React from 'react';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { RefreshCcw, Info } from 'lucide-react';
import type { AnalyticsRange } from '@/lib/api/analytics';
import { cn } from '@/lib/utils';

export const RANGE_OPTIONS: { key: AnalyticsRange; label: string }[] = [
  { key: '1d', label: '1D' },
  { key: '1w', label: '1W' },
  { key: '1m', label: '1M' },
  { key: '3m', label: '3M' },
  { key: '1y', label: '1Y' },
  { key: 'all', label: 'ALL' },
];

export const CHART_GRID_STROKE = 'var(--card-border)';
export const CHART_AXIS_TICK = { fill: 'var(--muted-foreground)', fontSize: 10 };

export function AnalyticsPageHeader({
  title,
  description,
  icon: Icon,
  iconBg,
  onRefresh,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  iconBg: string;
  onRefresh: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
    >
      <div className="flex items-start gap-3">
        <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] shadow-[0_4px_16px_rgba(0,0,0,0.06)]', iconBg)}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-xl">{description}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onRefresh}
        className="dash-btn-outline btn-premium-ghost shrink-0"
      >
        <RefreshCcw className="h-3.5 w-3.5" />
        Refresh
      </button>
    </motion.div>
  );
}

export function AnalyticsRangeSelector({
  range,
  onChange,
  accent = 'primary',
}: {
  range: AnalyticsRange;
  onChange: (r: AnalyticsRange) => void;
  accent?: 'primary' | 'destructive' | 'chart-3';
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {RANGE_OPTIONS.map(({ key, label }) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className={cn(
            'dash-filter-pill',
            range === key && (accent === 'destructive' ? 'dash-filter-pill-active !text-destructive !border-destructive/25 !bg-destructive/10' : accent === 'chart-3' ? 'dash-filter-pill-active !text-chart-3 !border-chart-3/25 !bg-chart-3/10' : 'dash-filter-pill-active'),
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export function AnalyticsInfoBanner({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-[color-mix(in_srgb,var(--info)_30%,var(--card-border))] bg-[color-mix(in_srgb,var(--info)_10%,transparent)] px-4 py-3 flex items-start gap-3">
      <Info className="h-4 w-4 text-[var(--info)] shrink-0 mt-0.5" />
      <p className="text-sm text-foreground/80 leading-relaxed">{message}</p>
    </div>
  );
}

export function ChartCard({
  eyebrow,
  title,
  subtitle,
  children,
  className,
  delay = 0,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35, ease: 'easeOut' }}
      whileHover={{ y: -3 }}
      className={cn('dashboard-card p-3.5 relative overflow-hidden transition-shadow duration-300 hover:shadow-[var(--shadow-card-hover)]', className)}
    >
      <div className="mb-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{eyebrow}</p>
        <p className="text-sm font-bold text-foreground mt-0.5">{title}</p>
        {subtitle ? <p className="text-xs text-muted-foreground mt-1">{subtitle}</p> : null}
      </div>
      {children}
    </motion.div>
  );
}

export function ChartTooltip({
  active,
  payload,
  label,
  formatter,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name?: string; color?: string }>;
  label?: string;
  formatter?: (value: number, name?: string) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-[var(--card-border)] bg-card px-3 py-2 shadow-lg">
      {label ? (
        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
      ) : null}
      {payload.map((entry, i) => (
        <p key={i} className="text-sm font-bold tabular-nums" style={{ color: entry.color ?? undefined }}>
          {formatter ? formatter(entry.value, entry.name) : entry.value}
        </p>
      ))}
    </div>
  );
}

export function EmptyChartOverlay({ title, description }: { title: string; description?: string }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-card/60 backdrop-blur-[1px]">
      <div className="text-center max-w-xs px-4">
        <p className="text-sm font-medium text-foreground">{title}</p>
        {description ? <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{description}</p> : null}
      </div>
    </div>
  );
}

export function StatCard({
  label,
  value,
  icon: Icon,
  iconBg,
  valueClass,
  delay = 0,
}: {
  label: string;
  value: React.ReactNode;
  icon: LucideIcon;
  iconBg: string;
  valueClass?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="dashboard-card p-3.5 flex flex-col gap-2"
    >
      <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', iconBg)}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div>
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className={cn('text-xl font-bold tabular-nums mt-0.5', valueClass ?? 'text-foreground')}>{value}</p>
      </div>
    </motion.div>
  );
}

export function MetricRow({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: React.ReactNode;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl border border-[var(--card-border)] bg-muted/20 hover:border-primary/15 transition-colors">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span className={cn('text-sm font-bold tabular-nums', valueClass ?? 'text-foreground')}>{value}</span>
    </div>
  );
}
