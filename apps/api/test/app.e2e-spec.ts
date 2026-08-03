import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

/**
 * Smoke e2e covering public health + version surfaces used by Cloud Run probes.
 * Full money-path e2e remains staging-gated (see Project Execution evidence index).
 */
describe('App probes (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    process.env.AES_MASTER_KEY =
      process.env.AES_MASTER_KEY ||
      '0000000000000000000000000000000000000000000000000000000000000000';
    process.env.JWT_ACCESS_SECRET =
      process.env.JWT_ACCESS_SECRET ||
      'ci_access_secret_at_least_32_characters_long_xx';
    process.env.JWT_REFRESH_SECRET =
      process.env.JWT_REFRESH_SECRET ||
      'ci_refresh_secret_at_least_32_characters_long_yy';
    process.env.REDIS_INMEMORY = process.env.API_TEST_WITH_INFRA
      ? process.env.REDIS_INMEMORY
      : 'true';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET / returns service status payload', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect((res) => {
        expect(res.body).toMatchObject({
          status: 'ok',
          version: '1.0.4',
          prefix: 'v1',
        });
      });
  });

  it('GET /live returns liveness probe', () => {
    return request(app.getHttpServer())
      .get('/live')
      .expect(200)
      .expect((res) => {
        expect(res.body.check).toBe('live');
        expect(['ok', 'shutting_down']).toContain(res.body.status);
        expect(typeof res.body.uptime).toBe('number');
      });
  });

  it('GET /ready returns readiness body', () => {
    return request(app.getHttpServer())
      .get('/ready')
      .expect((res) => {
        expect([200, 503]).toContain(res.status);
        expect(res.body).toHaveProperty('status');
      });
  });

  it('GET /health returns health aggregate', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect((res) => {
        expect([200, 503]).toContain(res.status);
        expect(res.body).toBeDefined();
      });
  });
});
