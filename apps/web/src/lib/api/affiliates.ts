import { apiClient } from './client';

export type AffiliateTier = 'STARTER' | 'PRO' | 'ELITE';

export type AffiliateFunnelPulse = {
  clicks: number;
  signups: number;
  conversions: number;
  totalEarned: number;
  totalPaid: number;
  pendingPayout: number;
  signupRate: number;
  conversionRate: number;
  payoutRate: number;
};

export type AffiliateDashboardResponse = {
  referralCode: string;
  tier: AffiliateTier;
  commissionRate: number;
  stats: {
    clicks: number;
    signups: number;
    conversions: number;
    conversionRate: number;
    totalEarned: number;
    totalPaid: number;
    pendingPayout: number;
    funnelPulse?: AffiliateFunnelPulse;
  };
};

export type AffiliateRecordResponse = {
  id: string;
  userId: string;
  referralCode?: string | null;
  tier: AffiliateTier;
  commissionRate: number;
  clickCount: number;
  signupCount: number;
  conversionCount: number;
  totalEarned: number;
  totalPaid: number;
};

export type AffiliateReferralItem = {
  userId: string;
  fullName: string;
  emailMasked: string;
  joinedAt: string;
  plan: string;
  converted: boolean;
};

export type AffiliateReferralsResponse = {
  total: number;
  referrals: AffiliateReferralItem[];
};

export type AffiliateActivityPoint = {
  label: string;
  clicks: number;
  signups: number;
  conversions: number;
};

export type AffiliateActivityResponse = {
  range: string;
  points: AffiliateActivityPoint[];
};

const unwrap = <T>(payload: any): T => {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return payload.data as T;
  }
  return payload as T;
};

export const affiliatesApi = {
  async getMine() {
    const res = await apiClient.get('/affiliates/me');
    return unwrap<AffiliateRecordResponse>(res.data);
  },

  async getDashboard() {
    const res = await apiClient.get('/affiliates/dashboard');
    return unwrap<AffiliateDashboardResponse>(res.data);
  },

  async getReferrals() {
    const res = await apiClient.get('/affiliates/referrals');
    return unwrap<AffiliateReferralsResponse>(res.data);
  },

  async getActivity(range: string) {
    const res = await apiClient.get('/affiliates/activity', { params: { range } });
    return unwrap<AffiliateActivityResponse>(res.data);
  },

  async trackClick(code: string) {
    const res = await apiClient.post(`/affiliates/click/${code}`);
    return unwrap<any>(res.data);
  },

  async capture(code: string) {
    const res = await apiClient.post(`/affiliates/capture/${code}`);
    return unwrap<any>(res.data);
  },
};
