import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { RedisService } from '../auth/redis.service';

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

/** TTL constants (seconds) */
const TTL_QUOTE = 30; // price quotes — refresh every 30 s
const TTL_OHLC_SHORT = 30; // 1m/5m/15m candles — short TTL, data changes fast
const TTL_OHLC_LONG = 5 * 60; // 1h/4h/1d candles — slower cadence, cache 5 min

@Injectable()
export class MarketService {
  private readonly logger = new Logger(MarketService.name);
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
  private readonly allowSyntheticFallback =
    process.env.MARKET_ALLOW_SYNTHETIC_FALLBACK !== 'false';

  constructor(private readonly redis: RedisService) {}

  async getQuote(symbol: MarketSymbol) {
    const cacheKey = `market:quote:${symbol}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      this.logger.debug(`Cache hit: quote for ${symbol}`);
      return JSON.parse(cached);
    }

    const response = await this.getOHLC(symbol, '1m', 2);
    const candles = response.candles;
    const previous = candles[candles.length - 2];
    const latest = candles[candles.length - 1];
    const change24hPct = Number(
      (((latest.close - previous.close) / previous.close) * 100).toFixed(4),
    );

    const quote = {
      symbol,
      price: latest.close,
      change24hPct,
      timestamp: new Date().toISOString(),
      source: response.source,
    };

    await this.redis.set(cacheKey, JSON.stringify(quote), TTL_QUOTE);
    return quote;
  }

  async getAllQuotes() {
    const quotes = await Promise.all(
      this.supportedSymbols.map((symbol) => this.getQuote(symbol)),
    );
    return quotes;
  }

  async getOHLC(symbol: MarketSymbol, timeframe: MarketTimeframe, limit = 220) {
    const safeLimit = Math.max(20, Math.min(500, Math.floor(limit || 220)));

    // Use shorter TTL for high-frequency timeframes
    const isShortTimeframe = ['1m', '5m', '15m'].includes(timeframe);
    const ttl = isShortTimeframe ? TTL_OHLC_SHORT : TTL_OHLC_LONG;
    const cacheKey = `market:ohlc:${symbol}:${timeframe}:${safeLimit}`;

    const cached = await this.redis.get(cacheKey);
    if (cached) {
      this.logger.debug(`Cache hit: OHLC ${symbol}/${timeframe}/${safeLimit}`);
      return JSON.parse(cached);
    }

    const liveCandles = await this.fetchTwelveDataOHLC(
      symbol,
      timeframe,
      safeLimit,
    );
    if (liveCandles.length > 0) {
      const result = {
        symbol,
        timeframe,
        limit: safeLimit,
        candles: liveCandles,
        source: 'twelve-data',
        serverTime: new Date().toISOString(),
      };
      await this.redis.set(cacheKey, JSON.stringify(result), ttl);
      return result;
    }

    if (!this.allowSyntheticFallback) {
      throw new ServiceUnavailableException(
        'Live market data unavailable. Configure TWELVE_DATA_API_KEY or enable MARKET_ALLOW_SYNTHETIC_FALLBACK for non-production demos.',
      );
    }

    const syntheticResult = this.buildSyntheticOHLC(
      symbol,
      timeframe,
      safeLimit,
    );
    // Cache synthetic data with the same TTL to avoid re-generating on every request
    await this.redis.set(cacheKey, JSON.stringify(syntheticResult), ttl);
    return syntheticResult;
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

  async getMarketNews(category = 'general', minId = 0) {
    const safeCategory = this.normalizeNewsCategory(category);
    const safeMinId = Math.max(0, Math.floor(minId || 0));
    const cacheKey = `market:news:${safeCategory}:${safeMinId}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const apiKey = process.env.FINNHUB_API_KEY?.trim();
    if (!apiKey) {
      throw new ServiceUnavailableException(
        'Market news unavailable. Configure FINNHUB_API_KEY.',
      );
    }

    const url = new URL('https://finnhub.io/api/v1/news');
    url.searchParams.set('category', safeCategory);
    if (safeMinId > 0) url.searchParams.set('minId', String(safeMinId));
    url.searchParams.set('token', apiKey);

    const response = await fetch(url.toString(), {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(12000),
    });
    if (!response.ok) {
      this.logger.warn(`Finnhub news failed: ${response.status}`);
      throw new ServiceUnavailableException('Unable to fetch market news right now.');
    }

    const payload = (await response.json()) as Array<{
      category?: string;
      datetime?: number;
      headline?: string;
      id?: number;
      image?: string;
      related?: string;
      source?: string;
      summary?: string;
      url?: string;
    }>;

    const items = (Array.isArray(payload) ? payload : [])
      .filter((item) => item?.headline && item?.url)
      .slice(0, 40)
      .map((item) => ({
        id: item.id ?? 0,
        category: item.category || safeCategory,
        datetime: item.datetime
          ? new Date(item.datetime * 1000).toISOString()
          : new Date().toISOString(),
        headline: item.headline || '',
        image: item.image || null,
        related: item.related || '',
        source: item.source || 'Finnhub',
        summary: item.summary || '',
        url: item.url || '',
      }));

    const result = {
      category: safeCategory,
      count: items.length,
      items,
      source: 'finnhub',
      serverTime: new Date().toISOString(),
    };
    // Cache 2 minutes to stay within free-tier rate limits for many users.
    await this.redis.set(cacheKey, JSON.stringify(result), 120);
    return result;
  }

  async getCompanyNews(symbol: string, from?: string, to?: string) {
    const safeSymbol = (symbol || 'AAPL').toUpperCase().trim();
    const toDate = to || new Date().toISOString().slice(0, 10);
    const fromDate =
      from ||
      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const cacheKey = `market:company-news:${safeSymbol}:${fromDate}:${toDate}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const apiKey = process.env.FINNHUB_API_KEY?.trim();
    if (!apiKey) {
      throw new ServiceUnavailableException(
        'Company news unavailable. Configure FINNHUB_API_KEY.',
      );
    }

    const url = new URL('https://finnhub.io/api/v1/company-news');
    url.searchParams.set('symbol', safeSymbol);
    url.searchParams.set('from', fromDate);
    url.searchParams.set('to', toDate);
    url.searchParams.set('token', apiKey);

    const response = await fetch(url.toString(), {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(12000),
    });
    if (!response.ok) {
      throw new ServiceUnavailableException('Unable to fetch company news right now.');
    }

    const payload = (await response.json()) as Array<{
      category?: string;
      datetime?: number;
      headline?: string;
      id?: number;
      image?: string;
      related?: string;
      source?: string;
      summary?: string;
      url?: string;
    }>;

    const items = (Array.isArray(payload) ? payload : [])
      .filter((item) => item?.headline && item?.url)
      .slice(0, 30)
      .map((item) => ({
        id: item.id ?? 0,
        category: item.category || 'company',
        datetime: item.datetime
          ? new Date(item.datetime * 1000).toISOString()
          : new Date().toISOString(),
        headline: item.headline || '',
        image: item.image || null,
        related: item.related || safeSymbol,
        source: item.source || 'Finnhub',
        summary: item.summary || '',
        url: item.url || '',
      }));

    const result = {
      symbol: safeSymbol,
      from: fromDate,
      to: toDate,
      count: items.length,
      items,
      source: 'finnhub',
      serverTime: new Date().toISOString(),
    };
    await this.redis.set(cacheKey, JSON.stringify(result), 180);
    return result;
  }

  async getEconomicCalendar(from?: string, to?: string) {
    const toDate = to || new Date().toISOString().slice(0, 10);
    const fromDate =
      from ||
      new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const cacheKey = `market:econ-calendar:v2:${fromDate}:${toDate}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    // 1) Finnhub (paid plans only — free tier returns 403)
    const finnhub = await this.fetchFinnhubEconomicCalendar(fromDate, toDate);
    if (finnhub) {
      await this.redis.set(cacheKey, JSON.stringify(finnhub), 300);
      return finnhub;
    }

    // 2) Free Forex Factory feed via Fair Economy (this week)
    const ff = await this.fetchForexFactoryCalendar(fromDate, toDate);
    if (ff) {
      await this.redis.set(cacheKey, JSON.stringify(ff), 300);
      return ff;
    }

    throw new ServiceUnavailableException(
      'Unable to fetch economic calendar right now.',
    );
  }

  private async fetchFinnhubEconomicCalendar(fromDate: string, toDate: string) {
    const apiKey = process.env.FINNHUB_API_KEY?.trim();
    if (!apiKey) return null;

    try {
      const url = new URL('https://finnhub.io/api/v1/calendar/economic');
      url.searchParams.set('from', fromDate);
      url.searchParams.set('to', toDate);
      url.searchParams.set('token', apiKey);

      const response = await fetch(url.toString(), {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(12000),
      });
      if (!response.ok) {
        this.logger.warn(
          `Finnhub economic calendar unavailable (${response.status}); using free feed fallback`,
        );
        return null;
      }

      const payload = (await response.json()) as {
        economicCalendar?: Array<{
          actual?: number | null;
          country?: string;
          estimate?: number | null;
          event?: string;
          impact?: string;
          prev?: number | null;
          time?: string;
          unit?: string;
        }>;
      };

      const events = (payload?.economicCalendar ?? [])
        .filter((e) => e?.event && e?.time)
        .map((e) => ({
          event: e.event || '',
          country: e.country || '',
          impact: String(e.impact || 'low').toLowerCase(),
          time: e.time || '',
          actual: e.actual ?? null,
          estimate: e.estimate ?? null,
          prev: e.prev ?? null,
          unit: e.unit || '',
        }))
        .sort((a, b) => a.time.localeCompare(b.time))
        .slice(0, 40);

      return {
        from: fromDate,
        to: toDate,
        count: events.length,
        events,
        source: 'finnhub',
        serverTime: new Date().toISOString(),
      };
    } catch (err: any) {
      this.logger.warn(`Finnhub calendar error: ${err?.message || err}`);
      return null;
    }
  }

  /** Free public Forex Factory calendar (Fair Economy NFS). */
  private async fetchForexFactoryCalendar(fromDate: string, toDate: string) {
    try {
      const response = await fetch(
        'https://nfs.faireconomy.media/ff_calendar_thisweek.json',
        {
          headers: {
            Accept: 'application/json',
            'User-Agent': 'Profytron/1.0',
          },
          signal: AbortSignal.timeout(12000),
        },
      );
      if (!response.ok) {
        this.logger.warn(`Forex Factory calendar failed: ${response.status}`);
        return null;
      }

      const payload = (await response.json()) as Array<{
        title?: string;
        country?: string;
        date?: string;
        impact?: string;
        forecast?: string;
        previous?: string;
        actual?: string;
      }>;

      const fromMs = new Date(`${fromDate}T00:00:00.000Z`).getTime();
      const toMs = new Date(`${toDate}T23:59:59.999Z`).getTime();

      const events = (Array.isArray(payload) ? payload : [])
        .filter((e) => e?.title && e?.date)
        .map((e) => {
          const time = new Date(e.date as string).toISOString();
          const impact = String(e.impact || 'low').toLowerCase();
          return {
            event: e.title || '',
            country: e.country || '',
            impact:
              impact === 'high' || impact === 'medium' || impact === 'low'
                ? impact
                : 'low',
            time,
            actual: this.parseCalendarValue(e.actual),
            estimate: this.parseCalendarValue(e.forecast),
            prev: this.parseCalendarValue(e.previous),
            unit: '',
            actualDisplay: (e.actual || '').trim() || null,
            estimateDisplay: (e.forecast || '').trim() || null,
            prevDisplay: (e.previous || '').trim() || null,
          };
        })
        .filter((e) => {
          const t = new Date(e.time).getTime();
          if (!Number.isFinite(t)) return false;
          // Keep this-week feed rows that fall in the requested window,
          // plus anything still upcoming.
          return t >= fromMs && t <= toMs;
        })
        .sort((a, b) => {
          const nowMs = Date.now();
          const aUp = new Date(a.time).getTime() >= nowMs ? 0 : 1;
          const bUp = new Date(b.time).getTime() >= nowMs ? 0 : 1;
          if (aUp !== bUp) return aUp - bUp;
          const impactRank = (i: string) =>
            i === 'high' ? 0 : i === 'medium' ? 1 : 2;
          const ir = impactRank(a.impact) - impactRank(b.impact);
          if (ir !== 0) return ir;
          return a.time.localeCompare(b.time);
        })
        .slice(0, 40);

      return {
        from: fromDate,
        to: toDate,
        count: events.length,
        events,
        source: 'forexfactory',
        serverTime: new Date().toISOString(),
      };
    } catch (err: any) {
      this.logger.warn(`Forex Factory calendar error: ${err?.message || err}`);
      return null;
    }
  }

  private parseCalendarValue(value?: string | null): number | null {
    if (value == null) return null;
    const cleaned = String(value).replace(/[%KMB,\s]/gi, '').trim();
    if (!cleaned) return null;
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : null;
  }

  private normalizeNewsCategory(value?: string): string {
    const allowed = new Set(['general', 'forex', 'crypto', 'merger']);
    const normalized = (value || 'general').toLowerCase().trim();
    return allowed.has(normalized) ? normalized : 'general';
  }
}
