import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';

describe('Stripe Webhook Testing', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Webhook Signature Verification', () => {
    it('should reject webhook with invalid signature', () => {
      const webhookPayload = {
        id: 'evt_invalid_sig',
        object: 'event',
        type: 'checkout.session.completed',
      };

      return request(app.getHttpServer())
        .post('/webhooks/stripe')
        .set('stripe-signature', 'invalid-signature')
        .send(webhookPayload)
        .expect((res) => {
          expect([400, 401, 403, 500]).toContain(res.status);
        });
    });

    it('should reject malformed webhook payload', () => {
      return request(app.getHttpServer())
        .post('/webhooks/stripe')
        .set('stripe-signature', 'mock-signature')
        .send({ invalid: 'payload' })
        .expect((res) => {
          expect([400, 401, 403, 500]).toContain(res.status);
        });
    });

    it('should reject webhook without signature header', () => {
      return request(app.getHttpServer())
        .post('/webhooks/stripe')
        .send({ type: 'checkout.session.completed' })
        .expect((res) => {
          expect([400, 401, 403, 500]).toContain(res.status);
        });
    });
  });
});
