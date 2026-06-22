import { computeDailyLossUsd, computeMaxDrawdownPct } from './pnl.util';

describe('pnl.util', () => {
  it('computeDailyLossUsd sums absolute losses only', () => {
    expect(
      computeDailyLossUsd([
        { profit: 50 },
        { profit: -30 },
        { profit: -20 },
        { profit: 10 },
      ]),
    ).toBe(50);
  });

  it('computeMaxDrawdownPct tracks peak-to-trough', () => {
    const dd = computeMaxDrawdownPct(
      [{ profit: 100 }, { profit: -150 }, { profit: 50 }],
      10_000,
    );
    expect(dd).toBeGreaterThan(0);
  });
});
