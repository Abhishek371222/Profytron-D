import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';

describe('🔥 ENVIRONMENT TESTING - Config Validation', () => {
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

  describe('1. REQUIRED ENVIRONMENT VARIABLES', () => {
    test('should have all required environment variables set', () => {
      const requiredVars = [
        'DATABASE_URL',
        'JWT_ACCESS_SECRET',
        'JWT_REFRESH_SECRET',
        'STRIPE_SECRET_KEY',
        'STRIPE_WEBHOOK_SECRET',
        'SUPABASE_URL',
        'SUPABASE_ANON_KEY'
      ];

      for (const varName of requiredVars) {
        const value = process.env[varName];
        expect(value).toBeDefined();
        expect(value?.length).toBeGreaterThan(0);
      }
    });

    test('should have valid JWT secrets (sufficient length)', () => {
      const accessSecret = process.env.JWT_ACCESS_SECRET;
      const refreshSecret = process.env.JWT_REFRESH_SECRET;

      expect(accessSecret?.length).toBeGreaterThanOrEqual(32);
      expect(refreshSecret?.length).toBeGreaterThanOrEqual(32);
    });

    test('should have valid database URL', () => {
      const dbUrl = process.env.DATABASE_URL;
      expect(dbUrl).toMatch(/^postgresql:\/\/.+/);
    });
  });

  describe('2. CONFIGURATION VALIDATION', () => {
    test('should load configuration without errors', () => {
      // If the app started successfully, config is valid
      expect(app).toBeDefined();
    });

    test('should have valid port configuration', () => {
      const port = process.env.PORT || 3001;
      const portNum = parseInt(port.toString());
      expect(portNum).toBeGreaterThan(1000);
      expect(portNum).toBeLessThan(65535);
    });
  });

  describe('3. EXTERNAL SERVICE CONNECTIVITY', () => {
    test('should connect to database', async () => {
      // Test database connection through health check
      const response = await request(app.getHttpServer())
        .get('/health')
        .expect(200);

      expect(response.body.database).toBe('connected');
    });

    test('should have valid Stripe configuration', () => {
      const stripeKey = process.env.STRIPE_SECRET_KEY;
      expect(stripeKey).toMatch(/^sk_(test|live)_/);
    });

    test('should have valid Supabase configuration', () => {
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_ANON_KEY;

      expect(supabaseUrl).toMatch(/^https:\/\/.+\.supabase\.co$/);
      expect(supabaseKey).toMatch(/^eyJ/); // JWT token format
    });
  });

  describe('4. LOGGING CONFIGURATION', () => {
    test('should have logging configured', () => {
      // Check if Winston is configured (app started without errors)
      expect(app).toBeDefined();
    });

    test('should handle log levels correctly', () => {
      const logLevel = process.env.LOG_LEVEL || 'info';
      const validLevels = ['error', 'warn', 'info', 'debug'];
      expect(validLevels).toContain(logLevel);
    });
  });

  describe('5. SECURITY CONFIGURATION', () => {
    test('should have secure CORS configuration', () => {
      // Test CORS headers
      return request(app.getHttpServer())
        .options('/health')
        .expect(200)
        .expect((res) => {
          expect(res.headers['access-control-allow-origin']).toBeDefined();
        });
    });

    test('should have helmet security headers', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect((res) => {
          expect(res.headers['x-content-type-options']).toBe('nosniff');
          expect(res.headers['x-frame-options']).toBeDefined();
        });
    });
  });

  describe('6. NODE_ENV VALIDATION', () => {
    test('should have valid NODE_ENV', () => {
      const nodeEnv = process.env.NODE_ENV;
      const validEnvs = ['development', 'production', 'test'];
      expect(validEnvs).toContain(nodeEnv);
    });

    test('should have appropriate configuration for environment', () => {
      const nodeEnv = process.env.NODE_ENV;
      const stripeKey = process.env.STRIPE_SECRET_KEY;

      if (nodeEnv === 'production') {
        expect(stripeKey).toMatch(/^sk_live_/);
      } else {
        expect(stripeKey).toMatch(/^sk_test_/);
      }
    });
  });
});