'use client';

import React from 'react';
import Link from 'next/link';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';
import { ShieldCheck, Activity, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export interface MarketplaceStrategyRow {
  id: string;
  name: string;
  category: string;
  creator: string;
  verified?: boolean;
  returns: number;
  sharpe: number;
  risk: string;
  subscribers: number;
  price: number;
  drawdown?: number;
}

export function MarketplaceStrategyTable({
  strategies,
  onSubscribe,
}: {
  strategies: MarketplaceStrategyRow[];
  onSubscribe: (s: MarketplaceStrategyRow) => void;
}) {
  return (
    <div className="dashboard-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead>
            <tr className="border-b border-[var(--card-border)] bg-muted/30">
              {['Strategy', 'Type', '30D Return', 'Sharpe', 'Max DD', 'Subscribers', 'Price', 'Action'].map((h, i) => (
                <th
                  key={h}
                  className={cn(
                    'px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground',
                    i >= 6 ? 'text-right' : 'text-left',
                  )}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--card-border)]">
            {strategies.map((s) => {
              const spark = buildSpark(s.returns, s.id);
              const dd = s.drawdown ?? Math.max(5, 20 - s.sharpe * 3);
              return (
                <tr key={s.id} className="hover:bg-muted/25 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3 min-w-[200px]">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Activity className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <Link href={`/marketplace/${s.id}`} className="text-sm font-semibold text-foreground hover:text-primary truncate block">
                          {s.name}
                        </Link>
                        <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                          {s.creator}
                          {s.verified && <ShieldCheck className="h-3 w-3 text-primary shrink-0" />}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-semibold uppercase border border-primary/20">
                      {s.category}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-chart-3 tabular-nums">+{s.returns.toFixed(1)}%</span>
                      <div className="h-6 w-16 hidden sm:block">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                          <AreaChart data={spark}>
                            <Area type="monotone" dataKey="v" stroke="#16A34A" fill="#16A34A" fillOpacity={0.15} strokeWidth={1.5} isAnimationActive={false} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold tabular-nums text-foreground">{s.sharpe.toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm font-semibold tabular-nums text-destructive">-{dd.toFixed(1)}%</td>
                  <td className="px-4 py-3 text-sm font-semibold tabular-nums text-foreground">{s.subscribers.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-sm font-bold text-foreground">
                    {s.price > 0 ? `$${s.price.toLocaleString()}` : 'FREE'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-lg border border-[var(--card-border)] text-xs font-semibold uppercase"
                      onClick={() => onSubscribe(s)}
                    >
                      View
                      <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function buildSpark(base: number, seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return Array.from({ length: 8 }, (_, i) => ({
    v: base * 0.3 + ((h + i * 17) % 20) + i * 1.5,
  }));
}
