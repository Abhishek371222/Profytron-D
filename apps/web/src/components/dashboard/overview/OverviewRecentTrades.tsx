'use client';

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { TradeHistoryRow } from '@/lib/api/trading';
import {
  formatSignedMoney,
  formatSymbol,
  pnlClass,
  relativeTime,
} from './overview-utils';

type Props = {
  trades: TradeHistoryRow[];
  currency?: string;
  loading?: boolean;
};

export function OverviewRecentTrades({ trades, currency: _currency = 'USD', loading }: Props) {
  const currency = 'USD';
  return (
    <div className="flex h-full min-h-[280px] flex-col overflow-hidden rounded-xl border border-[var(--card-border)] bg-card">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--card-border)] px-4 py-3.5 sm:px-5">
        <h2 className="text-sm font-semibold text-foreground">Recent Trades</h2>
        <Link href="/history" className="text-[11px] font-medium text-primary hover:underline">
          View all
        </Link>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        {loading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-9 animate-pulse rounded-lg bg-muted/40" />
            ))}
          </div>
        ) : trades.length === 0 ? (
          <div className="flex min-h-[160px] flex-col items-center justify-center gap-1 px-6 text-center">
            <p className="text-sm font-medium text-foreground">No recent trades</p>
            <p className="text-xs text-muted-foreground">Closed trades will show here.</p>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-card text-[10px] uppercase tracking-wider text-muted-foreground">
              <tr className="border-b border-[var(--card-border)]">
                <th className="px-4 py-2.5 font-medium sm:px-5">Ticket</th>
                <th className="px-2 py-2.5 font-medium">Symbol</th>
                <th className="px-2 py-2.5 font-medium">Type</th>
                <th className="hidden px-2 py-2.5 font-medium text-right sm:table-cell">Vol</th>
                <th className="px-2 py-2.5 font-medium text-right">P/L</th>
                <th className="px-4 py-2.5 font-medium text-right sm:px-5">When</th>
              </tr>
            </thead>
            <tbody>
              {trades.slice(0, 8).map((t) => {
                const pnl = Number(t.profit ?? 0);
                const isBuy = t.direction === 'LONG';
                return (
                  <tr
                    key={t.id}
                    className="border-b border-[var(--card-border)]/60 last:border-0 hover:bg-muted/20"
                  >
                    <td className="px-4 py-2.5 font-mono text-[10px] text-muted-foreground sm:px-5">
                      {t.id.slice(0, 8)}
                    </td>
                    <td className="px-2 py-2.5 font-semibold text-foreground">
                      {formatSymbol(t.symbol)}
                    </td>
                    <td className="px-2 py-2.5">
                      <span
                        className={cn(
                          'inline-flex rounded-md px-1.5 py-0.5 text-[10px] font-semibold',
                          isBuy
                            ? 'bg-[color-mix(in_srgb,var(--chart-bull)_12%,transparent)] text-[var(--chart-bull)]'
                            : 'bg-destructive/10 text-destructive',
                        )}
                      >
                        {isBuy ? 'Buy' : 'Sell'}
                      </span>
                    </td>
                    <td className="hidden px-2 py-2.5 text-right tabular-nums sm:table-cell">
                      {Number(t.volume).toFixed(2)}
                    </td>
                    <td className={cn('px-2 py-2.5 text-right tabular-nums font-medium', pnlClass(pnl))}>
                      {formatSignedMoney(pnl, currency)}
                    </td>
                    <td className="px-4 py-2.5 text-right text-muted-foreground sm:px-5">
                      {relativeTime(t.closedAt || t.openedAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
