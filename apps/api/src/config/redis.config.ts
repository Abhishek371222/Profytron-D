import Redis, { Redis as IORedis } from 'ioredis';
import { Logger } from '@nestjs/common';

const logger = new Logger('RedisConnection');

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
    : new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
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
