import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PaymentsService } from './payments.service';

function buildService(overrides: {
  plan?: any;
  user?: any;
  existingActive?: any;
  txSub?: any;
} = {}) {
  const plan = overrides.plan ?? {
    id: 'plan_starter',
    name: 'Starter',
  };
  const user = overrides.user ?? {
    email: 'trader@example.com',
    fullName: 'Trader',
    emailVerified: true,
    hasUsedPlatformTrial: false,
  };
  const txSub = overrides.txSub ?? {
    id: 'sub_1',
    userId: 'user_1',
    planId: plan.id,
    isTrial: true,
  };

  const prisma = {
    subscriptionPlan: {
      findFirst: jest.fn().mockResolvedValue(plan),
    },
    user: {
      findUnique: jest.fn().mockResolvedValue(user),
      update: jest.fn().mockResolvedValue(undefined),
    },
    userSubscription: {
      findFirst: jest.fn().mockResolvedValue(overrides.existingActive ?? null),
      upsert: jest.fn().mockResolvedValue(txSub),
    },
    $queryRaw: jest.fn().mockResolvedValue([{ id: 'user_1' }]),
    $transaction: jest.fn().mockImplementation(async (fn: any) =>
      fn({
        $queryRaw: prisma.$queryRaw,
        userSubscription: {
          findFirst: prisma.userSubscription.findFirst,
          upsert: prisma.userSubscription.upsert,
        },
        user: {
          findUnique: prisma.user.findUnique,
          update: prisma.user.update,
        },
      }),
    ),
  };

  const notifications = { create: jest.fn().mockResolvedValue(undefined) };
  const emailService = {
    sendTrialStartedEmail: jest.fn().mockResolvedValue(undefined),
  };
  const agentEvents = { emit: jest.fn() };

  const service = Object.create(PaymentsService.prototype) as PaymentsService;
  Object.assign(service, {
    logger: { log: jest.fn(), warn: jest.fn(), error: jest.fn() },
    prisma,
    notifications,
    emailService,
    agentEvents,
  });

  return { service, prisma, notifications, emailService, agentEvents };
}

describe('PaymentsService.startPlatformTrial', () => {
  const ORIGINAL_FLAG = process.env.PLATFORM_TRIALS_ENABLED;

  afterEach(() => {
    if (ORIGINAL_FLAG === undefined) delete process.env.PLATFORM_TRIALS_ENABLED;
    else process.env.PLATFORM_TRIALS_ENABLED = ORIGINAL_FLAG;
  });

  it('rejects when PLATFORM_TRIALS_ENABLED=false (kill switch)', async () => {
    process.env.PLATFORM_TRIALS_ENABLED = 'false';
    const { service } = buildService();
    await expect(
      service.startPlatformTrial('user_1', 'plan_starter'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects when the plan does not exist', async () => {
    const { service, prisma } = buildService();
    prisma.subscriptionPlan.findFirst.mockResolvedValue(null);
    await expect(
      service.startPlatformTrial('user_1', 'unknown_plan'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects when the plan is not trial-eligible', async () => {
    const { service } = buildService({ plan: { id: 'plan_business', name: 'Business' } });
    await expect(
      service.startPlatformTrial('user_1', 'plan_business'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects when the user is not found', async () => {
    const { service, prisma } = buildService();
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(
      service.startPlatformTrial('user_1', 'plan_starter'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects when the email is not verified', async () => {
    const { service } = buildService({
      user: {
        email: 'trader@example.com',
        fullName: 'Trader',
        emailVerified: false,
        hasUsedPlatformTrial: false,
      },
    });
    await expect(
      service.startPlatformTrial('user_1', 'plan_starter'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects when the user has already used their trial', async () => {
    const { service } = buildService({
      user: {
        email: 'trader@example.com',
        fullName: 'Trader',
        emailVerified: true,
        hasUsedPlatformTrial: true,
      },
    });
    await expect(
      service.startPlatformTrial('user_1', 'plan_starter'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects when the user already has an active subscription', async () => {
    const { service } = buildService({ existingActive: { id: 'existing_sub' } });
    await expect(
      service.startPlatformTrial('user_1', 'plan_starter'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('grants the trial, marks hasUsedPlatformTrial, and fires notifications on success', async () => {
    const { service, prisma, notifications, emailService, agentEvents } = buildService();

    const result = await service.startPlatformTrial('user_1', 'plan_starter');

    expect(result).toEqual(
      expect.objectContaining({ id: 'sub_1', isTrial: true }),
    );
    expect(prisma.userSubscription.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId_planId: { userId: 'user_1', planId: 'plan_starter' } },
        create: expect.objectContaining({ isTrial: true, status: 'ACTIVE' }),
      }),
    );
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'user_1' },
        data: expect.objectContaining({
          subscriptionTier: 'PRO',
          hasUsedPlatformTrial: true,
        }),
      }),
    );
    expect(notifications.create).toHaveBeenCalled();
    expect(emailService.sendTrialStartedEmail).toHaveBeenCalled();
    expect(agentEvents.emit).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'trial.started' }),
    );
  });
});
