import type { ThrottlerStorage } from '@nestjs/throttler';
import type { IORedis } from '../config/redis.config';

export type RedisThrottlerStorageRecord = {
  totalHits: number;
  timeToExpire: number;
  isBlocked: boolean;
  timeToBlockExpire: number;
};

/**
 * Shared Redis storage for Nest Throttler so rate limits apply across
 * multi-instance Cloud Run / k8s replicas (closes RC P1-7 in-memory gap).
 */
export class RedisThrottlerStorage implements ThrottlerStorage {
  constructor(
    private readonly redis: IORedis,
    private readonly keyPrefix = 'throttle:',
  ) {}

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    _throttlerName: string,
  ): Promise<RedisThrottlerStorageRecord> {
    const redisKey = `${this.keyPrefix}${key}`;
    const blockKey = `${redisKey}:block`;
    const ttlSeconds = Math.max(1, Math.ceil(ttl / 1000));
    const blockSeconds = Math.max(0, Math.ceil(blockDuration / 1000));

    const blockedTtlMs = await this.redis.pttl(blockKey);
    if (blockedTtlMs > 0) {
      return {
        totalHits: limit + 1,
        timeToExpire: ttlSeconds,
        isBlocked: true,
        timeToBlockExpire: Math.ceil(blockedTtlMs / 1000),
      };
    }

    const hits = await this.redis.incr(redisKey);
    if (hits === 1) {
      await this.redis.expire(redisKey, ttlSeconds);
    }

    const pttl = await this.redis.pttl(redisKey);
    const timeToExpire = pttl > 0 ? Math.ceil(pttl / 1000) : ttlSeconds;
    const isBlocked = hits > limit;

    if (isBlocked && blockSeconds > 0) {
      await this.redis.set(blockKey, '1', 'EX', blockSeconds);
      return {
        totalHits: hits,
        timeToExpire,
        isBlocked: true,
        timeToBlockExpire: blockSeconds,
      };
    }

    return {
      totalHits: hits,
      timeToExpire,
      isBlocked,
      timeToBlockExpire: 0,
    };
  }
}
