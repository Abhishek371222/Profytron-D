'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  Clock3,
  ExternalLink,
  Newspaper,
  RefreshCcw,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import {
  DashboardPage,
  DashboardBreadcrumbs,
  DashboardPageHeader,
} from '@/components/dashboard/DashboardPrimitives';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  marketApi,
  type MarketNewsCategory,
  type MarketNewsItem,
  type MarketOhlcCandle,
  type MarketQuoteResponse,
  type MarketSymbol,
  type MarketTimeframe,
} from '@/lib/api/market';
import {
  isUsableNewsImageUrl,
  newsImageSrc,
  newsWithImages,
} from '@/lib/market/news-image';
import { getMarketSessionState } from '@/lib/market/session-schedule';

const TradingViewAdvancedChart = dynamic(
  () => import('@/components/charts/TradingViewAdvancedChart'),
  {
    ssr: false,
    loading: () => (
      <div className="h-[480px] w-full animate-pulse rounded-2xl border border-[var(--card-border)] bg-muted/40" />
    ),
  },
);

const NEWS_CATEGORIES: { id: MarketNewsCategory; label: string }[] = [
  { id: 'general', label: 'General' },
  { id: 'forex', label: 'Forex' },
  { id: 'crypto', label: 'Crypto' },
  { id: 'merger', label: 'M&A' },
];

const CHART_SYMBOLS: {
  id: MarketSymbol;
  tv: string;
  label: string;
  pair: string;
}[] = [
  { id: 'XAUUSD', tv: 'OANDA:XAUUSD', label: 'Gold', pair: 'XAU/USD' },
  { id: 'EURUSD', tv: 'OANDA:EURUSD', label: 'Euro', pair: 'EUR/USD' },
  { id: 'BTCUSDT', tv: 'BINANCE:BTCUSDT', label: 'Bitcoin', pair: 'BTC/USDT' },
];

const OHLC_FRAMES: { id: MarketTimeframe; label: string }[] = [
  { id: '1h', label: '1H' },
  { id: '4h', label: '4H' },
  { id: '1d', label: '1D' },
];

const IST = 'Asia/Kolkata';

const SESSIONS: {
  name: string;
  city: string;
  openIstMin: number;
  closeIstMin: number;
  openLabel: string;
  closeLabel: string;
}[] = [
  {
    name: 'Sydney',
    city: 'AUD',
    openIstMin: 2 * 60 + 30,
    closeIstMin: 11 * 60 + 30,
    openLabel: '02:30',
    closeLabel: '11:30',
  },
  {
    name: 'Tokyo',
    city: 'Asia',
    openIstMin: 5 * 60 + 30,
    closeIstMin: 14 * 60 + 30,
    openLabel: '05:30',
    closeLabel: '14:30',
  },
  {
    name: 'London',
    city: 'Europe',
    openIstMin: 12 * 60 + 30,
    closeIstMin: 21 * 60 + 30,
    openLabel: '12:30',
    closeLabel: '21:30',
  },
  {
    name: 'New York',
    city: 'US',
    openIstMin: 17 * 60 + 30,
    closeIstMin: 2 * 60 + 30,
    openLabel: '17:30',
    closeLabel: '02:30',
  },
];

function minutesInTimeZone(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? 0) % 24;
  const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? 0);
  return hour * 60 + minute;
}

function sessionOpenIst(
  openIstMin: number,
  closeIstMin: number,
  nowIstMin: number,
) {
  if (openIstMin < closeIstMin) {
    return nowIstMin >= openIstMin && nowIstMin < closeIstMin;
  }
  return nowIstMin >= openIstMin || nowIstMin < closeIstMin;
}

function formatIstClock(date: Date) {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: IST,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date);
}

function formatIstWeekday(date: Date) {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: IST,
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  }).format(date);
}

function formatNewsTime(value: string) {
  try {
    return new Intl.DateTimeFormat('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: IST,
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function formatPrice(symbol: string, price: number) {
  if (!Number.isFinite(price)) return '—';
  if (symbol.includes('BTC')) {
    return price.toLocaleString('en-US', { maximumFractionDigits: 0 });
  }
  if (symbol.includes('XAU')) {
    return price.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
  return price.toLocaleString('en-US', {
    minimumFractionDigits: 5,
    maximumFractionDigits: 5,
  });
}

function formatPct(value: number) {
  if (!Number.isFinite(value)) return '0.00%';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

function cleanSummary(item: MarketNewsItem) {
  const summary = (item.summary || '').trim();
  const headline = (item.headline || '').trim();
  if (!summary || summary === headline) return '';
  if (
    headline &&
    summary.startsWith(headline.slice(0, Math.min(40, headline.length)))
  ) {
    return '';
  }
  return summary;
}

function lastCandleStats(candles: MarketOhlcCandle[] | undefined) {
  if (!candles?.length) return null;
  const valid = candles.filter((c) => c.close > 0 && c.open > 0);
  const last = valid[valid.length - 1];
  if (!last) return null;
  const changePct =
    last.open !== 0 ? ((last.close - last.open) / last.open) * 100 : 0;
  return {
    ...last,
    changePct,
    closes: valid.slice(-36).map((c) => c.close),
    spark: valid.slice(-28),
  };
}

function ZoomedMiniChart({
  candles,
  livePrice,
}: {
  candles: MarketOhlcCandle[];
  livePrice?: number;
}) {
  const gradId = React.useId().replace(/:/g, '');
  const w = 220;
  const h = 88;
  const padX = 4;
  const padY = 6;
  const slice = candles.slice(-24);
  if (slice.length < 2) {
    return <div className="h-[88px] w-full rounded-lg bg-muted/30" />;
  }

  const highs = slice.map((c) => c.high);
  const lows = slice.map((c) => c.low);
  let min = Math.min(...lows);
  let max = Math.max(...highs);
  if (livePrice && livePrice > 0) {
    min = Math.min(min, livePrice);
    max = Math.max(max, livePrice);
  }
  const span = max - min || Math.abs(max) * 0.001 || 1;
  const yMin = min - span * 0.04;
  const yMax = max + span * 0.04;
  const ySpan = yMax - yMin || 1;

  const xAt = (i: number) =>
    padX + (i / Math.max(1, slice.length - 1)) * (w - padX * 2);
  const yAt = (price: number) =>
    padY + (1 - (price - yMin) / ySpan) * (h - padY * 2);

  const line = slice
    .map((c, i) => `${i === 0 ? 'M' : 'L'} ${xAt(i).toFixed(1)} ${yAt(c.close).toFixed(1)}`)
    .join(' ');
  const area = `${line} L ${xAt(slice.length - 1).toFixed(1)} ${h - padY} L ${padX} ${h - padY} Z`;
  const lastClose = slice[slice.length - 1].close;
  const up = lastClose >= slice[0].close;
  const color = up ? 'var(--chart-bull, #16a34a)' : 'var(--destructive)';
  const liveY =
    livePrice && livePrice > 0 ? yAt(livePrice) : yAt(lastClose);

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="h-[88px] w-full overflow-visible"
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradId})`} />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      {slice.map((c, i) => {
        const x = xAt(i);
        const bull = c.close >= c.open;
        return (
          <line
            key={c.time}
            x1={x}
            x2={x}
            y1={yAt(c.high)}
            y2={yAt(c.low)}
            stroke={bull ? color : 'var(--destructive)'}
            strokeWidth="1"
            opacity="0.35"
            vectorEffect="non-scaling-stroke"
          />
        );
      })}
      <line
        x1={padX}
        x2={w - padX}
        y1={liveY}
        y2={liveY}
        stroke="currentColor"
        strokeOpacity="0.35"
        strokeDasharray="3 3"
        vectorEffect="non-scaling-stroke"
      />
      <circle
        cx={xAt(slice.length - 1)}
        cy={liveY}
        r="3"
        fill={color}
        stroke="var(--card)"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function BiasBadge({
  direction,
  confidence,
}: {
  direction?: 'bullish' | 'bearish' | 'neutral';
  confidence?: number;
}) {
  const dir = direction ?? 'neutral';
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
        dir === 'bullish' && 'bg-[var(--chart-bull)]/15 text-[var(--chart-bull)]',
        dir === 'bearish' && 'bg-destructive/15 text-destructive',
        dir === 'neutral' && 'bg-muted text-muted-foreground',
      )}
    >
      {dir}
      {confidence != null ? (
        <span className="font-semibold opacity-70">
          {Math.round(confidence * 100)}%
        </span>
      ) : null}
    </span>
  );
}

function NewsCard({
  item,
  onHide,
}: {
  item: MarketNewsItem;
  onHide: () => void;
}) {
  const summary = cleanSummary(item);
  const imageUrl = isUsableNewsImageUrl(item.image) ? item.image! : null;
  if (!imageUrl) return null;

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group grid grid-cols-[88px_minmax(0,1fr)_auto] items-start gap-3 rounded-2xl border border-[var(--card-border)] bg-card p-3 transition-colors hover:border-primary/30 hover:bg-muted/25"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={newsImageSrc(imageUrl)}
        alt=""
        loading="lazy"
        onError={onHide}
        className="h-[72px] w-[88px] shrink-0 rounded-xl border border-[var(--card-border)] object-cover bg-muted"
      />
      <div className="min-w-0">
        <div className="mb-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
          <span className="font-semibold uppercase tracking-wide text-primary/80">
            {item.source}
          </span>
          <span className="text-muted-foreground/50">·</span>
          <span className="tabular-nums">{formatNewsTime(item.datetime)}</span>
        </div>
        <p className="line-clamp-2 text-sm font-semibold leading-snug text-foreground group-hover:text-primary">
          {item.headline}
        </p>
        {summary ? (
          <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {summary}
          </p>
        ) : null}
      </div>
      <ExternalLink className="mt-1 h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
    </a>
  );
}

function QuoteCard({
  meta,
  quote,
  active,
  onSelect,
}: {
  meta: (typeof CHART_SYMBOLS)[number];
  quote?: MarketQuoteResponse;
  active: boolean;
  onSelect: () => void;
}) {
  const pct = quote?.change24hPct ?? 0;
  const up = pct >= 0;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'flex min-w-0 flex-1 flex-col gap-1 rounded-2xl border px-4 py-3 text-left transition-colors',
        active
          ? 'border-primary/40 bg-primary/10'
          : 'border-[var(--card-border)] bg-card hover:border-primary/25 hover:bg-muted/20',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-muted-foreground">
          {meta.label}
        </span>
        <span
          className={cn(
            'inline-flex items-center gap-0.5 text-[11px] font-semibold tabular-nums',
            up ? 'text-[var(--chart-bull)]' : 'text-destructive',
          )}
        >
          {up ? (
            <TrendingUp className="h-3 w-3" />
          ) : (
            <TrendingDown className="h-3 w-3" />
          )}
          {formatPct(pct)}
        </span>
      </div>
      <p className="text-sm font-bold tracking-wide text-foreground">{meta.pair}</p>
      <p className="text-lg font-semibold tabular-nums text-foreground">
        {quote ? formatPrice(meta.id, quote.price) : '—'}
      </p>
    </button>
  );
}

function SessionBoard() {
  const [now, setNow] = React.useState<Date | null>(null);

  React.useEffect(() => {
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const nowIstMin = now ? minutesInTimeZone(now, IST) : null;
  const clock = now ? formatIstClock(now) : '--:--:--';
  const weekday = now ? formatIstWeekday(now) : '—';
  const openCount =
    nowIstMin == null
      ? null
      : SESSIONS.filter((s) =>
          sessionOpenIst(s.openIstMin, s.closeIstMin, nowIstMin),
        ).length;

  return (
    <div className="rounded-2xl border border-[var(--card-border)] bg-card">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--card-border)] px-4 py-3">
        <div className="flex items-center gap-2">
          <Clock3 className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">
            Trading sessions
          </h2>
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            IST
          </span>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold tabular-nums text-foreground">
            {clock} IST
          </p>
          <p className="text-[11px] text-muted-foreground">
            {weekday}
            {openCount == null
              ? ''
              : ` · ${openCount} session${openCount === 1 ? '' : 's'} open`}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-4">
        {SESSIONS.map((session) => {
          const open =
            nowIstMin == null
              ? null
              : sessionOpenIst(
                  session.openIstMin,
                  session.closeIstMin,
                  nowIstMin,
                );
          return (
            <div
              key={session.name}
              className={cn(
                'rounded-xl border px-3 py-3 transition-colors',
                open === true
                  ? 'border-primary/35 bg-primary/10'
                  : 'border-[var(--card-border)] bg-muted/20',
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-foreground">
                  {session.name}
                </p>
                <span
                  className={cn(
                    'h-2 w-2 rounded-full',
                    open === true
                      ? 'bg-[var(--chart-bull)] shadow-[0_0_0_3px_color-mix(in_srgb,var(--chart-bull)_25%,transparent)]'
                      : 'bg-muted-foreground/40',
                  )}
                />
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {session.city}
              </p>
              <p className="mt-2 text-[11px] font-medium tabular-nums text-muted-foreground">
                {session.openLabel}–{session.closeLabel} IST
              </p>
              <p
                className={cn(
                  'mt-1 text-[11px] font-semibold uppercase tracking-wide',
                  open === true ? 'text-primary' : 'text-muted-foreground',
                )}
              >
                {open == null ? '—' : open ? 'Open' : 'Closed'}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function OhlcBoard({
  symbol,
  pair,
  frames,
  livePrice,
  biases,
  loading,
  sessionLabel,
}: {
  symbol: MarketSymbol;
  pair: string;
  frames: Record<
    string,
    ReturnType<typeof lastCandleStats> | null | undefined
  >;
  livePrice?: number;
  biases?: Record<
    string,
    {
      direction: 'bullish' | 'bearish' | 'neutral';
      confidence: number;
      note: string;
      trend?: string;
      trade?: string;
      source: string;
    }
  >;
  loading: boolean;
  sessionLabel?: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--card-border)] bg-card">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--card-border)] px-4 py-3">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">
            Multi-timeframe · {pair}
          </h2>
        </div>
        <span className="text-[11px] text-muted-foreground">
          {sessionLabel || 'AI trend & trade notes'}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-2 p-3 sm:grid-cols-3">
        {OHLC_FRAMES.map((frame) => {
          const stats = frames[frame.id];
          const bias = biases?.[frame.id];
          const displayPrice =
            livePrice && livePrice > 0 ? livePrice : stats?.close;
          const up =
            bias?.direction === 'bullish'
              ? true
              : bias?.direction === 'bearish'
                ? false
                : (stats?.changePct ?? 0) >= 0;
          return (
            <div
              key={frame.id}
              className="rounded-xl border border-[var(--card-border)] bg-muted/15 p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {frame.label}
                </p>
                <BiasBadge
                  direction={bias?.direction}
                  confidence={bias?.confidence}
                />
              </div>

              {loading && !stats ? (
                <div className="mt-3 h-28 animate-pulse rounded-lg bg-muted/40" />
              ) : stats ? (
                <>
                  <div className="mt-2 flex items-end justify-between gap-2">
                    <div>
                      <p className="text-lg font-semibold tabular-nums text-foreground">
                        {formatPrice(symbol, displayPrice ?? stats.close)}
                      </p>
                      <p
                        className={cn(
                          'mt-0.5 text-xs font-semibold tabular-nums',
                          up
                            ? 'text-[var(--chart-bull)]'
                            : 'text-destructive',
                        )}
                      >
                        {formatPct(stats.changePct)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-2 overflow-hidden rounded-lg border border-[var(--card-border)]/70 bg-card/80 px-1 pt-1">
                    <ZoomedMiniChart
                      candles={stats.spark}
                      livePrice={livePrice}
                    />
                  </div>

                  <div className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] text-muted-foreground">
                    <span>O {formatPrice(symbol, stats.open)}</span>
                    <span>H {formatPrice(symbol, stats.high)}</span>
                    <span>L {formatPrice(symbol, stats.low)}</span>
                    <span>C {formatPrice(symbol, stats.close)}</span>
                  </div>

                  {(bias?.trend || bias?.note) && (
                    <div className="mt-2.5 space-y-1.5 rounded-lg border border-[var(--card-border)]/80 bg-card/70 p-2">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-primary/80">
                        Trend
                      </p>
                      <p className="text-[11px] leading-relaxed text-foreground/90">
                        {bias.trend || bias.note}
                      </p>
                      {bias.trade ? (
                        <>
                          <p className="pt-1 text-[10px] font-semibold uppercase tracking-wide text-primary/80">
                            Trade idea
                          </p>
                          <p className="text-[11px] leading-relaxed text-muted-foreground">
                            {bias.trade}
                          </p>
                        </>
                      ) : null}
                    </div>
                  )}
                </>
              ) : (
                <p className="mt-3 text-xs text-muted-foreground">No data</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function MarketsPage() {
  const [category, setCategory] = React.useState<MarketNewsCategory>('general');
  const [activeSymbol, setActiveSymbol] = React.useState(CHART_SYMBOLS[0]);
  const [now, setNow] = React.useState(() => new Date());
  const [hiddenNews, setHiddenNews] = React.useState<Set<string>>(new Set());

  const session = React.useMemo(() => getMarketSessionState(now), [now]);

  React.useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 15_000);
    return () => window.clearInterval(id);
  }, []);

  React.useEffect(() => {
    setHiddenNews(new Set());
  }, [category]);

  const quotesQuery = useQuery({
    queryKey: ['market-quotes-page'],
    queryFn: () => marketApi.getQuotes(),
    staleTime: Math.min(15_000, session.quotePollMs),
    refetchInterval: session.quotePollMs,
    refetchIntervalInBackground: true,
  });

  const newsQuery = useQuery({
    queryKey: ['market-news', category, 'imaged'],
    queryFn: async () => {
      const data = await marketApi.getNews({ category });
      return {
        ...data,
        items: newsWithImages(data.items),
        count: newsWithImages(data.items).length,
      };
    },
    staleTime: 60_000,
    refetchInterval: session.open ? 120_000 : 5 * 60_000,
  });

  const ohlcQueries = useQuery({
    queryKey: ['market-ohlc-board', activeSymbol.id],
    queryFn: async () => {
      const results = await Promise.all(
        OHLC_FRAMES.map(async (frame) => {
          const data = await marketApi.getOHLC({
            symbol: activeSymbol.id,
            timeframe: frame.id,
            limit: 48,
          });
          return [frame.id, lastCandleStats(data.candles)] as const;
        }),
      );
      return Object.fromEntries(results) as Record<
        string,
        ReturnType<typeof lastCandleStats>
      >;
    },
    staleTime: Math.min(30_000, session.ohlcPollMs),
    refetchInterval: session.ohlcPollMs,
    refetchIntervalInBackground: true,
  });

  const biasQuery = useQuery({
    queryKey: ['market-bias', activeSymbol.id, ohlcQueries.dataUpdatedAt],
    enabled: Boolean(ohlcQueries.data),
    queryFn: async () => {
      const frames = OHLC_FRAMES.map((frame) => {
        const stats = ohlcQueries.data?.[frame.id];
        return {
          timeframe: frame.id,
          open: stats?.open ?? 0,
          high: stats?.high ?? 0,
          low: stats?.low ?? 0,
          close: stats?.close ?? 0,
          changePct: stats?.changePct ?? 0,
          closes: stats?.closes ?? [],
        };
      }).filter((f) => f.close > 0);
      if (!frames.length) return { symbol: activeSymbol.id, biases: {} };
      return marketApi.getBias({
        symbol: activeSymbol.id,
        frames,
      });
    },
    staleTime: Math.min(90_000, session.biasPollMs),
    refetchInterval: session.biasPollMs,
  });

  React.useEffect(() => {
    if (session.open || session.msUntilOpen == null) return;
    const wait = Math.min(session.msUntilOpen + 1_500, 2_147_000_000);
    const timer = window.setTimeout(() => {
      setNow(new Date());
      void quotesQuery.refetch();
      void ohlcQueries.refetch();
      void biasQuery.refetch();
      void newsQuery.refetch();
    }, wait);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.open, session.msUntilOpen]);

  const quoteMap = React.useMemo(() => {
    const map: Record<string, MarketQuoteResponse> = {};
    for (const q of quotesQuery.data ?? []) {
      map[q.symbol] = q;
    }
    return map;
  }, [quotesQuery.data]);

  const livePrice = quoteMap[activeSymbol.id]?.price;

  const visibleNews = (newsQuery.data?.items ?? []).filter(
    (item) => !hiddenNews.has(`${item.id}:${item.url}`),
  );

  return (
    <DashboardPage>
      <DashboardBreadcrumbs
        items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Markets' }]}
      />
      <DashboardPageHeader
        title="Markets"
        description="Live quotes auto-refresh on session open, with AI trend and trade notes per timeframe."
        icon={Newspaper}
        actions={
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              quotesQuery.refetch();
              newsQuery.refetch();
              ohlcQueries.refetch();
              biasQuery.refetch();
            }}
            disabled={
              quotesQuery.isFetching ||
              newsQuery.isFetching ||
              ohlcQueries.isFetching ||
              biasQuery.isFetching
            }
            className="gap-2"
          >
            <RefreshCcw
              className={cn(
                'h-3.5 w-3.5',
                (quotesQuery.isFetching || newsQuery.isFetching) &&
                  'animate-spin',
              )}
            />
            Refresh
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {CHART_SYMBOLS.map((meta) => (
          <QuoteCard
            key={meta.id}
            meta={meta}
            quote={quoteMap[meta.id]}
            active={activeSymbol.id === meta.id}
            onSelect={() => setActiveSymbol(meta)}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <section className="min-w-0 w-full space-y-5">
          <TradingViewAdvancedChart height={620} symbol={activeSymbol.tv} />
          <SessionBoard />
          <OhlcBoard
            symbol={activeSymbol.id}
            pair={activeSymbol.pair}
            frames={ohlcQueries.data ?? {}}
            livePrice={livePrice}
            biases={biasQuery.data?.biases}
            loading={ohlcQueries.isLoading}
            sessionLabel={session.label}
          />
        </section>

        <section className="flex min-w-0 w-full flex-col gap-3 xl:sticky xl:top-4">
          <div className="flex flex-wrap gap-2">
            {NEWS_CATEGORIES.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setCategory(item.id)}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
                  category === item.id
                    ? 'border-primary/40 bg-primary/10 text-primary'
                    : 'border-[var(--card-border)] bg-card text-muted-foreground hover:text-foreground',
                )}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="flex max-h-[min(820px,calc(100vh-10rem))] flex-col gap-2.5 overflow-y-auto overscroll-contain pr-1 custom-scrollbar">
            {newsQuery.isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="h-[96px] animate-pulse rounded-2xl bg-muted/40"
                />
              ))
            ) : newsQuery.isError ? (
              <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                Couldn&apos;t load news right now. Please try again in a moment.
              </div>
            ) : visibleNews.length === 0 ? (
              <div className="rounded-2xl border border-[var(--card-border)] bg-card p-4 text-sm text-muted-foreground">
                No photo headlines in this category right now. Try General or
                Crypto.
              </div>
            ) : (
              visibleNews.map((item) => (
                <NewsCard
                  key={`${item.id}-${item.url}`}
                  item={item}
                  onHide={() =>
                    setHiddenNews((prev) => {
                      const next = new Set(prev);
                      next.add(`${item.id}:${item.url}`);
                      return next;
                    })
                  }
                />
              ))
            )}
          </div>
        </section>
      </div>
    </DashboardPage>
  );
}
