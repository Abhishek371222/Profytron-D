import { apiClient } from './client';

const unwrap = <T>(payload: any): T => {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return payload.data as T;
  }
  return payload as T;
};

export interface EmergencyStopResponse {
  timestamp: string;
  status: 'SUCCESS' | 'NO_OPEN_TRADES';
  closedTrades: number;
}

export const tradingApi = {
  async emergencyStop() {
    const res = await apiClient.post('/trading/emergency-stop');
    return unwrap<EmergencyStopResponse>(res.data);
  },
};
