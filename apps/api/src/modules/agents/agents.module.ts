import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { AgentEventService } from './agent-event.service';
import { AgentRouterService } from './agent-router.service';
import { PreAiGateService } from './pre-ai-gate.service';
import { RuleEngineService } from './core/rule-engine.service';
import { ModelRouterService } from './core/model-router.service';
import { TokenBudgetService } from './core/token-budget.service';
import { AgentMemoryService } from './core/agent-memory.service';
import { AgentRollupsService } from './core/agent-rollups.service';
import { AgentExecutorService } from './agent-executor.service';
import { AgentWorkforceProcessor, AgentDlqProcessor } from './agent.processor';
import {
  AgentOutboxPoller,
  AgentSchedulerService,
} from './agent-scheduler.service';
import { AgentsController } from './agents.controller';
import { RedisModule } from '../auth/redis.module';
import { GrowthModule } from '../growth/growth.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    RedisModule,
    GrowthModule,
    EmailModule,
    BullModule.registerQueue(
      { name: 'agent_workforce' },
      { name: 'agent_dlq' },
    ),
  ],
  controllers: [AgentsController],
  providers: [
    AgentEventService,
    AgentRouterService,
    PreAiGateService,
    RuleEngineService,
    ModelRouterService,
    TokenBudgetService,
    AgentMemoryService,
    AgentRollupsService,
    AgentExecutorService,
    AgentWorkforceProcessor,
    AgentDlqProcessor,
    AgentOutboxPoller,
    AgentSchedulerService,
  ],
  exports: [AgentEventService],
})
export class AgentsModule {}
