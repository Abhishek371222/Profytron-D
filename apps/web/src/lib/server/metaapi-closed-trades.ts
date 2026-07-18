
export function isBalanceOrNonTradingDeal(deal: any): boolean {
  const type = String(deal?.type || deal?.dealType || '').toUpperCase();
  if (
    type.includes('BALANCE') ||
    type.includes('CREDIT') ||
    type.includes('CHARGE') ||
    type.includes('CORRECTION') ||
    type.includes('BONUS') ||
    type.includes('SO_COMPENSATION') ||
    (type.includes('COMMISSION') && !type.includes('DEAL'))
  ) {
    return true;
  }
  const n = Number(deal?.type ?? deal?.dealType);
  return Number.isFinite(n) && n >= 2 && n <= 6;
}

function dealPnl(deal: any): number {
  return (
    Number(deal.profit || 0) +
    Number(deal.commission || 0) +
    Number(deal.swap || 0)
  );
}

function mapDirection(type: string): 'LONG' | 'SHORT' {
  const t = String(type || '').toUpperCase();
  if (t.includes('SELL') || t.includes('SHORT')) return 'SHORT';
  return 'LONG';
}

function entryKind(deal: any): 'in' | 'out' | 'other' {
  const e = String(deal?.entryType || deal?.entry || '').toUpperCase();
  if (e.includes('IN') && !e.includes('OUT')) return 'in';
  if (e.includes('OUT')) return 'out';
  return 'other';
}

export type ClosedHistoryRow = {
  id: string;
  symbol: string;
  direction: 'LONG' | 'SHORT';
  volume: number;
  openPrice: number;
  closePrice: number;
  profit: number;
  status: 'CLOSED';
  openedAt: string | null;
  closedAt: string | null;
  strategyId: null;
  isPaper: false;
};

export function closedTradesFromMetaDeals(
  deals: any[],
  opts?: { symbolFilter?: string; idPrefix?: string },
): ClosedHistoryRow[] {
  const symbolFilter = (opts?.symbolFilter || '').trim().toUpperCase();
  const idPrefix = opts?.idPrefix || 'meta-hist';
  const trading = deals.filter((d) => !isBalanceOrNonTradingDeal(d));

  const byPosition = new Map<string, any[]>();
  for (const d of trading) {
    const pid = String(d.positionId || '').trim();
    if (!pid) continue;
    if (!byPosition.has(pid)) byPosition.set(pid, []);
    byPosition.get(pid)!.push(d);
  }

  const closedRows: ClosedHistoryRow[] = [];

  const pushGroup = (group: any[]) => {
    const sorted = [...group].sort(
      (a, b) =>
        new Date(a.time || a.brokerTime || 0).getTime() -
        new Date(b.time || b.brokerTime || 0).getTime(),
    );
    const hasOut = sorted.some((d) => entryKind(d) === 'out');
    if (!hasOut && sorted.length < 2) return;

    const entry =
      sorted.find((d) => entryKind(d) === 'in') || sorted[0];
    const exit =
      [...sorted].reverse().find((d) => entryKind(d) === 'out') ||
      sorted[sorted.length - 1];

    const symbol = String(entry?.symbol || exit?.symbol || '');
    if (!symbol) return;
    if (symbolFilter && symbol.toUpperCase() !== symbolFilter) return;

    const profit = sorted.reduce((sum, d) => sum + dealPnl(d), 0);
    const openedAt = entry?.time || entry?.brokerTime || null;
    const closedAt = exit?.time || exit?.brokerTime || openedAt;

    closedRows.push({
      id: `${idPrefix}:${exit?.id || entry?.id || openedAt || Math.random()}`,
      symbol,
      direction: mapDirection(entry?.type || ''),
      volume: Number(entry?.volume || exit?.volume || 0),
      openPrice: Number(entry?.price || 0),
      closePrice: Number(exit?.price || entry?.price || 0),
      profit,
      status: 'CLOSED',
      openedAt,
      closedAt,
      strategyId: null,
      isPaper: false,
    });
  };

  for (const [, group] of byPosition) {
    pushGroup(group);
  }

  const orphans = trading.filter((d) => !String(d.positionId || '').trim());
  if (orphans.length > 0) {
    const bySymbol = new Map<string, any[]>();
    for (const d of orphans) {
      const sym = String(d.symbol || 'UNKNOWN');
      if (!bySymbol.has(sym)) bySymbol.set(sym, []);
      bySymbol.get(sym)!.push(d);
    }
    for (const [, group] of bySymbol) {
      const sorted = [...group].sort(
        (a, b) =>
          new Date(a.time || 0).getTime() - new Date(b.time || 0).getTime(),
      );
      let open: any[] = [];
      for (const d of sorted) {
        const kind = entryKind(d);
        if (kind === 'in') {
          open = [d];
        } else if (kind === 'out' && open.length > 0) {
          pushGroup([...open, d]);
          open = [];
        } else if (open.length > 0) {
          open.push(d);
        }
      }
    }
  }

  closedRows.sort(
    (a, b) =>
      new Date(b.closedAt || 0).getTime() - new Date(a.closedAt || 0).getTime(),
  );
  return closedRows;
}
