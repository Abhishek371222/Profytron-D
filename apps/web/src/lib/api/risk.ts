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

export type RiskPolicy = {
  maxDailyLossUsd?: number | null;
  maxDailyLossPct?: number | null;
  maxDrawdownPct?: number | null;
  autoStopAfterLoss?: boolean;
  autoStopAfterWin?: boolean;
  riskPerTradePct?: number | null;
  maxOpenTrades?: number | null;
  minWinRate?: number | null;
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

  async getPolicy(): Promise<RiskPolicy | null> {
    const res = await apiClient.get('/risk/policy');
    return unwrapApiResponse<RiskPolicy | null>(res.data);
  },

  async updatePolicy(policy: RiskPolicy): Promise<RiskPolicy> {
    const res = await apiClient.put('/risk/policy', policy);
    return unwrapApiResponse<RiskPolicy>(res.data);
  },
};
