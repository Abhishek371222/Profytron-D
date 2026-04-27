import { Injectable } from '@nestjs/common';

export type MarketSymbol = 'BTCUSDT' | 'EURUSD' | 'XAUUSD';
export type MarketTimeframe = '1m' | '5m' | '15m' | '1h' | '4h' | '1d';

export type OhlcCandle = {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

type TwelveDataSeriesItem = {
  datetime: string;
  open: string;
  high: string;
  low: string;
  close: string;
  volume?: string;
};

type TwelveDataSeriesResponse = {
  status?: string;
  message?: string;
  values?: TwelveDataSeriesItem[];
};

const basePriceBySymbol: Record<MarketSymbol, number> = {
  BTCUSDT: 66800,
  EURUSD: 1.085,
  XAUUSD: 2360,
};

const timeframeSeconds: Record<MarketTimeframe, number> = {
  '1m': 60,
  '5m': 300,
  '15m': 900,
  '1h': 3600,
  '4h': 14400,
  '1d': 86400,
};

const twelveDataSymbolMap: Record<MarketSymbol, string> = {
  BTCUSDT: 'BTC/USD',
  EURUSD: 'EUR/USD',
  XAUUSD: 'XAU/USD',
};

const twelveDataIntervalMap: Record<MarketTimeframe, string> = {
  '1m': '1min',
  '5m': '5min',
  '15m': '15min',
  '1h': '1h',
  '4h': '4h',
  '1d': '1day',
};

@Injectable()
export class MarketService {
  readonly supportedSymbols: MarketSymbol[] = ['BTCUSDT', 'EURUSD', 'XAUUSD'];
  readonly supportedTimeframes: MarketTimeframe[] = [
    '1m',
    '5m',
    '15m',
    '1h',
    '4h',
    '1d',
  ];

  private readonly twelveDataBaseUrl =
    process.env.TWELVE_DATA_BASE_URL?.trim() || 'https://api.twelvedata.com';
  private readonly twelveDataApiKey = process.env.TWELVE_DATA_API_KEY?.trim();

  async getQuote(symbol: MarketSymbol) {
    const response = await this.getOHLC(symbol, '1m', 2);
    const candles = response.candles;
    const previous = candles[candles.length - 2];
    const latest = candles[candles.length - 1];
    const change24hPct = Number(
      (((latest.close - previous.close) / previous.close) * 100).toFixed(4),
    );

    return {
      symbol,
      price: latest.close,
      change24hPct,
      timestamp: new Date().toISOString(),
      source: response.source,
    };
  }

  async getOHLC(symbol: MarketSymbol, timeframe: MarketTimeframe, limit = 220) {
    const safeLimit = Math.max(20, Math.min(500, Math.floor(limit || 220)));
    const liveCandles = await this.fetchTwelveDataOHLC(
      symbol,
      timeframe,
      safeLimit,
    );
    if (liveCandles.length > 0) {
      return {
        symbol,
        timeframe,
        limit: safeLimit,
        candles: liveCandles,
        source: 'twelve-data',
        serverTime: new Date().toISOString(),
      };
    }

    return this.buildSyntheticOHLC(symbol, timeframe, safeLimit);
  }

  private async fetchTwelveDataOHLC(
    symbol: MarketSymbol,
    timeframe: MarketTimeframe,
    limit: number,
  ): Promise<OhlcCandle[]> {
    if (!this.twelveDataApiKey) {
      return [];
    }

    try {
      const query = new URLSearchParams({
        symbol: twelveDataSymbolMap[symbol],
        interval: twelveDataIntervalMap[timeframe],
        outputsize: String(limit),
        order: 'ASC',
        format: 'JSON',
        apikey: this.twelveDataApiKey,
      });

      const response = await fetch(
        `${this.twelveDataBaseUrl}/time_series?${query.toString()}`,
      );
      if (!response.ok) {
        return [];
      }

      const payload = (await response.json()) as TwelveDataSeriesResponse;
      if (payload.status && payload.status.toLowerCase() === 'error') {
        return [];
      }

      const decimals = symbol === 'EURUSD' ? 6 : 2;
      const candles = (payload.values ?? [])
        .map((item) => ({
          time: new Date(item.datetime).toISOString(),
          open: Number(Number(item.open).toFixed(decimals)),
          high: Number(Number(item.high).toFixed(decimals)),
          low: Number(Number(item.low).toFixed(decimals)),
          close: Number(Number(item.close).toFixed(decimals)),
          volume: Number(item.volume ?? '0'),
        }))
        .filter((item) => Number.isFinite(Date.parse(item.time)));

      return candles;
    } catch {
      return [];
    }
  }

  private buildSyntheticOHLC(
    symbol: MarketSymbol,
    timeframe: MarketTimeframe,
    limit = 220,
  ) {
    const interval = timeframeSeconds[timeframe];
    const nowSeconds = Math.floor(Date.now() / 1000);
    const currentBucket = Math.floor(nowSeconds / interval) * interval;
    const firstBucket = currentBucket - (limit - 1) * interval;
    const basePrice = basePriceBySymbol[symbol];

    const candles: OhlcCandle[] = [];
    let previousClose = basePrice;
    for (let index = 0; index < limit; index += 1) {
      const bucket = firstBucket + index * interval;
      const noiseA = this.seededNoise(
        this.hash(`${symbol}-${timeframe}-${bucket}`),
      );
      const noiseB = this.seededNoise(
        this.hash(`${timeframe}-${symbol}-${bucket}-body`),
      );

      const bodySpread = this.getBodySpread(symbol, previousClose);
      const wickSpread = bodySpread * 1.65;

      const open = previousClose + (noiseA - 0.5) * bodySpread;
      const close = open + (noiseB - 0.5) * bodySpread;
      const high =
        Math.max(open, close) + this.seededNoise(index + bucket) * wickSpread;
      const low =
        Math.min(open, close) -
        this.seededNoise(index + bucket + 67) * wickSpread;
      const volume = this.getVolume(symbol, index, bucket);

      candles.push({
        time: new Date(bucket * 1000).toISOString(),
        open: Number(open.toFixed(symbol === 'EURUSD' ? 6 : 2)),
        high: Number(high.toFixed(symbol === 'EURUSD' ? 6 : 2)),
        low: Number(low.toFixed(symbol === 'EURUSD' ? 6 : 2)),
        close: Number(close.toFixed(symbol === 'EURUSD' ? 6 : 2)),
        volume,
      });

      previousClose = close;
    }

    return {
      symbol,
      timeframe,
      limit,
      candles,
      source: 'profytron-market-v1',
      serverTime: new Date().toISOString(),
    };
  }

  private getBodySpread(symbol: MarketSymbol, close: number): number {
    if (symbol === 'BTCUSDT') {
      return Math.max(55, close * 0.0028);
    }
    if (symbol === 'XAUUSD') {
      return Math.max(3.8, close * 0.0019);
    }
    return Math.max(0.00035, close * 0.0012);
  }

  private getVolume(
    symbol: MarketSymbol,
    index: number,
    bucket: number,
  ): number {
    const n = this.seededNoise(index + bucket + this.hash(symbol));
    if (symbol === 'BTCUSDT') {
      return Math.round(120 + n * 950);
    }
    if (symbol === 'XAUUSD') {
      return Math.round(80 + n * 540);
    }
    return Math.round(45 + n * 320);
  }

  private hash(value: string): number {
    let hash = 0;
    for (let index = 0; index < value.length; index += 1) {
      hash = (hash << 5) - hash + value.charCodeAt(index);
      hash |= 0;
    }
    return Math.abs(hash);
  }

  private seededNoise(seed: number): number {
    const value = Math.sin(seed * 12.9898) * 43758.5453;
    return value - Math.floor(value);
  }
}
