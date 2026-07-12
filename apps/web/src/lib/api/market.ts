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

export type MarketNewsCategory = 'general' | 'forex' | 'crypto' | 'merger';

export interface MarketNewsItem {
  id: number;
  category: string;
  datetime: string;
  headline: string;
  image: string | null;
  related: string;
  source: string;
  summary: string;
  url: string;
}

export interface MarketNewsResponse {
  category: string;
  count: number;
  items: MarketNewsItem[];
  source: string;
  serverTime: string;
}

export interface EconomicCalendarEvent {
  event: string;
  country: string;
  impact: string;
  time: string;
  actual: number | null;
  estimate: number | null;
  prev: number | null;
  unit: string;
  actualDisplay?: string | null;
  estimateDisplay?: string | null;
  prevDisplay?: string | null;
}

export interface EconomicCalendarResponse {
  from: string;
  to: string;
  count: number;
  events: EconomicCalendarEvent[];
  source: string;
  serverTime: string;
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

  async getQuotes() {
    const response = await apiClient.get('/market/quotes');
    return unwrap<MarketQuoteResponse[]>(response.data);
  },

  async getNews(params?: { category?: MarketNewsCategory; minId?: number }) {
    const response = await apiClient.get('/market/news', {
      params: {
        category: params?.category ?? 'general',
        minId: params?.minId ?? 0,
      },
    });
    return unwrap<MarketNewsResponse>(response.data);
  },

  async getCompanyNews(params: { symbol: string; from?: string; to?: string }) {
    const response = await apiClient.get('/market/company-news', {
      params,
    });
    return unwrap<MarketNewsResponse & { symbol: string; from: string; to: string }>(
      response.data,
    );
  },

  async getEconomicCalendar(params?: { from?: string; to?: string }) {
    const response = await apiClient.get('/market/economic-calendar', {
      params,
    });
    return unwrap<EconomicCalendarResponse>(response.data);
  },

  async getBias(params: {
    symbol: MarketSymbol;
    frames: Array<{
      timeframe: string;
      open: number;
      high: number;
      low: number;
      close: number;
      changePct: number;
      closes?: number[];
    }>;
  }) {
    const response = await apiClient.post('/market/bias', params);
    return unwrap<{
      symbol: string;
      biases: Record<
        string,
        {
          direction: 'bullish' | 'bearish' | 'neutral';
          confidence: number;
          note: string;
          trend: string;
          trade: string;
          source: string;
        }
      >;
    }>(response.data);
  },
};
