'use client';

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  formatPct,
  formatSymbol,
  pnlClass,
} from './overview-utils';

export type WatchTab = 'forex' | 'metals' | 'crypto' | 'indices';

const TABS: { id: WatchTab; label: string }[] = [
  { id: 'forex', label: 'Forex' },
  { id: 'metals', label: 'Metals' },
  { id: 'crypto', label: 'Crypto' },
  { id: 'indices', label: 'Indices' },
];

const TAB_SYMBOLS: Record<WatchTab, string[]> = {
  forex: ['EURUSD'],
  metals: ['XAUUSD'],
  crypto: ['BTCUSDT'],
  indices: [],
};

type Quote = {
  price: number;
  change24hPct: number;
};

type Props = {
  quotes: Record<string, Quote | undefined>;
  activeTab: WatchTab;
  onTabChange: (tab: WatchTab) => void;
  loading?: boolean;
};

export function OverviewMarketWatch({
  quotes,
  activeTab,
  onTabChange,
  loading = false,
}: Props) {
  const symbols = TAB_SYMBOLS[activeTab];

  return (
    <div className="flex h-full min-h-[280px] flex-col overflow-hidden rounded-xl border border-[var(--card-border)] bg-card">
      <div className="flex items-center justify-between gap-2 border-b border-[var(--card-border)] px-4 py-3">
        <h2 className="text-sm font-semibold text-foreground">Market Watch</h2>
        <Link href="/markets" className="text-[11px] font-medium text-primary hover:underline">
          View All
        </Link>
      </div>

      <div className="flex gap-1 border-b border-[var(--card-border)] px-2 pt-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'rounded-t-md px-2.5 py-2 text-[11px] font-semibold transition-colors',
              activeTab === tab.id
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        {loading ? (
          <div className="space-y-3 p-4 animate-pulse">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-8 rounded-lg bg-muted/50" />
            ))}
          </div>
        ) : symbols.length === 0 ? (
          <p className="px-4 py-10 text-center text-xs text-muted-foreground">
            Index quotes coming soon.
          </p>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-card text-[10px] uppercase tracking-wider text-muted-foreground">
              <tr className="border-b border-[var(--card-border)]">
                <th className="px-4 py-2.5 font-medium">Symbol</th>
                <th className="px-2 py-2.5 font-medium text-right">Last</th>
                <th className="px-2 py-2.5 font-medium text-right">Chg</th>
                <th className="px-4 py-2.5 font-medium text-right">Chg%</th>
              </tr>
            </thead>
            <tbody>
              {symbols.map((sym) => {
                const q = quotes[sym];
                const chgAbs =
                  q && Number.isFinite(q.price) && Number.isFinite(q.change24hPct)
                    ? q.price - q.price / (1 + q.change24hPct / 100)
                    : 0;
                return (
                  <tr
                    key={sym}
                    className="border-b border-[var(--card-border)]/50 last:border-0 hover:bg-muted/20"
                  >
                    <td className="px-4 py-2.5 font-semibold text-foreground">
                      {formatSymbol(sym)}
                    </td>
                    <td className="px-2 py-2.5 text-right tabular-nums text-foreground">
                      {q
                        ? q.price.toLocaleString('en-US', {
                            minimumFractionDigits: q.price >= 100 ? 2 : 5,
                            maximumFractionDigits: q.price >= 100 ? 2 : 5,
                          })
                        : '—'}
                    </td>
                    <td
                      className={cn(
                        'px-2 py-2.5 text-right tabular-nums font-medium',
                        q ? pnlClass(chgAbs) : 'text-muted-foreground',
                      )}
                    >
                      {q
                        ? `${chgAbs >= 0 ? '+' : ''}${chgAbs.toFixed(q.price >= 100 ? 2 : 5)}`
                        : '—'}
                    </td>
                    <td
                      className={cn(
                        'px-4 py-2.5 text-right tabular-nums font-medium',
                        q ? pnlClass(q.change24hPct) : 'text-muted-foreground',
                      )}
                    >
                      {q ? formatPct(q.change24hPct) : '—'}
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
