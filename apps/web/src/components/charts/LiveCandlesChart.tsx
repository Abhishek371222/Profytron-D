'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { marketApi, type MarketSymbol, type MarketTimeframe } from '@/lib/api/market';

interface EquityPoint {
	date: string;
	equity: number;
}

interface LiveCandlesChartProps {
	data: EquityPoint[];
	rangeLabel: string;
}

type CandlePoint = {
	time: number;
	open: number;
	high: number;
	low: number;
	close: number;
	volume: number;
};

const SYMBOL_STORAGE_KEY = 'profytron.dashboard.chart.symbol';
const symbolOptions: MarketSymbol[] = ['BTCUSDT', 'EURUSD', 'XAUUSD'];
const timeframeOptions: MarketTimeframe[] = ['1m', '5m', '15m', '1h', '4h', '1d'];

const rangeToTimeframe = (rangeLabel: string): MarketTimeframe => {
	switch (rangeLabel) {
		case '1D':
			return '1m';
		case '1W':
			return '5m';
		case '1M':
			return '15m';
		case '3M':
			return '1h';
		case '1Y':
			return '4h';
		case 'ALL':
			return '1d';
		default:
			return '15m';
	}
};

const timeframeToSeconds = (timeframe: MarketTimeframe): number => {
	switch (timeframe) {
		case '1m':
			return 60;
		case '5m':
			return 300;
		case '15m':
			return 900;
		case '1h':
			return 3600;
		case '4h':
			return 14400;
		case '1d':
			return 86400;
		default:
			return 900;
	}
};

const symbolToPricePrecision = (symbol: MarketSymbol): number => {
	if (symbol === 'EURUSD') return 6;
	if (symbol === 'XAUUSD') return 2;
	return 2;
};

const parseIsoToUnixTime = (iso: string): number => Math.floor(new Date(iso).getTime() / 1000);

const seededNoise = (seed: number): number => {
	const value = Math.sin(seed * 12.9898) * 43758.5453;
	return value - Math.floor(value);
};

const toCandleDataFromEquity = (equityData: EquityPoint[], timeframe: MarketTimeframe): CandlePoint[] => {
	if (!equityData.length) {
		return [];
	}

	const bucketSeconds = timeframeToSeconds(timeframe);
	const now = Math.floor(Date.now() / 1000);
	const start = now - equityData.length * bucketSeconds;
	const candles: CandlePoint[] = [];
	let prevClose = equityData[0]?.equity ?? 10000;

	for (let index = 0; index < equityData.length; index += 1) {
		const point = equityData[index];
		const baseline = point.equity;
		const n1 = seededNoise(index + bucketSeconds);
		const n2 = seededNoise(index * 1.37 + bucketSeconds * 2);
		const bodySpread = Math.max(6, baseline * 0.0008);
		const wickSpread = bodySpread * 1.5;
		const open = prevClose + (n1 - 0.5) * bodySpread;
		const close = baseline + (n2 - 0.5) * bodySpread;
		const high = Math.max(open, close) + seededNoise(index + 91) * wickSpread;
		const low = Math.min(open, close) - seededNoise(index + 187) * wickSpread;
		const volume = Math.round(180 + seededNoise(index + 241) * 620);

		candles.push({
			time: start + index * bucketSeconds,
			open,
			high,
			low,
			close,
			volume,
		});

		prevClose = close;
	}

	return candles;
};

const toCandleDataFromApi = (
	candles: Array<{ time: string; open: number; high: number; low: number; close: number; volume: number }>,
): CandlePoint[] =>
	candles
		.map((item) => ({
			time: parseIsoToUnixTime(item.time),
			open: item.open,
			high: item.high,
			low: item.low,
			close: item.close,
			volume: item.volume,
		}))
		.filter((item) => Number.isFinite(item.time));

type Size = { width: number; height: number };
const formatValue = (value: number, precision: number) =>
	value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: precision });

export function LiveCandlesChart({ data, rangeLabel }: LiveCandlesChartProps) {
	const [mounted, setMounted] = React.useState(false);
	const [symbol, setSymbol] = React.useState<MarketSymbol>('BTCUSDT');
	const [timeframe, setTimeframe] = React.useState<MarketTimeframe>(rangeToTimeframe(rangeLabel));
	const [ticker, setTicker] = React.useState<{ last: number; deltaPct: number } | null>(null);
	const containerRef = React.useRef<HTMLDivElement | null>(null);

	React.useEffect(() => {
		setMounted(true);
	}, []);

	React.useEffect(() => {
		if (typeof window === 'undefined') return;
		const stored = window.localStorage.getItem(SYMBOL_STORAGE_KEY);
		if (stored && symbolOptions.includes(stored as MarketSymbol)) {
			setSymbol(stored as MarketSymbol);
		}
	}, []);

	React.useEffect(() => {
		if (typeof window === 'undefined') return;
		window.localStorage.setItem(SYMBOL_STORAGE_KEY, symbol);
	}, [symbol]);

	React.useEffect(() => {
		setTimeframe(rangeToTimeframe(rangeLabel));
	}, [rangeLabel]);

	const marketQuery = useQuery({
		queryKey: ['market-ohlc', symbol, timeframe],
		queryFn: () => marketApi.getOHLC({ symbol, timeframe, limit: 220 }),
		staleTime: 15_000,
		refetchInterval: 15_000,
		enabled: mounted,
	});

	const apiCandles = React.useMemo(
		() => (marketQuery.data?.candles ? toCandleDataFromApi(marketQuery.data.candles) : []),
		[marketQuery.data?.candles],
	);

	const fallbackCandles = React.useMemo(() => toCandleDataFromEquity(data, timeframe), [data, timeframe]);
	const selectedCandles = apiCandles.length > 0 ? apiCandles : fallbackCandles;
	const hasApiData = apiCandles.length > 0;

	React.useEffect(() => {
		if (selectedCandles.length >= 2) {
			const last = selectedCandles[selectedCandles.length - 1];
			const prev = selectedCandles[selectedCandles.length - 2];
			setTicker({
				last: last.close,
				deltaPct: ((last.close - prev.close) / prev.close) * 100,
			});
		} else {
			setTicker(null);
		}
	}, [selectedCandles]);

	const precision = symbolToPricePrecision(symbol);
	const viewBoxWidth = 1000;
	const viewBoxHeight = 500;
	const chartMargin = { top: 26, right: 72, bottom: 52, left: 72 };
	const chartWidth = viewBoxWidth - chartMargin.left - chartMargin.right;
	const chartHeight = viewBoxHeight - chartMargin.top - chartMargin.bottom;

	const bounds = React.useMemo(() => {
		if (!selectedCandles.length) return null;
		const highs = selectedCandles.map((item) => item.high);
		const lows = selectedCandles.map((item) => item.low);
		const volumeMax = Math.max(...selectedCandles.map((item) => item.volume), 1);
		const minPrice = Math.min(...lows);
		const maxPrice = Math.max(...highs);
		const padding = Math.max((maxPrice - minPrice) * 0.08, symbol === 'EURUSD' ? 0.0002 : 10);
		return {
			minPrice: minPrice - padding,
			maxPrice: maxPrice + padding,
			volumeMax,
		};
	}, [selectedCandles, symbol]);

	const priceToY = React.useCallback(
		(price: number) => {
			if (!bounds || chartHeight <= 0) return 0;
			const span = Math.max(bounds.maxPrice - bounds.minPrice, 1e-9);
			return chartMargin.top + ((bounds.maxPrice - price) / span) * chartHeight;
		},
		[bounds, chartHeight]
	);

	const volumeToHeight = React.useCallback(
		(volume: number) => {
			if (!bounds || chartHeight <= 0) return 0;
			return Math.max(1, (volume / bounds.volumeMax) * Math.max(40, chartHeight * 0.18));
		},
		[bounds, chartHeight]
	);

	const candleWidth = selectedCandles.length > 0 ? Math.max(6, Math.min(24, (chartWidth / selectedCandles.length) * 0.6)) : 8;
	const step = selectedCandles.length > 0 ? chartWidth / selectedCandles.length : 0;

	if (!mounted) {
		return <div className="h-full w-full animate-pulse rounded-2xl bg-white/5" />;
	}

	return (
		<div className="relative h-full w-full min-h-[360px] rounded-2xl border border-white/8 bg-black/20">
			<div className="absolute left-3 top-3 z-10 flex items-center gap-2 rounded-xl border border-white/10 bg-black/45 px-3 py-2 backdrop-blur-sm">
				<span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/40">{hasApiData ? 'Live API' : 'Fallback'}</span>
				<span className="rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-white/65">{symbol}</span>
				<span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/45">OHLC + Volume</span>
				<span className="text-xs font-semibold text-white">{ticker ? formatValue(ticker.last, precision) : 'Loading'}</span>
				{ticker && (
					<span className={cn('text-[11px] font-semibold', ticker.deltaPct >= 0 ? 'text-emerald-300' : 'text-red-300')}>
						{ticker.deltaPct >= 0 ? '+' : ''}
						{ticker.deltaPct.toFixed(2)}%
					</span>
				)}
			</div>

			<div className="absolute left-3 top-14 z-10 flex items-center gap-1 rounded-xl border border-white/10 bg-black/45 p-1 backdrop-blur-sm">
				{symbolOptions.map((option) => (
					<button
						key={option}
						onClick={() => setSymbol(option)}
						className={cn(
							'rounded-md px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] transition-colors',
							symbol === option ? 'bg-emerald-500/30 text-emerald-200' : 'text-white/55 hover:bg-white/10 hover:text-white'
						)}
					>
						{option}
					</button>
				))}
			</div>

			<div className="absolute right-3 top-3 z-10 flex items-center gap-1 rounded-xl border border-white/10 bg-black/45 p-1 backdrop-blur-sm">
				{timeframeOptions.map((option) => (
					<button
						key={option}
						onClick={() => setTimeframe(option)}
						className={cn(
							'rounded-md px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] transition-colors',
							timeframe === option ? 'bg-indigo-500/30 text-indigo-200' : 'text-white/55 hover:bg-white/10 hover:text-white'
						)}
					>
						{option}
					</button>
				))}
			</div>

			<div ref={containerRef} className="h-full min-h-[360px] w-full">
				{selectedCandles.length > 0 && chartWidth > 0 && chartHeight > 0 ? (
					<svg className="h-full w-full" viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`} preserveAspectRatio="none" role="img" aria-label="Live candlestick chart">
						<defs>
							<linearGradient id="gridFade" x1="0" y1="0" x2="0" y2="1">
								<stop offset="0%" stopColor="rgba(255,255,255,0.12)" />
								<stop offset="100%" stopColor="rgba(255,255,255,0.02)" />
							</linearGradient>
						</defs>

						{[0, 0.25, 0.5, 0.75, 1].map((tick) => {
							const y = chartMargin.top + tick * chartHeight;
							return <line key={tick} x1={chartMargin.left} y1={y} x2={viewBoxWidth - chartMargin.right} y2={y} stroke="rgba(255,255,255,0.05)" strokeDasharray="4 6" />;
						})}

						{selectedCandles.map((candle, index) => {
							const centerX = chartMargin.left + index * step + step / 2;
							const openY = priceToY(candle.open);
							const closeY = priceToY(candle.close);
							const highY = priceToY(candle.high);
							const lowY = priceToY(candle.low);
							const bullish = candle.close >= candle.open;
							const bodyTop = Math.min(openY, closeY);
							const bodyHeight = Math.max(1.5, Math.abs(closeY - openY));
							const volumeHeight = volumeToHeight(candle.volume);
							const volumeTop = viewBoxHeight - chartMargin.bottom - volumeHeight;
							return (
								<g key={candle.time}>
									<line x1={centerX} y1={highY} x2={centerX} y2={lowY} stroke={bullish ? '#2dd4bf' : '#fb7185'} strokeWidth={1.5} strokeLinecap="round" />
									<rect
										x={centerX - candleWidth / 2}
										y={bodyTop}
										width={candleWidth}
										height={bodyHeight}
										rx={candleWidth / 3}
										fill={bullish ? '#14b8a6' : '#fb7185'}
										stroke={bullish ? '#5eead4' : '#fecdd3'}
										strokeWidth={0.5}
									/>
									<rect x={centerX - candleWidth / 2} y={volumeTop} width={candleWidth} height={volumeHeight} rx={2} fill={bullish ? 'rgba(34,197,94,0.38)' : 'rgba(239,68,68,0.38)'} />
								</g>
							);
						})}

						<text x={chartMargin.left} y={viewBoxHeight - 14} fill="rgba(255,255,255,0.42)" fontSize="10" fontWeight="700" letterSpacing="0.24em">
							LIVE CANDLES
						</text>

						{bounds && (
							<text x={viewBoxWidth - chartMargin.right} y={chartMargin.top + 8} fill="rgba(255,255,255,0.48)" fontSize="10" fontWeight="700" textAnchor="end">
								{formatValue(bounds.maxPrice, precision)}
							</text>
						)}

						{bounds && (
							<text x={viewBoxWidth - chartMargin.right} y={viewBoxHeight - chartMargin.bottom} fill="rgba(255,255,255,0.32)" fontSize="10" fontWeight="700" textAnchor="end">
								{formatValue(bounds.minPrice, precision)}
							</text>
						)}
					</svg>
				) : (
					<div className="grid h-full place-items-center text-sm font-semibold text-white/70">
						No candles available for this symbol/timeframe.
					</div>
				)}
			</div>

			<div className="pointer-events-none absolute left-3 bottom-3 z-10 flex items-center gap-3 rounded-xl border border-white/10 bg-black/45 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/60 backdrop-blur-sm">
				<span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-400" />Bull candle</span>
				<span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-red-400" />Bear candle</span>
				<span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-indigo-300" />Volume</span>
			</div>

			<div className="pointer-events-none absolute right-3 bottom-3 z-10 flex items-center gap-2 rounded-xl border border-white/10 bg-black/45 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/60 backdrop-blur-sm">
				<ArrowUpRight className="h-3.5 w-3.5 text-cyan-300" />
				Live market feed via Twelve Data
			</div>

			{marketQuery.isError && (
				<div className="pointer-events-none absolute inset-x-4 bottom-3 z-10 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-200">
					Realtime market feed unavailable. Showing fallback candles.
				</div>
			)}
		</div>
	);
}
