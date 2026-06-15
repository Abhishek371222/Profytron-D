import {
  ThrottlerGuard,
  ThrottlerLimitDetail,
  ThrottlerStorage,
  getOptionsToken,
} from '@nestjs/throttler';
import type { ThrottlerModuleOptions } from '@nestjs/throttler';
import { ExecutionContext, Inject, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AgentEventService } from '../../modules/agents/agent-event.service';
import { AGENT_EVENTS } from '../../modules/agents/agent.types';

@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  constructor(
    @Inject(getOptionsToken()) options: ThrottlerModuleOptions,
    storageService: ThrottlerStorage,
    reflector: Reflector,
    private readonly agentEvents: AgentEventService,
  ) {
    super(options, storageService, reflector);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (context.getType() !== 'http') return true;
    return super.canActivate(context);
  }

  protected async throwThrottlingException(
    context: ExecutionContext,
    throttlerLimitDetail: ThrottlerLimitDetail,
  ): Promise<void> {
    if (context.getType() === 'http') {
      const req = context.switchToHttp().getRequest<{ ip?: string; user?: { id?: string } }>();
      const ip = req.ip ?? 'unknown';
      void this.agentEvents.emit({
        type: AGENT_EVENTS.API_RATE_LIMIT_EXCEEDED,
        entityType: 'ip',
        entityId: ip,
        userId: req.user?.id,
        payload: {
          limit: throttlerLimitDetail.limit,
          ttl: throttlerLimitDetail.ttl,
        },
        idempotencyKey: `rate:${ip}:${Math.floor(Date.now() / 3_600_000)}`,
      });
    }
    return super.throwThrottlingException(context, throttlerLimitDetail);
  }
}
