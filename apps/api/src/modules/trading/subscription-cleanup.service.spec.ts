import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionCleanupService } from './subscription-cleanup.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CopyFactorySyncService } from '../copy-factory/copy-factory-sync.service';

describe('SubscriptionCleanupService', () => {
  let service: SubscriptionCleanupService;
  let prismaService: PrismaService;
  let copyFactorySync: CopyFactorySyncService;
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
        {
          provide: CopyFactorySyncService,
          useValue: {
            enqueueLinkSubscription: jest.fn().mockResolvedValue(undefined),
            enqueueUnlinkSubscription: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get(SubscriptionCleanupService);
    prismaService = module.get(PrismaService);
    copyFactorySync = module.get(CopyFactorySyncService);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('expires active subscriptions and queues a CopyFactory unlink for copy strategies', async () => {
    (
      prismaService.userStrategySubscription.findMany as jest.Mock
    ).mockResolvedValue([
      {
        id: 'sub-1',
        userId: 'user-1',
        strategyId: 'strat-1',
        brokerAccountId: 'broker-1',
        expiresAt: new Date('2026-04-21T11:59:00.000Z'),
        strategy: {
          copyFactoryStrategyId: 'cf-strat-1',
          masterBrokerAccountId: 'master-broker-1',
        },
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

    // Copy strategies are detached from CopyFactory rather than deactivating the
    // broker account directly.
    expect(copyFactorySync.enqueueUnlinkSubscription).toHaveBeenCalledWith(
      'sub-1',
    );

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
