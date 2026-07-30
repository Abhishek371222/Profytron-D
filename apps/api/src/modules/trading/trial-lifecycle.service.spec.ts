import { TrialLifecycleService } from './trial-lifecycle.service';

function buildService(trials: any[]) {
  const prisma = {
    userSubscription: {
      findMany: jest.fn().mockResolvedValue(trials),
    },
  };
  const email = { sendTrialEndingSoonEmail: jest.fn().mockResolvedValue(undefined) };
  const notifications = { create: jest.fn().mockResolvedValue(undefined) };
  const store = new Map<string, string>();
  const redis = {
    get: jest.fn().mockImplementation(async (key: string) => store.get(key) ?? null),
    set: jest.fn().mockImplementation(async (key: string, value: string) => {
      store.set(key, value);
    }),
  };
  const agentEvents = { emit: jest.fn() };

  const service = Object.create(
    TrialLifecycleService.prototype,
  ) as TrialLifecycleService;
  Object.assign(service, {
    logger: { log: jest.fn(), warn: jest.fn(), error: jest.fn() },
    prisma,
    email,
    notifications,
    redis,
    agentEvents,
  });

  return { service, prisma, email, notifications, redis, agentEvents };
}

describe('TrialLifecycleService.sendTrialEndingReminders', () => {
  const trial = {
    id: 'sub_1',
    userId: 'user_1',
    trialEndsAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    user: { id: 'user_1', email: 'trader@example.com', fullName: 'Trader' },
    plan: { name: 'Starter' },
  };

  it('sends a reminder email and notification for a matching trial', async () => {
    const { service, email, notifications, agentEvents } = buildService([trial]);

    await service.sendTrialEndingReminders();

    expect(email.sendTrialEndingSoonEmail).toHaveBeenCalled();
    expect(notifications.create).toHaveBeenCalled();
    expect(agentEvents.emit).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'trial.ending_soon' }),
    );
  });

  it('does not send a duplicate reminder for the same user/window twice', async () => {
    const { service, email, prisma } = buildService([trial]);
    prisma.userSubscription.findMany.mockResolvedValue([trial]);

    await service.sendTrialEndingReminders();
    await service.sendTrialEndingReminders();

    // Only the 3-day window matches `trial` (trialEndsAt = now+3d); the 1-day
    // scan re-queries with a different date range but our mock returns the
    // same array regardless of args, so we only assert the 3-day email was
    // deduped across the two full cron runs, not double-sent.
    const threeDayCalls = email.sendTrialEndingSoonEmail.mock.calls.filter(
      (args: any[]) => args[3] === 3,
    );
    expect(threeDayCalls.length).toBe(1);
  });
});
