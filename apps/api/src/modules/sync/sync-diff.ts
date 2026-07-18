/**
 * Pure entity diffs for Phase 3 SyncEngine.
 * Ticket/id keyed — never replace entire collections when unchanged.
 */

export type EquitySnapshot = {
  balance: number;
  equity: number;
  margin?: number;
  freeMargin?: number;
  currency?: string;
};

export type PositionSnapshot = {
  id: string;
  symbol: string;
  volume: number;
  openPrice: number;
  profit?: number;
  stopLoss?: number | null;
  takeProfit?: number | null;
  type?: string;
};

export type EntityDiff<T> = {
  changed: boolean;
  upserts: T[];
  removes: string[];
};

function approxEq(a: number, b: number, eps = 1e-6): boolean {
  return Math.abs(a - b) <= eps;
}

export function diffEquity(
  prev: EquitySnapshot | null,
  next: EquitySnapshot,
): EntityDiff<EquitySnapshot> {
  if (
    prev &&
    approxEq(prev.balance, next.balance) &&
    approxEq(prev.equity, next.equity) &&
    approxEq(Number(prev.margin ?? 0), Number(next.margin ?? 0)) &&
    approxEq(Number(prev.freeMargin ?? 0), Number(next.freeMargin ?? 0))
  ) {
    return { changed: false, upserts: [], removes: [] };
  }
  return { changed: true, upserts: [next], removes: [] };
}

export function diffPositions(
  prev: PositionSnapshot[],
  next: PositionSnapshot[],
): EntityDiff<PositionSnapshot> {
  const prevMap = new Map(prev.map((p) => [p.id, p]));
  const nextIds = new Set(next.map((p) => p.id));
  const upserts: PositionSnapshot[] = [];
  const removes: string[] = [];

  for (const p of next) {
    const old = prevMap.get(p.id);
    if (!old) {
      upserts.push(p);
      continue;
    }
    if (
      old.symbol !== p.symbol ||
      !approxEq(old.volume, p.volume) ||
      !approxEq(old.openPrice, p.openPrice) ||
      !approxEq(Number(old.profit ?? 0), Number(p.profit ?? 0)) ||
      Number(old.stopLoss ?? 0) !== Number(p.stopLoss ?? 0) ||
      Number(old.takeProfit ?? 0) !== Number(p.takeProfit ?? 0)
    ) {
      upserts.push(p);
    }
  }

  for (const id of prevMap.keys()) {
    if (!nextIds.has(id)) removes.push(id);
  }

  return {
    changed: upserts.length > 0 || removes.length > 0,
    upserts,
    removes,
  };
}

export function positionFingerprint(positions: PositionSnapshot[]): string {
  return positions
    .map(
      (p) =>
        `${p.id}:${p.volume}:${p.openPrice}:${Number(p.profit ?? 0).toFixed(2)}`,
    )
    .sort()
    .join('|');
}
