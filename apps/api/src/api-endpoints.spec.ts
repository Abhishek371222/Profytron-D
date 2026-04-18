import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { createTestApp } from './test-utils/test-app';
import { resetTestDatabase } from './test-utils/test-db';
import { loginAs, seedVerifiedUser } from './test-utils/auth';

describe('API endpoint contract', () => {
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

  it('registers a user and returns the dev OTP in test mode', async () => {
    const email = `newuser-${Date.now()}@test.com`;
    const response = await request(app.getHttpServer())
      .post('/v1/auth/register')
      .send({
        email,
        password: 'ValidPass123!',
        confirmPassword: 'ValidPass123!',
        fullName: 'New User',
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.success).toBe(true);
    expect(response.body.data.devOtp).toMatch(/^\d{6}$/);
  });

  it('rejects duplicate registrations', async () => {
    const email = `duplicate-${Date.now()}@test.com`;
    await request(app.getHttpServer())
      .post('/v1/auth/register')
      .send({
        email,
        password: 'ValidPass123!',
        confirmPassword: 'ValidPass123!',
        fullName: 'First User',
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/v1/auth/register')
      .send({
        email,
        password: 'ValidPass123!',
        confirmPassword: 'ValidPass123!',
        fullName: 'Second User',
      })
      .expect(409);
  });

  it('logs in a verified user and returns the wrapped auth payload', async () => {
    const { user, password } = await seedVerifiedUser(prisma, {
      email: 'login@test.com',
      password: 'ValidPass123!',
      fullName: 'Login Test User',
    });

    const response = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({
        email: user.email,
        password,
      })
      .expect(200);

    expect(response.body.data.accessToken).toBeDefined();
    expect(response.body.data.user.email).toBe(user.email);
  });

  it('verifies email using the OTP returned at registration time', async () => {
    const email = `verify-${Date.now()}@test.com`;
    const registerResponse = await request(app.getHttpServer())
      .post('/v1/auth/register')
      .send({
        email,
        password: 'ValidPass123!',
        confirmPassword: 'ValidPass123!',
        fullName: 'Verify User',
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

    expect(verifyResponse.body.data.accessToken).toBeDefined();
    expect(verifyResponse.body.data.user.emailVerified).toBe(true);
  });

  it('returns the current user profile from /v1/users/me', async () => {
    const { user, password } = await seedVerifiedUser(prisma, {
      email: 'profile@test.com',
      password: 'ValidPass123!',
      fullName: 'Profile Test User',
    });
    const accessToken = await loginAs(app, user.email, password);

    const response = await request(app.getHttpServer())
      .get('/v1/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.data.email).toBe(user.email);
    expect(response.body.data.fullName).toBe(user.fullName);
  });

  it('executes the emergency stop endpoint once authenticated', async () => {
    const { user, password } = await seedVerifiedUser(prisma, {
      email: 'trader@test.com',
      password: 'ValidPass123!',
      fullName: 'Trader Test User',
    });
    const accessToken = await loginAs(app, user.email, password);

    const response = await request(app.getHttpServer())
      .post('/v1/trading/emergency-stop')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(201);

    expect(response.body.data.success).toBe(true);
    expect(response.body.data.userId).toBe(user.id);
  });

  it('rejects a Stripe webhook with an invalid signature', async () => {
    await request(app.getHttpServer())
      .post('/v1/webhooks/stripe')
      .set('Content-Type', 'application/json')
      .set('stripe-signature', 'invalid-signature')
      .send(Buffer.from(JSON.stringify({ id: 'evt_invalid', type: 'payment_intent.succeeded' }), 'utf8'))
      .expect((res) => {
        expect([400, 403]).toContain(res.status);
      });
  });

  it('returns the wrapped health response', async () => {
    const response = await request(app.getHttpServer())
      .get('/health')
      .expect(200);

    expect(response.body.data.status).toBe('ok');
    expect(response.body.data.database).toBe('connected');
  });
});
