'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { razorpayApi, readRazorpayApiError } from '@/lib/api/razorpay';
import { openRazorpayCheckout } from '@/lib/razorpay/load-checkout';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { toast } from 'sonner';

interface Props {
  amount: number;
  onSuccess?: (result: { paymentId: string; amount: number }) => void;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function RazorpayCheckoutButton({
  amount,
  onSuccess,
  disabled,
  className,
  children,
}: Props) {
  const [loading, setLoading] = React.useState(false);
  const user = useAuthStore((s) => s.user);

  const handlePay = async () => {
    if (!amount || amount < 1) {
      toast.error('Enter an amount of at least ₹1');
      return;
    }
    setLoading(true);
    try {
      const order = await razorpayApi.createOrder(Math.round(amount * 100));

      if (order.demo || order.keyId === 'DEMO_KEY') {
        const rupees = (Number(order.amount) / 100).toFixed(2);
        const confirmed = window.confirm(
          `Demo payment mode — simulate a ₹${rupees} wallet deposit? (No real charge)`,
        );
        if (!confirmed) {
          setLoading(false);
          return;
        }
        const result = await razorpayApi.completeDemoOrder(order.orderId);
        toast.success('Demo payment successful', {
          description: `₹${result.amount.toFixed(2)} added to your wallet.`,
        });
        onSuccess?.({
          paymentId: result.paymentId,
          amount: result.amount,
        });
        setLoading(false);
        return;
      }

      await openRazorpayCheckout({
        keyId: order.keyId,
        orderId: order.orderId,
        amount: Number(order.amount),
        currency: order.currency,
        description: 'Wallet deposit',
        prefill: {
          name: user?.fullName || user?.username || '',
          email: user?.email || '',
        },
        onSuccess: async (response) => {
          try {
            const result = await razorpayApi.verifyPayment(response);
            toast.success('Payment successful', {
              description: `₹${result.amount.toFixed(2)} added to your wallet.`,
            });
            onSuccess?.({
              paymentId: result.paymentId,
              amount: result.amount,
            });
          } catch (err: unknown) {
            const message =
              typeof err === 'object' &&
              err !== null &&
              'response' in err &&
              typeof (err as { response?: { data?: { error?: string } } }).response
                ?.data?.error === 'string'
                ? (err as { response: { data: { error: string } } }).response.data.error
                : 'Your payment could not be verified.';
            toast.error('Payment verification failed', { description: message });
          } finally {
            setLoading(false);
          }
        },
        onDismiss: () => {
          setLoading(false);
          toast('Payment cancelled');
        },
        onFailed: (description) => {
          setLoading(false);
          toast.error('Payment failed', { description });
        },
      });
    } catch (err: unknown) {
      setLoading(false);
      toast.error('Could not start payment', {
        description: readRazorpayApiError(err, 'Could not start payment.'),
      });
    }
  };

  return (
    <Button
      type="button"
      onClick={handlePay}
      disabled={disabled || loading}
      className={className}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Processing…
        </>
      ) : (
        (children ?? 'Pay with Razorpay')
      )}
    </Button>
  );
}
