import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';

describe('🔗 INTEGRATION TESTS - API + Database (CRITICAL)', () => {
  let app: INestApplication<App>;
  const uniqueEmail = (prefix: string) =>
    `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.com`;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('1. AUTH FLOW INTEGRATION', () => {
    it('should complete full signup → email verification → login flow', async () => {
      const signupData = {
        email: uniqueEmail('integration'),
        password: 'TestPass123!',
        confirmPassword: 'TestPass123!',
        fullName: 'Integration Test User'
      };

      // 1. Signup
      const signupResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send(signupData)
        .expect((res) => {
          expect([201, 409]).toContain(res.status);
        });

      if (signupResponse.status === 409) {
        expect(signupResponse.body.error || signupResponse.body.message).toBeDefined();
        return;
      }

      expect(signupResponse.body.success).toBe(true);
      expect(signupResponse.body.devOtp).toBeDefined();

      // 2. Verify OTP
      await request(app.getHttpServer())
        .post('/auth/verify-email')
        .send({
          email: signupData.email,
          otp: signupResponse.body.devOtp,
        })
        .expect(200);

      // 3. Login
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: signupData.email,
          password: signupData.password
        })
        .expect(200);

      expect(loginResponse.body.accessToken).toBeDefined();
      expect(loginResponse.body.user.email).toBe(signupData.email);
    });

    it('should reject login for unverified email', async () => {
      const signupData = {
        email: uniqueEmail('unverified'),
        password: 'TestPass123!',
        confirmPassword: 'TestPass123!',
        fullName: 'Unverified User'
      };

      // Signup
      const signupResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send(signupData)
        .expect((res) => {
          expect([201, 409]).toContain(res.status);
        });

      if (signupResponse.status === 409) {
        expect(signupResponse.body.error || signupResponse.body.message).toBeDefined();
        return;
      }

      // Try to login without verification
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: signupData.email,
          password: signupData.password
        })
        .expect(403);
    });
  });

  describe('2. PROTECTED ROUTE INTEGRATION', () => {
    it('should reject protected trading endpoint without authentication', async () => {
      await request(app.getHttpServer())
        .post('/trading/emergency-stop')
        .expect(401);
    });
  });

  describe('3. PAYMENT WEBHOOK INTEGRATION', () => {
    it('should reject invalid Stripe webhook signature', async () => {
      // Mock Stripe webhook payload for successful payment
      const webhookPayload = {
        id: 'evt_test_webhook',
        object: 'event',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test_123',
            customer_email: 'subscriber@test.com',
            amount_total: 2999, // $29.99
            currency: 'usd',
            payment_status: 'paid'
          }
        }
      };

      await request(app.getHttpServer())
        .post('/webhooks/stripe')
        .set('stripe-signature', 'mock-signature')
        .send(webhookPayload)
        .expect((res) => {
          expect([400, 401, 403, 500]).toContain(res.status);
          expect(res.body.message).toBeDefined();
        });
    });

    it('should reject webhook without signature header', async () => {
      await request(app.getHttpServer())
        .post('/webhooks/stripe')
        .send({ type: 'checkout.session.completed' })
        .expect((res) => {
          expect([400, 401, 403, 500]).toContain(res.status);
        });
    });
  });
});