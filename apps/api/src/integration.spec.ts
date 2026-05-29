import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from './prisma/prisma.service';
import { createTestApp } from './test-utils/test-app';
import { resetTestDatabase } from './test-utils/test-db';
import { PaymentsService } from './modules/payments/payments.service';
import { describeIfApiInfra } from './test-utils/test-infra';

describeIfApiInfra('Integration flows', () => {
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

  it('completes register -> verify -> login with the current API contract', async () => {
    const email = `integration-${randomUUID()}@test.com`;
    const registerResponse = await request(app.getHttpServer())
      .post('/v1/auth/register')
      .send({
        email,
        password: 'ValidPass123!',
        confirmPassword: 'ValidPass123!',
        fullName: 'Integration Test User',
      })
      .expect(201);

    const otp = registerResponse.body.data.devOtp;

    const verifyResponse = await request(app.getHttpServer())
      .post('/v1/auth/verify-email')
      .send({
        email,
        otp,
      })
      .expect(200);

    expect(verifyResponse.body.data.user.emailVerified).toBe(true);

    const loginResponse = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({
        email,
        password: 'ValidPass123!',
      })
      .expect(200);

    expect(loginResponse.body.data.accessToken).toBeDefined();
    expect(loginResponse.body.data.user.email).toBe(email);
  });

  it('activates a marketplace subscription from checkout.session.completed', async () => {
    const creator = await prisma.user.create({
      data: {
        email: 'creator@test.com',
        fullName: 'Creator User',
        emailVerified: true,
        role: 'CREATOR',
      },
    });
    const buyer = await prisma.user.create({
      data: {
        email: 'buyer@test.com',
        fullName: 'Buyer User',
        emailVerified: true,
      },
    });

    const strategy = await prisma.strategy.create({
      data: {
        creatorId: creator.id,
        name: 'Momentum Engine',
        description: 'Integration test strategy',
        category: 'TREND',
        riskLevel: 'MEDIUM',
        configJson: { nodes: [] },
        monthlyPrice: 29,
        annualPrice: 199,
        isPublished: true,
      },
    });

    await prisma.marketplaceListing.create({
      data: {
        strategyId: strategy.id,
        monthlyPrice: 29,
        annualPrice: 199,
        lifetimePrice: 499,
      },
    });

    const checkoutEventId = `evt_checkout_${randomUUID()}`;
    await paymentsService.handleStripeEvent({
      id: checkoutEventId,
      object: 'event',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_checkout',
          amount_total: 2900,
          subscription: 'sub_checkout_123',
          metadata: {
            userId: buyer.id,
            strategyId: strategy.id,
            planType: 'MONTHLY',
          },
        },
      },
    });

    const subscription = await prisma.userStrategySubscription.findUnique({
      where: {
        userId_strategyId: {
          userId: buyer.id,
          strategyId: strategy.id,
        },
      },
    });
    const creatorCredit = await prisma.walletTransaction.findFirst({
      where: {
        userId: creator.id,
        type: 'MARKETPLACE_SALE',
      },
    });

    expect(subscription?.status).toBe('ACTIVE');
    expect(subscription?.stripeSubId).toBe('sub_checkout_123');
    expect(creatorCredit?.amount).toBeCloseTo(20.3, 5);
  });

  it('renews an existing subscription on invoice.payment_succeeded without crediting the buyer wallet', async () => {
    const creator = await prisma.user.create({
      data: {
        email: 'renew-creator@test.com',
        fullName: 'Renew Creator',
        emailVerified: true,
        role: 'CREATOR',
      },
    });
    const buyer = await prisma.user.create({
      data: {
        email: 'renew-buyer@test.com',
        fullName: 'Renew Buyer',
        emailVerified: true,
      },
    });

    const strategy = await prisma.strategy.create({
      data: {
        creatorId: creator.id,
        name: 'Renewal Strategy',
        description: 'Renewal integration strategy',
        category: 'TREND',
        riskLevel: 'LOW',
        configJson: { nodes: [] },
        monthlyPrice: 29,
        isPublished: true,
      },
    });

    await prisma.marketplaceListing.create({
      data: {
        strategyId: strategy.id,
        monthlyPrice: 29,
        annualPrice: 199,
        lifetimePrice: 499,
      },
    });

    await prisma.userStrategySubscription.create({
      data: {
        userId: buyer.id,
        strategyId: strategy.id,
        status: 'INACTIVE',
        planType: 'MONTHLY',
        stripeSubId: 'sub_existing_123',
      },
    });

    const invoiceEventId = `evt_invoice_${randomUUID()}`;
    await paymentsService.handleStripeEvent({
      id: invoiceEventId,
      object: 'event',
      type: 'invoice.payment_succeeded',
      data: {
        object: {
          id: 'in_paid_123',
          amount_paid: 2900,
          subscription: 'sub_existing_123',
          lines: {
            data: [
              {
                period: {
                  end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
                },
              },
            ],
          },
        },
      },
    });

    const renewedSubscription =
      await prisma.userStrategySubscription.findUnique({
        where: {
          userId_strategyId: {
            userId: buyer.id,
            strategyId: strategy.id,
          },
        },
      });
    const buyerDebit = await prisma.walletTransaction.findFirst({
      where: {
        userId: buyer.id,
        type: 'SUBSCRIPTION_PAYMENT',
      },
    });
    const accidentalDeposit = await prisma.walletTransaction.findFirst({
      where: {
        userId: buyer.id,
        type: 'DEPOSIT',
      },
    });

    expect(renewedSubscription?.status).toBe('ACTIVE');
    expect(renewedSubscription?.expiresAt).toBeTruthy();
    expect(buyerDebit?.direction).toBe('OUT');
    expect(accidentalDeposit).toBeNull();
  });
});
