/// <reference types="jest" />

/**
 * Authenticated wallet smoke + IDOR (requires API_TEST_WITH_INFRA=true).
 * No hardcoded secrets: users are seeded via test helpers.
 *
 * History path in this API is GET /v1/wallet/transactions (not /wallet/history).
 */
import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { createTestApp } from '../../test-utils/test-app';
import { resetTestDatabase } from '../../test-utils/test-db';
import { loginAs, seedVerifiedUser } from '../../test-utils/auth';
import { describeIfApiInfra } from '../../test-utils/test-infra';

describeIfApiInfra('Wallet authenticated smoke + IDOR', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await resetTestDatabase(prisma);
  });

  it('rejects unauthenticated wallet balance and transactions with 401', async () => {
    await request(app.getHttpServer())
      .get('/v1/wallet/balance')
      .expect(401);

    await request(app.getHttpServer())
      .get('/v1/wallet/transactions')
      .expect(401);

    await request(app.getHttpServer())
      .get('/v1/wallet/transaction/00000000-0000-4000-8000-000000000001')
      .expect(401);

    await request(app.getHttpServer())
      .get('/v1/wallet/billing/PRF-WLT-TEST')
      .expect(401);
  });

  it('returns zero balance and empty history for a verified user with no txs', async () => {
    const { user, password } = await seedVerifiedUser(prisma, {
      email: `wallet-empty-${Date.now()}@test.local`,
    });
    const token = await loginAs(app, user.email, password);

    const balance = await request(app.getHttpServer())
      .get('/v1/wallet/balance')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(balance.body.data.total).toBe(0);
    expect(balance.body.data.available).toBe(0);
    expect(balance.body.data.currency).toBe('INR');

    const history = await request(app.getHttpServer())
      .get('/v1/wallet/transactions')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(history.body.data.transactions).toEqual([]);
    expect(history.body.data.total).toBe(0);
    expect(history.body.data.nextCursor).toBeNull();
  });

  it('shows only the calling user transactions and blocks IDOR reads', async () => {
    const owner = await seedVerifiedUser(prisma, {
      email: `wallet-owner-${Date.now()}@test.local`,
    });
    const other = await seedVerifiedUser(prisma, {
      email: `wallet-other-${Date.now()}@test.local`,
    });

    const ownerTx = await prisma.walletTransaction.create({
      data: {
        userId: owner.user.id,
        type: 'DEPOSIT',
        direction: 'IN',
        amount: 2500,
        status: 'CONFIRMED',
        balanceAfter: 2500,
        billingId: `PRF-WLT-OWNER-${Date.now()}`,
        description: 'owner deposit',
        idempotencyKey: `iday13-owner-${Date.now()}`,
      },
    });

    await prisma.walletTransaction.create({
      data: {
        userId: other.user.id,
        type: 'DEPOSIT',
        direction: 'IN',
        amount: 9900,
        status: 'CONFIRMED',
        balanceAfter: 9900,
        billingId: `PRF-WLT-OTHER-${Date.now()}`,
        description: 'other deposit',
        idempotencyKey: `iday13-other-${Date.now()}`,
      },
    });

    const ownerToken = await loginAs(app, owner.user.email, owner.password);
    const otherToken = await loginAs(app, other.user.email, other.password);

    const balance = await request(app.getHttpServer())
      .get('/v1/wallet/balance')
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);
    expect(balance.body.data.total).toBe(2500);

    const history = await request(app.getHttpServer())
      .get('/v1/wallet/transactions')
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);
    expect(history.body.data.transactions).toHaveLength(1);
    expect(history.body.data.transactions[0].id).toBe(ownerTx.id);
    expect(history.body.data.transactions[0].amount).toBe(2500);

    // Foreign transaction id → 404 (ownership in WHERE, not 403)
    await request(app.getHttpServer())
      .get(`/v1/wallet/transaction/${ownerTx.id}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .expect(404);

    // Foreign billing id → 403
    await request(app.getHttpServer())
      .get(`/v1/wallet/billing/${ownerTx.billingId}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .expect(403);

    // Owner can read own detail
    await request(app.getHttpServer())
      .get(`/v1/wallet/transaction/${ownerTx.id}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);
  });
});
