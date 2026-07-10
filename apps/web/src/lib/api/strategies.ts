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
  isPublished?: boolean;
  verificationStatus?: string;
  reviewStartedAt?: string | null;
  reviewEndsAt?: string | null;
  reviewNotes?: string | null;
  isSubscribed?: boolean;
  copiesCount: number;
  totalRevenue?: number;
  latestPerformance?: any;
  equityCurve?: any[];
  monthlyReturns?: Record<string, number>;
  configJson?: any;
}

export type StrategyDocumentKind = 'IMAGE' | 'PDF' | 'DATA';

export interface StrategyDocument {
  id: string;
  title: string;
  description: string | null;
  kind: StrategyDocumentKind;
  downloadUrl: string;
  mimeType: string;
  fileSizeBytes: number;
  sortOrder: number;
  isPublished: boolean;
  createdAt: string;
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

  async getCreatedStrategies() {
    const res = await apiClient.get<{ items: Strategy[]; total: number } | Strategy[]>(
      '/strategies/created',
    );
    const payload = unwrapApiResponse<{ items: Strategy[]; total: number } | Strategy[]>(res.data);
    if (Array.isArray(payload)) return payload;
    if (payload && typeof payload === 'object' && Array.isArray((payload as { items?: Strategy[] }).items)) {
      return (payload as { items: Strategy[] }).items;
    }
    return [] as Strategy[];
  },

  async getStrategy(id: string) {
    const res = await apiClient.get<Strategy>(`/strategies/${id}`);
    return unwrapApiResponse<Strategy>(res.data);
  },

  async createStrategy(data: any) {
    const res = await apiClient.post<Strategy>('/strategies', data);
    const created = unwrapApiResponse<Strategy>(res.data);
    // Guard against double-wrapped envelopes so callers always get an id
    if (created && typeof created === 'object' && 'id' in created) return created;
    if (
      created &&
      typeof created === 'object' &&
      'data' in created &&
      (created as { data?: Strategy }).data?.id
    ) {
      return (created as { data: Strategy }).data;
    }
    return created;
  },

  async updateStrategy(id: string, data: any) {
    const res = await apiClient.patch<Strategy>(`/strategies/${id}`, data);
    return unwrapApiResponse<Strategy>(res.data);
  },

  async deleteStrategy(id: string) {
    const res = await apiClient.delete(`/strategies/${id}`);
    return unwrapApiResponse<any>(res.data);
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

  /** Submit for 1-week Profytron review (pending approval). */
  async publishStrategy(id: string) {
    const res = await apiClient.post(`/strategies/${id}/publish`);
    return unwrapApiResponse<any>(res.data);
  },

  /** After approval, publish to public marketplace. */
  async publishLive(id: string) {
    const res = await apiClient.post(`/strategies/${id}/publish-live`);
    return unwrapApiResponse<any>(res.data);
  },

  async uploadDocument(
    strategyId: string,
    file: File,
    kind: StrategyDocumentKind,
    title?: string,
  ) {
    const form = new FormData();
    form.append('file', file);
    form.append('kind', kind);
    if (title) form.append('title', title);
    const res = await apiClient.post(`/strategies/${strategyId}/documents`, form, {
      // Let the browser set multipart boundary — do not force application/json
      headers: { 'Content-Type': 'multipart/form-data' },
      transformRequest: [
        (data, headers) => {
          if (typeof FormData !== 'undefined' && data instanceof FormData) {
            delete headers['Content-Type'];
          }
          return data;
        },
      ],
    });
    return unwrapApiResponse<StrategyDocument>(res.data);
  },

  async listDocuments(strategyId: string) {
    const res = await apiClient.get<StrategyDocument[]>(`/strategies/${strategyId}/documents`);
    return unwrapApiResponse<StrategyDocument[]>(res.data);
  },

  async deleteDocument(strategyId: string, documentId: string) {
    const res = await apiClient.delete(`/strategies/${strategyId}/documents/${documentId}`);
    return unwrapApiResponse<{ ok: boolean }>(res.data);
  },
};
