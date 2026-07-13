import { apiClient } from './client';

export type PlanType = 'MONTHLY' | 'ANNUAL' | 'LIFETIME';
export type SubscriptionBillingModel = 'FIXED' | 'PROFIT_SHARE';

export interface MarketplaceQueryParams {
  q?: string;
  cursor?: string;
  limit?: number;
  sort?: 'trending' | 'top-rated' | 'newest' | 'price' | 'performance' | 'subscribers';
  category?: string;
  riskLevel?: string;
  verified?: boolean;
  priceMin?: number;
  priceMax?: number;
  assetClass?: string;
  timeframe?: string;
}

export interface SubscribeRequest {
  planType?: PlanType;
  billingModel?: SubscriptionBillingModel;
  useTrial?: boolean;
}

export interface ReviewRequest {
  rating: number;
  reviewText: string;
}

export const marketplaceApi = {
  async getMarketplace(params?: MarketplaceQueryParams) {
    const res = await apiClient.get('/marketplace', { params });
    return res.data.data;
  },

  async getFeatured() {
    const res = await apiClient.get('/marketplace/featured');
    return res.data.data;
  },

  async getStrategy(id: string, params?: { reviewsPage?: number; reviewsLimit?: number }) {
    const res = await apiClient.get(`/marketplace/${id}`, { params });
    return res.data.data;
  },

  async getStrategyAnalytics(
    id: string,
    params?: { tradesPage?: number; tradesLimit?: number },
  ) {
    const res = await apiClient.get(`/marketplace/${id}/analytics`, { params });
    return res.data.data;
  },

  async subscribe(id: string, data: SubscribeRequest) {
    const res = await apiClient.post(`/marketplace/${id}/subscribe`, data);
    return res.data.data;
  },

  /**
   * Professional wiring: enable MetaApi SUBSCRIBER + link CopyFactory strategy.
   * Call after subscribe / payment / broker connect (idempotent).
   */
  async ensureCopyLink(payload?: { subscriptionId?: string; strategyId?: string }) {
    const res = await apiClient.post('/copy/link', payload ?? {});
    return res.data.data ?? res.data;
  },

  async getReviews(id: string, params?: { reviewsPage?: number; reviewsLimit?: number }) {
    const res = await apiClient.get(`/marketplace/${id}/reviews`, { params });
    return res.data.data;
  },

  async createReview(id: string, data: ReviewRequest) {
    const res = await apiClient.post(`/marketplace/${id}/reviews`, data);
    return res.data.data;
  },

  async replyToReview(reviewId: string, replyText: string) {
    const res = await apiClient.patch(`/marketplace/reviews/${reviewId}/reply`, {
      replyText,
    });
    return res.data.data;
  },
};
