import { apiClient, unwrapApiResponse } from './client';

export type AgentDashboard = {
  summary: {
    invocations24h: number;
    costUsd24h: number;
    gateSkipRate: string;
    dlqDepth24h: number;
  };
  agents: {
    agentType: string;
    description?: string;
    invocations: number;
    tokens: number;
    costUsd: number;
    skipRate: string;
    enabled: boolean;
    tokensUsedToday: number;
    tokenCap: number;
  }[];
  recentInsights: {
    id: string;
    agentType: string;
    title: string;
    summary: string;
    createdAt: string;
  }[];
  agentSummaries: {
    agentType: string;
    description: string;
    title: string | null;
    summary: string | null;
    updatedAt: string | null;
  }[];
};

export type AgentActivityJob = {
  id: string;
  agentType: string;
  eventType: string;
  eventLabel: string;
  entityId: string | null;
  status: string;
  gateSource: string | null;
  tokens: number;
  costUsd: number;
  latencyMs: number | null;
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
};

export type AgentActivity = {
  pendingOutbox: number;
  processing: number;
  agentsEnabled: boolean;
  descriptions: Record<string, string>;
  recentJobs: AgentActivityJob[];
};

export const agentsApi = {
  async getDashboard() {
    const res = await apiClient.get('/agents/dashboard');
    return unwrapApiResponse<AgentDashboard>(res.data);
  },

  async getActivity() {
    const res = await apiClient.get('/agents/activity');
    return unwrapApiResponse<AgentActivity>(res.data);
  },

  async getInsights(agentType?: string) {
    const res = await apiClient.get('/agents/insights', {
      params: agentType ? { agentType } : undefined,
    });
    return unwrapApiResponse<any[]>(res.data);
  },

  async enableAgent(agentType: string) {
    const res = await apiClient.post(`/agents/budgets/${agentType}/enable`);
    return unwrapApiResponse(res.data);
  },

  async disableAgent(agentType: string) {
    const res = await apiClient.post(`/agents/budgets/${agentType}/disable`);
    return unwrapApiResponse(res.data);
  },

  async runAllLow(force = true) {
    const res = await apiClient.post('/agents/run-all-low', {}, {
      params: force ? { force: 'true' } : undefined,
    });
    return unwrapApiResponse<{
      ok: boolean;
      batchId?: string;
      queued: string[];
      skipped?: string[];
      mode: string;
      message?: string;
    }>(res.data);
  },

  async runSingle(agentType: string) {
    const res = await apiClient.post(`/agents/run/${agentType}`, {});
    return unwrapApiResponse<{
      ok: boolean;
      agentType: string;
      batchId?: string;
      message?: string;
    }>(res.data);
  },
};
