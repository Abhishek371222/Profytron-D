import { apiClient, unwrapApiResponse } from './client';

export type PlatformPlan = {
  slug: string;
  name: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  tier: string;
  features: string[];
  maxStrategies: number;
  maxCopyTrades: number;
  maxBrokerAccounts: number;
  maxTeamMembers: number;
  prioritySupport: boolean;
  recommended: boolean;
  cta: string;
  ctaHref: string;
};

export const plansApi = {
  async getPlans() {
    const res = await apiClient.get('/plans');
    return unwrapApiResponse<PlatformPlan[]>(res.data);
  },
};
