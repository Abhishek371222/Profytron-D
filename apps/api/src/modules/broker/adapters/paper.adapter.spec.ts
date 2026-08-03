import { PaperBrokerAdapter } from './paper.adapter';
import { estimateUnrealizedPnl } from '../../trading/utils/pnl.util';

describe('PaperBrokerAdapter.closeTrade', () => {
  const adapter = new PaperBrokerAdapter();

  it('returns non-zero close_price and profit when trade context is provided', async () => {
    const params = {
      direction: 'LONG',
      volume: 0.1,
      openPrice: 1.1,
      fillPrice: 1.1,
      closePrice: 1.105,
      openedAt: new Date(Date.now() - 60_000),
    };

    const expected = estimateUnrealizedPnl(
      {
        direction: params.direction,
        volume: params.volume,
        openPrice: params.openPrice,
        fillPrice: params.fillPrice,
      },
      params.closePrice,
    );

    const result = await adapter.closeTrade('paper-ticket-1', params);

    expect(result.success).toBe(true);
    expect(result.calculated).toBe(true);
    expect(result.status).toBe('CLOSED');
    expect(result.close_price).toBe(params.closePrice);
    expect(result.profit).toBe(expected);
    expect(result.pnl).toBe(expected);
    expect(result.profit).not.toBe(0);
    expect(result.close_price).not.toBe(0);
    expect(result.commission).toBeNull();
    expect(result.swap).toBeNull();
    expect(result.closedAt).toEqual(expect.any(String));
    expect(result.duration).toBeGreaterThan(0);
    expect(result.loss).toBe(expected < 0 ? Math.abs(expected) : 0);
  });

  it('matches estimateUnrealizedPnl for SHORT losses', async () => {
    const params = {
      direction: 'SHORT',
      volume: 0.2,
      openPrice: 2000,
      fillPrice: null as number | null,
      closePrice: 2010,
    };
    const expected = estimateUnrealizedPnl(
      {
        direction: params.direction,
        volume: params.volume,
        openPrice: params.openPrice,
        fillPrice: params.fillPrice,
      },
      params.closePrice,
    );

    const result = await adapter.closeTrade('t2', params);
    expect(result.calculated).toBe(true);
    expect(result.profit).toBe(expected);
    expect(result.loss).toBe(Math.abs(expected));
  });

  it('does not fabricate zeros when params are missing', async () => {
    const result = await adapter.closeTrade('ticket-only');
    expect(result.success).toBe(true);
    expect(result.calculated).toBe(false);
    expect(result.close_price).toBeNull();
    expect(result.profit).toBeNull();
    expect(result.pnl).toBeNull();
    expect(result.loss).toBeNull();
  });

  it('does not fabricate zeros for invalid prices', async () => {
    const result = await adapter.closeTrade('bad', {
      direction: 'LONG',
      volume: 0.1,
      openPrice: 0,
      closePrice: 0,
    });
    expect(result.calculated).toBe(false);
    expect(result.close_price).toBeNull();
    expect(result.profit).toBeNull();
  });
});
