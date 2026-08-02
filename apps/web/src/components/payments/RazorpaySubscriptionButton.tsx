'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { subscriptionsApi } from '@/lib/api/subscriptions';
import { razorpayApi, readRazorpayApiError } from '@/lib/api/razorpay';
import { openRazorpayCheckout } from '@/lib/razorpay/load-checkout';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { trackEvent, ACTIVATION_EVENTS } from '@/lib/analytics/track';
import { toast } from 'sonner';
import { formatMoney } from '@/lib/currency';

interface Props {
  planId: string;
  planName: string;
  billingCycle?: 'MONTHLY' | 'ANNUAL';
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
  onSuccess?: () => void;
  onFailed?: (message: string) => void;
  onDismiss?: () => void;
}

export function RazorpaySubscriptionButton({
  planId,
  planName,
  billingCycle = 'MONTHLY',
  disabled,
  className,
  children,
  onSuccess,
  onFailed,
  onDismiss,
}: Props) {
  const [loading, setLoading] = React.useState(false);
  const user = useAuthStore((s) => s.user);

  const handleCheckout = async () => {
    setLoading(true);
    trackEvent(ACTIVATION_EVENTS.CHECKOUT_STARTED, {
      planId,
      planName,
      billingCycle,
    });

    try {
      const order = await subscriptionsApi.checkout(planId, billingCycle);

      if (order.keyId === 'DEMO_KEY' || (order as { demo?: boolean }).demo) {
        const rupees = Number(order.amount) / 100;
        const confirmed = window.confirm(
          `Demo payment mode — activate ${planName} for ${formatMoney(rupees, 'INR')}? (No real charge)`,
        );
        if (!confirmed) {
          setLoading(false);
          onDismiss?.();
          return;
        }
        await razorpayApi.completeDemoOrder(order.orderId);
        toast.success('Subscription activated', {
          description: `Your ${planName} plan is now active (demo mode).`,
        });
        onSuccess?.();
        setLoading(false);
        return;
      }

      await openRazorpayCheckout({
        keyId: order.keyId,
        orderId: order.orderId,
        amount: Number(order.amount),
        currency: order.currency,
        description: `${planName} subscription`,
        prefill: {
          name: user?.fullName || user?.username || '',
          email: user?.email || '',
        },
        onSuccess: async (response) => {
          try {
            await razorpayApi.verifyPayment(response);
            toast.success('Subscription activated', {
              description: `Your ${planName} plan is now active.`,
            });
            onSuccess?.();
          } catch (err: unknown) {
            const message =
              typeof err === 'object' &&
              err !== null &&
              'response' in err &&
              typeof (err as { response?: { data?: { error?: string } } }).response
                ?.data?.error === 'string'
                ? (err as { response: { data: { error: string } } }).response.data.error
                : 'Payment could not be verified.';
            toast.error('Verification failed', { description: message });
            onFailed?.(message);
          } finally {
            setLoading(false);
          }
        },
        onDismiss: () => {
          setLoading(false);
          toast('Checkout cancelled');
          onDismiss?.();
        },
        onFailed: (description) => {
          setLoading(false);
          toast.error('Payment failed', { description });
          onFailed?.(description || 'Payment failed');
        },
      });
    } catch (err: unknown) {
      setLoading(false);
      const message = readRazorpayApiError(err, 'Could not start checkout.');
      toast.error('Checkout error', { description: message });
      onFailed?.(message);
    }
  };

  return (
    <Button
      type="button"
      onClick={handleCheckout}
      disabled={disabled || loading}
      className={className}
      aria-busy={loading}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden />
          <span>Processing…</span>
        </>
      ) : (
        (children ?? 'Subscribe with Razorpay')
      )}
    </Button>
  );
}
