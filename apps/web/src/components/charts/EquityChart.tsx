'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
	CandlestickSeries,
	createChart,
	ColorType,
	CrosshairMode,
	HistogramSeries,
	type CandlestickData,
	type HistogramData,
	type IChartApi,
	type ISeriesApi,
	type Time,
} from 'lightweight-charts';
import { cn } from '@/lib/utils';
import { marketApi, type MarketSymbol, type MarketTimeframe } from '@/lib/api/market';

interface EquityPoint {
 date: string;
 equity: number;
}

interface EquityChartProps {
 data: EquityPoint[];
 rangeLabel: string;
 isLoading?: boolean;
}

type CandlePoint = {
	time: Time;
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
	if (symbol === 'EURUSD') {
		return 6;
	}
	if (symbol === 'XAUUSD') {
		return 2;
	}
	return 2;
};

const parseIsoToUnixTime = (iso: string): Time =>
	Math.floor(new Date(iso).getTime() / 1000) as Time;

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
			time: (start + index * bucketSeconds) as Time,
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
	candles: Array<{ time: string; open: number; high: number; low: number; close: number; volume: number }>
): CandlePoint[] => {
	return candles
		.map((item) => ({
			time: parseIsoToUnixTime(item.time),
			open: item.open,
			high: item.high,
			low: item.low,
			close: item.close,
			volume: item.volume,
		}))
		.filter((item) => Number.isFinite(Number(item.time)));
};

export function EquityChart({ data, rangeLabel, isLoading }: EquityChartProps) {
	const [mounted, setMounted] = React.useState(false);
	const [symbol, setSymbol] = React.useState<MarketSymbol>('BTCUSDT');
	const [timeframe, setTimeframe] = React.useState<MarketTimeframe>(rangeToTimeframe(rangeLabel));
	const [ticker, setTicker] = React.useState<{ last: number; deltaPct: number } | null>(null);
	const containerRef = React.useRef<HTMLDivElement | null>(null);
	const chartRef = React.useRef<IChartApi | null>(null);
	const candleSeriesRef = React.useRef<ISeriesApi<'Candlestick'> | null>(null);
	const volumeSeriesRef = React.useRef<ISeriesApi<'Histogram'> | null>(null);

	React.useEffect(() => {
		setMounted(true);
	}, []);

	React.useEffect(() => {
		if (typeof window === 'undefined') {
			return;
		}
		const stored = window.localStorage.getItem(SYMBOL_STORAGE_KEY);
		if (stored && symbolOptions.includes(stored as MarketSymbol)) {
			setSymbol(stored as MarketSymbol);
		}
	}, []);

	React.useEffect(() => {
		if (typeof window === 'undefined') {
			return;
		}
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

	React.useEffect(() => {
		if (!mounted || !containerRef.current) {
			return;
		}

		const chart = createChart(containerRef.current, {
			layout: {
				background: { type: ColorType.Solid, color: 'transparent' },
				textColor: 'rgba(255,255,255,0.62)',
				fontFamily: 'Inter, ui-sans-serif, system-ui',
			},
			rightPriceScale: {
				borderColor: 'rgba(255,255,255,0.08)',
			},
			timeScale: {
				borderColor: 'rgba(255,255,255,0.08)',
				timeVisible: true,
				secondsVisible: false,
			},
			grid: {
				vertLines: { color: 'rgba(255,255,255,0.04)' },
				horzLines: { color: 'rgba(255,255,255,0.05)' },
			},
			crosshair: {
				mode: CrosshairMode.Normal,
			},
			handleScale: true,
			handleScroll: true,
		});

		const candleSeries = chart.addSeries(CandlestickSeries, {
			upColor: '#16a34a',
			downColor: '#dc2626',
			borderUpColor: '#16a34a',
			borderDownColor: '#dc2626',
			wickUpColor: '#22c55e',
			wickDownColor: '#f87171',
			priceLineVisible: true,
		});

		const volumeSeries = chart.addSeries(HistogramSeries, {
			priceFormat: { type: 'volume' },
			priceScaleId: '',
			color: 'rgba(99, 102, 241, 0.34)',
			lastValueVisible: false,
			priceLineVisible: false,
		});

		volumeSeries.priceScale().applyOptions({
			scaleMargins: {
				top: 0.78,
				bottom: 0,
			},
		});

		chartRef.current = chart;
		candleSeriesRef.current = candleSeries;
		volumeSeriesRef.current = volumeSeries;

		const resize = () => {
			if (!containerRef.current || !chartRef.current) {
				return;
			}
			const { width, height } = containerRef.current.getBoundingClientRect();
			chartRef.current.applyOptions({
				width: Math.max(0, Math.floor(width)),
				height: Math.max(0, Math.floor(height)),
			});
		};

		resize();
		const observer = new ResizeObserver(resize);
		observer.observe(containerRef.current);

		return () => {
			observer.disconnect();
			chartRef.current?.remove();
			chartRef.current = null;
			candleSeriesRef.current = null;
			volumeSeriesRef.current = null;
		};
	}, [mounted]);

	React.useEffect(() => {
		const precision = symbolToPricePrecision(symbol);
		candleSeriesRef.current?.applyOptions({
			priceFormat: {
				type: 'price',
				precision,
				minMove: precision >= 6 ? 0.000001 : 0.01,
			},
		});
	}, [symbol]);

	const apiCandles = React.useMemo(
		() => (marketQuery.data?.candles ? toCandleDataFromApi(marketQuery.data.candles) : []),
		[marketQuery.data?.candles]
	);

	const fallbackCandles = React.useMemo(
		() => toCandleDataFromEquity(data, timeframe),
		[data, timeframe]
	);

	const selectedCandles = apiCandles.length > 0 ? apiCandles : fallbackCandles;
	const hasApiData = apiCandles.length > 0;

	React.useEffect(() => {
		if (!mounted || !candleSeriesRef.current || !volumeSeriesRef.current) {
			return;
		}

		const candles = selectedCandles;
		candleSeriesRef.current.setData(
			candles.map((item) => ({
				time: item.time,
				open: item.open,
				high: item.high,
				low: item.low,
				close: item.close,
			})) as CandlestickData[]
		);

		volumeSeriesRef.current.setData(
			candles.map((item) => ({
				time: item.time,
				value: item.volume,
				color: item.close >= item.open ? 'rgba(22,163,74,0.5)' : 'rgba(220,38,38,0.5)',
			})) as HistogramData[]
		);

		chartRef.current?.timeScale().fitContent();

		if (candles.length >= 2) {
			const last = candles[candles.length - 1];
			const prev = candles[candles.length - 2];
			setTicker({
				last: last.close,
				deltaPct: ((last.close - prev.close) / prev.close) * 100,
			});
		} else {
			setTicker(null);
		}
	}, [mounted, selectedCandles]);

	if (!mounted || isLoading) {
		return <div className="h-full w-full bg-white/5 animate-pulse rounded-2xl" />;
	}

	return (
		<div className="relative h-full w-full min-h-[320px] rounded-2xl border border-white/8 bg-black/20">
			<div className="absolute left-3 top-3 z-10 flex items-center gap-2 rounded-xl border border-white/10 bg-black/45 px-3 py-2 backdrop-blur-sm">
				<span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/40">{hasApiData ? 'Live API' : 'Fallback'}</span>
				<span className="rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-white/65">{symbol}</span>
				<span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/45">OHLC + Volume</span>
				<span className="text-xs font-semibold text-white">{ticker ? ticker.last.toLocaleString(undefined, { maximumFractionDigits: symbolToPricePrecision(symbol) }) : 'Loading'}</span>
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

			<div ref={containerRef} className="h-full w-full min-h-[320px]" />

			<div className="pointer-events-none absolute left-3 bottom-3 z-10 flex items-center gap-3 rounded-xl border border-white/10 bg-black/45 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/60 backdrop-blur-sm">
				<span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-400" />Bull candle</span>
				<span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-red-400" />Bear candle</span>
				<span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-indigo-300" />Volume</span>
			</div>

			{marketQuery.isError && (
				<div className="pointer-events-none absolute inset-x-4 bottom-3 z-10 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-200">
					Realtime market feed unavailable. Showing fallback candles.
				</div>
			)}

			{!marketQuery.isLoading && selectedCandles.length === 0 && (
				<div className="pointer-events-none absolute inset-0 z-10 grid place-items-center bg-black/35 text-sm font-semibold text-white/70">
					No candles available for this symbol/timeframe.
				</div>
			)}
		</div>
	);
}
