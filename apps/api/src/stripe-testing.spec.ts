import { INestApplication } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from './prisma/prisma.service';
import { createTestApp } from './test-utils/test-app';
import { resetTestDatabase } from './test-utils/test-db';
import { PaymentsService } from './modules/payments/payments.service';
import { describeIfApiInfra } from './test-utils/test-infra';

describeIfApiInfra('Stripe webhook flows', () => {
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
  });

  it('marks duplicate Stripe events as duplicates instead of reprocessing them', async () => {
    const event = {
      id: 'evt_duplicate_check',
      object: 'event',
      type: 'payment_intent.succeeded',
      data: { object: { id: 'pi_dup_123' } },
    };

    const first = await paymentsService.handleStripeEvent(event);
    const second = await paymentsService.handleStripeEvent(event);

    expect(first.ok).toBe(true);
    expect(second.duplicate).toBe(true);
  });

  it('cancels an existing local subscription on customer.subscription.deleted', async () => {
    const creator = await prisma.user.create({
      data: {
        email: 'cancel-creator@test.com',
        fullName: 'Cancel Creator',
        emailVerified: true,
        role: 'CREATOR',
      },
    });
    const buyer = await prisma.user.create({
      data: {
        email: 'cancel-buyer@test.com',
        fullName: 'Cancel Buyer',
        emailVerified: true,
      },
    });

    const strategy = await prisma.strategy.create({
      data: {
        creatorId: creator.id,
        name: 'Cancel Strategy',
        description: 'Cancellation strategy',
        category: 'TREND',
        riskLevel: 'LOW',
        configJson: { nodes: [] },
        isPublished: true,
      },
    });

    await prisma.userStrategySubscription.create({
      data: {
        userId: buyer.id,
        strategyId: strategy.id,
        status: 'ACTIVE',
        planType: 'MONTHLY',
        stripeSubId: 'sub_cancel_123',
      },
    });

    await paymentsService.handleStripeEvent({
      id: `evt_cancel_subscription_${randomUUID()}`,
      object: 'event',
      type: 'customer.subscription.deleted',
      data: {
        object: {
          id: 'sub_cancel_123',
        },
      },
    });

    const updated = await prisma.userStrategySubscription.findUnique({
      where: {
        userId_strategyId: {
          userId: buyer.id,
          strategyId: strategy.id,
        },
      },
    });

    expect(updated?.status).toBe('CANCELLED');
    expect(updated?.cancelledAt).toBeTruthy();
  });

  it('rejects invalid webhook signatures at the service boundary', () => {
    expect(() =>
      paymentsService.verifyAndBuildStripeEvent(
        Buffer.from('{}', 'utf8'),
        'invalid-signature',
      ),
    ).toThrow();
  });
});
