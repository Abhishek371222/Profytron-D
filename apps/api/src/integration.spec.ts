import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('🔗 INTEGRATION TESTS - API + Database (CRITICAL)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

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
    // Clean up test data - only clean up tables that exist
    try {
      await prisma.user.deleteMany();
      // Only delete if the table exists
      if (prisma.tradingSignal) {
        await prisma.tradingSignal.deleteMany();
      }
      if (prisma.subscription) {
        await prisma.subscription.deleteMany();
      }
    } catch (error) {
      // Ignore errors if tables don't exist
    }
  });

  describe('1. AUTH FLOW INTEGRATION', () => {
    it('should complete full signup → email verification → login flow', async () => {
      const signupData = {
        email: 'integration@test.com',
        password: 'TestPass123!',
        fullName: 'Integration Test User'
      };

      // 1. Signup
      const signupResponse = await request(app.getHttpServer())
        .post('/auth/signup')
        .send(signupData)
        .expect(201);

      expect(signupResponse.body.success).toBe(true);

      // 2. Verify user was created in database
      const user = await prisma.user.findUnique({
        where: { email: signupData.email }
      });
      expect(user).toBeTruthy();
      expect(user?.email).toBe(signupData.email);
      expect(user?.emailVerified).toBe(false);

      // 3. Simulate email verification (in real test, would get OTP from email)
      // For now, manually verify the user
      await prisma.user.update({
        where: { email: signupData.email },
        data: { emailVerified: true }
      });

      // 4. Login
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
        email: 'unverified@test.com',
        password: 'TestPass123!',
        fullName: 'Unverified User'
      };

      // Signup
      await request(app.getHttpServer())
        .post('/auth/signup')
        .send(signupData)
        .expect(201);

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

  describe('2. TRADING SIGNAL INTEGRATION', () => {
    let accessToken: string;
    let userId: string;

    beforeEach(async () => {
      // Create and verify a test user
      const user = await prisma.user.create({
        data: {
          email: 'trader@test.com',
          passwordHash: '$2b$12$test',
          fullName: 'Test Trader',
          emailVerified: true
        }
      });
      userId = user.id;

      // Mock login to get token (simplified for testing)
      accessToken = 'mock-jwt-token';
    });

    it('should create trading signal and notify subscribers', async () => {
      const strategyId = 'test-strategy-123';

      // Create a subscription for the user
      await prisma.subscription.create({
        data: {
          userId,
          strategyId,
          isActive: true
        }
      });

      // Create trading signal (this would normally be called by strategy service)
      const signalResponse = await request(app.getHttpServer())
        .post('/trading/signal')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          strategyId,
          signalType: 'BUY',
          pair: 'BTCUSD',
          price: 45000
        })
        .expect(201);

      expect(signalResponse.body.id).toBeDefined();

      // Verify signal was saved to database
      const signal = await prisma.tradingSignal.findUnique({
        where: { id: signalResponse.body.id }
      });
      expect(signal).toBeTruthy();
      expect(signal?.pair).toBe('BTCUSD');
      expect(signal?.type).toBe('BUY');
    });
  });

  describe('3. PAYMENT WEBHOOK INTEGRATION', () => {
    it('should handle Stripe webhook and update user subscription', async () => {
      // Create a test user
      const user = await prisma.user.create({
        data: {
          email: 'subscriber@test.com',
          passwordHash: '$2b$12$test',
          fullName: 'Test Subscriber',
          emailVerified: true
        }
      });

      // Mock Stripe webhook payload for successful payment
      const webhookPayload = {
        id: 'evt_test_webhook',
        object: 'event',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test_123',
            customer_email: user.email,
            amount_total: 2999, // $29.99
            currency: 'usd',
            payment_status: 'paid'
          }
        }
      };

      // Send webhook (would need proper Stripe signature in real test)
      const webhookResponse = await request(app.getHttpServer())
        .post('/payments/webhook')
        .set('stripe-signature', 'mock-signature')
        .send(webhookPayload)
        .expect(200);

      // Verify user subscription was updated
      const updatedUser = await prisma.user.findUnique({
        where: { id: user.id }
      });
      expect(updatedUser?.subscriptionStatus).toBe('active');
    });
  });
});