// jest.setup.js
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgress_password@127.0.0.1:55432/profytron_local?schema=public';
process.env.DIRECT_URL =
  process.env.DIRECT_URL ||
  'postgresql://postgres:postgress_password@127.0.0.1:55432/profytron_local?schema=public';
process.env.REDIS_HOST = process.env.REDIS_HOST || '127.0.0.1';
process.env.REDIS_PORT = process.env.REDIS_PORT || '56379';
process.env.REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:56379';
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
jest.setTimeout(30000);

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-1234'),
}));
