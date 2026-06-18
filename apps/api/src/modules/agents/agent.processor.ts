import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { AgentType } from '@prisma/client';
import { AgentExecutorService } from './agent-executor.service';
import { AgentRouterService } from './agent-router.service';
import { AgentJobPayload } from './agent.types';

@Processor('agent_workforce')
export class AgentWorkforceProcessor {
  private readonly logger = new Logger(AgentWorkforceProcessor.name);

  constructor(
    private readonly executor: AgentExecutorService,
    private readonly router: AgentRouterService,
  ) {}

  @Process('run_agent')
  async handle(job: Job<AgentJobPayload & { agentType: AgentType }>) {
    const { agentType, ...payload } = job.data;
    this.logger.debug(`Running ${agentType} for ${payload.eventType}`);
    try {
      await this.executor.run(agentType, payload);
    } catch (error) {
      await this.router.moveToDlq(job.data, String(error));
      throw error;
    }
  }
}

@Processor('agent_dlq')
export class AgentDlqProcessor {
  private readonly logger = new Logger(AgentDlqProcessor.name);

  @Process('failed_job')
  async handle(job: Job) {
    this.logger.error(
      `Agent DLQ entry: ${JSON.stringify(job.data).slice(0, 500)}`,
    );
  }
}
