'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { walletApi } from '@/lib/api/wallet';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { refreshAfterPayment } from '@/lib/payments/refresh';

export function WithdrawSheet({
  open,
  onOpenChange,
  availableBalance,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableBalance: number;
}) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [step, setStep] = React.useState<1 | 2 | 3>(1);
  const [amount, setAmount] = React.useState('');
  const [otp, setOtp] = React.useState('');
  const [bankAccount, setBankAccount] = React.useState('');
  const [isSendingOtp, setIsSendingOtp] = React.useState(false);

  const withdrawMutation = useMutation({
    mutationFn: (payload: { amount: number; bankAccount: string; otp: string }) =>
      walletApi.initiateWithdrawal(payload),
    onSuccess: async () => {
      await refreshAfterPayment(queryClient);
      setStep(3);
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.error || error?.response?.data?.message || 'Withdrawal failed';
      if (typeof message === 'string' && message.toLowerCase().includes('kyc')) {
        onOpenChange(false);
        toast.error('Identity verification required', {
          description: 'Verify your identity before withdrawing funds.',
          action: {
            label: 'Verify now',
            onClick: () => router.push('/settings/kyc'),
          },
        });
        return;
      }
      toast.error(message);
    },
  });

  const numericAmount = Number(amount || 0);
  const isAmountValid = Number.isFinite(numericAmount) && numericAmount >= 500;
  const isWithinBalance = numericAmount <= availableBalance;
  const withdrawalPreview = useQuery({
    queryKey: ['withdrawal-impact', numericAmount],
    queryFn: () => walletApi.previewWithdrawal({ amount: numericAmount }),
    enabled: isAmountValid && isWithinBalance,
    staleTime: 10_000,
  });
  const affectedBots = withdrawalPreview.data?.affectedSubscriptions ?? [];

  const handleSendOtp = async () => {
    setIsSendingOtp(true);
    try {
      await walletApi.requestWithdrawalOtp();
      toast.success('OTP sent to your registered email');
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Failed to send OTP');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const submitWithdrawal = () => {
    if (!/^\d{6}$/.test(otp)) {
      toast.error('Enter a valid 6-digit OTP');
      return;
    }
    if (!bankAccount.trim()) {
      toast.error('Enter your bank account details');
      return;
    }

    withdrawMutation.mutate({
      amount: numericAmount,
      bankAccount,
      otp,
    });
  };

  const reset = () => {
    setStep(1);
    setAmount('');
    setOtp('');
    setBankAccount('');
    setIsSendingOtp(false);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={(next) => (next ? onOpenChange(true) : reset())}>
      <SheetContent side="right" className="w-[calc(100vw-2rem)] max-w-[420px] bg-card border-l border-[var(--card-border)] text-foreground">
        <SheetHeader>
          <SheetTitle className="text-xl font-bold">Withdraw Funds</SheetTitle>
          <SheetDescription className="text-muted-foreground">Step {step} of 3</SheetDescription>
        </SheetHeader>

        {step === 1 && (
          <div className="mt-6 space-y-4">
            <div className="space-y-2">
              <label htmlFor="withdraw-amount" className="text-sm font-medium text-foreground">Amount (min 500)</label>
              <input
                id="withdraw-amount"
                type="number"
                min="500"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-xl border border-[var(--card-border)] bg-card px-3 py-2.5 text-sm outline-none focus:border-primary/40"
              />
              <p className="text-xs text-muted-foreground">Available: ₹{availableBalance.toFixed(2)}</p>
              {!isWithinBalance && amount ? (
                <p className="text-xs text-destructive">Amount exceeds available balance</p>
              ) : null}
              {affectedBots.length > 0 ? (
                <div className="rounded-xl border border-chart-4/30 bg-chart-4/10 p-3 text-xs text-chart-4">
                  <p className="font-semibold">
                    Withdrawing will pause your bot {affectedBots.map((bot) => bot.botName).join(', ')}.
                  </p>
                  <p className="mt-1 text-chart-4/80">
                    Top up above the required buffer to auto-resume profit sharing.
                  </p>
                </div>
              ) : null}
            </div>

            <div className="space-y-2">
              <label htmlFor="withdraw-bank-account" className="text-sm font-medium text-foreground">Bank Account</label>
              <input
                id="withdraw-bank-account"
                value={bankAccount}
                onChange={(e) => setBankAccount(e.target.value)}
                className="w-full rounded-xl border border-[var(--card-border)] bg-card px-3 py-2.5 text-sm outline-none focus:border-primary/40"
              />
            </div>

            <Button
              className="w-full rounded-xl"
              disabled={!isAmountValid || !isWithinBalance || !bankAccount.trim() || isSendingOtp || withdrawalPreview.isFetching}
              onClick={async () => {
                await handleSendOtp();
                setStep(2);
              }}
            >
              {isSendingOtp ? 'Sending OTP...' : 'Continue'}
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="mt-6 space-y-4">
            <p className="text-sm text-muted-foreground">An OTP has been sent to your registered email. Enter it below to confirm the withdrawal.</p>
            <Button
              variant="ghost"
              className="w-full border border-[var(--card-border)] text-muted-foreground text-sm rounded-xl"
              disabled={isSendingOtp}
              onClick={handleSendOtp}
            >
              {isSendingOtp ? 'Sending...' : 'Resend OTP'}
            </Button>
            <input
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="w-full rounded-xl border border-[var(--card-border)] bg-card px-3 py-2.5 tracking-[0.4em] text-center text-lg outline-none focus:border-primary/40"
              placeholder="• • • • • •"
              aria-label="6-digit withdrawal OTP"
              inputMode="numeric"
              maxLength={6}
            />
            <Button
              className="w-full rounded-xl"
              disabled={otp.length !== 6 || withdrawMutation.isPending}
              onClick={submitWithdrawal}
            >
              {withdrawMutation.isPending ? 'Submitting...' : 'Confirm Withdrawal'}
            </Button>
          </div>
        )}

        {step === 3 && (
          <div className="mt-6 space-y-4 text-center">
            <p className="text-chart-3 font-semibold">Withdrawal queued successfully.</p>
            <Button className="w-full rounded-xl" onClick={reset}>
              Done
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
