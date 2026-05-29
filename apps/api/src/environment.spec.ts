/// <reference types="jest" />

import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { createTestApp } from './test-utils/test-app';
import { describeIfApiInfra } from './test-utils/test-infra';

describeIfApiInfra('Environment and runtime configuration', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
  });

  afterAll(async () => {
    await app.close();
  });

  it('loads the required environment variables for tests', () => {
    const requiredVars = [
      'DATABASE_URL',
      'JWT_ACCESS_SECRET',
      'JWT_REFRESH_SECRET',
      'STRIPE_SECRET_KEY',
      'STRIPE_WEBHOOK_SECRET',
      'SUPABASE_URL',
      'SUPABASE_ANON_KEY',
    ];

    for (const varName of requiredVars) {
      expect(process.env[varName]).toBeDefined();
    }
  });

  it('uses strong-enough JWT secrets', () => {
    expect((process.env.JWT_ACCESS_SECRET || '').length).toBeGreaterThanOrEqual(
      16,
    );
    expect(
      (process.env.JWT_REFRESH_SECRET || '').length,
    ).toBeGreaterThanOrEqual(16);
  });

  it('exposes a healthy database-backed health endpoint', async () => {
    const response = await request(app.getHttpServer())
      .get('/health')
      .expect(200);

    expect(response.body.data.status).toBe('ok');
    expect(response.body.data.database).toBe('connected');
  });

  it('applies CORS headers through the shared app bootstrap', async () => {
    const origin =
      process.env.CORS_ORIGIN ||
      process.env.FRONTEND_URL ||
      'https://app-test.profytron.example';

    const response = await request(app.getHttpServer())
      .options('/health')
      .set('Origin', origin)
      .set('Access-Control-Request-Method', 'GET');

    expect([200, 204]).toContain(response.status);
    expect(response.headers['access-control-allow-origin']).toBe(origin);
  });

  it('applies helmet security headers', async () => {
    const response = await request(app.getHttpServer())
      .get('/health')
      .expect(200);

    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-frame-options']).toBeDefined();
  });
});
