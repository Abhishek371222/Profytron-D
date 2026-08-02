/**
 * Narrow regression: history BFF must preserve DB isPaper (Day 15 PT3).
 * Source of truth lives in the Next.js history mapping helper.
 */
import { mapSavedTradeRow } from '../../../../web/src/lib/server/metaapi-closed-trades';

describe('mapSavedTradeRow isPaper preservation (history BFF)', () => {
  const base = {
    id: 'tx-1',
    symbol: 'EURUSD',
    direction: 'LONG',
    volume: 0.1,
    openPrice: 1.1,
    closePrice: 1.2,
    profit: 10,
    openedAt: '2026-08-01T00:00:00.000Z',
    closedAt: '2026-08-01T01:00:00.000Z',
  };

  it('paper trade → isPaper true', () => {
    expect(mapSavedTradeRow({ ...base, isPaper: true }).isPaper).toBe(true);
  });

  it('live trade → isPaper false', () => {
    expect(mapSavedTradeRow({ ...base, isPaper: false }).isPaper).toBe(false);
  });

  it('missing isPaper → false', () => {
    expect(mapSavedTradeRow({ ...base }).isPaper).toBe(false);
  });
});
