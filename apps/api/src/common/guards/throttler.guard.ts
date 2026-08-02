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

/** Must match ThrottlerModule.forRoot throttlers[0].limit in app.module.ts */
const MODULE_DEFAULT_LIMIT = 100;
const AUTHENTICATED_LIMIT = 1000;

const SKIP_PATH_PREFIXES = [
  '/health',
  '/live',
  '/ready',
  '/metrics',
  '/v1/webhooks/',
  '/v1/wallet/webhook',
];

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
    if (process.env.NODE_ENV === 'test') return true;
    if (context.getType() !== 'http') return true;

    const req = context.switchToHttp().getRequest<{
      url?: string;
      path?: string;
      originalUrl?: string;
    }>();
    const path = String(req?.originalUrl ?? req?.url ?? req?.path ?? '');
    if (SKIP_PATH_PREFIXES.some((p) => path === p || path.startsWith(p))) {
      return true;
    }

    return super.canActivate(context);
  }

  protected getTracker(req: Record<string, any>): Promise<string> {
    const userId = req?.user?.userId ?? req?.user?.id;
    return Promise.resolve(
      userId ? `user:${userId}` : `ip:${req?.ip ?? 'unknown'}`,
    );
  }

  protected async handleRequest(
    requestProps: ThrottlerRequest,
  ): Promise<boolean> {
    const req = requestProps.context
      .switchToHttp()
      .getRequest<{ user?: { id?: string; userId?: string } }>();
    const isAuthenticated = Boolean(req?.user?.userId ?? req?.user?.id);
    // Raise the module-wide default (100/min) for signed-in users, but never
    // override a route @Throttle that intentionally used a different limit
    // (stricter coach quotas or higher streaming caps).
    if (isAuthenticated && requestProps.limit === MODULE_DEFAULT_LIMIT) {
      return super.handleRequest({
        ...requestProps,
        limit: AUTHENTICATED_LIMIT,
      });
    }
    return super.handleRequest(requestProps);
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
