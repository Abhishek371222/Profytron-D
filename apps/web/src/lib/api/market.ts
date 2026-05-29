import { apiClient } from './client';

export type MarketSymbol = 'BTCUSDT' | 'EURUSD' | 'XAUUSD';
export type MarketTimeframe = '1m' | '5m' | '15m' | '1h' | '4h' | '1d';

const unwrap = <T>(payload: any): T => {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return payload.data as T;
  }
  return payload as T;
};

export interface MarketOhlcCandle {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MarketOhlcResponse {
  symbol: MarketSymbol;
  timeframe: MarketTimeframe;
  limit: number;
  candles: MarketOhlcCandle[];
  source: string;
  serverTime: string;
}

export interface MarketQuoteResponse {
  symbol: MarketSymbol;
  price: number;
  change24hPct: number;
  timestamp: string;
  source: string;
}

export const marketApi = {
  async getOHLC(params: {
    symbol: MarketSymbol;
    timeframe: MarketTimeframe;
    limit?: number;
  }) {
    const response = await apiClient.get('/market/ohlc', {
      params: {
        symbol: params.symbol,
        timeframe: params.timeframe,
        limit: params.limit ?? 220,
      },
    });
    return unwrap<MarketOhlcResponse>(response.data);
  },

  async getQuote(symbol: MarketSymbol) {
    const response = await apiClient.get('/market/quote', {
      params: { symbol },
    });
    return unwrap<MarketQuoteResponse>(response.data);
  },
};
