import { AgentType } from '@prisma/client';

export const AGENT_EVENTS = {
  USER_REGISTERED: 'user.registered',
  USER_ONBOARDING_FAILED: 'user.onboarding.failed',
  USER_INACTIVE_7D: 'user.inactive.7d',
  SUBSCRIPTION_CANCELLED: 'subscription.cancelled',
  PAYMENT_FAILED: 'payment.failed',
  PAYMENT_SUCCEEDED: 'payment.succeeded',
  SUBSCRIPTION_UPGRADED: 'subscription.upgraded',
  SUPPORT_TICKET_CREATED: 'support.ticket.created',
  SUPPORT_MESSAGE_RECEIVED: 'support.message.received',
  AUTH_LOGIN_FAILED_THRESHOLD: 'auth.login.failed.threshold',
  AUTH_LOGIN_SUSPICIOUS: 'auth.login.suspicious',
  API_RATE_LIMIT_EXCEEDED: 'api.rate_limit.exceeded',
  ERROR_RATE_SPIKE: 'error.rate.spike',
  SERVER_CPU_THRESHOLD: 'server.cpu.threshold',
  DEPLOY_FAILED: 'deploy.failed',
  REVENUE_DELTA_SIGNIFICANT: 'revenue.delta.significant',
  CEO_DAILY_TICK: 'CEO_DAILY_TICK',
  PRODUCT_DAILY_TICK: 'PRODUCT_DAILY_TICK',
  MARKETING_DAILY_TICK: 'MARKETING_DAILY_TICK',
  SEO_WEEKLY_TICK: 'SEO_WEEKLY_TICK',
  ANALYTICS_DAILY_TICK: 'ANALYTICS_DAILY_TICK',
} as const;

export type AgentEventType = (typeof AGENT_EVENTS)[keyof typeof AGENT_EVENTS];

export interface AgentJobPayload {
  outboxId?: string;
  eventType: string;
  entityType: string;
  entityId: string;
  userId?: string;
  payload: Record<string, unknown>;
  idempotencyKey: string;
}

export const EVENT_TO_AGENTS: Record<string, AgentType[]> = {
  [AGENT_EVENTS.USER_REGISTERED]: [AgentType.CUSTOMER_SUCCESS],
  [AGENT_EVENTS.USER_ONBOARDING_FAILED]: [AgentType.CUSTOMER_SUCCESS],
  [AGENT_EVENTS.USER_INACTIVE_7D]: [AgentType.CUSTOMER_SUCCESS],
  [AGENT_EVENTS.SUBSCRIPTION_CANCELLED]: [
    AgentType.CUSTOMER_SUCCESS,
    AgentType.BILLING,
  ],
  [AGENT_EVENTS.PAYMENT_FAILED]: [
    AgentType.BILLING,
    AgentType.CUSTOMER_SUCCESS,
  ],
  [AGENT_EVENTS.PAYMENT_SUCCEEDED]: [AgentType.BILLING],
  [AGENT_EVENTS.SUBSCRIPTION_UPGRADED]: [AgentType.BILLING],
  [AGENT_EVENTS.SUPPORT_TICKET_CREATED]: [AgentType.SUPPORT],
  [AGENT_EVENTS.SUPPORT_MESSAGE_RECEIVED]: [AgentType.SUPPORT],
  [AGENT_EVENTS.AUTH_LOGIN_FAILED_THRESHOLD]: [AgentType.SECURITY],
  [AGENT_EVENTS.AUTH_LOGIN_SUSPICIOUS]: [AgentType.SECURITY],
  [AGENT_EVENTS.API_RATE_LIMIT_EXCEEDED]: [AgentType.SECURITY],
  [AGENT_EVENTS.ERROR_RATE_SPIKE]: [AgentType.DEVOPS],
  [AGENT_EVENTS.SERVER_CPU_THRESHOLD]: [AgentType.DEVOPS],
  [AGENT_EVENTS.DEPLOY_FAILED]: [AgentType.DEVOPS],
  [AGENT_EVENTS.REVENUE_DELTA_SIGNIFICANT]: [AgentType.CEO],
  [AGENT_EVENTS.CEO_DAILY_TICK]: [AgentType.CEO],
  [AGENT_EVENTS.PRODUCT_DAILY_TICK]: [AgentType.PRODUCT],
  [AGENT_EVENTS.MARKETING_DAILY_TICK]: [AgentType.MARKETING],
  [AGENT_EVENTS.SEO_WEEKLY_TICK]: [AgentType.SEO],
  [AGENT_EVENTS.ANALYTICS_DAILY_TICK]: [AgentType.ANALYTICS],
};

export const MODEL_TIERS = {
  L1: {
    model: 'google/gemma-2-9b-it',
    maxTokens: 200,
    costPer1M: 0.1,
  },
  L2: {
    model: 'meta-llama/llama-3.3-70b-instruct',
    maxTokens: 500,
    costPer1M: 0.5,
  },
  L3: {
    model: 'anthropic/claude-sonnet-4',
    maxTokens: 800,
    costPer1M: 3.0,
  },
} as const;

export type ModelTier = keyof typeof MODEL_TIERS;

export function isAgentsLowUsage(): boolean {
  return process.env.AGENTS_LOW_USAGE !== 'false';
}

export function resolveModelTier(requested: ModelTier): ModelTier {
  return isAgentsLowUsage() ? 'L1' : requested;
}

export function tierMaxTokens(tier: ModelTier): number {
  const base = MODEL_TIERS[tier].maxTokens;
  return isAgentsLowUsage() ? Math.min(base, 80) : base;
}

export const AGENT_DESCRIPTIONS: Record<string, string> = {
  CEO: 'Daily KPI summary — MRR, users, activation',
  PRODUCT: 'Activation funnel analysis & recommendations',
  CUSTOMER_SUCCESS: 'Onboarding nudges & re-engagement emails',
  SUPPORT: 'Ticket replies via knowledge base + AI draft',
  MARKETING: 'Growth ideas from daily metrics',
  SEO: 'Weekly SEO action plan',
  SECURITY: 'Login anomalies & rate-limit monitoring',
  ANALYTICS: 'Daily metrics snapshot & revenue alerts',
  BILLING: 'Payment failures, dunning & upgrades',
  DEVOPS: 'Error spikes & incident analysis',
};

export const EVENT_LABELS: Record<string, string> = {
  [AGENT_EVENTS.USER_REGISTERED]: 'New user signup',
  [AGENT_EVENTS.USER_ONBOARDING_FAILED]: 'Incomplete onboarding (3+ days)',
  [AGENT_EVENTS.USER_INACTIVE_7D]: 'Inactive user (7 days)',
  [AGENT_EVENTS.SUBSCRIPTION_CANCELLED]: 'Subscription cancelled',
  [AGENT_EVENTS.PAYMENT_FAILED]: 'Payment failed',
  [AGENT_EVENTS.PAYMENT_SUCCEEDED]: 'Payment succeeded',
  [AGENT_EVENTS.SUBSCRIPTION_UPGRADED]: 'Plan upgraded',
  [AGENT_EVENTS.SUPPORT_TICKET_CREATED]: 'Support ticket opened',
  [AGENT_EVENTS.SUPPORT_MESSAGE_RECEIVED]: 'Support message received',
  [AGENT_EVENTS.AUTH_LOGIN_FAILED_THRESHOLD]: 'Failed login burst',
  [AGENT_EVENTS.AUTH_LOGIN_SUSPICIOUS]: 'Suspicious login',
  [AGENT_EVENTS.API_RATE_LIMIT_EXCEEDED]: 'API rate limit hit',
  [AGENT_EVENTS.ERROR_RATE_SPIKE]: 'Error rate spike',
  [AGENT_EVENTS.SERVER_CPU_THRESHOLD]: 'High CPU usage',
  [AGENT_EVENTS.DEPLOY_FAILED]: 'Deploy pipeline failed',
  [AGENT_EVENTS.REVENUE_DELTA_SIGNIFICANT]: 'Revenue change ≥5%',
  [AGENT_EVENTS.CEO_DAILY_TICK]: 'CEO daily review',
  [AGENT_EVENTS.PRODUCT_DAILY_TICK]: 'Product daily review',
  [AGENT_EVENTS.MARKETING_DAILY_TICK]: 'Marketing daily review',
  [AGENT_EVENTS.SEO_WEEKLY_TICK]: 'SEO weekly review',
  [AGENT_EVENTS.ANALYTICS_DAILY_TICK]: 'Analytics snapshot',
};

export interface GateResult {
  resolved: boolean;
  source: 'rule' | 'sql' | 'cache' | 'summary' | 'ai_required';
  data?: Record<string, unknown>;
  action?: string;
}

export interface AiCompletionResult {
  text: string;
  inputTokens: number;
  outputTokens: number;
  modelLevel: ModelTier;
  costUsd: number;
  latencyMs: number;
}
