import { Injectable } from '@nestjs/common';
import { AgentType, Prisma } from '@prisma/client';
import { RedisService } from '../../auth/redis.service';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class AgentMemoryService {
  constructor(
    private readonly redis: RedisService,
    private readonly prisma: PrismaService,
  ) {}

  async pushShortTerm(userId: string, event: string, data: unknown) {
    const key = `agent:ctx:${userId}`;
    const raw = (await this.redis.get(key)) ?? '[]';
    const arr = JSON.parse(raw) as unknown[];
    arr.push({ event, data, at: new Date().toISOString() });
    const trimmed = arr.slice(-5);
    await this.redis.set(key, JSON.stringify(trimmed), 172800);
  }

  async getShortTerm(userId: string): Promise<unknown[]> {
    const raw = await this.redis.get(`agent:ctx:${userId}`);
    return raw ? JSON.parse(raw) : [];
  }

  async saveInsight(input: {
    agentType: AgentType;
    scope: string;
    title: string;
    summary: string;
    dataJson?: Record<string, unknown>;
    ttlHours?: number;
  }) {
    const validUntil = new Date();
    validUntil.setHours(validUntil.getHours() + (input.ttlHours ?? 24));
    return this.prisma.agentInsight.create({
      data: {
        agentType: input.agentType,
        scope: input.scope,
        title: input.title,
        summary: input.summary,
        dataJson: (input.dataJson ?? {}) as Prisma.InputJsonValue,
        validUntil,
      },
    });
  }
}
