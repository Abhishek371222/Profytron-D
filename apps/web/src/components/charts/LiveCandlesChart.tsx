'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { marketApi, type MarketSymbol, type MarketTimeframe } from '@/lib/api/market';

interface EquityPoint {
	date: string;
	equity: number;
}

interface LiveCandlesChartProps {
	data: EquityPoint[];
	rangeLabel: string;
	embedded?: boolean;
	decoupleRange?: boolean;
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

const BULL = '#348398';
const BEAR = '#973336';
const VOL_BULL = 'color-mix(in srgb, #348398 18%, transparent)';
const VOL_BEAR = 'color-mix(in srgb, #973336 18%, transparent)';

const rangeToTimeframe = (rangeLabel: string): MarketTimeframe => {
	switch (rangeLabel) {
		case '1D': return '1m';
		case '1W': return '5m';
		case '1M': return '15m';
		case '3M': return '1h';
		case '1Y': return '4h';
		case 'ALL': return '1d';
		default: return '15m';
	}
};

const symbolToPricePrecision = (symbol: MarketSymbol): number => {
	if (symbol === 'EURUSD') return 5;
	if (symbol === 'XAUUSD') return 2;
	return 2;
};

const parseIsoToUnixTime = (iso: string): number => Math.floor(new Date(iso).getTime() / 1000);

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

const formatPrice = (value: number, precision: number) =>
	value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: precision });

const formatTimeLabel = (unix: number, timeframe: MarketTimeframe): string => {
	const d = new Date(unix * 1000);
	if (timeframe === '1d' || timeframe === '4h') {
		return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
	}
	return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });
};

/** Evenly spaced, human-readable Y-axis ticks. */
function nicePriceTicks(min: number, max: number, target = 5): number[] {
	if (!Number.isFinite(min) || !Number.isFinite(max) || min === max) {
		return [min];
	}
	const span = max - min;
	const rough = span / Math.max(target - 1, 1);
	const mag = Math.pow(10, Math.floor(Math.log10(rough)));
	const step = Math.ceil(rough / mag) * mag;
	const start = Math.floor(min / step) * step;
	const end = Math.ceil(max / step) * step;
	const ticks: number[] = [];
	for (let v = start; v <= end + step * 0.001; v += step) {
		ticks.push(Number(v.toFixed(10)));
	}
	return ticks.length > 8 ? ticks.filter((_, i) => i % 2 === 0) : ticks;
}

const MAX_VISIBLE_CANDLES = 72;
const CHART_H = 360;

async function fetchChartCandles(
	symbol: MarketSymbol,
	timeframe: MarketTimeframe,
	limit: number,
): Promise<CandlePoint[]> {
	const response = await marketApi.getOHLC({ symbol, timeframe, limit });
	const fromApi = response?.candles ? toCandleDataFromApi(response.candles) : [];
	if (fromApi.length > 0) return fromApi.slice(-limit);
	throw new Error(`Live OHLC unavailable for ${symbol}`);
}

export function LiveCandlesChart({
	data: _data,
	rangeLabel,
	embedded = false,
	decoupleRange = false,
}: LiveCandlesChartProps) {
	const [mounted, setMounted] = React.useState(false);
	const [symbol, setSymbol] = React.useState<MarketSymbol>('BTCUSDT');
	const [timeframe, setTimeframe] = React.useState<MarketTimeframe>('15m');
	const [containerWidth, setContainerWidth] = React.useState(720);
	const containerRef = React.useRef<HTMLDivElement>(null);

	React.useEffect(() => setMounted(true), []);

	React.useEffect(() => {
		const el = containerRef.current;
		if (!el || typeof ResizeObserver === 'undefined') return;
		const observer = new ResizeObserver((entries) => {
			const width = entries[0]?.contentRect.width;
			if (width && width > 0) setContainerWidth(width);
		});
		observer.observe(el);
		setContainerWidth(el.clientWidth || 720);
		return () => observer.disconnect();
	}, [mounted]);

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
		if (decoupleRange) return;
		setTimeframe(rangeToTimeframe(rangeLabel));
	}, [rangeLabel, decoupleRange]);

	const marketQuery = useQuery({
		queryKey: ['market-ohlc', symbol, timeframe],
		queryFn: () => fetchChartCandles(symbol, timeframe, MAX_VISIBLE_CANDLES),
		staleTime: timeframe === '1m' || timeframe === '5m' ? 15_000 : 45_000,
		refetchInterval: timeframe === '1m' ? 20_000 : timeframe === '5m' ? 30_000 : 60_000,
		refetchOnWindowFocus: true,
		enabled: mounted,
	});

	const candles = React.useMemo(() => {
		if (marketQuery.data?.length) return marketQuery.data.slice(-MAX_VISIBLE_CANDLES);
		return [];
	}, [marketQuery.data]);

	const precision = symbolToPricePrecision(symbol);
	const lastClose = candles[candles.length - 1]?.close;
	const firstClose = candles[0]?.close;
	const sessionChangePct =
		lastClose != null && firstClose
			? ((lastClose - firstClose) / firstClose) * 100
			: null;
	const isLiveData = Boolean(marketQuery.data?.length && !marketQuery.isError);

	const layout = React.useMemo(() => {
		const margin = { top: 12, right: 76, bottom: 28, left: 8 };
		const volH = 52;
		const priceH = CHART_H - margin.top - margin.bottom - volH - 6;
		const volTop = margin.top + priceH + 6;
		const plotW = Math.max(320, containerWidth - margin.left - margin.right);

		if (!candles.length) {
			return {
				W: containerWidth,
				H: CHART_H,
				margin,
				volH,
				priceH,
				volTop,
				bounds: null,
				step: 0,
				candleWidth: 6,
				priceTicks: [] as number[],
			};
		}

		const highs = candles.map((c) => c.high);
		const lows = candles.map((c) => c.low);
		const rawMin = Math.min(...lows);
		const rawMax = Math.max(...highs);
		const rawSpan = rawMax - rawMin || rawMax * 0.001;
		const pad = Math.max(rawSpan * 0.06, symbol === 'EURUSD' ? 0.00008 : rawMax * 0.001);
		const dataMin = rawMin - pad;
		const dataMax = rawMax + pad;
		const priceTicks = nicePriceTicks(dataMin, dataMax, 6);
		const minPrice = priceTicks[0] ?? dataMin;
		const maxPrice = priceTicks[priceTicks.length - 1] ?? dataMax;
		const volumeMax = Math.max(...candles.map((c) => c.volume), 1);

		const step = plotW / candles.length;
		const candleWidth = Math.max(3, Math.min(10, step * 0.68));
		const W = containerWidth;

		return {
			W,
			H: CHART_H,
			margin,
			volH,
			priceH,
			volTop,
			step,
			candleWidth,
			priceTicks,
			bounds: { minPrice, maxPrice, volumeMax },
		};
	}, [candles, symbol, containerWidth]);

	const priceToY = React.useCallback(
		(price: number) => {
			if (!layout.bounds) return layout.margin.top;
			const span = layout.bounds.maxPrice - layout.bounds.minPrice || 1;
			return layout.margin.top + ((layout.bounds.maxPrice - price) / span) * layout.priceH;
		},
		[layout.bounds, layout.margin.top, layout.priceH],
	);

	const volumeToH = (vol: number) =>
		Math.max(1, (vol / (layout.bounds?.volumeMax ?? 1)) * layout.volH);

	const timeTicks = React.useMemo(() => {
		if (candles.length < 2) return [];
		const maxLabels = candles.length > 48 ? 7 : 6;
		const indices = Array.from({ length: maxLabels }, (_, i) =>
			Math.min(candles.length - 1, Math.round((i / (maxLabels - 1)) * (candles.length - 1))),
		);
		const seen = new Set<string>();
		return [...new Set(indices)]
			.map((idx) => {
				const label = formatTimeLabel(candles[idx].time, timeframe);
				return {
					idx,
					x: layout.margin.left + idx * layout.step + layout.step / 2,
					label,
				};
			})
			.filter(({ label }) => {
				if (seen.has(label)) return false;
				seen.add(label);
				return true;
			});
	}, [candles, layout.margin.left, layout.step, timeframe]);

	const priceAxisTicks = React.useMemo(() => {
		if (!layout.bounds || !layout.priceTicks.length) return [];
		return layout.priceTicks.map((price) => ({
			price,
			y: priceToY(price),
		}));
	}, [layout.bounds, layout.priceTicks, priceToY]);

	if (!mounted) {
		return <div className="h-full w-full animate-pulse rounded-xl bg-muted/40" />;
	}

	return (
		<div
			className={cn(
				'flex flex-col h-full w-full',
				!embedded && 'rounded-[var(--radius-card)] border border-[var(--card-border)] bg-card p-3',
			)}
		>
			{/* Toolbar — sits above chart, never overlays candles */}
			<div className="flex flex-wrap items-center justify-between gap-2 shrink-0 mb-3 px-1">
				<div className="flex items-center gap-2 flex-wrap">
					<div className="flex items-center gap-1 rounded-xl border border-[var(--card-border)] bg-muted/40 p-1">
						{symbolOptions.map((option) => (
							<button
								key={option}
								type="button"
								onClick={() => setSymbol(option)}
								className={cn(
									'rounded-lg px-3 py-1.5 text-xs font-semibold transition-all',
									symbol === option
										? 'bg-primary/10 text-primary border border-primary/25 shadow-sm'
										: 'text-muted-foreground hover:text-foreground hover:bg-card border border-transparent',
								)}
							>
								{option}
							</button>
						))}
					</div>
					{lastClose != null && (
						<div className="flex items-center gap-2 text-xs tabular-nums">
							<span className="font-bold text-foreground">
								{formatPrice(lastClose, precision)}
							</span>
							{sessionChangePct != null && (
								<span
									className={cn(
										'font-semibold',
										sessionChangePct >= 0 ? 'text-primary' : 'text-destructive',
									)}
								>
									{sessionChangePct >= 0 ? '+' : ''}
									{sessionChangePct.toFixed(2)}%
								</span>
							)}
							{isLiveData && (
								<span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
									<span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
									Live
								</span>
							)}
						</div>
					)}
				</div>

				<div className="flex items-center gap-2">
					<div className="flex items-center gap-0.5 rounded-xl border border-[var(--card-border)] bg-muted/40 p-1">
						{timeframeOptions.map((option) => (
							<button
								key={option}
								type="button"
								onClick={() => setTimeframe(option)}
								className={cn(
									'rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all',
									timeframe === option
										? 'bg-primary/10 text-primary'
										: 'text-muted-foreground hover:text-foreground hover:bg-card',
								)}
							>
								{option}
							</button>
						))}
					</div>
					{embedded && (
						<button
							type="button"
							className="hidden sm:flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--card-border)] bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-card transition-colors"
							aria-label="Expand chart"
						>
							<Maximize2 className="h-3.5 w-3.5" />
						</button>
					)}
				</div>
			</div>

			{/* Chart canvas — uniform scale, no axis stretch */}
			<div
				ref={containerRef}
				className="flex-1 min-h-[280px] max-h-[360px] w-full relative rounded-xl bg-bg-secondary overflow-hidden"
			>
				{candles.length > 0 && layout.bounds ? (
					<svg
						className="h-full w-full block"
						viewBox={`0 0 ${layout.W} ${layout.H}`}
						preserveAspectRatio="none"
						role="img"
						aria-label={`${symbol} candlestick chart`}
					>
						{priceAxisTicks.map(({ y, price }) => (
							<g key={price}>
								<line
									x1={layout.margin.left}
									y1={y}
									x2={layout.W - layout.margin.right}
									y2={y}
									stroke="color-mix(in srgb, var(--foreground) 7%, transparent)"
									strokeDasharray="3 5"
									vectorEffect="non-scaling-stroke"
								/>
								<text
									x={layout.W - layout.margin.right + 4}
									y={y + 3.5}
									fill="var(--muted-foreground)"
									fontSize="9.5"
									fontWeight="500"
								>
									{formatPrice(price, precision)}
								</text>
							</g>
						))}

						{timeTicks.map(({ x, label, idx }) => (
							<g key={idx}>
								<line
									x1={x}
									y1={layout.margin.top}
									x2={x}
									y2={layout.volTop + layout.volH}
									stroke="color-mix(in srgb, var(--foreground) 4%, transparent)"
									vectorEffect="non-scaling-stroke"
								/>
								<text x={x} y={layout.H - 10} fill="var(--muted-foreground)" fontSize="9" fontWeight="500" textAnchor="middle">
									{label}
								</text>
							</g>
						))}

						{/* Volume separator */}
						<line
							x1={layout.margin.left}
							y1={layout.volTop - 2}
							x2={layout.W - layout.margin.right}
							y2={layout.volTop - 2}
							stroke="rgba(15,23,42,0.08)"
						/>

						{/* Candles + volume */}
						{candles.map((candle, index) => {
							const cx = layout.margin.left + index * layout.step + layout.step / 2;
							const bullish = candle.close >= candle.open;
							const openY = priceToY(candle.open);
							const closeY = priceToY(candle.close);
							const highY = priceToY(candle.high);
							const lowY = priceToY(candle.low);
							const bodyTop = Math.min(openY, closeY);
							const bodyH = Math.max(1.2, Math.abs(closeY - openY));
							const vH = volumeToH(candle.volume);
							const color = bullish ? BULL : BEAR;

							return (
								<g key={candle.time}>
									<line x1={cx} y1={highY} x2={cx} y2={lowY} stroke={color} strokeWidth={1.2} vectorEffect="non-scaling-stroke" />
									<rect
										x={cx - layout.candleWidth / 2}
										y={bodyTop}
										width={layout.candleWidth}
										height={bodyH}
										fill={color}
										rx={1}
									/>
									<rect
										x={cx - layout.candleWidth / 2}
										y={layout.volTop + layout.volH - vH}
										width={layout.candleWidth}
										height={vH}
										fill={bullish ? VOL_BULL : VOL_BEAR}
										rx={1}
									/>
								</g>
							);
						})}

						{/* Current price line */}
						{lastClose != null && (
							<g>
								<line
									x1={layout.margin.left}
									y1={priceToY(lastClose)}
									x2={layout.W - layout.margin.right}
									y2={priceToY(lastClose)}
									stroke={BULL}
									strokeWidth={1}
									strokeDasharray="4 4"
									opacity={0.85}
								/>
								<rect
									x={layout.W - layout.margin.right + 2}
									y={priceToY(lastClose) - 9}
									width={layout.margin.right - 6}
									height={18}
									rx={3}
									fill={BULL}
								/>
								<text
									x={layout.W - layout.margin.right + (layout.margin.right - 6) / 2 + 2}
									y={priceToY(lastClose) + 3.5}
									fill="#fff"
									fontSize="9"
									fontWeight="700"
									textAnchor="middle"
								>
									{formatPrice(lastClose, precision)}
								</text>
							</g>
						)}
					</svg>
				) : (
					<div className="grid h-full min-h-[280px] place-items-center px-6 text-center">
						<p className="text-sm text-muted-foreground">
							{marketQuery.isLoading
								? 'Loading live chart…'
								: marketQuery.isError
									? 'Could not load live candles. Retrying…'
									: 'Waiting for live market data…'}
						</p>
					</div>
				)}
			</div>
		</div>
	);
}
