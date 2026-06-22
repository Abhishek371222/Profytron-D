import {
  buildRedisUrlFromEnv,
  resolveUpstashRedisUrl,
  UPSTASH_REDIS_TLS_PORT,
} from './redis.config';

describe('redis.config URL resolution', () => {
  const envSnapshot = { ...process.env };

  afterEach(() => {
    process.env = { ...envSnapshot };
  });

  it('converts Upstash REST URL to rediss on port 6379', () => {
    expect(
      resolveUpstashRedisUrl('https://us1-example.upstash.io', 'my-token'),
    ).toBe(
      `rediss://default:${encodeURIComponent('my-token')}@us1-example.upstash.io:${UPSTASH_REDIS_TLS_PORT}`,
    );
  });

  it('converts http(s) REDIS_URL using UPSTASH_REDIS_REST_TOKEN', () => {
    process.env.REDIS_URL = 'https://us1-example.upstash.io';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'secret';
    delete process.env.UPSTASH_REDIS_REST_URL;

    expect(buildRedisUrlFromEnv()).toBe(
      `rediss://default:${encodeURIComponent('secret')}@us1-example.upstash.io:${UPSTASH_REDIS_TLS_PORT}`,
    );
  });

  it('corrects rediss Upstash URLs mistakenly using port 443', () => {
    process.env.REDIS_URL =
      'rediss://default:secret@us1-example.upstash.io:443';

    expect(buildRedisUrlFromEnv()).toBe(
      `rediss://default:secret@us1-example.upstash.io:${UPSTASH_REDIS_TLS_PORT}`,
    );
  });

  it('passes through plain redis:// URLs unchanged', () => {
    process.env.REDIS_URL = 'redis://localhost:6379';
    expect(buildRedisUrlFromEnv()).toBe('redis://localhost:6379');
  });

  it('derives from UPSTASH_REDIS_REST_URL when REDIS_URL is unset', () => {
    delete process.env.REDIS_URL;
    process.env.UPSTASH_REDIS_REST_URL = 'https://us1-example.upstash.io';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'tok';

    expect(buildRedisUrlFromEnv()).toContain(':6379');
    expect(buildRedisUrlFromEnv()).toMatch(/^rediss:\/\//);
  });
});
