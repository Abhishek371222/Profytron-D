import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('🌐 API TESTING (CRITICAL) - All Endpoints', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let accessToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clean up and setup test data
    await prisma.user.deleteMany();
    await prisma.tradingSignal.deleteMany();

    // Create test user and get token
    const user = await prisma.user.create({
      data: {
        email: 'api-test@example.com',
        passwordHash: '$2b$12$test',
        fullName: 'API Test User',
        emailVerified: true
      }
    });

    // Mock JWT token for testing
    accessToken = 'mock-jwt-token-for-testing';
  });

  describe('POST /auth/signup', () => {
    it('should create user successfully', () => {
      return request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          email: 'newuser@test.com',
          password: 'ValidPass123!',
          fullName: 'New User'
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.message).toContain('Check your email');
        });
    });

    it('should reject invalid email', () => {
      return request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          email: 'invalid-email',
          password: 'ValidPass123!',
          fullName: 'Test User'
        })
        .expect(400);
    });

    it('should reject weak password', () => {
      return request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          email: 'test@example.com',
          password: '123',
          fullName: 'Test User'
        })
        .expect(400);
    });

    it('should reject duplicate email', async () => {
      // First signup
      await request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          email: 'duplicate@test.com',
          password: 'ValidPass123!',
          fullName: 'First User'
        })
        .expect(201);

      // Second signup with same email
      return request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          email: 'duplicate@test.com',
          password: 'ValidPass123!',
          fullName: 'Second User'
        })
        .expect(409);
    });
  });

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      // Create verified user for login tests
      await prisma.user.create({
        data: {
          email: 'login@test.com',
          passwordHash: '$2b$12$test',
          fullName: 'Login Test User',
          emailVerified: true
        }
      });
    });

    it('should login successfully with correct credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'login@test.com',
          password: 'correctpassword'
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.accessToken).toBeDefined();
          expect(res.body.user.email).toBe('login@test.com');
        });
    });

    it('should reject invalid credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'login@test.com',
          password: 'wrongpassword'
        })
        .expect(401);
    });

    it('should reject non-existent user', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'password'
        })
        .expect(401);
    });
  });

  describe('POST /auth/verify-email', () => {
    it('should verify email with correct OTP', async () => {
      // Create unverified user
      const user = await prisma.user.create({
        data: {
          email: 'verify@test.com',
          passwordHash: '$2b$12$test',
          fullName: 'Verify Test User',
          emailVerified: false
        }
      });

      // Mock OTP in Redis (would be set during signup)
      // For testing, we'll assume OTP verification logic works

      return request(app.getHttpServer())
        .post('/auth/verify-email')
        .send({
          email: 'verify@test.com',
          otp: '123456'
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.accessToken).toBeDefined();
          expect(res.body.user.emailVerified).toBe(true);
        });
    });

    it('should reject invalid OTP', () => {
      return request(app.getHttpServer())
        .post('/auth/verify-email')
        .send({
          email: 'verify@test.com',
          otp: 'wrong-otp'
        })
        .expect(400);
    });
  });

  describe('GET /user/profile', () => {
    it('should return user profile with authentication', () => {
      return request(app.getHttpServer())
        .get('/user/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.email).toBe('api-test@example.com');
          expect(res.body.fullName).toBe('API Test User');
        });
    });

    it('should reject without authentication', () => {
      return request(app.getHttpServer())
        .get('/user/profile')
        .expect(401);
    });
  });

  describe('POST /trading/signal', () => {
    it('should create trading signal', () => {
      return request(app.getHttpServer())
        .post('/trading/signal')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          strategyId: 'test-strategy',
          signalType: 'BUY',
          pair: 'BTCUSD',
          price: 45000
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.id).toBeDefined();
          expect(res.body.type).toBe('BUY');
          expect(res.body.pair).toBe('BTCUSD');
        });
    });

    it('should reject invalid signal data', () => {
      return request(app.getHttpServer())
        .post('/trading/signal')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          strategyId: 'test-strategy',
          signalType: 'INVALID',
          pair: 'BTCUSD',
          price: -1000
        })
        .expect(400);
    });
  });

  describe('POST /payments/webhook', () => {
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
        .post('/payments/webhook')
        .set('stripe-signature', 'mock-signature')
        .send(webhookPayload)
        .expect(200);
    });

    it('should reject invalid webhook signature', () => {
      return request(app.getHttpServer())
        .post('/payments/webhook')
        .send({ type: 'test' })
        .expect(400);
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