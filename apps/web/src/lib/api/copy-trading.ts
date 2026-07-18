import { apiClient, unwrapApiResponse } from './client';

export type SizingMode = 'FIXED' | 'MULTIPLIER' | 'EQUITY_RATIO';

export interface SetSizingPayload {
  sizingMode: SizingMode;
  multiplier?: number;
  fixedLot?: number;
  maxDrawdownPct?: number;
  dailyLossLimitUsd?: number;
}

export interface MasterProfile {
  id: string;
  displayName: string;
  bio?: string | null;
  strategyDescription?: string | null;
  isPublic: boolean;
  isVerified: boolean;
  followersCount: number;
  roiPct: number;
  maxDrawdownPct: number;
  winRate: number;
  sharpeRatio: number;
}

export const copyTradingApi = {
  async getMySubscriptions() {
    const res = await apiClient.get('/trading/subscriptions');
    return unwrapApiResponse<any[]>(res.data);
  },

  async updateSubscription(id: string, data: { lotMultiplier?: number; isPaused?: boolean }) {
    const res = await apiClient.patch(`/trading/subscriptions/${id}`, data);
    return unwrapApiResponse<any>(res.data);
  },

  async getMasterStatus() {
    const res = await apiClient.get('/trading/master-status');
    return unwrapApiResponse<any>(res.data);
  },

  async listMasters(limit = 50): Promise<MasterProfile[]> {
    const res = await apiClient.get('/copy/masters', { params: { limit } });
    return unwrapApiResponse<MasterProfile[]>(res.data);
  },

  async getMaster(id: string): Promise<MasterProfile> {
    const res = await apiClient.get(`/copy/masters/${id}`);
    return unwrapApiResponse<MasterProfile>(res.data);
  },

  async getMyMaster(): Promise<MasterProfile | null> {
    const res = await apiClient.get('/copy/master/me');
    return unwrapApiResponse<MasterProfile | null>(res.data);
  },

  async upsertMyMaster(data: {
    displayName: string;
    bio?: string;
    strategyDescription?: string;
    isPublic?: boolean;
  }): Promise<MasterProfile> {
    const res = await apiClient.put('/copy/master/me', data);
    return unwrapApiResponse<MasterProfile>(res.data);
  },

  async getMyRelationships(): Promise<any[]> {
    const res = await apiClient.get('/copy/relationships');
    return unwrapApiResponse<any[]>(res.data);
  },

  async setSizing(subscriptionId: string, payload: SetSizingPayload) {
    const res = await apiClient.put(`/copy/subscriptions/${subscriptionId}/sizing`, payload);
    return unwrapApiResponse<any>(res.data);
  },
};
