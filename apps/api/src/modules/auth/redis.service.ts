import { Injectable, Inject, Logger } from '@nestjs/common';
import type { IORedis } from '../../config/redis.config';

export const REDIS_CLIENT = 'REDIS_CLIENT';

// Keys with these prefixes store security state (blacklists, OTPs, reset tokens).
// If Redis is unavailable for these keys, we must fail hard — falling back to
// in-memory would allow revoked tokens to be reused across process restarts.
const SECURITY_CRITICAL_PREFIXES = [
  'auth:blacklist:',
  'auth:otp:',
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
      if (isSecurityCriticalKey(key)) {
        this.logger.error(
          `Redis unavailable for security-critical set(${key}). Failing hard to protect auth state.`,
        );
        throw error;
      }
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
      if (isSecurityCriticalKey(key)) {
        this.logger.error(
          `Redis unavailable for security-critical get(${key}). Failing hard to protect auth state.`,
        );
        throw error;
      }
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
      if (isSecurityCriticalKey(key)) {
        this.logger.error(
          `Redis unavailable for security-critical del(${key}). Failing hard to protect auth state.`,
        );
        throw error;
      }
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
      if (isSecurityCriticalKey(key)) {
        this.logger.error(
          `Redis unavailable for security-critical exists(${key}). Failing hard to protect auth state.`,
        );
        throw error;
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

  /** Atomically gets and removes a key in one round-trip (Redis GETDEL). */
  async getdel(key: string): Promise<string | null> {
    try {
      return await this.redis.getdel(key);
    } catch (error) {
      if (isSecurityCriticalKey(key)) {
        this.logger.error(
          `Redis unavailable for security-critical getdel(${key}). Failing hard to protect auth state.`,
        );
        throw error;
      }
      this.logger.warn(
        `Redis unavailable for getdel(${key}), reading in-memory fallback: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
      const val = this.memoryStore.get(key) ?? null;
      this.clearMemoryKey(key);
      return val;
    }
  }

  /**
   * Renewable leader lease. Returns true if this caller holds the lock for
   * `key` (either freshly acquired or renewed because it already owns it).
   * Used so that only one API instance runs singleton work (e.g. master-trade
   * polling) when the app is scaled horizontally. If Redis is unavailable we
   * assume a single instance and grant the lock.
   */
  async tryRenewableLock(
    key: string,
    token: string,
    ttlSeconds: number,
  ): Promise<boolean> {
    try {
      const acquired = await this.redis.set(
        key,
        token,
        'EX',
        ttlSeconds,
        'NX',
      );
      if (acquired === 'OK') return true;
      const current = await this.redis.get(key);
      if (current === token) {
        await this.redis.expire(key, ttlSeconds);
        return true;
      }
      return false;
    } catch {
      return true;
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
