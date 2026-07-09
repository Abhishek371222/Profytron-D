'use client';

import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, X, Sparkles, Zap, Calendar, Infinity as InfinityIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { marketplaceApi, PlanType } from '@/lib/api/marketplace';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { formatBotName } from '@/lib/bot-labels';
import { useCurrency } from '@/lib/hooks/useCurrency';

interface SubscribeModalProps {
  strategy: any;
  isOpen: boolean;
  onClose: () => void;
}

const PLAN_CONFIG: Record<PlanType, { label: string; subtitle: string; icon: any; accent: string; badge?: string }> = {
  MONTHLY:  { label: 'Monthly',  subtitle: 'Billed every month',          icon: Calendar,     accent: 'cyan'   },
  ANNUAL:   { label: 'Annual',   subtitle: 'Save 20% — billed yearly',    icon: Zap,          accent: 'indigo', badge: 'POPULAR' },
  LIFETIME: { label: 'Lifetime', subtitle: 'One payment, forever access', icon: InfinityIcon, accent: 'violet', badge: 'BEST VALUE' },
};

const ACCENT_STYLES: Record<string, { border: string; bg: string; ring: string; text: string; dot: string }> = {
  cyan:   { border: 'border-chart-5/50',   bg: 'bg-chart-5/[0.08]',   ring: 'ring-chart-5/30',   text: 'text-chart-5',   dot: 'bg-chart-5'   },
  indigo: { border: 'border-primary/50', bg: 'bg-primary/[0.08]', ring: 'ring-primary/30', text: 'text-primary', dot: 'bg-primary' },
  violet: { border: 'border-chart-2/50', bg: 'bg-chart-2/[0.08]', ring: 'ring-chart-2/30', text: 'text-chart-2', dot: 'bg-chart-2' },
};

export function SubscribeModal({ strategy, isOpen, onClose }: SubscribeModalProps) {
  const { currency, formatPrice } = useCurrency();
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

  if (!strategy) return null;

  const priceFor = (key: PlanType) =>
    key === 'MONTHLY'
      ? Number(strategy.monthlyPrice ?? strategy.price ?? 0)
      : key === 'ANNUAL'
        ? Number(strategy.annualPrice ?? strategy.price ?? 0)
        : Number(strategy.lifetimePrice ?? strategy.price ?? 0);

  const planPrice = priceFor(planType);

  const submit = async () => {
    setIsSubmitting(true);
    try {
      const response = await marketplaceApi.subscribe(strategy.id, { planType, useTrial });

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
      toast.error(error?.response?.data?.error || error?.response?.data?.message || 'Failed to subscribe to strategy');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/85 backdrop-blur-xl"
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.94 }}
            transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
            className={cn(
              'relative w-full max-w-2xl overflow-hidden rounded-[var(--radius-modal)]',
              'dashboard-card shadow-[var(--shadow-lg)]',
            )}
          >
            {/* Ambient corner glows */}
            <div className="pointer-events-none absolute -top-24 -right-24 w-64 h-64 rounded-full bg-primary/15 blur-[80px]" />
            <div className="pointer-events-none absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-chart-2/10 blur-[80px]" />

            {/* Top hairline */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute right-4 top-4 z-10 grid place-items-center w-8 h-8 rounded-full border border-[var(--card-border)] bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-all"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="relative p-7 sm:p-9">
              {showSuccess ? (
                /* ─────────── SUCCESS STATE ─────────── */
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                  className="flex flex-col items-center py-10 text-center"
                >
                  <div className="relative mb-5">
                    <motion.div
                      animate={{ scale: [1, 1.6], opacity: [0.4, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute inset-0 rounded-full border-2 border-chart-3/60"
                    />
                    <motion.div
                      animate={{ scale: [1, 1.4], opacity: [0.3, 0] }}
                      transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                      className="absolute inset-0 rounded-full border-2 border-chart-3/40"
                    />
                    <div className="relative w-20 h-20 rounded-full bg-chart-3/15 border border-chart-3/40 grid place-items-center">
                      <CheckCircle2 className="w-10 h-10 text-chart-3" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-foreground tracking-tight">Subscription Activated</h3>
                  <p className="mt-2 text-sm text-foreground/45 max-w-sm">
                    <span className="font-semibold text-foreground/70">{formatBotName(strategy.name)}</span> is now enabled. Your bot will execute on the next operator signal.
                  </p>
                  <div className="mt-6 flex gap-3">
                    <Button variant="outline" size="lg" onClick={onClose}>
                      Close
                    </Button>
                    <Button variant="primary" size="lg" onClick={() => (window.location.href = '/dashboard')}>
                      Go to Dashboard
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <>
                  {/* ─────────── HEADER ─────────── */}
                  <div className="flex items-start justify-between gap-4 mb-7">
                    <div className="flex-1 min-w-0">
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-primary/15 border border-primary/25 text-micro font-bold uppercase tracking-[0.22em] text-primary mb-2.5">
                        <Sparkles className="w-2.5 h-2.5" />
                        Subscribe
                      </div>
                      <h3 className="text-2xl font-bold text-foreground tracking-tight leading-tight truncate">
                        {formatBotName(strategy.name)}
                      </h3>
                      <p className="mt-1 text-xs text-foreground/40 font-bold uppercase tracking-[0.18em]">
                        Step {step} of 2 — {step === 1 ? 'Choose plan' : 'Confirm'}
                      </p>
                    </div>

                    {/* Step indicator */}
                    <div className="flex items-center gap-1.5 mt-1">
                      {[1, 2].map((s) => (
                        <div
                          key={s}
                          className={cn(
                            'h-1.5 rounded-full transition-all duration-300',
                            step === s ? 'w-8 bg-primary' : step > s ? 'w-3 bg-chart-3' : 'w-3 bg-foreground/10',
                          )}
                        />
                      ))}
                    </div>
                  </div>

                  <AnimatePresence mode="wait">
                    {step === 1 ? (
                      /* ─────────── STEP 1: PLAN PICKER ─────────── */
                      <motion.div
                        key="step-1"
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -12 }}
                        transition={{ duration: 0.25 }}
                        className="space-y-3"
                      >
                        {(Object.keys(PLAN_CONFIG) as PlanType[]).map((key) => {
                          const config = PLAN_CONFIG[key];
                          const accent = ACCENT_STYLES[config.accent];
                          const price = priceFor(key);
                          const isSelected = planType === key;

                          return (
                            <motion.button
                              key={key}
                              onClick={() => setPlanType(key)}
                              whileHover={{ scale: 1.005 }}
                              whileTap={{ scale: 0.995 }}
                              className={cn(
                                'group relative w-full rounded-2xl border p-4 text-left overflow-hidden',
                                'transition-all duration-200',
                                isSelected
                                  ? cn(accent.border, accent.bg, 'ring-1', accent.ring)
                                  : 'border-white/[0.08] bg-muted/25 hover:border-white/[0.16] hover:bg-muted/4',
                              )}
                            >
                              <div className="relative flex items-center gap-4">
                                {/* Icon */}
                                <div className={cn(
                                  'shrink-0 w-11 h-11 rounded-xl border grid place-items-center transition-colors',
                                  isSelected
                                    ? cn(accent.border, accent.bg, accent.text)
                                    : 'border-white/[0.08] bg-muted/3 text-foreground/40',
                                )}>
                                  <config.icon className="w-5 h-5" />
                                </div>

                                {/* Label */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="text-sm font-bold text-foreground">{config.label}</p>
                                    {config.badge && (
                                      <span className={cn(
                                        'text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded',
                                        accent.bg, accent.text, 'border', accent.border,
                                      )}>
                                        {config.badge}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-caption text-foreground/40 font-medium mt-0.5">{config.subtitle}</p>
                                </div>

                                {/* Price */}
                                <div className="text-right shrink-0">
                                  <p className="text-lg font-bold text-foreground font-mono tabular-nums leading-none">
                                    {formatPrice(price)}
                                  </p>
                                  <p className="text-micro text-foreground/30 uppercase tracking-widest mt-1 font-bold">
                                    {key === 'MONTHLY' ? '/ mo' : key === 'ANNUAL' ? '/ yr' : 'once'} · {currency.code}
                                  </p>
                                </div>

                                {/* Radio */}
                                <div className={cn(
                                  'shrink-0 w-5 h-5 rounded-full border-2 grid place-items-center transition-all',
                                  isSelected ? cn(accent.border, accent.bg) : 'border-border',
                                )}>
                                  {isSelected && <div className={cn('w-2 h-2 rounded-full', accent.dot)} />}
                                </div>
                              </div>
                            </motion.button>
                          );
                        })}

                        {Number(strategy.trialDays || 0) > 0 && planType !== 'LIFETIME' && (
                          <motion.label
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15 }}
                            className="flex items-center gap-3 rounded-xl border border-chart-3/20 bg-chart-3/[0.06] p-3.5 text-sm text-chart-3 cursor-pointer hover:border-chart-3/35 transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={useTrial}
                              onChange={(e) => setUseTrial(e.target.checked)}
                              className="w-4 h-4 accent-chart-3"
                            />
                            <div className="flex-1">
                              <p className="text-xs font-bold text-chart-3">
                                Activate {strategy.trialDays}-day free trial
                              </p>
                              <p className="text-caption text-chart-3/60 mt-0.5">No charge until trial ends</p>
                            </div>
                            <Sparkles className="w-4 h-4 text-chart-3/70" />
                          </motion.label>
                        )}
                      </motion.div>
                    ) : (
                      /* ─────────── STEP 2: CONFIRM ─────────── */
                      <motion.div
                        key="step-2"
                        initial={{ opacity: 0, x: 12 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 12 }}
                        transition={{ duration: 0.25 }}
                        className="rounded-2xl border border-white/[0.08] bg-muted/25 p-5 space-y-3"
                      >
                        {[
                          { label: 'Bot', value: formatBotName(strategy.name) },
                          { label: 'Plan',     value: PLAN_CONFIG[planType].label },
                          { label: 'Billing',  value: PLAN_CONFIG[planType].subtitle },
                        ].map((row) => (
                          <div key={row.label} className="flex items-center justify-between text-sm">
                            <span className="text-caption text-foreground/35 font-bold uppercase tracking-[0.18em]">{row.label}</span>
                            <span className="font-semibold text-foreground text-right truncate ml-3">{row.value}</span>
                          </div>
                        ))}

                        <div className="my-4 h-px bg-muted/6" />

                        <div className="flex items-baseline justify-between">
                          <span className="text-caption text-foreground/35 font-bold uppercase tracking-[0.18em]">Total</span>
                          <div className="text-right">
                            <span className="text-2xl font-bold text-foreground font-mono tabular-nums">
                              {formatPrice(Number(planPrice || 0))}
                            </span>
                            <p className="text-micro text-foreground/30 uppercase tracking-widest mt-0.5 font-bold">
                              {currency.code}
                            </p>
                          </div>
                        </div>

                        {useTrial && (
                          <div className="mt-3 flex items-center gap-2 rounded-xl border border-chart-3/20 bg-chart-3/[0.07] px-3 py-2.5">
                            <Sparkles className="w-3.5 h-3.5 text-chart-3 shrink-0" />
                            <p className="text-caption text-chart-3 font-semibold">
                              Trial activates instantly — no charge today
                            </p>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* ─────────── ACTIONS ─────────── */}
                  <div className="mt-7 flex items-center justify-between gap-3">
                    <Button
                      variant="ghost"
                      size="lg"
                      onClick={step === 1 ? onClose : () => setStep(1)}
                      disabled={isSubmitting}
                    >
                      {step === 1 ? 'Cancel' : '← Back'}
                    </Button>

                    {step === 1 ? (
                      <Button variant="primary" size="lg" onClick={() => setStep(2)}>
                        Continue
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    ) : (
                      <Button
                        variant="primary"
                        size="lg"
                        onClick={submit}
                        disabled={isSubmitting}
                        isLoading={isSubmitting}
                      >
                        {isSubmitting ? 'Processing…' : useTrial ? 'Activate Trial' : 'Proceed to Payment'}
                        {!isSubmitting && <ArrowRight className="w-4 h-4" />}
                      </Button>
                    )}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
