import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../auth/redis.service';

const FLAG_TTL = 60; // seconds

@Injectable()
export class FeatureFlagsService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async isEnabled(key: string, userId?: string): Promise<boolean> {
    const cacheKey = `flag:${key}`;
    const cached = await this.redis.get(cacheKey);
    const flag = cached
      ? JSON.parse(cached)
      : await this.prisma.featureFlag.findUnique({ where: { key } });

    if (!flag) return false;
    if (!cached) {
      await this.redis.set(cacheKey, JSON.stringify(flag), FLAG_TTL);
    }

    if (!flag.enabled) return false;
    if (userId && flag.userIds?.includes(userId)) return true;
    if (flag.rolloutPct >= 100) return true;
    if (flag.rolloutPct <= 0) return false;

    // Deterministic rollout based on userId hash so the same user always gets the same result.
    if (userId) {
      let hash = 0;
      for (let i = 0; i < userId.length; i++) {
        hash = (hash * 31 + userId.charCodeAt(i)) >>> 0;
      }
      return hash % 100 < flag.rolloutPct;
    }

    return false;
  }

  async getAll() {
    return this.prisma.featureFlag.findMany({ orderBy: { key: 'asc' } });
  }

  async upsert(
    key: string,
    data: {
      name?: string;
      description?: string;
      enabled?: boolean;
      rolloutPct?: number;
      userIds?: string[];
    },
  ) {
    const flag = await this.prisma.featureFlag.upsert({
      where: { key },
      create: { key, name: data.name ?? key, ...data },
      update: data,
    });
    await this.redis.del(`flag:${key}`);
    return flag;
  }

  async remove(key: string) {
    await this.prisma.featureFlag.delete({ where: { key } });
    await this.redis.del(`flag:${key}`);
    return { success: true };
  }
}
