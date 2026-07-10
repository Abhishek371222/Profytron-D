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

export type BulkCloseScope = 'ALL' | 'BUYS' | 'SELLS' | 'PROFITABLE' | 'LOSING';

export interface ModifyTradePayload {
  stopLoss?: number;
  takeProfit?: number;
}

export interface ManualOrderPayload {
  symbol: string;
  side: 'BUY' | 'SELL';
  volume: number;
  stopLoss?: number;
  takeProfit?: number;
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

  /** Close fully (omit volume) or partially (volume in lots, < position size). */
  async closeTrade(id: string, volume?: number) {
    const res = await apiClient.post(`/trading/trades/${id}/close`, volume != null ? { volume } : {});
    return unwrap<any>(res.data);
  },

  async modifyTrade(id: string, payload: ModifyTradePayload) {
    const res = await apiClient.patch(`/trading/trades/${id}/modify`, payload);
    return unwrap<any>(res.data);
  },

  async breakEven(id: string, offsetPips?: number) {
    const res = await apiClient.post(
      `/trading/trades/${id}/break-even`,
      offsetPips != null ? { offsetPips } : {},
    );
    return unwrap<any>(res.data);
  },

  async setTrailingStop(id: string, distance: number) {
    const res = await apiClient.post(`/trading/trades/${id}/trailing-stop`, { distance });
    return unwrap<any>(res.data);
  },

  async bulkClose(scope: BulkCloseScope) {
    const res = await apiClient.post('/trading/trades/bulk-close', { scope });
    return unwrap<any>(res.data);
  },

  async placeManualOrder(payload: ManualOrderPayload) {
    const res = await apiClient.post('/trading/trades/order', payload);
    return unwrap<any>(res.data);
  },

  async getTradeHistory(params?: { limit?: number; cursor?: string; symbol?: string }): Promise<{ rows: TradeHistoryRow[]; nextCursor: string | null }> {
    const res = await apiClient.get('/trading/trades/history', { params });
    return unwrap(res.data);
  },

  /** Live lot calculator (equity-ratio safe for ~$100 accounts). */
  async calculateLotSize(payload: {
    masterVolume: number;
    masterEquity?: number;
    followerEquity?: number;
    multiplier?: number;
    mode?: 'FIXED' | 'MULTIPLIER' | 'EQUITY_RATIO' | 'BALANCE';
    fixedLot?: number;
    skipIfBelowMin?: boolean;
  }) {
    const res = await apiClient.post('/trading/lot-size', payload);
    return unwrap<{
      volume: number | null;
      rawVolume: number;
      skipped: boolean;
      reason: string | null;
      followerEquity: number | null;
      masterEquity: number | null;
      mode: string;
    }>(res.data);
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
