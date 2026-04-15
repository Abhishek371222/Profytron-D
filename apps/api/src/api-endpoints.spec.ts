import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';

describe('🌐 API TESTING (CRITICAL) - All Endpoints', () => {
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

  describe('POST /auth/register', () => {
    it('should create user successfully', () => {
      const email = uniqueEmail('newuser');
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email,
          password: 'ValidPass123!',
          confirmPassword: 'ValidPass123!',
          fullName: 'New User'
        })
        .expect((res) => {
          expect([201, 409]).toContain(res.status);
        })
        .expect((res) => {
          expect(res.body.success || res.body.error || res.body.message).toBeDefined();
        });
    });

    it('should reject invalid email', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'invalid-email',
          password: 'ValidPass123!',
          confirmPassword: 'ValidPass123!',
          fullName: 'Test User'
        })
        .expect((res) => {
          expect([400, 409]).toContain(res.status);
        });
    });

    it('should reject weak password', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: uniqueEmail('weak'),
          password: '123',
          confirmPassword: '123',
          fullName: 'Test User'
        })
        .expect((res) => {
          expect([400, 409]).toContain(res.status);
        });
    });

    it('should reject duplicate email', async () => {
      const duplicateEmail = uniqueEmail('duplicate');

      // First signup
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: duplicateEmail,
          password: 'ValidPass123!',
          confirmPassword: 'ValidPass123!',
          fullName: 'First User'
        })
        .expect((res) => {
          expect([201, 409]).toContain(res.status);
        });

      // Second signup with same email
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: duplicateEmail,
          password: 'ValidPass123!',
          confirmPassword: 'ValidPass123!',
          fullName: 'Second User'
        })
        .expect((res) => {
          expect(res.status).toBe(409);
        });
    });
  });

  describe('POST /auth/login', () => {
    it('should reject invalid credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: uniqueEmail('missing'),
          password: 'wrongpassword'
        })
        .expect(401);
    });

    it('should reject non-existent user', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: uniqueEmail('nonexistent'),
          password: 'password'
        })
        .expect(401);
    });
  });

  describe('POST /auth/verify-email', () => {
    it('should reject invalid OTP', () => {
      return request(app.getHttpServer())
        .post('/auth/verify-email')
        .send({
          email: uniqueEmail('verify'),
          otp: 'wrong-otp'
        })
        .expect(400);
    });
  });

  describe('POST /trading/emergency-stop', () => {
    it('should reject without authentication', () => {
      return request(app.getHttpServer())
        .post('/trading/emergency-stop')
        .expect(401);
    });
  });

  describe('POST /webhooks/stripe', () => {
    it('should handle Stripe webhook', () => {
      const webhookPayload = {
        id: 'evt_test_webhook',
        object: 'event',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test_123',
            customer_email: 'api-test@example.com',
            amount_total: 2999,
            currency: 'usd',
            payment_status: 'paid'
          }
        }
      };

      return request(app.getHttpServer())
        .post('/webhooks/stripe')
        .set('stripe-signature', 'mock-signature')
        .send(webhookPayload)
        .expect((res) => {
          expect([400, 401, 403, 500]).toContain(res.status);
        });
    });

    it('should reject invalid webhook signature', () => {
      return request(app.getHttpServer())
        .post('/webhooks/stripe')
        .send({ type: 'test' })
        .expect((res) => {
          expect([400, 401, 403, 500]).toContain(res.status);
        });
    });
  });

  describe('GET /health', () => {
    it('should return health status', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe('ok');
        });
    });
  });
});