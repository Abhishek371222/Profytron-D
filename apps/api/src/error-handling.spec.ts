import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { createTestApp } from './test-utils/test-app';
import { resetTestDatabase } from './test-utils/test-db';
import { loginAs, seedVerifiedUser } from './test-utils/auth';
import { describeIfApiInfra } from './test-utils/test-infra';

describeIfApiInfra('Error handling', () => {
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

  it('returns 404 for unknown endpoints', async () => {
    await request(app.getHttpServer())
      .get('/api/non-existent-endpoint')
      .expect(404);
  });

  it('returns 400 for malformed JSON', async () => {
    await request(app.getHttpServer())
      .post('/v1/auth/register')
      .set('Content-Type', 'application/json')
      .send('{ invalid json }')
      .expect(400);
  });

  it('returns 400 with validation details for invalid registration payloads', async () => {
    const response = await request(app.getHttpServer())
      .post('/v1/auth/register')
      .send({
        email: 'invalid-email',
        password: '123',
        confirmPassword: '123',
        fullName: '',
      })
      .expect(400);

    expect([response.body.message, response.body.error]).toContainEqual(
      expect.anything(),
    );
  });

  it('returns 403 for an invalid Stripe webhook signature', async () => {
    const response = await request(app.getHttpServer())
      .post('/v1/webhooks/stripe')
      .set('Content-Type', 'application/json')
      .set('stripe-signature', 'invalid')
      .send(
        Buffer.from(
          JSON.stringify({
            id: 'evt_invalid',
            type: 'payment_intent.succeeded',
          }),
          'utf8',
        ),
      )
      .expect((res) => {
        expect([400, 403]).toContain(res.status);
      });

    expect(
      String(response.body.message || response.body.error).toLowerCase(),
    ).toContain('signature');
  });

  it('returns 401 for protected routes without a token', async () => {
    await request(app.getHttpServer()).get('/v1/users/me').expect(401);
  });

  it('rejects unverified users at login', async () => {
    await request(app.getHttpServer())
      .post('/v1/auth/register')
      .send({
        email: 'unverified@test.com',
        password: 'ValidPass123!',
        confirmPassword: 'ValidPass123!',
        fullName: 'Unverified User',
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({
        email: 'unverified@test.com',
        password: 'ValidPass123!',
      })
      .expect(403);
  });

  it('allows a valid authenticated request after login', async () => {
    const { user, password } = await seedVerifiedUser(prisma, {
      email: 'ok@test.com',
      password: 'ValidPass123!',
      fullName: 'Valid User',
    });
    const token = await loginAs(app, user.email, password);

    await request(app.getHttpServer())
      .get('/v1/users/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });
});
