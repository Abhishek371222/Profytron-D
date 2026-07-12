'use client';

import React from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  formatMoney,
  formatPct,
  formatSignedMoney,
  formatSymbol,
  normalizeQuoteKey,
  pnlClass,
} from './overview-utils';

export type OverviewPosition = {
  id: string;
  asset: string;
  type: 'Long' | 'Short';
  amount: number;
  entry: number;
  pnl: number;
  currentPrice?: number;
};

type Props = {
  positions: OverviewPosition[];
  quotes: Record<string, { price?: number } | undefined>;
  currency?: string;
  onNewOrder?: () => void;
  loading?: boolean;
};

export function OverviewOpenPositions({
  positions,
  quotes,
  currency: _currency = 'USD',
  onNewOrder,
  loading,
}: Props) {
  const currency = 'USD';
  const rows = positions.map((p) => {
    const key = normalizeQuoteKey(p.asset);
    const live = quotes[key]?.price ?? quotes[p.asset]?.price;
    const current = live ?? p.currentPrice ?? p.entry;
    const pnlPct =
      p.entry > 0
        ? ((current - p.entry) / p.entry) * 100 * (p.type === 'Short' ? -1 : 1)
        : 0;
    return { ...p, current, pnlPct };
  });

  const totalVolume = rows.reduce((s, r) => s + r.amount, 0);
  const totalPnl = rows.reduce((s, r) => s + r.pnl, 0);

  return (
    <div className="flex h-full min-h-[220px] flex-col overflow-hidden rounded-xl border border-[var(--card-border)] bg-card">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--card-border)] px-3 py-2.5 sm:px-4">
        <div className="flex items-center gap-2 min-w-0">
          <h2 className="text-sm font-semibold text-foreground">Open Positions</h2>
          {rows.length > 0 && (
            <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
              {rows.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {onNewOrder && (
            <Button variant="outline" size="sm" onClick={onNewOrder} className="h-8 gap-1.5 text-xs">
              <Plus className="h-3.5 w-3.5" />
              New
            </Button>
          )}
          <Link href="/history" className="text-[11px] font-medium text-primary hover:underline">
            View all
          </Link>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        {loading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded-lg bg-muted/40" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="flex h-full min-h-[180px] flex-col items-center justify-center gap-1 px-6 text-center">
            <p className="text-sm font-medium text-foreground">No open positions</p>
            <p className="text-xs text-muted-foreground">
              Live trades from your connected account will appear here.
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-card text-[10px] uppercase tracking-wider text-muted-foreground">
              <tr className="border-b border-[var(--card-border)]">
                <th className="px-4 py-2.5 font-medium sm:px-5">Symbol</th>
                <th className="px-2 py-2.5 font-medium">Type</th>
                <th className="px-2 py-2.5 font-medium text-right">Vol</th>
                <th className="hidden px-2 py-2.5 font-medium text-right sm:table-cell">Open</th>
                <th className="hidden px-2 py-2.5 font-medium text-right md:table-cell">Current</th>
                <th className="px-2 py-2.5 font-medium text-right">P/L</th>
                <th className="px-4 py-2.5 font-medium text-right sm:px-5">%</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-[var(--card-border)]/60 last:border-0 hover:bg-muted/20"
                >
                  <td className="px-4 py-2.5 font-semibold text-foreground sm:px-5">
                    {formatSymbol(r.asset)}
                  </td>
                  <td className="px-2 py-2.5">
                    <span
                      className={cn(
                        'inline-flex rounded-md px-1.5 py-0.5 text-[10px] font-semibold',
                        r.type === 'Long'
                          ? 'bg-[color-mix(in_srgb,var(--chart-bull)_12%,transparent)] text-[var(--chart-bull)]'
                          : 'bg-destructive/10 text-destructive',
                      )}
                    >
                      {r.type === 'Long' ? 'Buy' : 'Sell'}
                    </span>
                  </td>
                  <td className="px-2 py-2.5 text-right tabular-nums text-foreground">
                    {r.amount.toFixed(2)}
                  </td>
                  <td className="hidden px-2 py-2.5 text-right tabular-nums text-muted-foreground sm:table-cell">
                    {r.entry.toFixed(r.entry >= 100 ? 2 : 5)}
                  </td>
                  <td className="hidden px-2 py-2.5 text-right tabular-nums text-foreground md:table-cell">
                    {r.current.toFixed(r.current >= 100 ? 2 : 5)}
                  </td>
                  <td className={cn('px-2 py-2.5 text-right tabular-nums font-medium', pnlClass(r.pnl))}>
                    {formatSignedMoney(r.pnl, currency)}
                  </td>
                  <td className={cn('px-4 py-2.5 text-right tabular-nums font-medium sm:px-5', pnlClass(r.pnlPct))}>
                    {formatPct(r.pnlPct)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-[var(--card-border)] bg-muted/20 text-xs font-semibold">
                <td className="px-4 py-2.5 text-muted-foreground sm:px-5" colSpan={2}>
                  Total
                </td>
                <td className="px-2 py-2.5 text-right tabular-nums">{totalVolume.toFixed(2)}</td>
                <td className="hidden sm:table-cell" />
                <td className="hidden md:table-cell" />
                <td className={cn('px-2 py-2.5 text-right tabular-nums', pnlClass(totalPnl))}>
                  {formatSignedMoney(totalPnl, currency)}
                </td>
                <td className="px-4 sm:px-5" />
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  );
}
