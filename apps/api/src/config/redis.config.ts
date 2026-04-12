import Redis, { Redis as IORedis } from 'ioredis';
import { Logger } from '@nestjs/common';

const logger = new Logger('RedisConnection');

export const redisClient: IORedis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
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
