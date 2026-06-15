'use client';

import React from 'react';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';
import { Sparkles, ShieldCheck, BarChart3, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { Button } from '@/components/ui/button';

export interface FeaturedStrategyItem {
  id: string;
  name: string;
  returns: string;
  subscribers: string;
  chartData: { val: number }[];
  creator?: string;
  category?: string;
  verified?: boolean;
  monthlyPrice?: number;
  price?: number;
  risk?: string;
  sharpe?: number;
  returnsValue?: number;
  subscribersValue?: number;
  maxDrawdown?: number;
}

interface FeaturedRowProps {
  strategies?: FeaturedStrategyItem[];
  onSubscribe?: (strategy: FeaturedStrategyItem) => void;
}

export function FeaturedRow({ strategies = [], onSubscribe }: FeaturedRowProps) {
  if (!strategies.length) return null;

  return (
    <div className="space-y-4 px-5 md:px-6 pt-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wide">Featured Strategies</h2>
            <p className="text-xs text-muted-foreground">Verified high performers</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase text-chart-3">
          <span className="h-1.5 w-1.5 rounded-full bg-chart-3 animate-pulse" />
          Live
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {strategies.slice(0, 2).map((strategy) => {
          const price = Number(strategy.price ?? strategy.monthlyPrice ?? 0);
          const sharpe = Number(strategy.sharpe ?? 0);
          const dd = Number(strategy.maxDrawdown ?? 12);
          return (
            <div
              key={strategy.id}
              className="dashboard-card p-5 flex flex-col gap-4 hover:border-primary/20 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <BarChart3 className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">{strategy.name}</p>
                    <p className="text-xs text-muted-foreground">{strategy.category ?? 'Strategy'}</p>
                  </div>
                </div>
                <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[10px] font-bold uppercase text-primary">
                  <Sparkles className="h-3 w-3" />
                  Featured
                </span>
              </div>

              <div className="h-16 -mx-1">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <AreaChart data={strategy.chartData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id={`feat-${strategy.id}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3B5BFF" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#3B5BFF" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area
                      type="monotone"
                      dataKey="val"
                      stroke="#3B5BFF"
                      fill={`url(#feat-${strategy.id})`}
                      strokeWidth={2}
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-4 gap-2 text-center">
                <Metric label="30D Return" value={strategy.returns} className="text-chart-3" />
                <Metric label="Sharpe" value={sharpe > 0 ? sharpe.toFixed(2) : '—'} />
                <Metric label="Max DD" value={`-${dd.toFixed(1)}%`} className="text-destructive" />
                <Metric label="Subs" value={String(strategy.subscribersValue ?? '—')} />
              </div>

              <div className="flex items-center justify-between gap-3 pt-1 border-t border-[var(--card-border)]">
                <div className="flex items-center gap-2 min-w-0">
                  <UserAvatar name={strategy.creator ?? 'Creator'} size="sm" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate flex items-center gap-1">
                      {strategy.creator}
                      {strategy.verified && <ShieldCheck className="h-3 w-3 text-primary shrink-0" />}
                    </p>
                    <p className="text-sm font-bold text-foreground">
                      {price > 0 ? `$${price.toLocaleString()} / mo` : 'FREE'}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  className="rounded-xl bg-primary text-primary-foreground text-[11px] font-bold uppercase shrink-0"
                  onClick={() => onSubscribe?.(strategy)}
                >
                  Subscribe
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Metric({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div>
      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className={cn('text-sm font-bold tabular-nums mt-0.5', className ?? 'text-foreground')}>{value}</p>
    </div>
  );
}
