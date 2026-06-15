import { apiClient, unwrapApiResponse } from './client';

export type DashboardRisk = {
  riskScore: number;
  limitPct: number;
  dailyLossUsed: number;
  dailyLossCap: number;
  drawdownPct: number;
  maxDrawdownPct: number;
  openPositions: number;
};

export type RiskScore = {
  score: number;
  label: 'LOW' | 'MEDIUM' | 'HIGH';
};

export const riskApi = {
  async getDashboard(): Promise<DashboardRisk> {
    const res = await apiClient.get('/risk/dashboard');
    return unwrapApiResponse<DashboardRisk>(res.data);
  },

  async getScore(): Promise<RiskScore> {
    const res = await apiClient.get('/risk/score');
    return unwrapApiResponse<RiskScore>(res.data);
  },

  async getPolicy() {
    const res = await apiClient.get('/risk/policy');
    return unwrapApiResponse<any>(res.data);
  },
};
