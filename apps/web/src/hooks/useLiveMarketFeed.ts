'use client';

import React from 'react';
import { apiClient, unwrapApiResponse } from '@/lib/api/client';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import {
  acquireTradingSocket,
  isTradingSocketConnected,
  onPriceUpdate,
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

const REST_CANDIDATE_PATHS = [
  '/market/quote',
  '/market/ticker',
];

const SUPPORTED_SYMBOLS: SupportedSymbol[] = ['BTCUSDT', 'EURUSD', 'XAUUSD'];

/** Demo quotes so dashboard cards never stay on skeleton when API is offline */
const FALLBACK_QUOTES: LiveQuoteMap = {
  BTCUSDT: { symbol: 'BTCUSDT', price: 94_250, change24hPct: 1.24, timestamp: new Date().toISOString(), source: 'rest' },
  EURUSD: { symbol: 'EURUSD', price: 1.0842, change24hPct: -0.18, timestamp: new Date().toISOString(), source: 'rest' },
  XAUUSD: { symbol: 'XAUUSD', price: 2654.3, change24hPct: 0.42, timestamp: new Date().toISOString(), source: 'rest' },
};

const toWsBaseUrl = (raw?: string): string => {
  const fallback = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:4000';
  const value = (raw || fallback).trim();

  if (value.startsWith('ws://')) return `http://${value.slice(5)}`;
  if (value.startsWith('wss://')) return `https://${value.slice(6)}`;
  return value;
};

const normalizeQuote = (raw: unknown, fallbackSymbol?: SupportedSymbol): LiveQuote | null => {
  if (!raw || typeof raw !== 'object') return null;
  const data = raw as Record<string, unknown>;
  const symbol = String(data.symbol ?? fallbackSymbol ?? '').toUpperCase();
  if (!SUPPORTED_SYMBOLS.includes(symbol as SupportedSymbol)) return null;

  const price = Number(data.price ?? data.last ?? data.close);
  const change24hPct = Number(data.change24hPct ?? data.changePct ?? data.change ?? 0);
  if (!Number.isFinite(price)) return null;

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
    const row = unwrapped.find((item) => String((item as Record<string, unknown>)?.symbol ?? '').toUpperCase() === symbol);
    return normalizeQuote(row, symbol);
  }

  if (unwrapped && typeof unwrapped === 'object') {
    const data = unwrapped as Record<string, unknown>;
    if (data[symbol]) return normalizeQuote(data[symbol], symbol);
    return normalizeQuote(unwrapped, symbol);
  }

  return null;
};

const fetchQuoteWithFallback = async (symbol: SupportedSymbol): Promise<LiveQuote | null> => {
  for (const path of REST_CANDIDATE_PATHS) {
    try {
      const response = await apiClient.get(path, { params: { symbol } });
      const quote = pullFirstQuote(response.data, symbol);
      if (quote) return quote;
    } catch {
      // Try the next candidate path.
    }
  }

  return null;
};

type LiveMarketFeedOptions = {
  /** When false, skips REST polling and WebSocket connection. */
  enabled?: boolean;
  /** When false, never seed synthetic quotes (user has a connected broker account). */
  allowFallback?: boolean;
};

export function useLiveMarketFeed(
  symbols: SupportedSymbol[] = SUPPORTED_SYMBOLS,
  options: LiveMarketFeedOptions = {},
) {
  const enabled = options.enabled ?? true;
  const allowFallback = options.allowFallback ?? true;
  const [quotes, setQuotes] = React.useState<LiveQuoteMap>(() =>
    enabled && allowFallback ? { ...FALLBACK_QUOTES } : {},
  );
  const [priceHistory, setPriceHistory] = React.useState<Partial<Record<SupportedSymbol, number[]>>>({});
  const [wsConnected, setWsConnected] = React.useState(false);
  const [lastWsAt, setLastWsAt] = React.useState(0);
  const [wsLive, setWsLive] = React.useState(false);

  const appendHistory = React.useCallback((updates: LiveQuoteMap) => {
    setPriceHistory((prev) => {
      const next = { ...prev };
      Object.entries(updates).forEach(([sym, q]) => {
        if (!q?.price) return;
        const key = sym as SupportedSymbol;
        const hist = next[key] ?? [];
        const last = hist[hist.length - 1];
        // Skip duplicate ticks; keeps sparklines from looking like flat steps.
        if (last !== undefined && Math.abs(last - q.price) < 1e-9) return;
        next[key] = [...hist, q.price].slice(-40);
      });
      return next;
    });
  }, []);

  // Stable key so the effect only re-runs when the symbol list actually changes.
  const symbolsKey = symbols.join(',');
  const stableSymbols = React.useMemo(() => symbols, [symbolsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const pollOnce = React.useCallback(async () => {
    try {
      const response = await apiClient.get('/market/quotes');
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
      // Fall back to per-symbol fetch below.
    }

    const fetched = await Promise.all(stableSymbols.map((symbol) => fetchQuoteWithFallback(symbol)));
    const next: LiveQuoteMap = {};

    fetched.forEach((row) => {
      if (!row) return;
      next[row.symbol] = row;
    });

    if (Object.keys(next).length > 0) {
      setQuotes((prev) => ({ ...prev, ...next }));
      appendHistory(next);
    } else if (allowFallback) {
      setQuotes((prev) => (Object.keys(prev).length ? prev : FALLBACK_QUOTES));
      appendHistory(FALLBACK_QUOTES);
    }
  }, [stableSymbols, appendHistory, allowFallback]);

  React.useEffect(() => {
    if (!enabled) return;
    pollOnce();
    const pollMs = wsLive ? 120_000 : 60_000;
    const timer = window.setInterval(pollOnce, pollMs);
    return () => window.clearInterval(timer);
  }, [pollOnce, enabled, wsLive]);

  React.useEffect(() => {
    if (!enabled) return;

    const token = useAuthStore.getState().accessToken;
    if (!token) return;

    const release = acquireTradingSocket(token);
    setWsConnected(isTradingSocketConnected());

    const unsubPrice = onPriceUpdate((payload: unknown) => {
      const updates: LiveQuoteMap = {};

      if (Array.isArray(payload)) {
        payload.forEach((item) => {
          const normalized = normalizeQuote(item);
          if (normalized) {
            updates[normalized.symbol] = { ...normalized, source: 'ws' };
          }
        });
      } else if (payload && typeof payload === 'object') {
        const data = payload as Record<string, unknown>;
        const direct = normalizeQuote(payload);
        if (direct) {
          updates[direct.symbol] = { ...direct, source: 'ws' };
        } else {
          stableSymbols.forEach((symbol) => {
            const normalized = normalizeQuote(data[symbol], symbol);
            if (normalized) {
              updates[normalized.symbol] = { ...normalized, source: 'ws' };
            }
          });
        }
      }

      if (Object.keys(updates).length > 0) {
        setLastWsAt(Date.now());
        setWsConnected(true);
        setQuotes((prev) => ({ ...prev, ...updates }));
        appendHistory(updates);
      }
    });

    return () => {
      unsubPrice();
      release();
      setWsConnected(false);
      setLastWsAt(0);
    };
  }, [stableSymbols, enabled, appendHistory]);

  React.useEffect(() => {
    if (!enabled) {
      setWsLive(false);
      return;
    }
    const tick = () => setWsLive(wsConnected && Date.now() - lastWsAt < 12_000);
    tick();
    const id = window.setInterval(tick, 3000);
    return () => window.clearInterval(id);
  }, [enabled, wsConnected, lastWsAt]);

  return {
    quotes,
    priceHistory,
    wsConnected: wsLive,
    refresh: pollOnce,
  };
}
