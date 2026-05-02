import { apiClient } from './client';

export interface VpsAccount {
  id: string;
  userId: string;
  provider: string;
  instanceId: string;
  hostname: string;
  status: 'RUNNING' | 'STOPPED' | 'PROVISIONING' | 'ERROR';
  cpuCores: number;
  memoryGb: number;
  monthlyPrice: number;
  createdAt: string;
}

export interface BotInstance {
  id: string;
  vpsId: string;
  strategyId: string;
  name: string;
  status: 'RUNNING' | 'STOPPED' | 'ERROR';
  processPid: number | null;
  startedAt: string | null;
  stoppedAt: string | null;
}

export interface CreateVpsPayload {
  provider: string;
  cpuCores?: number;
  memoryGb?: number;
}

export const vpsApi = {
  list: () => apiClient.get<VpsAccount[] | { data: VpsAccount[] }>('/vps').then((r) => {
    const data = r.data;
    return Array.isArray(data) ? data : (data as any)?.data ?? [];
  }),

  create: (payload: CreateVpsPayload) =>
    apiClient.post<VpsAccount>('/vps', payload).then((r) => r.data),

  start: (id: string) => apiClient.post<VpsAccount>(`/vps/${id}/start`).then((r) => r.data),

  stop: (id: string) => apiClient.post<VpsAccount>(`/vps/${id}/stop`).then((r) => r.data),

  remove: (id: string) => apiClient.delete(`/vps/${id}`).then((r) => r.data),

  getBots: (vpsId: string) =>
    apiClient.get<BotInstance[] | { data: BotInstance[] }>(`/vps/${vpsId}/bots`).then((r) => {
      const data = r.data;
      return Array.isArray(data) ? data : (data as any)?.data ?? [];
    }),

  deployBot: (vpsId: string, payload: { strategyId: string; name: string }) =>
    apiClient.post<BotInstance>(`/vps/${vpsId}/bots`, payload).then((r) => r.data),

  startBot: (botId: string) =>
    apiClient.post<BotInstance>(`/vps/bots/${botId}/start`).then((r) => r.data),

  stopBot: (botId: string) =>
    apiClient.post<BotInstance>(`/vps/bots/${botId}/stop`).then((r) => r.data),
};
