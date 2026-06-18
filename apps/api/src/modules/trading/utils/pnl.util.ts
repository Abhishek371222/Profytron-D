import type { MarketSymbol } from '../../market/market.service';

/**
 * Map a broker trade symbol (e.g. "EURUSD.pro", "XAUUSD", "BTCUSD") to one of
 * the market symbols we have quotes for. Returns null when unsupported.
 */
export function mapTradeSymbolToMarket(
  symbol: string,
  supportedSymbols: readonly MarketSymbol[],
): MarketSymbol | null {
  const normalized = symbol.toUpperCase().replace(/[^A-Z]/g, '');
  if (normalized.includes('BTC')) return 'BTCUSDT';
  if (normalized.includes('XAU') || normalized.includes('GOLD'))
    return 'XAUUSD';
  if (normalized.includes('EUR')) return 'EURUSD';
  if (supportedSymbols.includes(normalized as MarketSymbol)) {
    return normalized as MarketSymbol;
  }
  return null;
}

/**
 * Estimate unrealized PnL for an open trade given the current market price.
 */
export function estimateUnrealizedPnl(
  trade: {
    direction: string;
    volume: number;
    openPrice: number;
    fillPrice: number | null;
  },
  currentPrice: number,
): number {
  const entry = trade.fillPrice ?? trade.openPrice;
  if (!entry || !currentPrice) return 0;
  const dir = trade.direction === 'LONG' ? 1 : -1;
  const multiplier = entry > 100 ? 1 : 100_000;
  return Number(
    (dir * (currentPrice - entry) * trade.volume * multiplier).toFixed(2),
  );
}

/** Sum of absolute realized losses from closed trades (today or all-time). */
export function computeDailyLossUsd(
  closedTrades: Array<{ profit: number | null }>,
): number {
  return closedTrades
    .filter((t) => (t.profit ?? 0) < 0)
    .reduce((sum, t) => sum + Math.abs(t.profit ?? 0), 0);
}

/**
 * Peak-to-trough drawdown percentage from a chronological PnL series.
 * `startingEquity` is the balance before the first trade in the series.
 */
export function computeMaxDrawdownPct(
  trades: Array<{ profit: number | null }>,
  startingEquity: number,
): number {
  let peak = startingEquity;
  let running = startingEquity;
  let maxDd = 0;
  for (const t of trades) {
    running += t.profit ?? 0;
    if (running > peak) peak = running;
    const dd = peak > 0 ? ((peak - running) / peak) * 100 : 0;
    maxDd = Math.max(maxDd, dd);
  }
  return maxDd;
}
