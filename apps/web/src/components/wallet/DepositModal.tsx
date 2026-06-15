'use client';

import React from 'react';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { walletApi } from '@/lib/api/wallet';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RazorpayCheckoutButton } from '@/components/payments/RazorpayCheckoutButton';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
);

function DepositCheckout({
  clientSecret,
  onClose,
}: {
  clientSecret: string;
  onClose: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const confirmPayment = async () => {
    if (!stripe || !elements) {
      return;
    }

    setIsSubmitting(true);
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/wallet?deposit=success`,
      },
      redirect: 'if_required',
    });

    if (error) {
      toast.error(error.message || 'Payment confirmation failed');
      setIsSubmitting(false);
      return;
    }

    await queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
    await queryClient.invalidateQueries({ queryKey: ['wallet-transactions'] });
    toast.success('Deposit successful');
    onClose();
  };

  return (
    <div className="space-y-4">
      <PaymentElement />
      <Button onClick={confirmPayment} disabled={!stripe || isSubmitting} className="w-full">
        {isSubmitting ? 'Processing...' : 'Confirm Deposit'}
      </Button>
    </div>
  );
}

export function DepositModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [amount, setAmount] = React.useState('');
  const [step, setStep] = React.useState<'amount' | 'payment' | 'success'>('amount');
  const [clientSecret, setClientSecret] = React.useState<string | null>(null);
  const queryClient = useQueryClient();

  const depositMutation = useMutation({
    mutationFn: (value: number) => walletApi.initiateDeposit({ amount: value }),
    onSuccess: (data) => {
      setClientSecret(data.clientSecret);
      setStep('payment');
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.error || error?.response?.data?.message || error?.message || 'Failed to initiate deposit';
      toast.error('Deposit failed', { description: msg });
    },
  });

  const startDeposit = () => {
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    depositMutation.mutate(numericAmount);
  };

  const closeAndReset = () => {
    setAmount('');
    setClientSecret(null);
    setStep('amount');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : closeAndReset())}>
      <DialogContent className="max-w-xl bg-card border border-[var(--card-border)] text-foreground shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Deposit Funds</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Step {step === 'amount' ? '1' : step === 'payment' ? '2' : '3'} of 3
          </DialogDescription>
        </DialogHeader>

        {step === 'amount' && (
          <div className="space-y-4">
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              type="number"
              min="1"
              step="0.01"
              placeholder="Enter amount (₹)"
              className="w-full rounded-xl border border-[var(--card-border)] bg-card px-3 py-2.5 text-sm outline-none focus:border-primary/40"
            />
            <Button onClick={startDeposit} disabled={depositMutation.isPending} className="w-full rounded-xl">
              {depositMutation.isPending ? 'Creating payment...' : 'Continue with Card (Stripe)'}
            </Button>

            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-foreground/10" />
              <span className="text-xs uppercase tracking-widest text-foreground/30">or</span>
              <div className="h-px flex-1 bg-foreground/10" />
            </div>

            <RazorpayCheckoutButton
              amount={Number(amount)}
              disabled={!Number.isFinite(Number(amount)) || Number(amount) <= 0}
              className="w-full"
              onSuccess={async () => {
                await queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
                await queryClient.invalidateQueries({ queryKey: ['wallet-transactions'] });
                setStep('success');
              }}
            >
              Pay with Razorpay (UPI / Card)
            </RazorpayCheckoutButton>
          </div>
        )}

        {step === 'payment' && clientSecret && (
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <DepositCheckout
              clientSecret={clientSecret}
              onClose={() => {
                setStep('success');
              }}
            />
          </Elements>
        )}

        {step === 'success' && (
          <div className="space-y-4 text-center">
            <p className="text-chart-3 font-semibold">Deposit recorded successfully.</p>
            <Button className="w-full rounded-xl" onClick={closeAndReset}>
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
