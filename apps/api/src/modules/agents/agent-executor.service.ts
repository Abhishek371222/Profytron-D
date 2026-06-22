import { Injectable, Logger } from '@nestjs/common';
import { AgentType, AgentJobStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import {
  AGENT_EVENTS,
  AgentJobPayload,
  GateResult,
  isAgentsLowUsage,
  resolveModelTier,
  EVENT_LABELS,
} from './agent.types';
import { PreAiGateService } from './pre-ai-gate.service';
import { ModelRouterService } from './core/model-router.service';
import { TokenBudgetService } from './core/token-budget.service';
import { AgentMemoryService } from './core/agent-memory.service';
import { AgentRollupsService } from './core/agent-rollups.service';
import { AgentEventService } from './agent-event.service';
import { RedisService } from '../auth/redis.service';
import {
  appendAiEnhancement,
  buildAnalyticsSummary,
  buildBillingSummary,
  buildCeoSummary,
  buildCsSummary,
  buildDevopsSummary,
  buildMarketingSummary,
  buildProductSummary,
  buildSecuritySummary,
  buildSeoSummary,
  buildSupportSummary,
} from './core/agent-summary.builder';

interface AiRunResult {
  text: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  modelLevel: string;
}

interface AgentRunOutput {
  status: AgentJobStatus;
  gateSource?: string;
  result?: unknown;
  inputTokens?: number;
  outputTokens?: number;
  costUsd?: number;
  modelLevel?: string;
}

@Injectable()
export class AgentExecutorService {
  private readonly logger = new Logger(AgentExecutorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gate: PreAiGateService,
    private readonly models: ModelRouterService,
    private readonly budget: TokenBudgetService,
    private readonly memory: AgentMemoryService,
    private readonly rollups: AgentRollupsService,
    private readonly email: EmailService,
    private readonly agentEvents: AgentEventService,
    private readonly redis: RedisService,
  ) {}

  async run(agentType: AgentType, job: AgentJobPayload) {
    const dedupeKey = `agent:done:${agentType}:${job.idempotencyKey}`;
    if (await this.redis.exists(dedupeKey)) {
      this.logger.debug(`Skip duplicate ${agentType} ${job.idempotencyKey}`);
      return;
    }

    const jobRecord = await this.prisma.agentJob.create({
      data: {
        agentType,
        eventType: job.eventType,
        entityId: job.entityId,
        userId: job.userId,
        status: AgentJobStatus.PROCESSING,
      },
    });

    const start = Date.now();
    try {
      const gate = await this.gate.resolve(agentType, job);

      if (
        agentType === AgentType.ANALYTICS &&
        job.eventType === AGENT_EVENTS.ANALYTICS_DAILY_TICK
      ) {
        const snapshot =
          gate.data ?? (await this.rollups.computeDailySnapshot());
        await this.checkRevenueAnomaly(snapshot);
        const analyticsSummary = buildAnalyticsSummary(snapshot);
        await this.memory.saveInsight({
          agentType: AgentType.ANALYTICS,
          scope: 'global:daily',
          title: 'Daily Metrics Snapshot',
          summary: analyticsSummary,
          dataJson: snapshot,
        });
        await this.redis.set(dedupeKey, '1', 86400);
        return this.finish(jobRecord.id, {
          status: AgentJobStatus.COMPLETED,
          gateSource: gate.source ?? 'sql',
          result: { snapshot },
          latencyMs: Date.now() - start,
        });
      }

      const result = await this.runAgentLogic(agentType, job, gate);
      await this.redis.set(dedupeKey, '1', 86400);
      return this.finish(jobRecord.id, {
        ...result,
        latencyMs: Date.now() - start,
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      await this.prisma.agentJob.update({
        where: { id: jobRecord.id },
        data: {
          status: AgentJobStatus.FAILED,
          errorMessage: msg,
          completedAt: new Date(),
          latencyMs: Date.now() - start,
        },
      });
      throw error;
    }
  }

  private async runAgentLogic(
    agentType: AgentType,
    job: AgentJobPayload,
    gate: GateResult,
  ): Promise<AgentRunOutput> {
    switch (agentType) {
      case AgentType.CEO:
        return this.runCeo(job, gate);
      case AgentType.PRODUCT:
        return this.runProduct(job, gate);
      case AgentType.CUSTOMER_SUCCESS:
        return this.runCs(job, gate);
      case AgentType.SUPPORT:
        return this.runSupport(job);
      case AgentType.MARKETING:
        return this.runMarketing(job, gate);
      case AgentType.SEO:
        return this.runSeo(job);
      case AgentType.SECURITY:
        return this.runSecurity(job, gate);
      case AgentType.BILLING:
        return this.runBilling(job, gate);
      case AgentType.DEVOPS:
        return this.runDevops(job, gate);
      default:
        return {
          status: AgentJobStatus.SKIPPED_NO_AI,
          gateSource: gate.source,
          result: {},
        };
    }
  }

  private async runCeo(
    job: AgentJobPayload,
    gate: GateResult,
  ): Promise<AgentRunOutput> {
    const metrics = gate.data ?? {};
    const baseSummary = buildCeoSummary(metrics);
    const ai = await this.maybeAi(
      AgentType.CEO,
      'You are Profytron CEO analyst. Add 2-3 strategic bullets for Indian algo-trading SaaS based on the brief.',
      baseSummary.slice(0, 2000),
      'L2',
      400,
    );
    const summary = appendAiEnhancement(baseSummary, ai?.text, AgentType.CEO);
    await this.memory.saveInsight({
      agentType: AgentType.CEO,
      scope: 'global:daily',
      title: 'Daily Executive Summary',
      summary,
      dataJson: metrics,
      ttlHours: 36,
    });
    return {
      status: AgentJobStatus.COMPLETED,
      gateSource: gate.source,
      result: { summary, aiUsed: ai != null },
      ...this.aiUsage(ai),
    };
  }

  private async runProduct(
    job: AgentJobPayload,
    gate: GateResult,
  ): Promise<AgentRunOutput> {
    const funnel = gate.data ?? {};
    const baseSummary = buildProductSummary(funnel);
    const ai = await this.maybeAi(
      AgentType.PRODUCT,
      'Product manager for trading SaaS. Add 2 specific experiments based on this funnel report.',
      baseSummary.slice(0, 2000),
      'L2',
      350,
    );
    const text = appendAiEnhancement(baseSummary, ai?.text, AgentType.PRODUCT);
    await this.memory.saveInsight({
      agentType: AgentType.PRODUCT,
      scope: 'global:daily',
      title: 'Product Recommendations',
      summary: text,
      dataJson: funnel,
    });
    return {
      status: AgentJobStatus.COMPLETED,
      gateSource: gate.source ?? 'sql',
      result: { recommendations: text },
      ...this.aiUsage(ai),
    };
  }

  private async runCs(
    job: AgentJobPayload,
    gate: GateResult,
  ): Promise<AgentRunOutput> {
    if (!job.userId) {
      return {
        status: AgentJobStatus.SKIPPED_NO_AI,
        gateSource: 'rule',
        result: {},
      };
    }
    const user = await this.prisma.user.findUnique({
      where: { id: job.userId },
      select: { email: true, fullName: true, subscriptionTier: true },
    });
    if (!user) {
      return {
        status: AgentJobStatus.SKIPPED_NO_AI,
        gateSource: 'rule',
        result: {},
      };
    }

    let body = '';
    let ai: AiRunResult | null = null;
    if (
      gate.action === 'reengagement_email' ||
      gate.action === 'onboarding_nudge'
    ) {
      ai = await this.maybeAi(
        AgentType.CUSTOMER_SUCCESS,
        'Write a 2-sentence re-engagement email for an inactive trader.',
        `User: ${user.fullName}, tier: ${user.subscriptionTier}`,
        'L1',
        120,
      );
      body =
        ai?.text ??
        `${user.fullName}, your strategies and settings are saved. Log in to review today's paper-trading performance.`;
      await this.email
        .sendLifecycleEmail(user.email, user.fullName, {
          subject: 'Your Profytron workspace is ready',
          headline: 'We saved your setup',
          body,
          ctaLabel: 'Open Dashboard',
          ctaPath: '/dashboard',
        })
        .catch(() => {});
    }

    await this.memory.pushShortTerm(job.userId, job.eventType, gate);
    await this.prisma.notification.create({
      data: {
        userId: job.userId,
        title: 'Customer Success',
        body:
          gate.action ?? 'Your account has been reviewed by our success team.',
        type: 'INFO',
        actionUrl: '/dashboard',
      },
    });

    await this.memory.saveInsight({
      agentType: AgentType.CUSTOMER_SUCCESS,
      scope: `user:${job.userId}`,
      title: EVENT_LABELS[job.eventType] ?? 'Customer success action',
      summary: buildCsSummary({
        userName: user.fullName,
        email: user.email,
        tier: user.subscriptionTier,
        job,
        gate,
        emailBody: body || undefined,
      }),
    });

    return {
      status: AgentJobStatus.COMPLETED,
      gateSource: gate.source,
      result: { action: gate.action },
      ...this.aiUsage(ai),
    };
  }

  private async runSupport(job: AgentJobPayload): Promise<AgentRunOutput> {
    const subject = (job.payload?.subject ??
      job.payload?.message ??
      '') as string;
    const kb = await this.rollups.searchKnowledge(subject, 3);
    if (kb.length > 0 && subject.length > 0) {
      const match = kb[0];
      const confidence = match.content
        .toLowerCase()
        .includes(subject.toLowerCase().slice(0, 20))
        ? 0.9
        : 0.75;
      if (confidence >= 0.85) {
        const reply = match.content.slice(0, 800);
        await this.memory.saveInsight({
          agentType: AgentType.SUPPORT,
          scope: `ticket:${job.entityId}`,
          title: 'Support Reply (Knowledge Base)',
          summary: buildSupportSummary({
            subject,
            payload: job.payload ?? {},
            reply,
            source: 'kb',
            kbSlug: match.slug,
          }),
          dataJson: { slug: match.slug, confidence },
        });
        return {
          status: AgentJobStatus.SKIPPED_NO_AI,
          gateSource: 'cache',
          result: { kbHit: match.slug },
        };
      }
    }

    const draft = await this.maybeAi(
      AgentType.SUPPORT,
      'Support agent for Profytron. Write a helpful 3-sentence reply. No financial advice.',
      `Ticket: ${subject}\nContext: ${JSON.stringify(job.payload).slice(0, 1500)}`,
      'L1',
      300,
    );

    const replyText =
      draft?.text ??
      'Thank you for contacting Profytron support. Our team is reviewing your request and will respond shortly. In the meantime, check Help Center for broker connect and wallet deposit guides.';

    await this.memory.saveInsight({
      agentType: AgentType.SUPPORT,
      scope: `ticket:${job.entityId}`,
      title: 'Support Ticket Response',
      summary: buildSupportSummary({
        subject,
        payload: job.payload ?? {},
        reply: replyText,
        source: draft ? 'ai' : 'template',
      }),
    });

    return {
      status: AgentJobStatus.COMPLETED,
      gateSource: 'ai_required',
      result: { draft: draft?.text ?? null },
      ...this.aiUsage(draft),
    };
  }

  private async runMarketing(
    job: AgentJobPayload,
    gate: GateResult,
  ): Promise<AgentRunOutput> {
    const metrics = await this.prisma.dailyMetricsSnapshot.findFirst({
      orderBy: { date: 'desc' },
    });
    const snapshot = (metrics ?? gate.data ?? {}) as Record<string, unknown>;
    const baseSummary = buildMarketingSummary(snapshot);
    const ai = await this.maybeAi(
      AgentType.MARKETING,
      'Marketing analyst. Add one creative campaign idea for Indian traders based on this report.',
      baseSummary.slice(0, 1800),
      'L2',
      280,
    );
    const text = appendAiEnhancement(
      baseSummary,
      ai?.text,
      AgentType.MARKETING,
    );
    await this.memory.saveInsight({
      agentType: AgentType.MARKETING,
      scope: 'global:daily',
      title: 'Daily Marketing Ideas',
      summary: text,
    });
    return {
      status: AgentJobStatus.COMPLETED,
      gateSource: gate.source ?? 'sql',
      result: { text },
      ...this.aiUsage(ai),
    };
  }

  private async runSeo(job: AgentJobPayload): Promise<AgentRunOutput> {
    const baseSummary = buildSeoSummary();
    const ai = await this.maybeAi(
      AgentType.SEO,
      'SEO specialist. Add one keyword cluster suggestion for Indian algo-trading SaaS.',
      baseSummary.slice(0, 1500),
      'L2',
      400,
    );
    const text = appendAiEnhancement(baseSummary, ai?.text, AgentType.SEO);
    await this.memory.saveInsight({
      agentType: AgentType.SEO,
      scope: 'global:weekly',
      title: 'Weekly SEO Plan',
      summary: text,
      ttlHours: 168,
    });
    return {
      status: AgentJobStatus.COMPLETED,
      gateSource: 'sql',
      result: { text },
      ...this.aiUsage(ai),
    };
  }

  private async runSecurity(
    job: AgentJobPayload,
    gate: GateResult,
  ): Promise<AgentRunOutput> {
    if (job.userId) {
      await this.prisma.notification.create({
        data: {
          userId: job.userId,
          title: 'Security Alert',
          body: 'Unusual login activity detected. Review your account security.',
          type: 'WARNING',
          actionUrl: '/settings/security',
        },
      });
    }
    const summary = buildSecuritySummary(job, gate);
    await this.memory.saveInsight({
      agentType: AgentType.SECURITY,
      scope: job.entityId,
      title: EVENT_LABELS[job.eventType] ?? 'Security event',
      summary,
    });
    return {
      status: AgentJobStatus.COMPLETED,
      gateSource: gate.source,
      result: gate.data ?? {},
    };
  }

  private async runBilling(
    job: AgentJobPayload,
    gate: GateResult,
  ): Promise<AgentRunOutput> {
    if (job.userId && gate.action === 'send_dunning') {
      const user = await this.prisma.user.findUnique({
        where: { id: job.userId },
        select: { email: true, fullName: true },
      });
      if (user) {
        await this.email
          .sendLifecycleEmail(user.email, user.fullName, {
            subject: 'Payment failed — update your method',
            headline: 'We could not process your payment',
            body: 'Please update your payment method or add wallet funds to keep subscriptions active.',
            ctaLabel: 'Go to Billing',
            ctaPath: '/settings/billing',
          })
          .catch(() => {});
      }
    }
    await this.memory.saveInsight({
      agentType: AgentType.BILLING,
      scope: job.entityId,
      title: EVENT_LABELS[job.eventType] ?? 'Billing event',
      summary: buildBillingSummary(job, gate),
    });
    return {
      status: AgentJobStatus.COMPLETED,
      gateSource: gate.source,
      result: { action: gate.action },
    };
  }

  private async runDevops(
    job: AgentJobPayload,
    gate: GateResult,
  ): Promise<AgentRunOutput> {
    if (gate.resolved && gate.source === 'rule') {
      const summary = buildDevopsSummary(job, gate);
      await this.memory.saveInsight({
        agentType: AgentType.DEVOPS,
        scope: job.entityId,
        title: EVENT_LABELS[job.eventType] ?? 'DevOps event',
        summary,
      });
      return {
        status: AgentJobStatus.COMPLETED,
        gateSource: 'rule',
        result: gate.data ?? {},
      };
    }
    const baseSummary = buildDevopsSummary(job, gate);
    const ai = await this.maybeAi(
      AgentType.DEVOPS,
      'DevOps SRE. Given an incident payload, suggest root cause hypothesis in 3 bullets.',
      JSON.stringify(job.payload).slice(0, 2000),
      'L2',
      400,
    );
    await this.memory.saveInsight({
      agentType: AgentType.DEVOPS,
      scope: `incident:${job.entityId}`,
      title: 'Incident Analysis',
      summary: appendAiEnhancement(baseSummary, ai?.text, AgentType.DEVOPS),
    });
    return {
      status: AgentJobStatus.COMPLETED,
      gateSource: 'ai_required',
      result: { text: ai?.text ?? null },
      ...this.aiUsage(ai),
    };
  }

  private aiUsage(ai: AiRunResult | null) {
    if (!ai) {
      return {
        inputTokens: 0,
        outputTokens: 0,
        costUsd: 0,
        modelLevel: undefined,
      };
    }
    return {
      inputTokens: ai.inputTokens,
      outputTokens: ai.outputTokens,
      costUsd: ai.costUsd,
      modelLevel: ai.modelLevel,
    };
  }

  private async maybeAi(
    agentType: AgentType,
    system: string,
    user: string,
    tier: 'L1' | 'L2' | 'L3',
    estTokens: number,
  ): Promise<AiRunResult | null> {
    if (!process.env.OPENROUTER_API_KEY && !process.env.OPENAI_API_KEY) {
      return null;
    }
    const effectiveTier = resolveModelTier(tier);
    const tokenEstimate = isAgentsLowUsage()
      ? Math.min(estTokens, 80)
      : estTokens;
    const ok = await this.budget.ensureBudget(agentType, tokenEstimate);
    if (!ok) return null;
    try {
      const result = await this.models.completeWithEscalation(
        system,
        user,
        effectiveTier,
      );
      await this.budget.recordUsage(
        agentType,
        result.inputTokens + result.outputTokens,
        result.costUsd,
      );
      return {
        text: result.text,
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        costUsd: result.costUsd,
        modelLevel: result.modelLevel,
      };
    } catch (error) {
      this.logger.warn(`AI call failed for ${agentType}`, error);
      return null;
    }
  }

  private async checkRevenueAnomaly(snapshot: Record<string, unknown>) {
    const delta = snapshot.revenueDeltaPct as number | undefined;
    if (delta != null && Math.abs(delta) >= 5) {
      const day = new Date().toISOString().slice(0, 10);
      this.logger.log(`Revenue delta ${delta.toFixed(1)}% detected`);
      void this.agentEvents.emit({
        type: AGENT_EVENTS.REVENUE_DELTA_SIGNIFICANT,
        entityType: 'metrics',
        entityId: day,
        payload: {
          deltaPct: delta,
          mrr: snapshot.mrr,
        },
        idempotencyKey: `revenue-delta:${day}`,
      });
    }
  }

  private formatCeoFallback(metrics: Record<string, unknown>): string {
    return `MRR: ₹${Number(metrics.mrr ?? 0)} | Users: ${Number(metrics.totalUsers ?? 0)} | Activation: ${(metrics.activationRate as string | undefined) ?? '0%'}`;
  }

  private async finish(
    jobId: string,
    input: {
      status: AgentJobStatus;
      gateSource?: string;
      result?: unknown;
      latencyMs: number;
      inputTokens?: number;
      outputTokens?: number;
      costUsd?: number;
      modelLevel?: string;
    },
  ) {
    await this.prisma.agentJob.update({
      where: { id: jobId },
      data: {
        status: input.status,
        gateSource: input.gateSource,
        resultJson: input.result as object,
        latencyMs: input.latencyMs,
        inputTokens: input.inputTokens ?? 0,
        outputTokens: input.outputTokens ?? 0,
        costUsd: input.costUsd ?? 0,
        modelLevel: input.modelLevel,
        completedAt: new Date(),
      },
    });
    return input;
  }
}
