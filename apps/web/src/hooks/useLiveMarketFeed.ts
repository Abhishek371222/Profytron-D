'use client';

import React from 'react';
import { apiClient, unwrapApiResponse } from '@/lib/api/client';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import {
  acquireTradingSocket,
  isTradingSocketConnected,
} from '@/lib/realtime/trading-socket';

export type SupportedSymbol = 'BTCUSDT' | 'EURUSD' | 'XAUUSD';

export type LiveQuote = {
  symbol: SupportedSymbol;
  price: number;
  change24hPct: number;
  timestamp: string;
  source: 'rest' | 'ws';
};

type LiveQuoteMap = Partial<Record<SupportedSymbol, LiveQuote>>;

const SUPPORTED_SYMBOLS: SupportedSymbol[] = ['BTCUSDT', 'EURUSD', 'XAUUSD'];

/**
 * Nest market.service synthetic bands (basePrice ± drift). Reject these so the
 * stuck Render WS/REST cannot overwrite Vercel live Yahoo/CoinGecko prices.
 */
function isSyntheticNestPrice(symbol: string, price: number, source?: string): boolean {
  if (!Number.isFinite(price) || price <= 0) return true;
  const src = String(source || '').toLowerCase();
  if (src.includes('profytron-market') || src.includes('synthetic')) return true;

  const s = symbol.toUpperCase();
  if (s === 'BTCUSDT' || s === 'BTCUSD') return price >= 65000 && price <= 69000;
  if (s === 'EURUSD') return price >= 1.08 && price <= 1.092;
  if (s === 'XAUUSD' || s === 'XAU') return price >= 2300 && price <= 2450;
  return false;
}

const normalizeQuote = (
  raw: unknown,
  fallbackSymbol?: SupportedSymbol,
): LiveQuote | null => {
  if (!raw || typeof raw !== 'object') return null;
  const data = raw as Record<string, unknown>;
  const symbol = String(data.symbol ?? fallbackSymbol ?? '').toUpperCase();
  if (!SUPPORTED_SYMBOLS.includes(symbol as SupportedSymbol)) return null;

  const price = Number(data.price ?? data.last ?? data.close);
  const change24hPct = Number(data.change24hPct ?? data.changePct ?? data.change ?? 0);
  if (!Number.isFinite(price) || price <= 0) return null;

  const sourceHint = String(data.source ?? '');
  if (isSyntheticNestPrice(symbol, price, sourceHint)) return null;

  return {
    symbol: symbol as SupportedSymbol,
    price,
    change24hPct: Number.isFinite(change24hPct) ? change24hPct : 0,
    timestamp: String(data.timestamp ?? new Date().toISOString()),
    source: 'rest',
  };
};

const pullFirstQuote = (payload: unknown, symbol: SupportedSymbol): LiveQuote | null => {
  const unwrapped = unwrapApiResponse<unknown>(payload);

  if (Array.isArray(unwrapped)) {
    const row = unwrapped.find(
      (item) =>
        String((item as Record<string, unknown>)?.symbol ?? '').toUpperCase() === symbol,
    );
    return normalizeQuote(row, symbol);
  }

  if (unwrapped && typeof unwrapped === 'object') {
    const data = unwrapped as Record<string, unknown>;
    if (data[symbol]) return normalizeQuote(data[symbol], symbol);
    return normalizeQuote(unwrapped, symbol);
  }

  return null;
};

type LiveMarketFeedOptions = {
  enabled?: boolean;
  allowFallback?: boolean;
};

export function useLiveMarketFeed(
  symbols: SupportedSymbol[] = SUPPORTED_SYMBOLS,
  options: LiveMarketFeedOptions = {},
) {
  const enabled = options.enabled ?? true;
  const accessToken = useAuthStore((s) => s.accessToken);
  const [quotes, setQuotes] = React.useState<LiveQuoteMap>(() => ({}));
  const [priceHistory, setPriceHistory] = React.useState<
    Partial<Record<SupportedSymbol, number[]>>
  >({});
  const [wsConnected, setWsConnected] = React.useState(false);

  const appendHistory = React.useCallback((updates: LiveQuoteMap) => {
    setPriceHistory((prev) => {
      const next = { ...prev };
      Object.entries(updates).forEach(([sym, q]) => {
        if (!q?.price) return;
        const key = sym as SupportedSymbol;
        const hist = next[key] ?? [];
        const last = hist[hist.length - 1];
        if (last !== undefined && Math.abs(last - q.price) < 1e-9) return;
        next[key] = [...hist, q.price].slice(-40);
      });
      return next;
    });
  }, []);

  const symbolsKey = symbols.join(',');
  const stableSymbols = React.useMemo(() => symbols, [symbolsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const pollOnce = React.useCallback(async () => {
    try {
      const response = await apiClient.get('/market/quotes', {
        headers: { 'Cache-Control': 'no-cache' },
        params: { _t: Date.now() },
      });
      const rows = unwrapApiResponse<unknown>(response.data);
      if (Array.isArray(rows)) {
        const next: LiveQuoteMap = {};
        rows.forEach((item) => {
          const normalized = normalizeQuote(item);
          if (normalized && stableSymbols.includes(normalized.symbol)) {
            next[normalized.symbol] = normalized;
          }
        });
        if (Object.keys(next).length > 0) {
          setQuotes((prev) => ({ ...prev, ...next }));
          appendHistory(next);
          return;
        }
      }
    } catch {
      // per-symbol below
    }

    const fetched = await Promise.all(
      stableSymbols.map(async (symbol) => {
        try {
          const response = await apiClient.get('/market/quote', {
            params: { symbol, _t: Date.now() },
            headers: { 'Cache-Control': 'no-cache' },
          });
          return pullFirstQuote(response.data, symbol);
        } catch {
          return null;
        }
      }),
    );

    const next: LiveQuoteMap = {};
    fetched.forEach((row) => {
      if (!row) return;
      next[row.symbol] = row;
    });
    if (Object.keys(next).length > 0) {
      setQuotes((prev) => ({ ...prev, ...next }));
      appendHistory(next);
    }
  }, [stableSymbols, appendHistory]);

  React.useEffect(() => {
    if (!enabled) return;
    pollOnce();
    const timer = window.setInterval(pollOnce, 15_000);
    return () => window.clearInterval(timer);
  }, [pollOnce, enabled]);

  // Keep trading socket for orders/fills, but DO NOT apply Nest price_update
  // ticks — they are synthetic and overwrite live Yahoo quotes.
  React.useEffect(() => {
    if (!enabled) return;
    const token = accessToken ?? useAuthStore.getState().accessToken;
    if (!token) return;

    const release = acquireTradingSocket(token);
    setWsConnected(isTradingSocketConnected());
    const id = window.setInterval(() => {
      setWsConnected(isTradingSocketConnected());
    }, 5000);

    return () => {
      window.clearInterval(id);
      release();
      setWsConnected(false);
    };
  }, [enabled, accessToken]);

  return {
    quotes,
    priceHistory,
    // "Live" means REST market feed is populated (not Nest WS).
    wsConnected: Object.keys(quotes).length > 0 || wsConnected,
    refresh: pollOnce,
  };
}
