import { Injectable, Inject, Logger } from '@nestjs/common';
import type { IORedis } from '../../config/redis.config';

export const REDIS_CLIENT = 'REDIS_CLIENT';

const SECURITY_CRITICAL_PREFIXES = [
  'auth:blacklist:',
  'auth:otp:',
  'auth:delete:',
  'auth:reset:',
  'auth:magic:',
  'auth:refresh:',
  'auth:fails:',
  'auth:2fa:',
  'auth:oauth:',
];

function isSecurityCriticalKey(key: string): boolean {
  return SECURITY_CRITICAL_PREFIXES.some((prefix) => key.startsWith(prefix));
}

@Injectable()
export class RedisService {
  private readonly logger = new Logger(RedisService.name);
  private readonly memoryStore = new Map<string, string>();
  private readonly memoryTimers = new Map<string, NodeJS.Timeout>();
  private readonly inFlight = new Map<string, Promise<unknown>>();

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
      this.memoryStore.set(key, value);
      if (ttlSeconds) {
        this.setMemoryTtl(key, ttlSeconds);
      } else {
        const existing = this.memoryTimers.get(key);
        if (existing) {
          clearTimeout(existing);
          this.memoryTimers.delete(key);
        }
      }
      return;
    } catch (error) {
      if (isSecurityCriticalKey(key)) {
        this.logger.error(
          `Redis unavailable for security-critical set(${key}); using in-process mirror. ${
            error instanceof Error ? error.message : 'unknown error'
          }`,
        );
      } else {
        this.logger.warn(
          `Redis unavailable for set(${key}), using in-memory fallback: ${error instanceof Error ? error.message : 'unknown error'}`,
        );
      }
      this.memoryStore.set(key, value);
      if (ttlSeconds) {
        this.setMemoryTtl(key, ttlSeconds);
      }
    }
  }

  async get(key: string): Promise<string | null> {
    try {
      const value = await this.redis.get(key);
      if (value != null) return value;
      return this.memoryStore.get(key) ?? null;
    } catch (error) {
      const mirrored = this.memoryStore.get(key);
      if (mirrored != null) {
        this.logger.warn(
          `Redis unavailable for get(${key}); using in-process mirror.`,
        );
        return mirrored;
      }
      if (isSecurityCriticalKey(key)) {
        this.logger.error(
          `Redis unavailable for security-critical get(${key}); treating as miss. ${
            error instanceof Error ? error.message : 'unknown error'
          }`,
        );
        return null;
      }
      this.logger.warn(
        `Redis unavailable for get(${key}), reading in-memory fallback: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
      return null;
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.redis.del(key);
      this.clearMemoryKey(key);
      return;
    } catch (error) {
      if (isSecurityCriticalKey(key)) {
        this.logger.error(
          `Redis unavailable for security-critical del(${key}); clearing in-process mirror. ${
            error instanceof Error ? error.message : 'unknown error'
          }`,
        );
      } else {
        this.logger.warn(
          `Redis unavailable for del(${key}), removing in-memory fallback: ${error instanceof Error ? error.message : 'unknown error'}`,
        );
      }
      this.clearMemoryKey(key);
    }
  }

  async delPrefix(prefix: string): Promise<void> {
    try {
      const keys = await this.redis.keys(`${prefix}*`);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      this.logger.warn(
        `Redis unavailable for delPrefix(${prefix}): ${error instanceof Error ? error.message : 'unknown error'}`,
      );
    }

    for (const key of [...this.memoryStore.keys()]) {
      if (key.startsWith(prefix)) this.clearMemoryKey(key);
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(key);
      if (result > 0) return true;
      return this.memoryStore.has(key);
    } catch (error) {
      if (isSecurityCriticalKey(key)) {
        if (this.memoryStore.has(key)) {
          this.logger.warn(
            `Redis unavailable for security-critical exists(${key}); using in-process mirror.`,
          );
          return true;
        }
        this.logger.error(
          `Redis unavailable for security-critical exists(${key}); treating as not-blacklisted to avoid app-wide auth storms. ${
            error instanceof Error ? error.message : 'unknown error'
          }`,
        );
        return false;
      }
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
      if (isSecurityCriticalKey(key)) {
        this.logger.error(
          `Redis unavailable for security-critical incr(${key}). Failing hard to protect auth state.`,
        );
        throw error;
      }
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
      if (isSecurityCriticalKey(key)) {
        this.logger.error(
          `Redis unavailable for security-critical expire(${key}). Failing hard to protect auth state.`,
        );
        throw error;
      }
      this.logger.warn(
        `Redis unavailable for expire(${key}), expiring in-memory fallback: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
      if (this.memoryStore.has(key)) {
        this.setMemoryTtl(key, ttlSeconds);
      }
    }
  }

  async getdel(key: string): Promise<string | null> {
    try {
      return await this.redis.getdel(key);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (
        msg.includes('unknown command') &&
        msg.toLowerCase().includes('getdel')
      ) {
        const val = await this.redis.get(key);
        if (val !== null) await this.redis.del(key);
        return val;
      }
      if (isSecurityCriticalKey(key)) {
        this.logger.error(
          `Redis unavailable for security-critical getdel(${key}). Failing hard to protect auth state.`,
        );
        throw error;
      }
      this.logger.warn(
        `Redis unavailable for getdel(${key}), reading in-memory fallback: ${msg}`,
      );
      const val = this.memoryStore.get(key) ?? null;
      this.clearMemoryKey(key);
      return val;
    }
  }

  async tryRenewableLock(
    key: string,
    token: string,
    ttlSeconds: number,
  ): Promise<boolean> {
    try {
      const acquired = await this.redis.set(key, token, 'EX', ttlSeconds, 'NX');
      if (acquired === 'OK') return true;
      const current = await this.redis.get(key);
      if (current === token) {
        await this.redis.expire(key, ttlSeconds);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  async getJson<T>(key: string): Promise<T | null> {
    const raw = await this.get(key);
    if (raw == null) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  async setJson(
    key: string,
    value: unknown,
    ttlSeconds?: number,
  ): Promise<void> {
    await this.set(key, JSON.stringify(value), ttlSeconds);
  }

  async cached<T>(
    key: string,
    ttlSeconds: number,
    producer: () => Promise<T>,
  ): Promise<T> {
    const hit = await this.getJson<T>(key);
    if (hit !== null) return hit;

    const existing = this.inFlight.get(key) as Promise<T> | undefined;
    if (existing) return existing;

    const promise = (async () => {
      try {
        const fresh = await producer();
        if (fresh !== null && fresh !== undefined) {
          await this.setJson(key, fresh, ttlSeconds);
        }
        return fresh;
      } finally {
        this.inFlight.delete(key);
      }
    })();

    this.inFlight.set(key, promise);
    return promise;
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
