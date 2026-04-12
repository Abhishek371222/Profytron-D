import { apiClient } from './client';

const unwrap = <T>(payload: any): T => {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return payload.data as T;
  }
  return payload as T;
};

export interface AIChatResponse {
  reply: string;
  model?: string;
}

export interface CoachingReport {
  sampleSize: number;
  winRate: number;
  avgPnl: number;
  behaviorFlags: string[];
  suggestions: string[];
}

export const aiApi = {
  async explainTradeById(tradeId: string) {
    const res = await apiClient.post(`/ai/explain-trade/${tradeId}`);
    return unwrap<any>(res.data);
  },

  async explainTrade(payload: {
    asset: string;
    type: string;
    entry: number;
    reason: string;
  }) {
    const res = await apiClient.post('/ai/explain', payload);
    return unwrap<any>(res.data);
  },

  async chat(message: string, context?: string) {
    const res = await apiClient.post('/ai/chat', { message, context });
    return unwrap<AIChatResponse>(res.data);
  },

  async getCoachingReport() {
    const res = await apiClient.get('/ai/coaching-report');
    return unwrap<CoachingReport>(res.data);
  },

  async getMarketRegime(symbol: string) {
    const res = await apiClient.get(`/ai/market-regime/${symbol}`);
    return unwrap<any>(res.data);
  },
};
