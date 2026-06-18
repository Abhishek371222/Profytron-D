import {
  OhlcCandle,
  StrategyDefinition,
  SimulatedTrade,
  BacktestResult,
  BacktestEquityPoint,
} from '../types';
import * as ind from '../indicators/indicators';
import { calculateMetrics } from './metrics';

type SeriesMap = Record<string, number[]>;

function buildSeries(
  candles: OhlcCandle[],
  definition: StrategyDefinition,
): SeriesMap {
  const closes = candles.map((c) => c.close);
  const highs = candles.map((c) => c.high);
  const lows = candles.map((c) => c.low);
  const volumes = candles.map((c) => c.volume);

  const series: SeriesMap = {
    price: closes,
    close: closes,
    open: candles.map((c) => c.open),
    high: highs,
    low: lows,
    volume: volumes,
  };

  for (const [refId, config] of Object.entries(definition.indicators)) {
    const src = series[config.source ?? 'close'] ?? closes;
    switch (config.type) {
      case 'SMA':
        series[refId] = ind.sma(src, config.period ?? 14);
        break;
      case 'EMA':
        series[refId] = ind.ema(src, config.period ?? 14);
        break;
      case 'RSI':
        series[refId] = ind.rsi(src, config.period ?? 14);
        break;
      case 'MACD': {
        const r = ind.macd(
          src,
          config.fastPeriod ?? 12,
          config.slowPeriod ?? 26,
          config.signalPeriod ?? 9,
        );
        series[`${refId}.macd`] = r.macd;
        series[`${refId}.signal`] = r.signal;
        series[`${refId}.histogram`] = r.histogram;
        series[refId] = r.macd;
        break;
      }
      case 'BOLLINGER': {
        const r = ind.bollinger(
          src,
          config.period ?? 20,
          config.stdDevMultiplier ?? 2,
        );
        series[`${refId}.upper`] = r.upper;
        series[`${refId}.middle`] = r.middle;
        series[`${refId}.lower`] = r.lower;
        series[refId] = r.middle;
        break;
      }
      case 'ATR':
        series[refId] = ind.atr(highs, lows, closes, config.period ?? 14);
        break;
      case 'ADX': {
        const r = ind.adx(highs, lows, closes, config.period ?? 14);
        series[`${refId}.adx`] = r.adx;
        series[`${refId}.pdi`] = r.pdi;
        series[`${refId}.mdi`] = r.mdi;
        series[refId] = r.adx;
        break;
      }
      case 'VWAP':
        series[refId] = ind.vwap(highs, lows, closes, volumes);
        break;
    }
  }
  return series;
}

function resolveValue(
  ref: string | number,
  series: SeriesMap,
  i: number,
): number {
  if (typeof ref === 'number') return ref;
  return series[ref]?.[i] ?? NaN;
}

function evalRule(rule: any, series: SeriesMap, i: number): boolean {
  if (i < 1) return false;
  const lv = resolveValue(rule.left, series, i);
  const rv = resolveValue(rule.right, series, i);
  if (isNaN(lv) || isNaN(rv)) return false;
  switch (rule.comparator as string) {
    case '>': return lv > rv;
    case '<': return lv < rv;
    case '>=': return lv >= rv;
    case '<=': return lv <= rv;
    case '==': return Math.abs(lv - rv) < 1e-9;
    case 'crossesAbove': {
      const lp = resolveValue(rule.left, series, i - 1);
      const rp = resolveValue(rule.right, series, i - 1);
      return lp <= rp && lv > rv;
    }
    case 'crossesBelow': {
      const lp = resolveValue(rule.left, series, i - 1);
      const rp = resolveValue(rule.right, series, i - 1);
      return lp >= rp && lv < rv;
    }
    default: return false;
  }
}

function evalGroup(group: any, series: SeriesMap, i: number): boolean {
  const results: boolean[] = (group.rules ?? []).map((r: any) =>
    evalRule(r, series, i),
  );
  return group.op === 'OR' ? results.some(Boolean) : results.every(Boolean);
}

export function runBacktest(
  definition: StrategyDefinition,
  candles: OhlcCandle[],
  initialCapital = 10_000,
): BacktestResult {
  const series = buildSeries(candles, definition);
  const trades: SimulatedTrade[] = [];
  const equityCurve: BacktestEquityPoint[] = [];
  const monthlyPnl: Record<string, number> = {};

  let equity = initialCapital;
  let inTrade = false;
  let entryIdx = 0;
  let entryPrice = 0;
  let tradeDir: 'LONG' | 'SHORT' = 'LONG';

  const slPct = (definition.risk.slPct ?? 1) / 100;
  const tpPct = (definition.risk.tpPct ?? 2) / 100;
  const riskPct = (definition.risk.riskPerTradePct ?? 1) / 100;
  const dir = definition.direction;

  for (let i = 1; i < candles.length; i++) {
    const c = candles[i];
    const price = c.close;

    if (!inTrade) {
      if (evalGroup(definition.entryRules, series, i)) {
        inTrade = true;
        entryIdx = i;
        entryPrice = price;
        tradeDir = dir === 'SHORT' ? 'SHORT' : 'LONG';
      }
    } else {
      // Check SL / TP via intra-candle wicks
      let exitPrice: number | null = null;

      if (tradeDir === 'LONG') {
        if (c.low <= entryPrice * (1 - slPct))
          exitPrice = entryPrice * (1 - slPct);
        else if (c.high >= entryPrice * (1 + tpPct))
          exitPrice = entryPrice * (1 + tpPct);
      } else {
        if (c.high >= entryPrice * (1 + slPct))
          exitPrice = entryPrice * (1 + slPct);
        else if (c.low <= entryPrice * (1 - tpPct))
          exitPrice = entryPrice * (1 - tpPct);
      }

      if (exitPrice === null && evalGroup(definition.exitRules, series, i)) {
        exitPrice = price;
      }

      if (exitPrice !== null) {
        const pnlPct =
          tradeDir === 'LONG'
            ? (exitPrice - entryPrice) / entryPrice
            : (entryPrice - exitPrice) / entryPrice;
        // Risk-normalised PnL: risk 1% of equity per 1% SL move
        const pnlAbs = equity * riskPct * (pnlPct / slPct);

        trades.push({
          entryIdx,
          exitIdx: i,
          entryPrice,
          exitPrice,
          direction: tradeDir,
          pnlPct,
          pnlAbs,
        });

        equity += pnlAbs;
        inTrade = false;

        const month = c.datetime.slice(0, 7);
        monthlyPnl[month] = (monthlyPnl[month] ?? 0) + pnlAbs;
      }
    }

    equityCurve.push({ idx: i, datetime: c.datetime, equity, drawdown: 0 });
  }

  // Back-fill drawdown on equity curve
  let peak = initialCapital;
  for (const pt of equityCurve) {
    if (pt.equity > peak) peak = pt.equity;
    pt.drawdown = (peak - pt.equity) / peak;
  }

  // Trade PnL distribution (buckets of $100)
  const bucketMap = new Map<string, number>();
  for (const t of trades) {
    const bucket =
      t.pnlAbs >= 0
        ? `+${Math.floor(t.pnlAbs / 100) * 100}`
        : `-${Math.floor(Math.abs(t.pnlAbs) / 100) * 100}`;
    bucketMap.set(bucket, (bucketMap.get(bucket) ?? 0) + 1);
  }

  return {
    metrics: calculateMetrics(trades, initialCapital),
    trades,
    equityCurve,
    monthlyReturns: monthlyPnl,
    tradeDistribution: [...bucketMap.entries()].map(([bucket, count]) => ({
      bucket,
      count,
    })),
  };
}
