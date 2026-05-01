'use client';

import React from 'react';
import { io, type Socket } from 'socket.io-client';
import { apiClient, unwrapApiResponse } from '@/lib/api/client';
import { useAuthStore } from '@/lib/stores/useAuthStore';

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

export function useLiveMarketFeed(symbols: SupportedSymbol[] = SUPPORTED_SYMBOLS) {
  const [quotes, setQuotes] = React.useState<LiveQuoteMap>({});
  const [wsConnected, setWsConnected] = React.useState(false);
  const socketRef = React.useRef<Socket | null>(null);

  // Stable key so the effect only re-runs when the symbol list actually changes.
  const symbolsKey = symbols.join(',');
  const stableSymbols = React.useMemo(() => symbols, [symbolsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const pollOnce = React.useCallback(async () => {
    const rows = await Promise.all(stableSymbols.map((symbol) => fetchQuoteWithFallback(symbol)));
    const next: LiveQuoteMap = {};

    rows.forEach((row) => {
      if (!row) return;
      next[row.symbol] = row;
    });

    if (Object.keys(next).length > 0) {
      setQuotes((prev) => ({ ...prev, ...next }));
    }
  }, [stableSymbols]);

  // REST polling — paused while WebSocket is delivering live updates.
  React.useEffect(() => {
    if (wsConnected) return;
    pollOnce();
    const timer = window.setInterval(pollOnce, 4000);
    return () => window.clearInterval(timer);
  }, [pollOnce, wsConnected]);

  React.useEffect(() => {
    const token = useAuthStore.getState().accessToken;
    if (!token) return;

    const wsBase = toWsBaseUrl(process.env.NEXT_PUBLIC_WS_URL || process.env.NEXT_PUBLIC_BACKEND_URL);
    const socket = io(`${wsBase}/trading`, {
      transports: ['websocket', 'polling'],
      auth: { token },
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setWsConnected(true);
      socket.emit('subscribe_prices');
    });

    socket.on('disconnect', () => {
      setWsConnected(false);
    });

    socket.on('price_update', (payload: unknown) => {
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
        setQuotes((prev) => ({ ...prev, ...updates }));
      }
    });

    return () => {
      socket.emit('unsubscribe_prices');
      socket.disconnect();
      socketRef.current = null;
      setWsConnected(false);
    };
  }, [stableSymbols]);

  return {
    quotes,
    wsConnected,
    refresh: pollOnce,
  };
}
