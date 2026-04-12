import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('💰 STRIPE TESTING (VERY IMPORTANT)', () => {
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
    await prisma.user.deleteMany();
  });

  describe('✅ Successful Payment Flow', () => {
    it('should process successful checkout session', async () => {
      // Create test user
      const user = await prisma.user.create({
        data: {
          email: 'success@test.com',
          passwordHash: '$2b$12$test',
          fullName: 'Success Test User',
          emailVerified: true
        }
      });

      // Mock Stripe checkout.session.completed webhook
      const webhookPayload = {
        id: 'evt_success_payment',
        object: 'event',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test_success_123',
            customer_email: user.email,
            amount_total: 2999, // $29.99
            currency: 'usd',
            payment_status: 'paid',
            metadata: {
              userId: user.id,
              planType: 'premium'
            }
          }
        }
      };

      const response = await request(app.getHttpServer())
        .post('/payments/webhook')
        .set('stripe-signature', 'mock-signature-for-testing')
        .send(webhookPayload)
        .expect(200);

      // Verify user was upgraded
      const updatedUser = await prisma.user.findUnique({
        where: { id: user.id }
      });
      expect(updatedUser?.subscriptionStatus).toBe('active');
      expect(updatedUser?.subscriptionPlan).toBe('premium');
    });
  });

  describe('❌ Failed Payment Flow', () => {
    it('should handle payment failure gracefully', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'failed@test.com',
          passwordHash: '$2b$12$test',
          fullName: 'Failed Payment User',
          emailVerified: true
        }
      });

      // Mock Stripe payment_intent.payment_failed webhook
      const webhookPayload = {
        id: 'evt_failed_payment',
        object: 'event',
        type: 'payment_intent.payment_failed',
        data: {
          object: {
            id: 'pi_failed_123',
            customer: 'cus_failed_123',
            last_payment_error: {
              message: 'Your card was declined'
            },
            metadata: {
              userId: user.id
            }
          }
        }
      };

      await request(app.getHttpServer())
        .post('/payments/webhook')
        .set('stripe-signature', 'mock-signature-for-testing')
        .send(webhookPayload)
        .expect(200);

      // Verify user status remains unchanged
      const updatedUser = await prisma.user.findUnique({
        where: { id: user.id }
      });
      expect(updatedUser?.subscriptionStatus).toBe('inactive');
    });
  });

  describe('🔁 Subscription Renewal', () => {
    it('should handle subscription renewal', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'renewal@test.com',
          passwordHash: '$2b$12$test',
          fullName: 'Renewal Test User',
          emailVerified: true,
          subscriptionStatus: 'active',
          subscriptionPlan: 'premium'
        }
      });

      // Mock Stripe invoice.paid webhook for renewal
      const webhookPayload = {
        id: 'evt_renewal',
        object: 'event',
        type: 'invoice.paid',
        data: {
          object: {
            id: 'in_renewal_123',
            customer_email: user.email,
            amount_paid: 2999,
            currency: 'usd',
            subscription: 'sub_renewal_123'
          }
        }
      };

      await request(app.getHttpServer())
        .post('/payments/webhook')
        .set('stripe-signature', 'mock-signature-for-testing')
        .send(webhookPayload)
        .expect(200);

      // Verify subscription remains active
      const updatedUser = await prisma.user.findUnique({
        where: { id: user.id }
      });
      expect(updatedUser?.subscriptionStatus).toBe('active');
    });
  });

  describe('❌ Subscription Cancellation', () => {
    it('should handle subscription cancellation', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'cancel@test.com',
          passwordHash: '$2b$12$test',
          fullName: 'Cancel Test User',
          emailVerified: true,
          subscriptionStatus: 'active',
          subscriptionPlan: 'premium'
        }
      });

      // Mock Stripe customer.subscription.deleted webhook
      const webhookPayload = {
        id: 'evt_cancellation',
        object: 'event',
        type: 'customer.subscription.deleted',
        data: {
          object: {
            id: 'sub_cancel_123',
            customer: 'cus_cancel_123',
            status: 'canceled'
          }
        }
      };

      await request(app.getHttpServer())
        .post('/payments/webhook')
        .set('stripe-signature', 'mock-signature-for-testing')
        .send(webhookPayload)
        .expect(200);

      // Verify subscription was cancelled
      const updatedUser = await prisma.user.findUnique({
        where: { id: user.id }
      });
      expect(updatedUser?.subscriptionStatus).toBe('cancelled');
    });
  });

  describe('🧪 Webhook Signature Verification', () => {
    it('should reject webhook with invalid signature', () => {
      const webhookPayload = {
        id: 'evt_invalid_sig',
        object: 'event',
        type: 'checkout.session.completed'
      };

      return request(app.getHttpServer())
        .post('/payments/webhook')
        .set('stripe-signature', 'invalid-signature')
        .send(webhookPayload)
        .expect(400);
    });

    it('should reject malformed webhook payload', () => {
      return request(app.getHttpServer())
        .post('/payments/webhook')
        .set('stripe-signature', 'mock-signature')
        .send({ invalid: 'payload' })
        .expect(400);
    });
  });
});

// CLI Commands for Manual Testing:
// stripe trigger checkout.session.completed
// stripe trigger payment_intent.payment_failed
// stripe trigger invoice.paid
// stripe trigger customer.subscription.deleted