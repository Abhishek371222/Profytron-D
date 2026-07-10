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

const BINANCE_INTERVAL: Record<MarketTimeframe, string> = {
  '1m': '1m',
  '5m': '5m',
  '15m': '15m',
  '1h': '1h',
  '4h': '4h',
  '1d': '1d',
};

const YAHOO_SYMBOL: Record<Exclude<MarketSymbol, 'BTCUSDT'>, string> = {
  EURUSD: 'EURUSD=X',
  XAUUSD: 'GC=F', // COMEX gold — closest free liquid gold feed
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

async function fetchBinanceKlines(
  timeframe: MarketTimeframe,
  limit: number,
): Promise<OhlcCandle[]> {
  const res = await fetch(
    `https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=${BINANCE_INTERVAL[timeframe]}&limit=${limit}`,
    { cache: 'no-store', next: { revalidate: 0 } },
  );
  if (!res.ok) throw new Error(`Binance klines ${res.status}`);
  const rows = (await res.json()) as any[];
  return rows.map((k) => ({
    time: toIso(Number(k[0])),
    open: Number(k[1]),
    high: Number(k[2]),
    low: Number(k[3]),
    close: Number(k[4]),
    volume: Number(k[5]),
  }));
}

async function fetchBinanceQuote(): Promise<LiveQuote> {
  const res = await fetch(
    'https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT',
    { cache: 'no-store' },
  );
  if (!res.ok) throw new Error(`Binance ticker ${res.status}`);
  const t = await res.json();
  return {
    symbol: 'BTCUSDT',
    price: Number(t.lastPrice),
    change24hPct: Number(t.priceChangePercent),
    timestamp: new Date().toISOString(),
    source: 'binance',
  };
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

async function fetchYahooOhlc(
  symbol: Exclude<MarketSymbol, 'BTCUSDT'>,
  timeframe: MarketTimeframe,
  limit: number,
): Promise<OhlcCandle[]> {
  const yahoo = YAHOO_SYMBOL[symbol];
  const interval = YAHOO_INTERVAL[timeframe];
  const range = YAHOO_RANGE[timeframe];
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahoo)}?interval=${interval}&range=${range}`;
  const res = await fetch(url, {
    cache: 'no-store',
    headers: {
      'User-Agent': 'Mozilla/5.0 ProfytronMarket/1.0',
      Accept: 'application/json',
    },
  });
  if (!res.ok) throw new Error(`Yahoo chart ${res.status}`);
  const body = await res.json();
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

  if (timeframe === '4h') {
    candles = aggregateTo4h(candles);
  }

  return candles.slice(-limit);
}

async function fetchYahooQuote(
  symbol: Exclude<MarketSymbol, 'BTCUSDT'>,
): Promise<LiveQuote> {
  const candles = await fetchYahooOhlc(symbol, '1d', 5);
  if (candles.length < 1) throw new Error(`No Yahoo quote for ${symbol}`);
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

export async function fetchLiveOhlc(
  symbol: MarketSymbol,
  timeframe: MarketTimeframe,
  limit = 72,
): Promise<{ candles: OhlcCandle[]; source: string }> {
  const safeLimit = Math.min(Math.max(limit, 10), 500);
  if (symbol === 'BTCUSDT') {
    const candles = await fetchBinanceKlines(timeframe, safeLimit);
    return { candles, source: 'binance' };
  }
  const candles = await fetchYahooOhlc(symbol, timeframe, safeLimit);
  return { candles, source: 'yahoo' };
}

export async function fetchLiveQuote(symbol: MarketSymbol): Promise<LiveQuote> {
  if (symbol === 'BTCUSDT') return fetchBinanceQuote();
  return fetchYahooQuote(symbol);
}

export async function fetchLiveQuotes(
  symbols: MarketSymbol[] = ['BTCUSDT', 'EURUSD', 'XAUUSD'],
): Promise<LiveQuote[]> {
  const results = await Promise.allSettled(symbols.map((s) => fetchLiveQuote(s)));
  return results
    .filter((r): r is PromiseFulfilledResult<LiveQuote> => r.status === 'fulfilled')
    .map((r) => r.value);
}
