import { apiClient } from './client';

export type PlanType = 'MONTHLY' | 'ANNUAL' | 'LIFETIME';

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
  planType: PlanType;
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

  async subscribe(id: string, data: SubscribeRequest) {
    const res = await apiClient.post(`/marketplace/${id}/subscribe`, data);
    return res.data.data;
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
