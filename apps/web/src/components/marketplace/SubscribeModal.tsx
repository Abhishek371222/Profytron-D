'use client';

import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { marketplaceApi, PlanType } from '@/lib/api/marketplace';
import { toast } from 'sonner';

interface SubscribeModalProps {
  strategy: any;
  isOpen: boolean;
  onClose: () => void;
}

const PLAN_LABELS: Record<PlanType, string> = {
  MONTHLY: 'Monthly',
  ANNUAL: 'Annual',
  LIFETIME: 'Lifetime',
};

export function SubscribeModal({ strategy, isOpen, onClose }: SubscribeModalProps) {
  const [step, setStep] = React.useState<1 | 2>(1);
  const [planType, setPlanType] = React.useState<PlanType>('ANNUAL');
  const [useTrial, setUseTrial] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showSuccess, setShowSuccess] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setStep(1);
      setPlanType('ANNUAL');
      setUseTrial(false);
      setIsSubmitting(false);
      setShowSuccess(false);
    }
  }, [isOpen]);

  if (!strategy) {
    return null;
  }

  const planPrice =
    planType === 'MONTHLY'
      ? strategy.monthlyPrice ?? strategy.price ?? 0
      : planType === 'ANNUAL'
        ? strategy.annualPrice ?? strategy.price ?? 0
        : strategy.lifetimePrice ?? strategy.price ?? 0;

  const submit = async () => {
    setIsSubmitting(true);
    try {
      const response = await marketplaceApi.subscribe(strategy.id, {
        planType,
        useTrial,
      });

      if (!response.requiresPayment) {
        setShowSuccess(true);
        toast.success(response.trial ? 'Trial activated successfully' : 'Subscription activated');
        return;
      }

      if (response.checkoutUrl) {
        window.location.href = response.checkoutUrl;
        return;
      }

      toast.error('Checkout URL was not returned by server');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to subscribe to strategy');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="relative w-full max-w-2xl rounded-3xl border border-white/10 bg-[#0d0d12] p-8"
          >
            <button
              onClick={onClose}
              className="absolute right-5 top-5 rounded-full border border-white/10 bg-white/5 p-2 text-white/60"
            >
              <X className="h-4 w-4" />
            </button>

            {showSuccess ? (
              <div className="flex flex-col items-center py-12 text-center">
                <CheckCircle2 className="mb-4 h-16 w-16 text-emerald-400" />
                <h3 className="text-2xl font-bold text-white">Subscription activated!</h3>
                <p className="mt-2 text-sm text-white/60">{strategy.name} is now available in your strategy library.</p>
                <Button
                  className="mt-8 h-11 rounded-xl bg-white text-black hover:bg-white/90"
                  onClick={onClose}
                >
                  Go to My Strategies
                </Button>
              </div>
            ) : (
              <>
                <h3 className="text-2xl font-bold text-white">Subscribe to {strategy.name}</h3>
                <p className="mt-1 text-sm text-white/50">Step {step} of 2</p>

                {step === 1 ? (
                  <div className="mt-8 space-y-4">
                    {(Object.keys(PLAN_LABELS) as PlanType[]).map((key) => (
                      <button
                        key={key}
                        onClick={() => setPlanType(key)}
                        className={`w-full rounded-2xl border p-4 text-left transition ${
                          planType === key
                            ? 'border-indigo-400 bg-indigo-500/10'
                            : 'border-white/10 bg-white/5 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold uppercase tracking-widest text-white/80">{PLAN_LABELS[key]}</span>
                          <span className="text-base font-bold text-white">
                            {key === 'MONTHLY'
                              ? `$${Number(strategy.monthlyPrice ?? strategy.price ?? 0).toFixed(2)}`
                              : key === 'ANNUAL'
                                ? `$${Number(strategy.annualPrice ?? strategy.price ?? 0).toFixed(2)}`
                                : `$${Number(strategy.lifetimePrice ?? strategy.price ?? 0).toFixed(2)}`}
                          </span>
                        </div>
                      </button>
                    ))}

                    {Number(strategy.trialDays || 0) > 0 && planType !== 'LIFETIME' && (
                      <label className="mt-2 flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/80">
                        <input
                          type="checkbox"
                          checked={useTrial}
                          onChange={(e) => setUseTrial(e.target.checked)}
                        />
                        Activate {strategy.trialDays} day trial first
                      </label>
                    )}
                  </div>
                ) : (
                  <div className="mt-8 space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/60">Plan</span>
                      <span className="font-semibold text-white">{PLAN_LABELS[planType]}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/60">Amount</span>
                      <span className="font-semibold text-white">${Number(planPrice || 0).toFixed(2)}</span>
                    </div>
                    {useTrial && (
                      <p className="text-sm text-emerald-400">Trial will activate instantly without payment.</p>
                    )}
                  </div>
                )}

                <div className="mt-8 flex items-center justify-between">
                  <Button
                    variant="ghost"
                    className="text-white/70"
                    onClick={step === 1 ? onClose : () => setStep(1)}
                    disabled={isSubmitting}
                  >
                    {step === 1 ? 'Cancel' : 'Back'}
                  </Button>

                  {step === 1 ? (
                    <Button
                      className="h-11 rounded-xl bg-indigo-600 px-6 text-white hover:bg-indigo-500"
                      onClick={() => setStep(2)}
                    >
                      Continue <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      className="h-11 rounded-xl bg-indigo-600 px-6 text-white hover:bg-indigo-500"
                      onClick={submit}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Proceed to Payment'}
                    </Button>
                  )}
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
