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

  const depositMutation = useMutation({
    mutationFn: (value: number) => walletApi.initiateDeposit({ amount: value }),
    onSuccess: (data) => {
      setClientSecret(data.clientSecret);
      setStep('payment');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to initiate deposit');
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
      <DialogContent className="max-w-xl bg-[#0b0b0f] border border-white/10 text-white">
        <DialogHeader>
          <DialogTitle>Deposit Funds</DialogTitle>
          <DialogDescription>
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
              placeholder="Enter amount"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2"
            />
            <Button onClick={startDeposit} disabled={depositMutation.isPending} className="w-full">
              {depositMutation.isPending ? 'Creating payment...' : 'Continue to Payment'}
            </Button>
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
            <p className="text-emerald-400 font-semibold">Deposit recorded successfully.</p>
            <Button className="w-full" onClick={closeAndReset}>
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
