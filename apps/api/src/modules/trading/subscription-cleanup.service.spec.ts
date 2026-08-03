import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionCleanupService } from './subscription-cleanup.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CopyFactorySyncService } from '../copy-factory/copy-factory-sync.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RedisService } from '../auth/redis.service';

describe('SubscriptionCleanupService', () => {
  let service: SubscriptionCleanupService;
  let prismaService: PrismaService;
  let copyFactorySync: CopyFactorySyncService;
  let notifications: { create: jest.Mock };
  let redis: { get: jest.Mock; set: jest.Mock };
  const fixedNow = new Date('2026-04-21T12:00:00.000Z');

  beforeEach(async () => {
    jest.useFakeTimers();
    jest.setSystemTime(fixedNow);
    notifications = { create: jest.fn().mockResolvedValue(undefined) };
    redis = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue('OK'),
    };

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
            userSubscription: {
              findMany: jest.fn(),
            },
            brokerAccount: {
              updateMany: jest.fn(),
            },
            auditLog: {
              createMany: jest.fn(),
              create: jest.fn().mockResolvedValue({}),
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
        { provide: NotificationsService, useValue: notifications },
        { provide: RedisService, useValue: redis },
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
          name: 'Alpha',
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

  it('sends platform renewal reminder only for prepaid autoRenewal-eligible subs', async () => {
    const expiresAt = new Date('2026-04-24T10:00:00.000Z'); // +3 days from fixedNow
    (prismaService.userSubscription.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'plat-1',
        userId: 'user-1',
        planId: 'plan-1',
        expiresAt,
        plan: { name: 'Pro' },
      },
    ]);

    const sent = await service.sendPlatformRenewalReminderForDays(3);

    expect(sent).toBe(1);
    expect(prismaService.userSubscription.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: 'ACTIVE',
          autoRenewal: true,
          cancelledAt: null,
          isTrial: false,
        }),
      }),
    );
    expect(notifications.create).toHaveBeenCalledWith(
      'user-1',
      'Plan renewal reminder',
      expect.stringContaining('does not auto-charge'),
      'WARNING',
      '/settings/billing',
    );
    expect(redis.set).toHaveBeenCalled();
  });

  it('skips platform renewal reminder when already deduped', async () => {
    redis.get.mockResolvedValue('1');
    (prismaService.userSubscription.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'plat-1',
        userId: 'user-1',
        planId: 'plan-1',
        expiresAt: new Date('2026-04-24T10:00:00.000Z'),
        plan: { name: 'Pro' },
      },
    ]);

    const sent = await service.sendPlatformRenewalReminderForDays(3);
    expect(sent).toBe(0);
    expect(notifications.create).not.toHaveBeenCalled();
  });

  it('sends marketplace renewal reminder for prepaid auto-renew-eligible bots', async () => {
    const expiresAt = new Date('2026-04-24T10:00:00.000Z');
    (
      prismaService.userStrategySubscription.findMany as jest.Mock
    ).mockResolvedValue([
      {
        id: 'uss-1',
        userId: 'user-1',
        strategyId: 'strat-1',
        expiresAt,
        executionProfileJson: { autoRenew: true },
        strategy: { name: 'Alpha Bot' },
      },
    ]);
    redis.get.mockResolvedValue(null);

    const sent = await service.sendMarketplaceRenewalReminderForDays(3);
    expect(sent).toBe(1);
    expect(notifications.create).toHaveBeenCalledWith(
      'user-1',
      'Bot subscription renewal reminder',
      expect.stringContaining('does not auto-renew'),
      'WARNING',
      '/subscriptions',
    );
  });

  it('skips marketplace reminder when autoRenew is disabled in profile', async () => {
    (
      prismaService.userStrategySubscription.findMany as jest.Mock
    ).mockResolvedValue([
      {
        id: 'uss-2',
        userId: 'user-2',
        strategyId: 'strat-2',
        expiresAt: new Date('2026-04-24T10:00:00.000Z'),
        executionProfileJson: { autoRenew: false },
        strategy: { name: 'Beta Bot' },
      },
    ]);
    redis.get.mockResolvedValue(null);

    const sent = await service.sendMarketplaceRenewalReminderForDays(3);
    expect(sent).toBe(0);
    expect(notifications.create).not.toHaveBeenCalled();
  });
});
