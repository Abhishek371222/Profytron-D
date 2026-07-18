import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AgentEventType } from './agent.types';

export interface EmitAgentEventInput {
  type: AgentEventType | (string & {});
  entityType: string;
  entityId: string;
  userId?: string;
  payload?: Record<string, unknown>;
  idempotencyKey: string;
}

@Injectable()
export class AgentEventService {
  private readonly logger = new Logger(AgentEventService.name);

  constructor(private readonly prisma: PrismaService) {}

  isEnabled(): boolean {
    return process.env.AGENTS_ENABLED !== 'false';
  }

  async emit(input: EmitAgentEventInput): Promise<void> {
    if (!this.isEnabled()) return;

    try {
      await this.prisma.agentEventOutbox.create({
        data: {
          eventType: input.type,
          entityType: input.entityType,
          entityId: input.entityId,
          userId: input.userId,
          payload: (input.payload ?? {}) as Prisma.InputJsonValue,
          idempotencyKey: input.idempotencyKey,
        },
      });
    } catch (error: unknown) {
      const code = (error as { code?: string })?.code;
      if (code === 'P2002') return;
      this.logger.warn(`Agent event emit failed: ${input.type}`, error);
    }
  }
}
