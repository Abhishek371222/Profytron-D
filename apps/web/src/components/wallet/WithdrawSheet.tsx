'use client';

import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
  const [step, setStep] = React.useState<1 | 2 | 3>(1);
  const [amount, setAmount] = React.useState('');
  const [otp, setOtp] = React.useState('');
  const [bankAccount, setBankAccount] = React.useState('HDFC Bank ****4521');

  const withdrawMutation = useMutation({
    mutationFn: (payload: { amount: number; bankAccount: string; otp: string }) =>
      walletApi.initiateWithdrawal(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
      await queryClient.invalidateQueries({ queryKey: ['wallet-transactions'] });
      setStep(3);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Withdrawal failed');
    },
  });

  const numericAmount = Number(amount || 0);
  const isAmountValid = Number.isFinite(numericAmount) && numericAmount >= 500;
  const isWithinBalance = numericAmount <= availableBalance;

  const submitWithdrawal = () => {
    if (!/^\d{6}$/.test(otp)) {
      toast.error('Enter a valid 6-digit OTP');
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
    setBankAccount('HDFC Bank ****4521');
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={(next) => (next ? onOpenChange(true) : reset())}>
      <SheetContent side="right" className="w-[420px] bg-[#0b0b0f] border border-white/10 text-white">
        <SheetHeader>
          <SheetTitle>Withdraw Funds</SheetTitle>
          <SheetDescription>Step {step} of 3</SheetDescription>
        </SheetHeader>

        {step === 1 && (
          <div className="mt-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-white/70">Amount (min 500)</label>
              <input
                type="number"
                min="500"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2"
              />
              <p className="text-xs text-white/50">Available: INR {availableBalance.toFixed(2)}</p>
              {!isWithinBalance && amount ? (
                <p className="text-xs text-red-400">Amount exceeds available balance</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label className="text-sm text-white/70">Bank Account</label>
              <input
                value={bankAccount}
                onChange={(e) => setBankAccount(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2"
              />
            </div>

            <Button
              className="w-full"
              disabled={!isAmountValid || !isWithinBalance}
              onClick={() => setStep(2)}
            >
              Continue
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="mt-6 space-y-4">
            <p className="text-sm text-white/60">Enter 6-digit OTP (development accepts any 6 digits).</p>
            <input
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 tracking-[0.4em]"
              placeholder="______"
            />
            <Button
              className="w-full"
              disabled={otp.length !== 6 || withdrawMutation.isPending}
              onClick={submitWithdrawal}
            >
              {withdrawMutation.isPending ? 'Submitting...' : 'Submit Withdrawal'}
            </Button>
          </div>
        )}

        {step === 3 && (
          <div className="mt-6 space-y-4 text-center">
            <p className="text-emerald-400 font-semibold">Withdrawal queued successfully.</p>
            <Button className="w-full" onClick={reset}>
              Done
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
