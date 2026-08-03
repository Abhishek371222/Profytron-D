/**
 * Pure paper SL/TP evaluation against a mark price.
 * Used by PaperSlTpService only — no pricing or PnL calculation here.
 */
export type PaperStopOutcome = 'STOP_LOSS' | 'TAKE_PROFIT' | null;

export function evaluatePaperStopLevels(
  trade: {
    direction: string;
    stopLoss?: number | null;
    takeProfit?: number | null;
  },
  price: number,
): PaperStopOutcome {
  if (!Number.isFinite(price) || price <= 0) return null;

  const isLong = trade.direction === 'LONG';
  const sl = trade.stopLoss;
  const tp = trade.takeProfit;

  // Prefer SL if both touch in the same tick (risk-first).
  if (sl != null && Number.isFinite(sl)) {
    if (isLong ? price <= sl : price >= sl) {
      return 'STOP_LOSS';
    }
  }

  if (tp != null && Number.isFinite(tp)) {
    if (isLong ? price >= tp : price <= tp) {
      return 'TAKE_PROFIT';
    }
  }

  return null;
}
