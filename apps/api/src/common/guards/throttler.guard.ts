import {
  ThrottlerGuard,
  ThrottlerLimitDetail,
  ThrottlerStorage,
  getOptionsToken,
} from '@nestjs/throttler';
import type {
  ThrottlerModuleOptions,
  ThrottlerRequest,
} from '@nestjs/throttler';
import { ExecutionContext, Inject, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AgentEventService } from '../../modules/agents/agent-event.service';
import { AGENT_EVENTS } from '../../modules/agents/agent.types';

// Per-minute request budgets. Authenticated dashboards make many calls, so they
// get a much higher ceiling than anonymous traffic (the configured base limit).
const AUTHENTICATED_LIMIT = 1000;

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

  // Track authenticated callers by user id (so one user's quota follows them
  // across IPs / NAT), and anonymous callers by IP.
  protected getTracker(req: Record<string, any>): Promise<string> {
    const userId = req?.user?.userId ?? req?.user?.id;
    return Promise.resolve(userId ? `user:${userId}` : `ip:${req?.ip ?? 'unknown'}`);
  }

  // Raise the limit for authenticated requests; anonymous requests keep the
  // base limit configured on the module.
  protected async handleRequest(
    requestProps: ThrottlerRequest,
  ): Promise<boolean> {
    const req = requestProps.context
      .switchToHttp()
      .getRequest<{ user?: { id?: string; userId?: string } }>();
    const isAuthenticated = Boolean(req?.user?.userId ?? req?.user?.id);
    return super.handleRequest(
      isAuthenticated
        ? { ...requestProps, limit: AUTHENTICATED_LIMIT }
        : requestProps,
    );
  }

  protected async throwThrottlingException(
    context: ExecutionContext,
    throttlerLimitDetail: ThrottlerLimitDetail,
  ): Promise<void> {
    if (context.getType() === 'http') {
      const req = context
        .switchToHttp()
        .getRequest<{ ip?: string; user?: { id?: string } }>();
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
