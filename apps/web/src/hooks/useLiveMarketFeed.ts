'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import {
  acquireTradingSocket,
  isTradingSocketConnected,
} from '@/lib/realtime/trading-socket';

export type SupportedSymbol =
  | 'BTCUSDT'
  | 'EURUSD'
  | 'XAUUSD'
  | 'US30'
  | 'NAS100'
  | 'SPX500';

export type LiveQuote = {
  symbol: SupportedSymbol;
  price: number;
  change24hPct: number;
  timestamp: string;
  source: string;
};

type LiveQuoteMap = Partial<Record<SupportedSymbol, LiveQuote>>;

const SUPPORTED: SupportedSymbol[] = [
  'BTCUSDT',
  'EURUSD',
  'XAUUSD',
  'US30',
  'NAS100',
  'SPX500',
];

/** Nest stuck-API demo bands — never show these in the UI. */
export function isFakeNestQuote(symbol: string, price: number, source?: string): boolean {
  if (!Number.isFinite(price) || price <= 0) return true;
  const src = String(source || '').toLowerCase();
  if (src.includes('profytron-market') || src.includes('synthetic')) return true;

  const s = symbol.toUpperCase();
  // Live BTC is ~64k; Nest demo sits ~66.5–68k
  if (s.startsWith('BTC')) return price >= 65000 && price <= 69500;
  // Live EUR ~1.14; Nest demo ~1.08x
  if (s === 'EURUSD') return price >= 1.078 && price <= 1.095;
  // Live gold ~4100; Nest demo ~2300–2400
  if (s.startsWith('XAU') || s === 'GOLD') return price >= 2200 && price <= 2500;
  return false;
}

function isLiveSource(source?: string) {
  const s = String(source || '').toLowerCase();
  return (
    s.includes('yahoo') ||
    s.includes('coingecko') ||
    s.includes('binance') ||
    s === 'rest'
  );
}

async function fetchLiveQuotesFromVercel(): Promise<LiveQuoteMap> {
  // Same-origin only — never hit Render for market data.
  const url = `/api/market/quotes?_=${Date.now()}`;
  const res = await fetch(url, {
    cache: 'no-store',
    headers: {
      Accept: 'application/json',
      'Cache-Control': 'no-cache',
    },
  });
  if (!res.ok) throw new Error(`market quotes ${res.status}`);
  const body = await res.json();
  const rows = Array.isArray(body?.data) ? body.data : Array.isArray(body) ? body : [];
  const next: LiveQuoteMap = {};

  for (const row of rows) {
    const symbol = String(row?.symbol || '').toUpperCase() as SupportedSymbol;
    if (!SUPPORTED.includes(symbol)) continue;
    const price = Number(row?.price);
    const source = String(row?.source || 'rest');
    if (isFakeNestQuote(symbol, price, source)) continue;
    if (source.includes('profytron')) continue;

    next[symbol] = {
      symbol,
      price,
      change24hPct: Number(row?.change24hPct ?? 0) || 0,
      timestamp: String(row?.timestamp || new Date().toISOString()),
      source,
    };
  }

  // If batch missed a symbol, fetch individually from Vercel.
  for (const symbol of SUPPORTED) {
    if (next[symbol]) continue;
    try {
      const one = await fetch(`/api/market/quote?symbol=${symbol}&_=${Date.now()}`, {
        cache: 'no-store',
      });
      if (!one.ok) continue;
      const payload = await one.json();
      const q = payload?.data ?? payload;
      const price = Number(q?.price);
      const source = String(q?.source || 'rest');
      if (isFakeNestQuote(symbol, price, source)) continue;
      next[symbol] = {
        symbol,
        price,
        change24hPct: Number(q?.change24hPct ?? 0) || 0,
        timestamp: String(q?.timestamp || new Date().toISOString()),
        source,
      };
    } catch {
      /* skip */
    }
  }

  return next;
}

type Options = { enabled?: boolean; allowFallback?: boolean };

export function useLiveMarketFeed(
  _symbols: SupportedSymbol[] = SUPPORTED,
  options: Options = {},
) {
  const enabled = options.enabled ?? true;
  const accessToken = useAuthStore((s) => s.accessToken);
  const [socketUp, setSocketUp] = React.useState(false);

  const query = useQuery({
    queryKey: ['live-market-quotes-v3'],
    queryFn: fetchLiveQuotesFromVercel,
    enabled,
    staleTime: 10_000,
    refetchInterval: 12_000,
    refetchOnWindowFocus: true,
    retry: 2,
  });

  const quotes = (query.data ?? {}) as LiveQuoteMap;
  const [priceHistory, setPriceHistory] = React.useState<
    Partial<Record<SupportedSymbol, number[]>>
  >({});

  React.useEffect(() => {
    if (!query.data) return;
    setPriceHistory((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const sym of SUPPORTED) {
        const q = query.data[sym];
        if (!q?.price) continue;
        const hist = next[sym] ?? [];
        const last = hist[hist.length - 1];
        if (last !== undefined && Math.abs(last - q.price) < 1e-9) continue;
        next[sym] = [...hist, q.price].slice(-40);
        changed = true;
      }
      return changed ? next : prev;
    });
  }, [query.data, query.dataUpdatedAt]);

  // Trading socket for orders only — never for market prices.
  React.useEffect(() => {
    if (!enabled) return;
    const token = accessToken ?? useAuthStore.getState().accessToken;
    if (!token) return;
    const release = acquireTradingSocket(token);
    setSocketUp(isTradingSocketConnected());
    const id = window.setInterval(() => setSocketUp(isTradingSocketConnected()), 5000);
    return () => {
      window.clearInterval(id);
      release();
      setSocketUp(false);
    };
  }, [enabled, accessToken]);

  const hasLive = SUPPORTED.some((s) => {
    const q = quotes[s];
    return q && !isFakeNestQuote(s, q.price, q.source) && isLiveSource(q.source);
  });

  return {
    quotes,
    priceHistory,
    wsConnected: hasLive || socketUp,
    refresh: () => query.refetch(),
    isLoading: query.isLoading,
    isFetching: query.isFetching,
  };
}
