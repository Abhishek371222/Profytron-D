import { Injectable, Inject, Logger } from '@nestjs/common';
import type { IORedis } from '../../config/redis.config';

export const REDIS_CLIENT = 'REDIS_CLIENT';

@Injectable()
export class RedisService {
  private readonly logger = new Logger(RedisService.name);
  private readonly memoryStore = new Map<string, string>();
  private readonly memoryTimers = new Map<string, NodeJS.Timeout>();

  constructor(@Inject(REDIS_CLIENT) private readonly redis: IORedis) {}

  private clearMemoryKey(key: string) {
    this.memoryStore.delete(key);
    const existing = this.memoryTimers.get(key);
    if (existing) {
      clearTimeout(existing);
      this.memoryTimers.delete(key);
    }
  }

  private setMemoryTtl(key: string, ttlSeconds: number) {
    const existing = this.memoryTimers.get(key);
    if (existing) {
      clearTimeout(existing);
    }
    const timer = setTimeout(() => {
      this.clearMemoryKey(key);
    }, ttlSeconds * 1000);
    this.memoryTimers.set(key, timer);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    try {
      if (ttlSeconds) {
        await this.redis.set(key, value, 'EX', ttlSeconds);
      } else {
        await this.redis.set(key, value);
      }
      return;
    } catch (error) {
      this.logger.warn(
        `Redis unavailable for set(${key}), using in-memory fallback: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
      this.memoryStore.set(key, value);
      if (ttlSeconds) {
        this.setMemoryTtl(key, ttlSeconds);
      }
    }
  }

  async get(key: string): Promise<string | null> {
    try {
      return await this.redis.get(key);
    } catch (error) {
      this.logger.warn(
        `Redis unavailable for get(${key}), reading in-memory fallback: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
      return this.memoryStore.get(key) ?? null;
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.redis.del(key);
      return;
    } catch (error) {
      this.logger.warn(
        `Redis unavailable for del(${key}), removing in-memory fallback: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
      this.clearMemoryKey(key);
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(key);
      return result > 0;
    } catch (error) {
      this.logger.warn(
        `Redis unavailable for exists(${key}), checking in-memory fallback: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
      return this.memoryStore.has(key);
    }
  }

  async incr(key: string): Promise<number> {
    try {
      return await this.redis.incr(key);
    } catch (error) {
      this.logger.warn(
        `Redis unavailable for incr(${key}), incrementing in-memory fallback: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
      const current = Number(this.memoryStore.get(key) ?? '0');
      const next = current + 1;
      this.memoryStore.set(key, String(next));
      return next;
    }
  }

  async expire(key: string, ttlSeconds: number): Promise<void> {
    try {
      await this.redis.expire(key, ttlSeconds);
      return;
    } catch (error) {
      this.logger.warn(
        `Redis unavailable for expire(${key}), expiring in-memory fallback: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
      if (this.memoryStore.has(key)) {
        this.setMemoryTtl(key, ttlSeconds);
      }
    }
  }

  async ping(): Promise<boolean> {
    try {
      const response = await this.redis.ping();
      return response === 'PONG';
    } catch (error) {
      this.logger.warn(
        `Redis unavailable for ping(), falling back to false: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
      return false;
    }
  }
}
