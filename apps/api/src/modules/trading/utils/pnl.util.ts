import type { MarketSymbol } from '../../market/market.service';

/**
 * Map a broker trade symbol (e.g. "EURUSD.pro", "XAUUSD", "BTCUSD") to one of
 * the market symbols we have quotes for. Returns null when unsupported.
 *
 * Extracted from TradingService so the service, the trade processor, and the
 * trailing-stop service all share one implementation.
 */
export function mapTradeSymbolToMarket(
  symbol: string,
  supportedSymbols: readonly MarketSymbol[],
): MarketSymbol | null {
  const normalized = symbol.toUpperCase().replace(/[^A-Z]/g, '');
  if (normalized.includes('BTC')) return 'BTCUSDT';
  if (normalized.includes('XAU') || normalized.includes('GOLD')) return 'XAUUSD';
  if (normalized.includes('EUR')) return 'EURUSD';
  if (supportedSymbols.includes(normalized as MarketSymbol)) {
    return normalized as MarketSymbol;
  }
  return null;
}

/**
 * Estimate unrealized PnL for an open trade given the current market price.
 * Uses fillPrice when available, falling back to openPrice. The multiplier
 * heuristic mirrors the original TradingService implementation: FX-style
 * sub-100 prices use a 100k contract multiplier, larger prices use 1.
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
