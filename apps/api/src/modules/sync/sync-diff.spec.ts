import {
  diffEquity,
  diffPositions,
  positionFingerprint,
} from './sync-diff';

describe('sync-diff', () => {
  it('detects unchanged equity', () => {
    const e = { balance: 1000, equity: 1000, margin: 0, freeMargin: 1000 };
    expect(diffEquity(e, { ...e }).changed).toBe(false);
  });

  it('detects equity change', () => {
    const prev = { balance: 1000, equity: 1000 };
    const next = { balance: 1000, equity: 1001 };
    const d = diffEquity(prev, next);
    expect(d.changed).toBe(true);
    expect(d.upserts).toHaveLength(1);
  });

  it('diffs positions by ticket', () => {
    const prev = [
      { id: '1', symbol: 'EURUSD', volume: 0.1, openPrice: 1.1, profit: 1 },
      { id: '2', symbol: 'XAUUSD', volume: 0.2, openPrice: 2000, profit: 2 },
    ];
    const next = [
      { id: '1', symbol: 'EURUSD', volume: 0.1, openPrice: 1.1, profit: 5 },
      { id: '3', symbol: 'BTCUSD', volume: 0.01, openPrice: 60000, profit: 0 },
    ];
    const d = diffPositions(prev, next);
    expect(d.upserts.map((p) => p.id).sort()).toEqual(['1', '3']);
    expect(d.removes).toEqual(['2']);
  });

  it('fingerprints positions stably', () => {
    const a = [
      { id: 'b', symbol: 'X', volume: 1, openPrice: 1, profit: 0 },
      { id: 'a', symbol: 'Y', volume: 1, openPrice: 1, profit: 0 },
    ];
    const b = [
      { id: 'a', symbol: 'Y', volume: 1, openPrice: 1, profit: 0 },
      { id: 'b', symbol: 'X', volume: 1, openPrice: 1, profit: 0 },
    ];
    expect(positionFingerprint(a)).toBe(positionFingerprint(b));
  });
});
