import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionCleanupService } from './subscription-cleanup.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('SubscriptionCleanupService', () => {
  let service: SubscriptionCleanupService;
  let prismaService: PrismaService;
  const fixedNow = new Date('2026-04-21T12:00:00.000Z');

  beforeEach(async () => {
    jest.useFakeTimers();
    jest.setSystemTime(fixedNow);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionCleanupService,
        {
          provide: PrismaService,
          useValue: {
            userStrategySubscription: {
              findMany: jest.fn(),
              updateMany: jest.fn(),
            },
            brokerAccount: {
              updateMany: jest.fn(),
            },
            auditLog: {
              createMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get(SubscriptionCleanupService);
    prismaService = module.get(PrismaService);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('expires active subscriptions and deactivates linked broker accounts', async () => {
    (
      prismaService.userStrategySubscription.findMany as jest.Mock
    ).mockResolvedValue([
      {
        id: 'sub-1',
        userId: 'user-1',
        strategyId: 'strat-1',
        brokerAccountId: 'broker-1',
        expiresAt: new Date('2026-04-21T11:59:00.000Z'),
      },
    ]);

    await service.expireSubscriptions();

    expect(
      prismaService.userStrategySubscription.updateMany,
    ).toHaveBeenCalledWith({
      where: {
        id: { in: ['sub-1'] },
        status: 'ACTIVE',
      },
      data: {
        status: 'EXPIRED',
        cancelledAt: fixedNow,
      },
    });

    expect(prismaService.brokerAccount.updateMany).toHaveBeenCalledWith({
      where: {
        id: { in: ['broker-1'] },
        isActive: true,
      },
      data: { isActive: false },
    });

    expect(prismaService.auditLog.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          eventType: 'SUBSCRIPTION_AUTO_EXPIRED',
          userId: 'user-1',
          triggeredBy: 'SYSTEM_CRON',
        }),
      ],
    });
  });
});
