import Redis, { Redis as IORedis } from 'ioredis';
import { Logger } from '@nestjs/common';

const logger = new Logger('RedisConnection');

const buildRedisUrlFromEnv = (): string => {
  const redisUrl = process.env.REDIS_URL?.trim();
  if (redisUrl) {
    try {
      const parsed = new URL(redisUrl);

      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        const token =
          process.env.UPSTASH_REDIS_REST_TOKEN?.trim() ||
          process.env.REDIS_PASSWORD?.trim() ||
          parsed.password;

        if (!token) {
          return `rediss://${parsed.hostname}:${parsed.port || '443'}`;
        }

        // Upstash Redis protocol uses 'default' username and the token as password
        // Use the proper Redis protocol hostname (replace REST prefix if present)
        const redisHostname = parsed.hostname.replace(
          '.upstash.io',
          '.upstash.io',
        ); // Usually same hostname, but ensure it's rediss
        return `rediss://default:${encodeURIComponent(token)}@${redisHostname}:${parsed.port || '443'}`;
      }

      return redisUrl;
    } catch {
      return redisUrl;
    }
  }

  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (upstashUrl && upstashToken) {
    try {
      const parsed = new URL(upstashUrl);
      return `rediss://default:${encodeURIComponent(upstashToken)}@${parsed.hostname}:${parsed.port || '443'}`;
    } catch {
      return `rediss://default:${encodeURIComponent(upstashToken)}@${upstashUrl.replace(/^https?:\/\//, '')}:443`;
    }
  }

  const redisHost = process.env.REDIS_HOST?.trim() || 'redis';
  const redisPort = Number(process.env.REDIS_PORT) || 6379;
  const redisPassword = process.env.REDIS_PASSWORD?.trim();
  if (redisPassword) {
    return `redis://default:${encodeURIComponent(redisPassword)}@${redisHost}:${redisPort}`;
  }

  return `redis://${redisHost}:${redisPort}`;
};

export const getRedisConnectionUrl = (): string => buildRedisUrlFromEnv();

const createMemoryRedisClient = (): IORedis => {
  const store = new Map<string, string>();

  return {
    on: () => undefined,
    get: async (key: string) => store.get(key) ?? null,
    set: async (key: string, value: string) => {
      store.set(key, value);
      return 'OK' as const;
    },
    del: async (key: string) => Number(store.delete(key)),
    exists: async (key: string) => (store.has(key) ? 1 : 0),
    incr: async (key: string) => {
      const next = Number(store.get(key) ?? '0') + 1;
      store.set(key, String(next));
      return next;
    },
    expire: async () => 1,
    ping: async () => 'PONG',
  } as unknown as IORedis;
};

export const redisClient: IORedis =
  process.env.NODE_ENV === 'test' && process.env.API_TEST_WITH_INFRA !== 'true'
    ? createMemoryRedisClient()
    : new Redis(buildRedisUrlFromEnv(), {
        maxRetriesPerRequest: null,
        retryStrategy(times) {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
      });

redisClient.on('error', (err) => {
  logger.error('Redis connection error:', err);
});

redisClient.on('connect', () => {
  logger.log('Successfully connected to Redis');
});

export type { IORedis };
