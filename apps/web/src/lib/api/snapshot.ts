import { apiClient, unwrapApiResponse } from './client';

export type SnapshotSyncStatus = 'SUCCESS' | 'SYNCING' | 'FAILED' | string;

export interface AccountSnapshot {
  id: string;
  brokerAccountId: string;
  login?: string | null;
  broker?: string | null;
  server?: string | null;
  platform?: string | null;
  currency?: string | null;
  leverage?: number | null;
  connectionStatus: string;
  synchronizationStatus?: string | null;
  balance: number;
  equity: number;
  credit: number;
  margin: number;
  freeMargin: number;
  marginLevel?: number | null;
  floatingPnl: number;
  realizedProfit: number;
  unrealizedProfit: number;
  todayProfit: number;
  todayLoss: number;
  weeklyProfit: number;
  monthlyProfit: number;
  netProfit: number;
  positionsJson?: unknown;
  performanceJson?: unknown;
  riskJson?: unknown;
  positionsCount: number;
  syncStatus: SnapshotSyncStatus;
  syncDurationMs?: number | null;
  metaApiLatencyMs?: number | null;
  apiVersion?: string | null;
  lastSuccessfulSync?: string | null;
  capturedAt: string;
}

export interface LatestSnapshotResponse {
  available: boolean;
  source?: 'database' | 'snapshot';
  lastSyncedAt?: string | null;
  lastSuccessfulSync?: string | null;
  syncDuration?: number | null;
  syncStatus?: SnapshotSyncStatus | null;
  metaApiLatency?: number | null;
  apiVersion?: string | null;
  snapshot: AccountSnapshot | null;
}

export interface SnapshotPosition {
  id?: string;
  positionId?: string | null;
  ticket?: string | null;
  symbol: string;
  side?: string | null;
  type?: string | null;
  volume: number;
  openPrice?: number | null;
  currentPrice?: number | null;
  stopLoss?: number | null;
  takeProfit?: number | null;
  commission?: number;
  swap?: number;
  profit?: number;
  comment?: string | null;
  magicNumber?: string | null;
  openTime?: string | null;
  time?: string | null;
  durationSeconds?: number | null;
  currentPips?: number | null;
  risk?: number | null;
  reward?: number | null;
  status?: string | null;
}

export interface SnapshotHistoryPoint {
  id?: string;
  snapshotId?: string;
  balance?: number;
  equity?: number;
  totalReturn?: number;
  currentDrawdown?: number;
  maxDrawdown?: number;
  capturedAt: string;
}

const unwrap = <T>(payload: any): T => unwrapApiResponse<T>(payload);

const accountPath = (accountId: string, suffix: string) =>
  `/broker/accounts/${accountId}/snapshot/${suffix}`;

export const snapshotApi = {
  async getLatest(accountId: string) {
    const res = await apiClient.get(accountPath(accountId, 'latest'));
    return unwrap<LatestSnapshotResponse>(res.data);
  },

  async getSummary(accountId: string) {
    const res = await apiClient.get(accountPath(accountId, 'summary'));
    return unwrap<any>(res.data);
  },

  async getPositions(accountId: string) {
    const res = await apiClient.get(accountPath(accountId, 'positions'));
    return unwrap<{ positions: SnapshotPosition[]; capturedAt: string | null }>(
      res.data,
    );
  },

  async getPendingOrders(accountId: string) {
    const res = await apiClient.get(accountPath(accountId, 'pending-orders'));
    return unwrap<any>(res.data);
  },

  async getHistory(accountId: string, limit = 200) {
    const res = await apiClient.get(accountPath(accountId, 'history'), {
      params: { limit },
    });
    return unwrap<{ snapshots: AccountSnapshot[] }>(res.data);
  },

  async getDeals(accountId: string, limit = 200) {
    const res = await apiClient.get(accountPath(accountId, 'deals'), {
      params: { limit },
    });
    return unwrap<any>(res.data);
  },

  async getBalanceHistory(accountId: string, limit = 500) {
    const res = await apiClient.get(accountPath(accountId, 'balance-history'), {
      params: { limit },
    });
    return unwrap<{ points: SnapshotHistoryPoint[] }>(res.data);
  },

  async getEquityHistory(accountId: string, limit = 500) {
    const res = await apiClient.get(accountPath(accountId, 'equity-history'), {
      params: { limit },
    });
    return unwrap<{ points: SnapshotHistoryPoint[] }>(res.data);
  },

  async getDrawdownHistory(accountId: string, limit = 500) {
    const res = await apiClient.get(accountPath(accountId, 'drawdown-history'), {
      params: { limit },
    });
    return unwrap<{ points: SnapshotHistoryPoint[] }>(res.data);
  },

  async getReturnsHistory(accountId: string, limit = 500) {
    const res = await apiClient.get(accountPath(accountId, 'returns-history'), {
      params: { limit },
    });
    return unwrap<{ points: SnapshotHistoryPoint[] }>(res.data);
  },

  async getAnalytics(accountId: string) {
    const res = await apiClient.get(accountPath(accountId, 'analytics'));
    return unwrap<any>(res.data);
  },

  async getPerformance(accountId: string) {
    const res = await apiClient.get(accountPath(accountId, 'performance'));
    return unwrap<any>(res.data);
  },

  async getRisk(accountId: string) {
    const res = await apiClient.get(accountPath(accountId, 'risk'));
    return unwrap<any>(res.data);
  },

  async getSymbols(accountId: string) {
    const res = await apiClient.get(accountPath(accountId, 'symbols'));
    return unwrap<any>(res.data);
  },

  async getTimeline(accountId: string, limit = 200) {
    const res = await apiClient.get(accountPath(accountId, 'timeline'), {
      params: { limit },
    });
    return unwrap<any>(res.data);
  },
};
