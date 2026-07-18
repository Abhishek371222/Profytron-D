import { apiClient, unwrapApiResponse } from './client';

function readApiError(err: unknown, fallback: string): string {
  if (typeof err === 'object' && err !== null && 'response' in err) {
    const response = (err as { response?: { status?: number; data?: { error?: string } } })
      .response;
    if (typeof response?.data?.error === 'string') {
      return response.data.error;
    }
    if (response?.status === 404) {
      return 'Payment API not found. Ensure the API is running on port 4000 and NEXT_PUBLIC_BACKEND_URL is set.';
    }
    if (response?.status === 403) {
      return 'Razorpay rejected these API keys (401). Regenerate Key ID + Secret in Razorpay Dashboard → API Keys (Test), update apps/api/.env, restart API.';
    }
  }
  if (err instanceof Error && err.message) {
    return err.message;
  }
  return fallback;
}

export interface RazorpayOrder {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  demo?: boolean;
}

export interface RazorpayVerifyResult {
  success: boolean;
  orderId: string;
  paymentId: string;
  amount: number;
  currency: string;
}

export const razorpayApi = {
  async createOrder(amount: number, currency = 'INR') {
    const res = await apiClient.post('/payments/razorpay/order', {
      amount,
      currency,
    });
    return unwrapApiResponse<RazorpayOrder>(res.data);
  },

  async verifyPayment(payload: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) {
    const res = await apiClient.post('/payments/razorpay/verify', payload);
    return unwrapApiResponse<RazorpayVerifyResult>(res.data);
  },

  async completeDemoOrder(orderId: string) {
    const res = await apiClient.post('/payments/razorpay/demo-complete', {
      orderId,
    });
    return unwrapApiResponse<RazorpayVerifyResult>(res.data);
  },
};

export { readApiError as readRazorpayApiError };
