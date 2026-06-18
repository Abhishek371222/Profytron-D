import { Injectable } from '@nestjs/common';
import { AgentType } from '@prisma/client';
import { RedisService } from '../auth/redis.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AGENT_EVENTS, AgentJobPayload, GateResult } from './agent.types';
import { RuleEngineService } from './core/rule-engine.service';
import { AgentRollupsService } from './core/agent-rollups.service';

@Injectable()
export class PreAiGateService {
  constructor(
    private readonly rules: RuleEngineService,
    private readonly rollups: AgentRollupsService,
    private readonly redis: RedisService,
    private readonly prisma: PrismaService,
  ) {}

  async resolve(
    agentType: AgentType,
    job: AgentJobPayload,
  ): Promise<GateResult> {
    const cacheKey = `agent:gate:${job.idempotencyKey}:${agentType}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return { resolved: true, source: 'cache', data: JSON.parse(cached) };
    }

    const rule = this.rules.match(agentType, job);
    if (rule) {
      const result: GateResult = {
        resolved: true,
        source: 'rule',
        action: rule.action,
        data: rule.data,
      };
      await this.redis.set(cacheKey, JSON.stringify(result), 86400);
      return result;
    }

    const sql = await this.rollups.tryResolve(agentType, job);
    if (sql?.resolved) {
      await this.redis.set(cacheKey, JSON.stringify(sql), 86400);
      return sql;
    }
    if (sql?.data) {
      return {
        resolved: false,
        source: sql.source ?? 'sql',
        data: sql.data,
        action: sql.action,
      };
    }

    const summary = await this.prisma.agentInsight.findFirst({
      where: {
        agentType,
        scope: job.entityId,
        validUntil: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });
    if (
      summary &&
      AgentRouterServiceIsFresh(summary.createdAt, job.eventType)
    ) {
      const result: GateResult = {
        resolved: true,
        source: 'summary',
        data: { title: summary.title, summary: summary.summary },
      };
      await this.redis.set(cacheKey, JSON.stringify(result), 86400);
      return result;
    }

    return { resolved: false, source: 'ai_required' };
  }
}

function AgentRouterServiceIsFresh(
  createdAt: Date,
  eventType: string,
): boolean {
  const ageMs = Date.now() - createdAt.getTime();
  if (eventType.includes('DAILY') || eventType.includes('WEEKLY')) return false;
  return ageMs < 6 * 60 * 60 * 1000;
}

export { AgentRouterServiceIsFresh };
