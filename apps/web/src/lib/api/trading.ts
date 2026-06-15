import { apiClient } from './client';

const unwrap = <T>(payload: any): T => {
  if (payload && typeof payload === 'object' && 'data' in payload) return payload.data as T;
  return payload as T;
};

export interface EmergencyStopResponse {
  timestamp: string;
  status: 'SUCCESS' | 'NO_OPEN_TRADES';
  closedTrades: number;
}

export interface OpenTrade {
  id: string;
  symbol: string;
  direction: 'LONG' | 'SHORT';
  volume: number;
  openPrice: number;
  fillPrice: number | null;
  profit: number | null;
  unrealizedPnl?: number;
  status: string;
  openedAt: string;
  strategyId: string | null;
  brokerTicket: string | null;
  isPaper: boolean;
}

export interface TradeHistoryRow {
  id: string;
  symbol: string;
  direction: 'LONG' | 'SHORT';
  volume: number;
  openPrice: number;
  closePrice: number | null;
  profit: number | null;
  status: string;
  openedAt: string;
  closedAt: string | null;
  strategyId: string | null;
  isPaper: boolean;
}

export const tradingApi = {
  async emergencyStop() {
    const res = await apiClient.post('/trading/emergency-stop');
    return unwrap<EmergencyStopResponse>(res.data);
  },

  async getOpenTrades(): Promise<OpenTrade[]> {
    const res = await apiClient.get('/trading/trades/open');
    return unwrap<OpenTrade[]>(res.data);
  },

  async getTradeHistory(params?: { limit?: number; cursor?: string; symbol?: string }): Promise<{ rows: TradeHistoryRow[]; nextCursor: string | null }> {
    const res = await apiClient.get('/trading/trades/history', { params });
    return unwrap(res.data);
  },

  async getMySubscriptions() {
    const res = await apiClient.get('/trading/subscriptions');
    return unwrap<any[]>(res.data);
  },

  async updateSubscription(id: string, data: { lotMultiplier?: number; isPaused?: boolean }) {
    const res = await apiClient.patch(`/trading/subscriptions/${id}`, data);
    return unwrap<any>(res.data);
  },
};
