import Redis, { Redis as IORedis } from 'ioredis';
import RedisMock from 'ioredis-mock';
import { Logger } from '@nestjs/common';

const logger = new Logger('RedisConnection');

/**
 * In-memory Redis is used when REDIS_INMEMORY=true (local dev without a Redis
 * server) or in unit tests. It keeps auth state, caching and BullMQ working
 * within the process lifetime without requiring Docker/Upstash credentials.
 */
export const isInMemoryRedis = (): boolean => {
  if (process.env.REDIS_INMEMORY === 'true') return true;
  return (
    process.env.NODE_ENV === 'test' &&
    process.env.API_TEST_WITH_INFRA !== 'true'
  );
};

export const createRedisClient = (): IORedis =>
  isInMemoryRedis()
    ? (new RedisMock() as unknown as IORedis)
    : new Redis(buildRedisUrlFromEnv(), {
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
        retryStrategy(times) {
          return Math.min(times * 50, 2000);
        },
      });

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

export const redisClient: IORedis = createRedisClient();

redisClient.on('error', (err) => {
  logger.error('Redis connection error:', err);
});

redisClient.on('connect', () => {
  logger.log('Successfully connected to Redis');
});

export type { IORedis };
