/**
 * Account return / funding-baseline helpers.
 * initialEquity is the permanent first-sync baseline — never overwrite after seed.
 */

export function isUnsetBaseline(value: unknown): boolean {
  const n = Number(value);
  return !Number.isFinite(n) || n <= 0;
}

/** Seed-only: keep existing baseline; set only when unset. */
export function seedInitialEquity(
  existing: unknown,
  liveEquityOrBalance: unknown,
): number | undefined {
  if (!isUnsetBaseline(existing)) return undefined;
  const live = Number(liveEquityOrBalance);
  if (!Number.isFinite(live) || live <= 0) return undefined;
  return live;
}

/**
 * Resolve deposit/funding base for Return %.
 * Priority: net deposits → trusted DB baseline → reconstruct from live − trading PnL.
 * Treats a DB baseline that ≈ live equity as corrupted (was overwritten by sync).
 */
export function resolveDepositBase(input: {
  netDeposits: number;
  dbInitialEquity: number;
  liveEquity: number;
  tradingPnLAll: number;
}): {
  depositBase: number;
  shouldRepairBaseline: boolean;
  repairedBaseline?: number;
} {
  const { netDeposits, dbInitialEquity, liveEquity, tradingPnLAll } = input;
  const reconstructed = Math.max(1, liveEquity - tradingPnLAll);

  if (netDeposits > 1) {
    const looksCorrupted =
      dbInitialEquity > 1 &&
      Math.abs(dbInitialEquity - liveEquity) / Math.max(liveEquity, 1) < 0.01;
    return {
      depositBase: netDeposits,
      shouldRepairBaseline: looksCorrupted || isUnsetBaseline(dbInitialEquity),
      repairedBaseline:
        looksCorrupted || isUnsetBaseline(dbInitialEquity)
          ? netDeposits
          : undefined,
    };
  }

  const looksCorrupted =
    dbInitialEquity > 1 &&
    Math.abs(dbInitialEquity - liveEquity) / Math.max(liveEquity, 1) < 0.01;
  const reconstructionUseful =
    Math.abs(reconstructed - liveEquity) > 1 || Math.abs(tradingPnLAll) > 1;

  if (looksCorrupted && reconstructionUseful) {
    return {
      depositBase: reconstructed,
      shouldRepairBaseline: true,
      repairedBaseline: reconstructed,
    };
  }

  if (dbInitialEquity > 1 && !looksCorrupted) {
    return { depositBase: dbInitialEquity, shouldRepairBaseline: false };
  }

  return {
    depositBase: reconstructed,
    shouldRepairBaseline: isUnsetBaseline(dbInitialEquity),
    repairedBaseline: isUnsetBaseline(dbInitialEquity)
      ? reconstructed
      : undefined,
  };
}

/** Return % = ((current − initial) / initial) × 100, rounded to 2 decimals. */
export function computeReturnPct(current: number, initial: number): number {
  if (!Number.isFinite(current) || !Number.isFinite(initial) || initial <= 0) {
    return 0;
  }
  return Number((((current - initial) / initial) * 100).toFixed(2));
}
