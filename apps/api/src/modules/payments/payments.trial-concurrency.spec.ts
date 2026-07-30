import { randomUUID } from 'crypto';
import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { createTestApp } from '../../test-utils/test-app';
import { resetTestDatabase } from '../../test-utils/test-db';
import { PaymentsService } from './payments.service';
import { describeIfApiInfra } from '../../test-utils/test-infra';

describeIfApiInfra(
  'PaymentsService.startPlatformTrial — concurrency (real DB row locking)',
  () => {
    let app: INestApplication;
    let prisma: PrismaService;
    let paymentsService: PaymentsService;

    beforeAll(async () => {
      const testApp = await createTestApp();
      app = testApp.app;
      prisma = app.get(PrismaService);
      paymentsService = app.get(PaymentsService);
    });

    afterAll(async () => {
      await app.close();
    });

    beforeEach(async () => {
      await resetTestDatabase(prisma);
      await prisma.subscriptionPlan.create({
        data: {
          name: 'Starter',
          monthlyPrice: 799,
          annualPrice: 7990,
          features: [],
        },
      });
      await prisma.subscriptionPlan.create({
        data: {
          name: 'Pro',
          monthlyPrice: 999,
          annualPrice: 9990,
          features: [],
        },
      });
    });

    async function createVerifiedUser() {
      return prisma.user.create({
        data: {
          email: `concurrency-${randomUUID()}@test.com`,
          fullName: 'Concurrency Test User',
          emailVerified: true,
        },
      });
    }

    async function assertSingleActiveTrial(userId: string) {
      const subs = await prisma.userSubscription.findMany({
        where: { userId },
      });
      const active = subs.filter((s) => s.status === 'ACTIVE');
      expect(active.length).toBe(1);
      expect(subs.length).toBe(1);
      expect(active[0].isTrial).toBe(true);

      const user = await prisma.user.findUnique({ where: { id: userId } });
      expect(user?.hasUsedPlatformTrial).toBe(true);
    }

    it('2 simultaneous requests (same plan): exactly 1 success, 1 failure', async () => {
      const user = await createVerifiedUser();

      const results = await Promise.allSettled([
        paymentsService.startPlatformTrial(user.id, 'Starter'),
        paymentsService.startPlatformTrial(user.id, 'Starter'),
      ]);

      const fulfilled = results.filter((r) => r.status === 'fulfilled');
      const rejected = results.filter((r) => r.status === 'rejected');
      expect(fulfilled.length).toBe(1);
      expect(rejected.length).toBe(1);

      await assertSingleActiveTrial(user.id);
    });

    it('2 simultaneous requests (different plans): exactly 1 success, 1 failure', async () => {
      const user = await createVerifiedUser();

      const results = await Promise.allSettled([
        paymentsService.startPlatformTrial(user.id, 'Starter'),
        paymentsService.startPlatformTrial(user.id, 'Pro'),
      ]);

      const fulfilled = results.filter((r) => r.status === 'fulfilled');
      const rejected = results.filter((r) => r.status === 'rejected');
      expect(fulfilled.length).toBe(1);
      expect(rejected.length).toBe(1);

      await assertSingleActiveTrial(user.id);
    });

    it('5 simultaneous requests: exactly 1 success, 4 failures', async () => {
      const user = await createVerifiedUser();
      const plans = ['Starter', 'Pro', 'Starter', 'Pro', 'Starter'];

      const results = await Promise.allSettled(
        plans.map((planId) =>
          paymentsService.startPlatformTrial(user.id, planId),
        ),
      );

      const fulfilled = results.filter((r) => r.status === 'fulfilled');
      const rejected = results.filter((r) => r.status === 'rejected');
      expect(fulfilled.length).toBe(1);
      expect(rejected.length).toBe(4);

      await assertSingleActiveTrial(user.id);
    });

    it('10 simultaneous requests: exactly 1 success, 9 failures', async () => {
      const user = await createVerifiedUser();
      const plans = Array.from({ length: 10 }, (_, i) =>
        i % 2 === 0 ? 'Starter' : 'Pro',
      );

      const results = await Promise.allSettled(
        plans.map((planId) =>
          paymentsService.startPlatformTrial(user.id, planId),
        ),
      );

      const fulfilled = results.filter((r) => r.status === 'fulfilled');
      const rejected = results.filter((r) => r.status === 'rejected');
      expect(fulfilled.length).toBe(1);
      expect(rejected.length).toBe(9);

      await assertSingleActiveTrial(user.id);
    });

    it('does not affect a different, unrelated user racing at the same time', async () => {
      const userA = await createVerifiedUser();
      const userB = await createVerifiedUser();

      const results = await Promise.allSettled([
        paymentsService.startPlatformTrial(userA.id, 'Starter'),
        paymentsService.startPlatformTrial(userA.id, 'Pro'),
        paymentsService.startPlatformTrial(userB.id, 'Starter'),
        paymentsService.startPlatformTrial(userB.id, 'Pro'),
      ]);

      expect(results.filter((r) => r.status === 'fulfilled').length).toBe(2);
      expect(results.filter((r) => r.status === 'rejected').length).toBe(2);

      await assertSingleActiveTrial(userA.id);
      await assertSingleActiveTrial(userB.id);
    });
  },
);
