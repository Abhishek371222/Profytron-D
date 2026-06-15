import { Injectable, Logger } from '@nestjs/common';
import { AgentType } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { RedisService } from '../../auth/redis.service';

@Injectable()
export class TokenBudgetService {
  private readonly logger = new Logger(TokenBudgetService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async ensureBudget(agentType: AgentType, estimatedTokens: number): Promise<boolean> {
    await this.resetIfNeeded(agentType);
    const budget = await this.prisma.agentBudget.findUnique({
      where: { agentType },
    });
    if (!budget?.enabled) return false;
    if (budget.tokensUsedToday + estimatedTokens > budget.dailyTokenCap) {
      this.logger.warn(`${agentType} daily token cap reached`);
      return false;
    }
    if (budget.costUsedTodayUsd >= budget.dailyCostCapUsd) {
      await this.prisma.agentBudget.update({
        where: { agentType },
        data: { enabled: false },
      });
      this.logger.warn(`${agentType} disabled — cost cap hit`);
      return false;
    }
    return true;
  }

  async recordUsage(
    agentType: AgentType,
    tokens: number,
    costUsd: number,
  ): Promise<void> {
    await this.resetIfNeeded(agentType);
    await this.prisma.agentBudget.update({
      where: { agentType },
      data: {
        tokensUsedToday: { increment: tokens },
        costUsedTodayUsd: { increment: costUsd },
      },
    });
    const day = new Date().toISOString().slice(0, 10);
    await this.redis.set(
      `agent:budget:${agentType}:${day}`,
      String(tokens),
      90000,
    );
  }

  private async resetIfNeeded(agentType: AgentType) {
    const budget = await this.prisma.agentBudget.findUnique({
      where: { agentType },
    });
    if (!budget) {
      await this.prisma.agentBudget.create({
        data: { agentType },
      });
      return;
    }
    const now = new Date();
    if (now.getTime() - budget.resetAt.getTime() > 86400_000) {
      await this.prisma.agentBudget.update({
        where: { agentType },
        data: {
          tokensUsedToday: 0,
          costUsedTodayUsd: 0,
          resetAt: now,
          enabled: true,
        },
      });
    }
  }
}
