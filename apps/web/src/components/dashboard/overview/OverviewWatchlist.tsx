'use client';

import React from 'react';
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
  onSelectSymbol?: (symbol: string) => void;
  selectedSymbol?: string;
};

export function OverviewWatchlist({
  quotes,
  activeTab,
  onTabChange,
  onSelectSymbol,
  selectedSymbol,
}: Props) {
  const symbols = TAB_SYMBOLS[activeTab];

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-[var(--card-border)] bg-card">
      <div className="flex gap-1 border-b border-[var(--card-border)] px-2 pt-2">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'rounded-t-lg px-2.5 py-2 text-[11px] font-semibold transition-colors',
              activeTab === tab.id
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-auto px-1 py-1">
        {symbols.length === 0 ? (
          <p className="px-3 py-6 text-center text-xs text-muted-foreground">
            Live index quotes coming soon. Use the chart watchlist for more symbols.
          </p>
        ) : (
          <ul className="space-y-0.5">
            {symbols.map((sym) => {
              const q = quotes[sym];
              const active = selectedSymbol === sym;
              return (
                <li key={sym}>
                  <button
                    type="button"
                    onClick={() => onSelectSymbol?.(sym)}
                    className={cn(
                      'flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left transition-colors',
                      active ? 'bg-primary/10' : 'hover:bg-muted/40',
                    )}
                  >
                    <span className="text-xs font-semibold text-foreground">
                      {formatSymbol(sym)}
                    </span>
                    <div className="text-right">
                      <p className="text-xs font-medium tabular-nums text-foreground">
                        {q
                          ? q.price.toLocaleString('en-US', {
                              minimumFractionDigits: q.price >= 100 ? 2 : 5,
                              maximumFractionDigits: q.price >= 100 ? 2 : 5,
                            })
                          : '—'}
                      </p>
                      <p
                        className={cn(
                          'text-[10px] font-semibold tabular-nums',
                          q ? pnlClass(q.change24hPct) : 'text-muted-foreground',
                        )}
                      >
                        {q ? formatPct(q.change24hPct) : '—'}
                      </p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

export function toTradingViewSymbol(symbol: string): string {
  const s = symbol.replace('/', '').toUpperCase();
  if (s === 'BTCUSDT') return 'BINANCE:BTCUSDT';
  if (s === 'XAUUSD') return 'OANDA:XAUUSD';
  if (s === 'EURUSD') return 'OANDA:EURUSD';
  return `OANDA:${s}`;
}
