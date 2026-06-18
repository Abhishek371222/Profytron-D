import { Injectable } from '@nestjs/common';
import { AgentType } from '@prisma/client';
import { AGENT_EVENTS, AgentJobPayload } from '../agent.types';

export interface RuleMatch {
  action: string;
  data?: Record<string, unknown>;
}

@Injectable()
export class RuleEngineService {
  match(agentType: AgentType, job: AgentJobPayload): RuleMatch | null {
    switch (agentType) {
      case AgentType.BILLING:
        return this.billingRules(job);
      case AgentType.SECURITY:
        return this.securityRules(job);
      case AgentType.CUSTOMER_SUCCESS:
        return this.csRules(job);
      case AgentType.DEVOPS:
        return this.devopsRules(job);
      default:
        return null;
    }
  }

  private billingRules(job: AgentJobPayload): RuleMatch | null {
    if (job.eventType === AGENT_EVENTS.PAYMENT_SUCCEEDED) {
      return {
        action: 'log_payment_success',
        data: { entityId: job.entityId },
      };
    }
    if (job.eventType === AGENT_EVENTS.PAYMENT_FAILED) {
      const code = (job.payload?.errorCode as string | undefined) ?? 'unknown';
      const template = code.includes('insufficient')
        ? 'wallet_low'
        : 'payment_retry_dunning';
      return {
        action: 'send_dunning',
        data: { template, userId: job.userId, retryInHours: 24 },
      };
    }
    if (job.eventType === AGENT_EVENTS.SUBSCRIPTION_UPGRADED) {
      return { action: 'log_upgrade', data: { userId: job.userId } };
    }
    if (job.eventType === AGENT_EVENTS.SUBSCRIPTION_CANCELLED) {
      return {
        action: 'winback_email_scheduled',
        data: { userId: job.userId, delayDays: 3 },
      };
    }
    return null;
  }

  private securityRules(job: AgentJobPayload): RuleMatch | null {
    if (job.eventType === AGENT_EVENTS.AUTH_LOGIN_FAILED_THRESHOLD) {
      return {
        action: 'security_alert',
        data: {
          userId: job.userId,
          ip: job.payload?.ip,
          recommendation: 'Monitor account; force password reset if continues',
        },
      };
    }
    if (job.eventType === AGENT_EVENTS.API_RATE_LIMIT_EXCEEDED) {
      return {
        action: 'rate_limit_log',
        data: { ip: job.payload?.ip, path: job.payload?.path },
      };
    }
    return null;
  }

  private csRules(job: AgentJobPayload): RuleMatch | null {
    if (job.eventType === AGENT_EVENTS.USER_REGISTERED) {
      return {
        action: 'schedule_onboarding_check',
        data: { userId: job.userId, checkInHours: 24 },
      };
    }
    if (job.eventType === AGENT_EVENTS.USER_INACTIVE_7D) {
      return {
        action: 'reengagement_email',
        data: { userId: job.userId, template: 'inactive_7d' },
      };
    }
    if (job.eventType === AGENT_EVENTS.USER_ONBOARDING_FAILED) {
      return {
        action: 'onboarding_nudge',
        data: { userId: job.userId, cta: '/onboarding/risk' },
      };
    }
    if (job.eventType === AGENT_EVENTS.SUBSCRIPTION_CANCELLED) {
      return {
        action: 'exit_survey',
        data: { userId: job.userId },
      };
    }
    return null;
  }

  private devopsRules(job: AgentJobPayload): RuleMatch | null {
    if (job.eventType === AGENT_EVENTS.DEPLOY_FAILED) {
      return {
        action: 'alert_oncall',
        data: { pipeline: job.payload?.pipeline, rollback: true },
      };
    }
    if (job.eventType === AGENT_EVENTS.SERVER_CPU_THRESHOLD) {
      return {
        action: 'scale_recommendation',
        data: { cpu: job.payload?.cpu, threshold: 80 },
      };
    }
    return null;
  }
}
