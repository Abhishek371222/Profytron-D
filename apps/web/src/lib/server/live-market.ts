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

export type LiveQuote = {
  symbol: MarketSymbol;
  price: number;
  change24hPct: number;
  timestamp: string;
  source: string;
};

/** Yahoo works from Vercel; Binance is often blocked on serverless IPs. */
const YAHOO_SYMBOL: Record<MarketSymbol, string> = {
  BTCUSDT: 'BTC-USD',
  EURUSD: 'EURUSD=X',
  XAUUSD: 'XAUUSD=X', // spot gold; falls back to GC=F
};

const YAHOO_FALLBACK: Partial<Record<MarketSymbol, string>> = {
  XAUUSD: 'GC=F',
};

const YAHOO_INTERVAL: Record<MarketTimeframe, string> = {
  '1m': '1m',
  '5m': '5m',
  '15m': '15m',
  '1h': '60m',
  '4h': '60m',
  '1d': '1d',
};

const YAHOO_RANGE: Record<MarketTimeframe, string> = {
  '1m': '1d',
  '5m': '5d',
  '15m': '5d',
  '1h': '1mo',
  '4h': '3mo',
  '1d': '1y',
};

function toIso(ms: number) {
  return new Date(ms).toISOString();
}

function aggregateTo4h(candles: OhlcCandle[]): OhlcCandle[] {
  const buckets = new Map<number, OhlcCandle>();
  for (const c of candles) {
    const ms = new Date(c.time).getTime();
    const bucket = Math.floor(ms / (4 * 3600_000)) * (4 * 3600_000);
    const prev = buckets.get(bucket);
    if (!prev) {
      buckets.set(bucket, { ...c, time: toIso(bucket) });
    } else {
      buckets.set(bucket, {
        time: toIso(bucket),
        open: prev.open,
        high: Math.max(prev.high, c.high),
        low: Math.min(prev.low, c.low),
        close: c.close,
        volume: prev.volume + c.volume,
      });
    }
  }
  return [...buckets.values()].sort(
    (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime(),
  );
}

async function fetchYahooChart(yahooSymbol: string, timeframe: MarketTimeframe) {
  const interval = YAHOO_INTERVAL[timeframe];
  const range = YAHOO_RANGE[timeframe];
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?interval=${interval}&range=${range}`;
  const res = await fetch(url, {
    cache: 'no-store',
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; ProfytronMarket/1.1)',
      Accept: 'application/json',
    },
  });
  if (!res.ok) throw new Error(`Yahoo chart ${yahooSymbol} ${res.status}`);
  return res.json();
}

function parseYahooCandles(body: any, timeframe: MarketTimeframe, limit: number): OhlcCandle[] {
  const result = body?.chart?.result?.[0];
  const ts: number[] = result?.timestamp ?? [];
  const q = result?.indicators?.quote?.[0] ?? {};
  const opens: Array<number | null> = q.open ?? [];
  const highs: Array<number | null> = q.high ?? [];
  const lows: Array<number | null> = q.low ?? [];
  const closes: Array<number | null> = q.close ?? [];
  const volumes: Array<number | null> = q.volume ?? [];

  let candles: OhlcCandle[] = [];
  for (let i = 0; i < ts.length; i++) {
    const open = Number(opens[i]);
    const high = Number(highs[i]);
    const low = Number(lows[i]);
    const close = Number(closes[i]);
    if (![open, high, low, close].every(Number.isFinite)) continue;
    candles.push({
      time: toIso(ts[i] * 1000),
      open,
      high,
      low,
      close,
      volume: Number(volumes[i] ?? 0) || 0,
    });
  }

  if (timeframe === '4h') candles = aggregateTo4h(candles);
  return candles.slice(-limit);
}

async function fetchYahooOhlc(
  symbol: MarketSymbol,
  timeframe: MarketTimeframe,
  limit: number,
): Promise<OhlcCandle[]> {
  const primary = YAHOO_SYMBOL[symbol];
  try {
    const body = await fetchYahooChart(primary, timeframe);
    const candles = parseYahooCandles(body, timeframe, limit);
    if (candles.length) return candles;
  } catch {
    // try fallback ticker
  }
  const fallback = YAHOO_FALLBACK[symbol];
  if (!fallback) throw new Error(`No Yahoo OHLC for ${symbol}`);
  const body = await fetchYahooChart(fallback, timeframe);
  const candles = parseYahooCandles(body, timeframe, limit);
  if (!candles.length) throw new Error(`Empty Yahoo OHLC for ${symbol}`);
  return candles;
}

async function fetchYahooQuote(symbol: MarketSymbol): Promise<LiveQuote> {
  const candles = await fetchYahooOhlc(symbol, '1d', 5);
  const last = candles[candles.length - 1];
  const prev = candles[candles.length - 2] ?? last;
  const change24hPct =
    prev.close > 0 ? ((last.close - prev.close) / prev.close) * 100 : 0;
  return {
    symbol,
    price: last.close,
    change24hPct,
    timestamp: last.time,
    source: 'yahoo',
  };
}

/** CoinGecko as BTC backup when Yahoo is slow. */
async function fetchCoinGeckoBtc(): Promise<LiveQuote> {
  const res = await fetch(
    'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true',
    { cache: 'no-store', headers: { Accept: 'application/json' } },
  );
  if (!res.ok) throw new Error(`CoinGecko ${res.status}`);
  const body = await res.json();
  const price = Number(body?.bitcoin?.usd);
  const change = Number(body?.bitcoin?.usd_24h_change ?? 0);
  if (!Number.isFinite(price) || price <= 0) throw new Error('CoinGecko empty');
  return {
    symbol: 'BTCUSDT',
    price,
    change24hPct: change,
    timestamp: new Date().toISOString(),
    source: 'coingecko',
  };
}

export async function fetchLiveOhlc(
  symbol: MarketSymbol,
  timeframe: MarketTimeframe,
  limit = 72,
): Promise<{ candles: OhlcCandle[]; source: string }> {
  const safeLimit = Math.min(Math.max(limit, 10), 500);
  const candles = await fetchYahooOhlc(symbol, timeframe, safeLimit);
  return { candles, source: 'yahoo' };
}

export async function fetchLiveQuote(symbol: MarketSymbol): Promise<LiveQuote> {
  try {
    return await fetchYahooQuote(symbol);
  } catch (err) {
    if (symbol === 'BTCUSDT') return fetchCoinGeckoBtc();
    throw err;
  }
}

export async function fetchLiveQuotes(
  symbols: MarketSymbol[] = ['BTCUSDT', 'EURUSD', 'XAUUSD'],
): Promise<LiveQuote[]> {
  const results = await Promise.allSettled(symbols.map((s) => fetchLiveQuote(s)));
  const quotes = results
    .filter((r): r is PromiseFulfilledResult<LiveQuote> => r.status === 'fulfilled')
    .map((r) => r.value);

  // Ensure BTC is present even if Yahoo failed mid-batch.
  if (!quotes.some((q) => q.symbol === 'BTCUSDT') && symbols.includes('BTCUSDT')) {
    try {
      quotes.unshift(await fetchCoinGeckoBtc());
    } catch {
      /* ignore */
    }
  }

  return quotes;
}

/** Reject Nest synthetic ticks so WS cannot overwrite live REST prices. */
export function looksLikeSyntheticQuote(symbol: string, price: number): boolean {
  if (!Number.isFinite(price) || price <= 0) return true;
  const s = symbol.toUpperCase();
  // Known Nest demo bands from market.service basePriceBySymbol ± drift
  if (s === 'BTCUSDT' || s === 'BTCUSD') {
    return price > 65000 && price < 69000;
  }
  if (s === 'EURUSD') {
    return price > 1.08 && price < 1.09;
  }
  if (s === 'XAUUSD' || s === 'XAU') {
    return price > 2300 && price < 2450;
  }
  return false;
}
