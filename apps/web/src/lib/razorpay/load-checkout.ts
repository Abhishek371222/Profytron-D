const CHECKOUT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, handler: (response: unknown) => void) => void;
    };
  }
}

let scriptPromise: Promise<boolean> | null = null;

export function loadRazorpayScript(): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<boolean>((resolve) => {
    const existing = document.querySelector(
      `script[src="${CHECKOUT_SRC}"]`,
    ) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => resolve(true));
      existing.addEventListener('error', () => resolve(false));
      if (window.Razorpay) resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = CHECKOUT_SRC;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      scriptPromise = null;
      resolve(false);
    };
    document.body.appendChild(script);
  });
  return scriptPromise;
}

export type RazorpaySuccessPayload = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

export async function openRazorpayCheckout(options: {
  keyId: string;
  orderId: string;
  amount: number;
  currency: string;
  name?: string;
  description?: string;
  prefill?: { name?: string; email?: string };
  onSuccess: (response: RazorpaySuccessPayload) => void | Promise<void>;
  onDismiss?: () => void;
  onFailed?: (description?: string) => void;
}) {
  const ready = await loadRazorpayScript();
  if (!ready || !window.Razorpay) {
    throw new Error('Could not load Razorpay. Check your connection.');
  }

  const rzp = new window.Razorpay({
    key: options.keyId,
    order_id: options.orderId,
    amount: options.amount,
    currency: options.currency,
    name: options.name ?? 'Profytron',
    description: options.description ?? 'Payment',
    prefill: options.prefill ?? {},
    theme: { color: '#6366f1' },
    handler: (response: RazorpaySuccessPayload) => {
      void options.onSuccess(response);
    },
    modal: {
      ondismiss: () => options.onDismiss?.(),
    },
  });

  rzp.on('payment.failed', (response: unknown) => {
    const failed = response as { error?: { description?: string } };
    options.onFailed?.(failed?.error?.description);
  });

  rzp.open();
}
