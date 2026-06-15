import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { AgentType } from '@prisma/client';
import {
  AGENT_EVENTS,
  AgentJobPayload,
  EVENT_TO_AGENTS,
} from './agent.types';

@Injectable()
export class AgentRouterService {
  constructor(
    @InjectQueue('agent_workforce') private readonly queue: Queue,
    @InjectQueue('agent_dlq') private readonly dlq: Queue,
  ) {}

  async enqueueFromOutbox(row: {
    id: string;
    eventType: string;
    entityType: string;
    entityId: string;
    userId: string | null;
    payload: unknown;
    idempotencyKey: string;
  }) {
    const agents = EVENT_TO_AGENTS[row.eventType] ?? [];
    const payload: AgentJobPayload = {
      outboxId: row.id,
      eventType: row.eventType,
      entityType: row.entityType,
      entityId: row.entityId,
      userId: row.userId ?? undefined,
      payload: (row.payload as Record<string, unknown>) ?? {},
      idempotencyKey: row.idempotencyKey,
    };

    for (const agentType of agents) {
      await this.queue.add(
        'run_agent',
        { ...payload, agentType },
        {
          jobId: `${row.idempotencyKey}:${agentType}`,
          removeOnComplete: 100,
          removeOnFail: 50,
          attempts: 3,
          backoff: { type: 'exponential', delay: 30_000 },
        },
      );
    }
  }

  async enqueueTick(eventType: string, agentType: AgentType) {
    const day = new Date().toISOString().slice(0, 10);
    await this.queue.add(
      'run_agent',
      {
        eventType,
        entityType: 'system',
        entityId: 'system',
        payload: {},
        idempotencyKey: `${eventType}:${day}`,
        agentType,
      } satisfies AgentJobPayload & { agentType: AgentType },
      {
        jobId: `${eventType}:${day}:${agentType}`,
        removeOnComplete: 20,
        attempts: 2,
      },
    );
  }

  async moveToDlq(data: unknown, error: string) {
    await this.dlq.add('failed_job', { data, error, at: new Date().toISOString() });
  }

  static isScheduledEvent(eventType: string): boolean {
    const scheduled = new Set<string>([
      AGENT_EVENTS.CEO_DAILY_TICK,
      AGENT_EVENTS.PRODUCT_DAILY_TICK,
      AGENT_EVENTS.MARKETING_DAILY_TICK,
      AGENT_EVENTS.SEO_WEEKLY_TICK,
      AGENT_EVENTS.ANALYTICS_DAILY_TICK,
    ]);
    return scheduled.has(eventType);
  }
}
