// jest.setup.js
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgress_password@db-test:5432/profytron_test?schema=public';
process.env.DIRECT_URL =
  process.env.DIRECT_URL ||
  'postgresql://postgres:postgress_password@db-test:5432/profytron_test?schema=public';
if (!process.env.REDIS_URL) {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    const redisHost = new URL(process.env.UPSTASH_REDIS_REST_URL).hostname;
    const redisPort = new URL(process.env.UPSTASH_REDIS_REST_URL).port || '443';
    process.env.REDIS_URL = `rediss://default:${process.env.UPSTASH_REDIS_REST_TOKEN}@${redisHost}:${redisPort}`;
  } else {
    process.env.REDIS_URL = 'redis://redis-test:6379';
  }
}
process.env.REDIS_HOST = process.env.REDIS_HOST || 'redis-test';
process.env.REDIS_PORT = process.env.REDIS_PORT || '6379';
process.env.FRONTEND_URL = process.env.FRONTEND_URL || 'https://app-test.profytron.example';
process.env.CORS_ORIGIN = process.env.CORS_ORIGIN || process.env.FRONTEND_URL;
process.env.JWT_ACCESS_SECRET =
  process.env.JWT_ACCESS_SECRET ||
  'test-access-secret-1234567890-abcdefghijklmnopqrstuvwxyz';
process.env.JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET ||
  'test-refresh-secret-1234567890-abcdefghijklmnopqrstuvwxyz';
process.env.STRIPE_SECRET_KEY =
  process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder';
process.env.STRIPE_WEBHOOK_SECRET =
  process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test_placeholder';
process.env.SUPABASE_URL =
  process.env.SUPABASE_URL || 'https://example.supabase.co';
process.env.SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test-service-role-key';
// Infra-gated suites (API_TEST_WITH_INFRA=true) boot the full AppModule —
// Sentry, OpenTelemetry, BullMQ, scheduler and a real Redis/TLS handshake —
// which can take well over the default 30s on a cold local machine, tripping
// "Exceeded timeout for a hook". Give those runs a generous boot window while
// keeping fast unit runs strict so genuine hangs still surface quickly.
jest.setTimeout(process.env.API_TEST_WITH_INFRA === 'true' ? 120000 : 30000);

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-1234'),
}));
