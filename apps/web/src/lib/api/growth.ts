import { apiClient, unwrapApiResponse } from './client';

export type ActivationProgress = {
  checklist: {
    id: string;
    label: string;
    event: string;
    href: string;
    done: boolean;
  }[];
  progressPct: number;
  completed: number;
  total: number;
  isActivated: boolean;
};

export const growthApi = {
  async getActivation() {
    const res = await apiClient.get('/growth/activation');
    return unwrapApiResponse<ActivationProgress>(res.data);
  },

  async track(event: string, metadata?: Record<string, unknown>) {
    const res = await apiClient.post('/growth/track', { event, metadata });
    return unwrapApiResponse<{ tracked: boolean }>(res.data);
  },

  async getAdminMetrics() {
    const res = await apiClient.get('/growth/metrics');
    return unwrapApiResponse<any>(res.data);
  },
};
