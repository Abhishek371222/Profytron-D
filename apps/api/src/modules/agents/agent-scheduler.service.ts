import { Injectable, Logger } from '@nestjs/common';
import { Cron, Interval } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../auth/redis.service';
import { AgentRouterService } from './agent-router.service';
import { AGENT_EVENTS } from './agent.types';
import { AgentType } from '@prisma/client';
import { AgentEventService } from './agent-event.service';

@Injectable()
export class AgentOutboxPoller {
  private readonly logger = new Logger(AgentOutboxPoller.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly router: AgentRouterService,
    private readonly events: AgentEventService,
  ) {}

  /** Poll outbox every 30s — not agents themselves */
  @Interval(30_000)
  async poll() {
    if (!this.events.isEnabled()) return;

    const batch = await this.prisma.agentEventOutbox.findMany({
      where: { processedAt: null },
      take: 100,
      orderBy: { createdAt: 'asc' },
    });

    for (const row of batch) {
      try {
        await this.router.enqueueFromOutbox(row);
        await this.prisma.agentEventOutbox.update({
          where: { id: row.id },
          data: { processedAt: new Date() },
        });
      } catch (error) {
        this.logger.warn(`Outbox row ${row.id} failed`, error);
      }
    }
  }
}

@Injectable()
export class AgentSchedulerService {
  private readonly logger = new Logger(AgentSchedulerService.name);

  constructor(
    private readonly router: AgentRouterService,
    private readonly redis: RedisService,
    private readonly events: AgentEventService,
    private readonly prisma: PrismaService,
  ) {}

  private async withLeaderLock(key: string, fn: () => Promise<void>) {
    if (await this.redis.exists(key)) return;
    await this.redis.set(key, '1', 55);
    try {
      await fn();
    } finally {
      await this.redis.del(key);
    }
  }

  @Cron('0 6 * * *')
  async ceoDaily() {
    if (!this.events.isEnabled()) return;
    await this.withLeaderLock('agent:lock:ceo_daily', async () => {
      await this.router.enqueueTick(AGENT_EVENTS.CEO_DAILY_TICK, AgentType.CEO);
    });
  }

  @Cron('0 7 * * *')
  async productDaily() {
    if (!this.events.isEnabled()) return;
    await this.withLeaderLock('agent:lock:product_daily', async () => {
      await this.router.enqueueTick(
        AGENT_EVENTS.PRODUCT_DAILY_TICK,
        AgentType.PRODUCT,
      );
    });
  }

  @Cron('0 5 * * *')
  async analyticsDaily() {
    if (!this.events.isEnabled()) return;
    await this.withLeaderLock('agent:lock:analytics_daily', async () => {
      await this.router.enqueueTick(
        AGENT_EVENTS.ANALYTICS_DAILY_TICK,
        AgentType.ANALYTICS,
      );
    });
  }

  @Cron('0 8 * * *')
  async marketingDaily() {
    if (!this.events.isEnabled()) return;
    await this.withLeaderLock('agent:lock:marketing_daily', async () => {
      await this.router.enqueueTick(
        AGENT_EVENTS.MARKETING_DAILY_TICK,
        AgentType.MARKETING,
      );
    });
  }

  @Cron('0 5 * * 0')
  async seoWeekly() {
    if (!this.events.isEnabled()) return;
    await this.withLeaderLock('agent:lock:seo_weekly', async () => {
      await this.router.enqueueTick(AGENT_EVENTS.SEO_WEEKLY_TICK, AgentType.SEO);
    });
  }

  /** Emit inactive-user events once daily — incremental, indexed query */
  @Cron('0 18 * * *')
  async detectInactiveUsers() {
    if (!this.events.isEnabled()) return;
    await this.withLeaderLock('agent:lock:inactive_scan', async () => {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 7);
      const day = new Date().toISOString().slice(0, 10);

      const users = await this.prisma.user.findMany({
        where: {
          emailVerified: true,
          isActive: true,
          deletedAt: null,
          OR: [{ lastLoginAt: { lt: cutoff } }, { lastLoginAt: null }],
          createdAt: { lt: cutoff },
        },
        select: { id: true },
        take: 50,
      });

      for (const u of users) {
        await this.events.emit({
          type: AGENT_EVENTS.USER_INACTIVE_7D,
          entityType: 'user',
          entityId: u.id,
          userId: u.id,
          idempotencyKey: `inactive:${u.id}:${day}`,
        });
      }
    });
  }

  @Cron('0 11 * * *')
  async detectFailedOnboarding() {
    if (!this.events.isEnabled()) return;
    await this.withLeaderLock('agent:lock:onboarding_scan', async () => {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 3);
      const day = new Date().toISOString().slice(0, 10);

      const users = await this.prisma.user.findMany({
        where: {
          emailVerified: true,
          onboardingCompleted: false,
          createdAt: { lt: cutoff },
          deletedAt: null,
        },
        select: { id: true },
        take: 50,
      });

      for (const u of users) {
        await this.events.emit({
          type: AGENT_EVENTS.USER_ONBOARDING_FAILED,
          entityType: 'user',
          entityId: u.id,
          userId: u.id,
          idempotencyKey: `onboarding-fail:${u.id}:${day}`,
        });
      }
    });
  }
}
