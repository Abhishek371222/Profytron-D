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
      return 'Razorpay keys are invalid. Add test keys to apps/api/.env or keep RAZORPAY_KEY_ID=DEMO_KEY for local simulation.';
    }
  }
  if (err instanceof Error && err.message) {
    return err.message;
  }
  return fallback;
}

export interface RazorpayOrder {
  orderId: string;
  amount: number; // paise
  currency: string;
  keyId: string;
  demo?: boolean;
}

export interface RazorpayVerifyResult {
  success: boolean;
  orderId: string;
  paymentId: string;
  amount: number; // rupees
  currency: string;
}

export const razorpayApi = {
  /** Create a Razorpay order. `amount` is in paise (min 100). */
  async createOrder(amount: number, currency = 'INR') {
    const res = await apiClient.post('/payments/razorpay/order', {
      amount,
      currency,
    });
    return unwrapApiResponse<RazorpayOrder>(res.data);
  },

  /** Verify a completed payment's signature server-side. */
  async verifyPayment(payload: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) {
    const res = await apiClient.post('/payments/razorpay/verify', payload);
    return unwrapApiResponse<RazorpayVerifyResult>(res.data);
  },

  /** Dev-only: credit wallet for a DEMO_KEY order without Razorpay checkout. */
  async completeDemoOrder(orderId: string) {
    const res = await apiClient.post('/payments/razorpay/demo-complete', {
      orderId,
    });
    return unwrapApiResponse<RazorpayVerifyResult>(res.data);
  },
};

export { readApiError as readRazorpayApiError };
