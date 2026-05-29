import { apiClient, unwrapApiResponse } from './client';

export interface Strategy {
  id: string;
  name: string;
  category: string;
  riskLevel: string;
  description: string;
  creatorId: string;
  creator: {
    fullName: string;
    avatarUrl?: string;
    bio?: string;
  };
  monthlyPrice: number;
  isVerified: boolean;
  isSubscribed?: boolean;
  copiesCount: number;
  totalRevenue?: number;
  latestPerformance?: any;
  equityCurve?: any[];
  monthlyReturns?: Record<string, number>;
  configJson?: any;
}

export const strategiesApi = {
  async getStrategies(params?: any) {
    const res = await apiClient.get<{ strategies: Strategy[]; total: number }>('/strategies', { params });
    return unwrapApiResponse<{ strategies: Strategy[]; total: number }>(res.data);
  },

  async getMyStrategies() {
    const res = await apiClient.get<Strategy[]>('/strategies/my');
    return unwrapApiResponse<Strategy[]>(res.data);
  },

  async getStrategy(id: string) {
    const res = await apiClient.get<Strategy>(`/strategies/${id}`);
    return unwrapApiResponse<Strategy>(res.data);
  },

  async createStrategy(data: any) {
    const res = await apiClient.post<Strategy>('/strategies', data);
    return unwrapApiResponse<Strategy>(res.data);
  },

  async updateStrategy(id: string, data: any) {
    const res = await apiClient.patch<Strategy>(`/strategies/${id}`, data);
    return unwrapApiResponse<Strategy>(res.data);
  },

  async activateStrategy(id: string, data: any) {
    const res = await apiClient.post(`/strategies/${id}/activate`, data);
    return unwrapApiResponse<any>(res.data);
  },

  async deactivateStrategy(id: string) {
    const res = await apiClient.post(`/strategies/${id}/deactivate`);
    return unwrapApiResponse<any>(res.data);
  },

  async runBacktest(id: string, data: any) {
    const res = await apiClient.post(`/strategies/${id}/backtest`, data);
    return unwrapApiResponse<any>(res.data);
  },

  async runBacktestPreview(data: any) {
    const res = await apiClient.post('/strategies/backtest/preview', data);
    return unwrapApiResponse<any>(res.data);
  },

  async publishStrategy(id: string) {
    const res = await apiClient.post(`/strategies/${id}/publish`);
    return unwrapApiResponse<any>(res.data);
  },
};
