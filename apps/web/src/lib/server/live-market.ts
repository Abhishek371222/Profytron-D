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

/** Prefer the same venues as the TradingView chart on Markets. */
const TV_TICKER: Record<MarketSymbol, { market: string; ticker: string }> = {
  XAUUSD: { market: 'cfd', ticker: 'OANDA:XAUUSD' },
  EURUSD: { market: 'forex', ticker: 'OANDA:EURUSD' },
  BTCUSDT: { market: 'crypto', ticker: 'BINANCE:BTCUSDT' },
};

async function fetchTradingViewQuote(symbol: MarketSymbol): Promise<LiveQuote> {
  const { market, ticker } = TV_TICKER[symbol];
  const res = await fetch(`https://scanner.tradingview.com/${market}/scan`, {
    method: 'POST',
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'User-Agent': 'Mozilla/5.0 (compatible; ProfytronMarket/1.2)',
    },
    body: JSON.stringify({
      symbols: { tickers: [ticker], query: { types: [] } },
      columns: ['close', 'change', 'change_percent', 'description'],
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`TradingView ${ticker} ${res.status}`);
  const body = (await res.json()) as {
    data?: Array<{ s?: string; d?: Array<number | string | null> }>;
  };
  const row = body.data?.find((item) => item.s === ticker) ?? body.data?.[0];
  const close = Number(row?.d?.[0]);
  const changePct = Number(row?.d?.[1]);
  if (!Number.isFinite(close) || close <= 0) {
    throw new Error(`TradingView empty quote for ${ticker}`);
  }
  return {
    symbol,
    price: close,
    change24hPct: Number.isFinite(changePct) ? changePct : 0,
    timestamp: new Date().toISOString(),
    source: 'tradingview',
  };
}

async function fetchTradingViewQuotes(
  symbols: MarketSymbol[],
): Promise<Partial<Record<MarketSymbol, LiveQuote>>> {
  const byMarket = new Map<string, MarketSymbol[]>();
  for (const symbol of symbols) {
    const market = TV_TICKER[symbol].market;
    const list = byMarket.get(market) ?? [];
    list.push(symbol);
    byMarket.set(market, list);
  }

  const out: Partial<Record<MarketSymbol, LiveQuote>> = {};
  await Promise.all(
    [...byMarket.entries()].map(async ([market, marketSymbols]) => {
      const tickers = marketSymbols.map((s) => TV_TICKER[s].ticker);
      try {
        const res = await fetch(`https://scanner.tradingview.com/${market}/scan`, {
          method: 'POST',
          cache: 'no-store',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'User-Agent': 'Mozilla/5.0 (compatible; ProfytronMarket/1.2)',
          },
          body: JSON.stringify({
            symbols: { tickers, query: { types: [] } },
            columns: ['close', 'change', 'change_percent', 'description'],
          }),
          signal: AbortSignal.timeout(10_000),
        });
        if (!res.ok) return;
        const body = (await res.json()) as {
          data?: Array<{ s?: string; d?: Array<number | string | null> }>;
        };
        for (const symbol of marketSymbols) {
          const ticker = TV_TICKER[symbol].ticker;
          const row = body.data?.find((item) => item.s === ticker);
          const close = Number(row?.d?.[0]);
          const changePct = Number(row?.d?.[1]);
          if (!Number.isFinite(close) || close <= 0) continue;
          out[symbol] = {
            symbol,
            price: close,
            change24hPct: Number.isFinite(changePct) ? changePct : 0,
            timestamp: new Date().toISOString(),
            source: 'tradingview',
          };
        }
      } catch {
        /* fall through to Yahoo per-symbol */
      }
    }),
  );
  return out;
}

/** Yahoo works from Vercel; Binance is often blocked on serverless IPs. */
const YAHOO_SYMBOL: Record<MarketSymbol, string> = {
  BTCUSDT: 'BTC-USD',
  EURUSD: 'EURUSD=X',
  // XAUUSD=X often 404s; use COMEX futures and overwrite live price via TradingView.
  XAUUSD: 'GC=F',
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
    if (!(c.close > 0 && c.open > 0)) continue;
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
    // Yahoo pads off-session bars with null → Number(null) === 0; skip those.
    const openRaw = opens[i];
    const highRaw = highs[i];
    const lowRaw = lows[i];
    const closeRaw = closes[i];
    if (
      openRaw == null ||
      highRaw == null ||
      lowRaw == null ||
      closeRaw == null
    ) {
      continue;
    }
    const open = Number(openRaw);
    const high = Number(highRaw);
    const low = Number(lowRaw);
    const close = Number(closeRaw);
    if (![open, high, low, close].every((v) => Number.isFinite(v) && v > 0)) {
      continue;
    }
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
  // Prefer recent intraday bars so quotes move during the session.
  let candles: OhlcCandle[] = [];
  try {
    candles = await fetchYahooOhlc(symbol, '15m', 40);
  } catch {
    candles = [];
  }
  if (candles.length < 2) {
    candles = await fetchYahooOhlc(symbol, '1h', 48);
  }
  if (candles.length < 2) {
    candles = await fetchYahooOhlc(symbol, '1d', 5);
  }
  const last = candles[candles.length - 1];
  const prev = candles[candles.length - 2] ?? last;
  if (!last || !(last.close > 0)) {
    throw new Error(`Empty Yahoo quote for ${symbol}`);
  }
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
    return await fetchTradingViewQuote(symbol);
  } catch {
    /* Yahoo / CoinGecko fallback */
  }
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
  const tv = await fetchTradingViewQuotes(symbols);
  const quotes: LiveQuote[] = [];

  for (const symbol of symbols) {
    if (tv[symbol]) {
      quotes.push(tv[symbol]!);
      continue;
    }
    try {
      quotes.push(await fetchLiveQuote(symbol));
    } catch {
      /* skip missing symbol */
    }
  }

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
