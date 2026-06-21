import { Controller, Get, Post, Param, UseGuards, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AgentType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard, RolesGuard, Roles } from '../auth/guards/auth.guard';
import { AgentEventService } from './agent-event.service';
import { AGENT_EVENTS, AGENT_DESCRIPTIONS, EVENT_LABELS } from './agent.types';
import { AgentOutboxPoller } from './agent-scheduler.service';
import { RedisService } from '../auth/redis.service';

const LOW_USAGE_BUDGET = {
  dailyTokenCap: 300,
  dailyCostCapUsd: 0.05,
};

/** One smoke event per agent — rules/SQL first, AI only if gate requires it. */
const AGENT_SMOKE_EVENTS: Record<
  AgentType,
  {
    eventType: string;
    entityType: string;
    entityId: string;
    payload?: Record<string, unknown>;
  }
> = {
  [AgentType.CEO]: {
    eventType: AGENT_EVENTS.CEO_DAILY_TICK,
    entityType: 'system',
    entityId: 'smoke',
  },
  [AgentType.PRODUCT]: {
    eventType: AGENT_EVENTS.PRODUCT_DAILY_TICK,
    entityType: 'system',
    entityId: 'smoke',
  },
  [AgentType.MARKETING]: {
    eventType: AGENT_EVENTS.MARKETING_DAILY_TICK,
    entityType: 'system',
    entityId: 'smoke',
  },
  [AgentType.SEO]: {
    eventType: AGENT_EVENTS.SEO_WEEKLY_TICK,
    entityType: 'system',
    entityId: 'smoke',
  },
  [AgentType.ANALYTICS]: {
    eventType: AGENT_EVENTS.ANALYTICS_DAILY_TICK,
    entityType: 'system',
    entityId: 'smoke',
  },
  [AgentType.CUSTOMER_SUCCESS]: {
    eventType: AGENT_EVENTS.USER_INACTIVE_7D,
    entityType: 'user',
    entityId: 'smoke-user',
  },
  [AgentType.SUPPORT]: {
    eventType: AGENT_EVENTS.SUPPORT_TICKET_CREATED,
    entityType: 'ticket',
    entityId: 'smoke-ticket',
    payload: { subject: 'Smoke test', category: 'general' },
  },
  [AgentType.BILLING]: {
    eventType: AGENT_EVENTS.PAYMENT_FAILED,
    entityType: 'payment',
    entityId: 'smoke-pay',
    payload: { amount: 100 },
  },
  [AgentType.SECURITY]: {
    eventType: AGENT_EVENTS.API_RATE_LIMIT_EXCEEDED,
    entityType: 'ip',
    entityId: '127.0.0.1',
    payload: { limit: 60 },
  },
  [AgentType.DEVOPS]: {
    eventType: AGENT_EVENTS.ERROR_RATE_SPIKE,
    entityType: 'system',
    entityId: 'smoke',
    payload: { rate: 0.02 },
  },
};

async function enqueueSmokeRun(
  deps: {
    events: AgentEventService;
    prisma: PrismaService;
    redis: RedisService;
    outboxPoller: AgentOutboxPoller;
  },
  agentType: AgentType,
  opts: { forceBatch?: string | null; smokeUserId?: string },
): Promise<{ idempotencyKey: string }> {
  const day = new Date().toISOString().slice(0, 10);
  const smoke = AGENT_SMOKE_EVENTS[agentType];
  const idempotencyKey = opts.forceBatch
    ? `smoke:${agentType}:${day}:${opts.forceBatch}`
    : `smoke:${agentType}:${day}`;

  if (opts.forceBatch) {
    await Promise.all([
      deps.redis.del(`agent:done:${agentType}:${idempotencyKey}`),
      deps.redis.del(`agent:gate:${idempotencyKey}:${agentType}`),
    ]);
  }

  await deps.events.emit({
    type: smoke.eventType,
    entityType: smoke.entityType,
    entityId: smoke.entityId,
    userId: opts.smokeUserId,
    payload: smoke.payload,
    idempotencyKey,
  });

  return { idempotencyKey };
}

@ApiTags('Agents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('agents')
export class AgentsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: AgentEventService,
    private readonly outboxPoller: AgentOutboxPoller,
    private readonly redis: RedisService,
  ) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'AI workforce metrics for admin' })
  async dashboard() {
    const since = new Date();
    since.setDate(since.getDate() - 1);

    const [jobs, budgets, insightRows, dlqEstimate] = await Promise.all([
      this.prisma.agentJob.groupBy({
        by: ['agentType', 'status'],
        where: { createdAt: { gte: since } },
        _count: { id: true },
        _sum: { inputTokens: true, outputTokens: true, costUsd: true },
      }),
      this.prisma.agentBudget.findMany(),
      this.prisma.agentInsight.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      this.prisma.agentJob.count({
        where: { status: 'DEAD_LETTER', createdAt: { gte: since } },
      }),
      this.prisma.agentInsight.findMany({
        orderBy: { createdAt: 'desc' },
        take: 80,
      }),
    ]);

    const latestInsightByType = new Map<string, (typeof insightRows)[0]>();
    for (const row of insightRows) {
      if (!latestInsightByType.has(row.agentType)) {
        latestInsightByType.set(row.agentType, row);
      }
    }

    const agentSummaries = Object.values(AgentType).map((type) => {
      const latest = latestInsightByType.get(type);
      return {
        agentType: type,
        description: AGENT_DESCRIPTIONS[type] ?? '',
        title: latest?.title ?? null,
        summary: latest?.summary ?? null,
        updatedAt: latest?.createdAt ?? null,
      };
    });

    const recentInsights = insightRows.slice(0, 20);

    const byAgent = Object.values(AgentType).map((type) => {
      const rows = jobs.filter((j) => j.agentType === type);
      const invocations = rows.reduce((s, r) => s + r._count.id, 0);
      const tokens = rows.reduce(
        (s, r) => s + (r._sum.inputTokens ?? 0) + (r._sum.outputTokens ?? 0),
        0,
      );
      const cost = rows.reduce((s, r) => s + (r._sum.costUsd ?? 0), 0);
      const skipped =
        rows.find((r) => r.status === 'SKIPPED_NO_AI')?._count.id ?? 0;
      const budget = budgets.find((b) => b.agentType === type);
      return {
        agentType: type,
        invocations,
        tokens,
        costUsd: cost,
        skipRate:
          invocations > 0 ? ((skipped / invocations) * 100).toFixed(1) : '0',
        enabled: budget?.enabled ?? true,
        tokensUsedToday: budget?.tokensUsedToday ?? 0,
        tokenCap: budget?.dailyTokenCap ?? 0,
      };
    });

    const totalInvocations = byAgent.reduce((s, a) => s + a.invocations, 0);
    const totalCost = byAgent.reduce((s, a) => s + a.costUsd, 0);
    const aiSkipped = jobs
      .filter((j) => j.status === 'SKIPPED_NO_AI')
      .reduce((s, r) => s + r._count.id, 0);

    return {
      summary: {
        invocations24h: totalInvocations,
        costUsd24h: totalCost,
        gateSkipRate:
          totalInvocations > 0
            ? `${((aiSkipped / totalInvocations) * 100).toFixed(1)}%`
            : '0%',
        dlqDepth24h: dlqEstimate,
      },
      agents: byAgent.map((a) => ({
        ...a,
        description: AGENT_DESCRIPTIONS[a.agentType] ?? '',
      })),
      recentInsights: recentInsights,
      agentSummaries,
    };
  }

  @Get('activity')
  @ApiOperation({
    summary: 'Live agent job feed — what each agent is working on',
  })
  async activity() {
    const [recentJobs, pendingOutbox, processing] = await Promise.all([
      this.prisma.agentJob.findMany({
        orderBy: { createdAt: 'desc' },
        take: 40,
      }),
      this.prisma.agentEventOutbox.count({ where: { processedAt: null } }),
      this.prisma.agentJob.count({ where: { status: 'PROCESSING' } }),
    ]);

    return {
      pendingOutbox,
      processing,
      agentsEnabled: this.events.isEnabled(),
      descriptions: AGENT_DESCRIPTIONS,
      recentJobs: recentJobs.map((j) => ({
        id: j.id,
        agentType: j.agentType,
        eventType: j.eventType,
        eventLabel: EVENT_LABELS[j.eventType] ?? j.eventType,
        entityId: j.entityId,
        status: j.status,
        gateSource: j.gateSource,
        tokens: j.inputTokens + j.outputTokens,
        costUsd: j.costUsd,
        latencyMs: j.latencyMs,
        errorMessage: j.errorMessage,
        createdAt: j.createdAt,
        completedAt: j.completedAt,
      })),
    };
  }

  @Get('insights')
  async insights(@Query('agentType') agentType?: AgentType) {
    return this.prisma.agentInsight.findMany({
      where: agentType ? { agentType } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  @Post('budgets/:agentType/enable')
  async enableAgent(@Param('agentType') agentType: AgentType) {
    return this.prisma.agentBudget.upsert({
      where: { agentType },
      create: { agentType, enabled: true },
      update: { enabled: true },
    });
  }

  @Post('budgets/:agentType/disable')
  async disableAgent(@Param('agentType') agentType: AgentType) {
    return this.prisma.agentBudget.upsert({
      where: { agentType },
      create: { agentType, enabled: false },
      update: { enabled: false },
    });
  }

  @Post('run-all-low')
  @ApiOperation({
    summary:
      'Enable all agents with low budgets and enqueue one smoke job each',
  })
  async runAllLow(@Query('force') force?: string) {
    if (!this.events.isEnabled()) {
      return {
        ok: false,
        message: 'Agents disabled — set AGENTS_ENABLED=true',
      };
    }

    const forceRun = force === 'true';
    const forceBatch = forceRun ? Date.now().toString(36) : null;

    await Promise.all(
      Object.values(AgentType).map((agentType) =>
        this.prisma.agentBudget.upsert({
          where: { agentType },
          create: { agentType, enabled: true, ...LOW_USAGE_BUDGET },
          update: { enabled: true, ...LOW_USAGE_BUDGET },
        }),
      ),
    );

    const admin = await this.prisma.user.findFirst({
      where: { role: 'ADMIN' },
      select: { id: true },
    });

    const day = new Date().toISOString().slice(0, 10);
    const deps = {
      events: this.events,
      prisma: this.prisma,
      redis: this.redis,
      outboxPoller: this.outboxPoller,
    };

    const queued: string[] = [];
    const skipped: string[] = [];

    await Promise.all(
      Object.values(AgentType).map(async (agentType) => {
        const idempotencyKey = forceBatch
          ? `smoke:${agentType}:${day}:${forceBatch}`
          : `smoke:${agentType}:${day}`;

        if (!forceRun) {
          const alreadyQueued = await this.prisma.agentEventOutbox.findFirst({
            where: { idempotencyKey, processedAt: { not: null } },
          });
          if (alreadyQueued) {
            skipped.push(agentType);
            return;
          }
        }

        await enqueueSmokeRun(deps, agentType, {
          forceBatch,
          smokeUserId: admin?.id,
        });
        queued.push(agentType);
      }),
    );

    void this.outboxPoller.poll().catch(() => {});

    return {
      ok: true,
      batchId: forceBatch ?? `daily:${day}`,
      queued,
      skipped,
      mode: 'low_usage',
      budgets: LOW_USAGE_BUDGET,
      message: `Processing ${queued.length} agents — reports update in about 30 seconds`,
    };
  }

  @Post('run/:agentType')
  @ApiOperation({ summary: 'Enqueue a single agent smoke job' })
  async runSingle(@Param('agentType') agentType: AgentType) {
    if (!this.events.isEnabled()) {
      return {
        ok: false,
        message: 'Agents disabled — set AGENTS_ENABLED=true',
      };
    }

    if (!Object.values(AgentType).includes(agentType)) {
      return { ok: false, message: `Unknown agent type: ${agentType}` };
    }

    await this.prisma.agentBudget.upsert({
      where: { agentType },
      create: { agentType, enabled: true, ...LOW_USAGE_BUDGET },
      update: { enabled: true, ...LOW_USAGE_BUDGET },
    });

    const admin = await this.prisma.user.findFirst({
      where: { role: 'ADMIN' },
      select: { id: true },
    });

    const forceBatch = Date.now().toString(36);
    const { idempotencyKey } = await enqueueSmokeRun(
      {
        events: this.events,
        prisma: this.prisma,
        redis: this.redis,
        outboxPoller: this.outboxPoller,
      },
      agentType,
      { forceBatch, smokeUserId: admin?.id },
    );

    void this.outboxPoller.poll().catch(() => {});

    return {
      ok: true,
      agentType,
      batchId: forceBatch,
      idempotencyKey,
      message: `${agentType} is running — report updates in about 15 seconds`,
    };
  }
}
