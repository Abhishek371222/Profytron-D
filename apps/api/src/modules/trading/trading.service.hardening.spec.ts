import { TradingService } from './trading.service';

describe('TradingService hardening', () => {
  const makeService = (openTrades: unknown[] = []) => {
    const prisma = {
      trade: {
        findMany: jest.fn().mockResolvedValue(openTrades),
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      auditLog: {
        create: jest.fn().mockResolvedValue({}),
        createMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
    };
    const tradeQueue = { add: jest.fn().mockResolvedValue({}) };
    const gateway = { sendToUser: jest.fn() };
    const service = Object.create(TradingService.prototype) as TradingService;
    Object.assign(service, {
      logger: { warn: jest.fn(), log: jest.fn() },
      prisma,
      tradeQueue,
      gateway,
    });
    return { service, prisma, gateway };
  };

  it('emergencyStop returns NO_OPEN_TRADES when nothing is open', async () => {
    const { service } = makeService([]);
    const result = await service.emergencyStop('user-1');
    expect(result).toMatchObject({
      success: true,
      status: 'NO_OPEN_TRADES',
      closedTrades: 0,
    });
    expect(result.timestamp).toBeDefined();
    expect(result.stoppedAt).toBeDefined();
  });

  it('getOpenTrades returns trades across all broker accounts', async () => {
    const trades = [
      {
        id: 't1',
        symbol: 'EURUSD',
        direction: 'LONG',
        volume: 0.1,
        openPrice: 1.08,
        fillPrice: 1.08,
        profit: null,
        status: 'OPEN',
        openedAt: new Date(),
        strategyId: null,
        brokerTicket: '1',
        isPaper: false,
        brokerAccountId: 'broker-a',
      },
      {
        id: 't2',
        symbol: 'XAUUSD',
        direction: 'SHORT',
        volume: 0.1,
        openPrice: 2650,
        fillPrice: 2650,
        profit: 10,
        status: 'OPEN',
        openedAt: new Date(),
        strategyId: null,
        brokerTicket: '2',
        isPaper: false,
        brokerAccountId: 'broker-b',
      },
    ];
    const prisma = {
      trade: {
        findMany: jest.fn().mockResolvedValue(trades),
      },
    };
    const marketService = { getAllQuotes: jest.fn().mockResolvedValue([]) };
    const service = Object.create(TradingService.prototype) as TradingService;
    Object.assign(service, { prisma, marketService });
    const result = await service.getOpenTrades('user-1');
    expect(result).toHaveLength(2);
    expect(prisma.trade.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: 'user-1', status: 'OPEN' }),
      }),
    );
  });
});
