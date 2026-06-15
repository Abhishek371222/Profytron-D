import { Injectable } from '@nestjs/common';
import { AgentType } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { ActivationService } from '../../growth/activation.service';
import { AGENT_EVENTS, AgentJobPayload, GateResult } from '../agent.types';

@Injectable()
export class AgentRollupsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activation: ActivationService,
  ) {}

  async tryResolve(
    agentType: AgentType,
    job: AgentJobPayload,
  ): Promise<GateResult | null> {
    if (job.eventType === AGENT_EVENTS.ANALYTICS_DAILY_TICK) {
      const snapshot = await this.computeDailySnapshot();
      return {
        resolved: true,
        source: 'sql',
        data: snapshot as unknown as Record<string, unknown>,
        action: 'snapshot_stored',
      };
    }
    if (
      agentType === AgentType.CEO &&
      (job.eventType === AGENT_EVENTS.CEO_DAILY_TICK ||
        job.eventType === AGENT_EVENTS.REVENUE_DELTA_SIGNIFICANT)
    ) {
      const metrics = await this.activation.getAdminMetrics();
      return {
        resolved: false,
        source: 'sql',
        data: metrics as unknown as Record<string, unknown>,
      };
    }
    if (
      agentType === AgentType.PRODUCT &&
      job.eventType === AGENT_EVENTS.PRODUCT_DAILY_TICK
    ) {
      const funnel = await this.prisma.userActivationEvent.groupBy({
        by: ['event'],
        _count: { event: true },
      });
      return {
        resolved: false,
        source: 'sql',
        data: { funnel } as unknown as Record<string, unknown>,
      };
    }
    return null;
  }

  async computeDailySnapshot() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const metrics = await this.activation.getAdminMetrics();
    const newUsers = await this.prisma.user.count({
      where: { createdAt: { gte: yesterday }, deletedAt: null },
    });
    const openTickets = await this.prisma.supportTicket.count({
      where: { status: { in: ['OPEN', 'IN_PROGRESS'] } },
    });

    const snapshot: Record<string, unknown> = {
      date: today,
      mrr: metrics.mrr ?? 0,
      arr: metrics.arr ?? 0,
      newUsers,
      churnedUsers: 0,
      activationRate: parseFloat(String(metrics.activationRate ?? '0')),
      depositsInr: metrics.deposits30d ?? 0,
      supportTickets: openTickets,
      errorRate: 0,
    };

    await this.prisma.dailyMetricsSnapshot.upsert({
      where: { date: today },
      create: {
        date: today,
        mrr: Number(snapshot.mrr),
        arr: Number(snapshot.arr),
        newUsers: Number(snapshot.newUsers),
        churnedUsers: 0,
        activationRate: Number(snapshot.activationRate),
        depositsInr: Number(snapshot.depositsInr),
        supportTickets: Number(snapshot.supportTickets),
        errorRate: 0,
      },
      update: {
        mrr: Number(snapshot.mrr),
        arr: Number(snapshot.arr),
        newUsers: Number(snapshot.newUsers),
        activationRate: Number(snapshot.activationRate),
        depositsInr: Number(snapshot.depositsInr),
        supportTickets: Number(snapshot.supportTickets),
        computedAt: new Date(),
      },
    });

    const prev = await this.prisma.dailyMetricsSnapshot.findUnique({
      where: { date: yesterday },
    });
    if (prev && prev.mrr > 0) {
      const delta = ((Number(snapshot.mrr) - prev.mrr) / prev.mrr) * 100;
      if (Math.abs(delta) >= 5) {
        snapshot['revenueDeltaPct'] = delta;
      }
    }

    return snapshot;
  }

  async searchKnowledge(query: string, limit = 3) {
    const q = query.trim().slice(0, 200);
    if (!q) return [];
    return this.prisma.supportKnowledgeChunk.findMany({
      where: {
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { content: { contains: q, mode: 'insensitive' } },
          { tags: { hasSome: q.toLowerCase().split(/\s+/).slice(0, 5) } },
        ],
      },
      take: limit,
    });
  }
}
