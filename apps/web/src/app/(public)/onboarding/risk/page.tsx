'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  ShieldCheck,
  Target,
  Zap,
  ChevronRight,
  Lock,
  ArrowRight,
  Brain,
  Sparkles,
  Info,
} from '@/components/ui/icons';
import { Button } from '@/components/ui/button';
import { ChoiceCard } from '@/components/ui/ChoiceCard';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { usersApi } from '@/lib/api/users';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { SceneProvider } from '@/components/3d/SceneProvider';
import { AmbientDepthBackground } from '@/components/3d/AmbientDepthBackground';
import {
  ACTIVATION_EVENTS,
  trackActivation,
  trackEvent,
  REGISTRATION_FUNNEL_EVENTS,
  trackRegistrationFunnel,
  trackRegistrationFunnelOnce,
} from '@/lib/analytics/track';

const STEPS = [
  {
    id: 'capital',
    title: 'Capital allocation',
    description:
      'Tell us roughly how much you plan to deploy so we can size risk limits appropriately.',
    icon: Target,
    questions: [
      {
        id: 'amount',
        label: 'How much do you plan to trade with?',
        options: ['Under $10K', '$10K – $100K', '$100K – $1M', '$1M+'],
      },
      {
        id: 'source',
        label: 'Where is this capital coming from?',
        options: [
          'Personal savings',
          'Trading profits',
          'Pooled / prop account',
          'Other',
        ],
      },
    ],
  },
  {
    id: 'aggressiveness',
    title: 'Risk appetite',
    description:
      'We use this to tune leverage caps, drawdown alerts, and strategy recommendations.',
    icon: Zap,
    questions: [
      {
        id: 'leverage',
        label: 'Maximum leverage you are comfortable with',
        options: ['1× (spot only)', '3× – 5×', '10× – 20×', '50×+ (high risk)'],
      },
      {
        id: 'drawdown',
        label: 'Maximum drawdown before you pause',
        options: ['Under 2%', 'Around 5%', 'Up to 15%', '30%+ (aggressive)'],
      },
    ],
  },
  {
    id: 'security',
    title: 'Safety controls',
    description: 'Choose how strictly Profytron should protect your account.',
    icon: Lock,
    questions: [
      {
        id: 'mfa',
        label: 'Preferred security level',
        options: [
          'Standard (password + MFA path)',
          'Authenticator app (TOTP)',
          'Hardware security key',
          'Maximum session security',
        ],
      },
      {
        id: 'killswitch',
        label: 'Auto pause / kill-switch trigger',
        options: [
          'Manual only',
          'Pause on 2% equity drop',
          'Pause on 5% shock',
          'Immediate flatten (aggressive)',
        ],
      },
    ],
  },
] as const;

export default function RiskOnboardingPage() {
  const reduceMotion = useReducedMotion();
  const { isAuthenticated, isHydrating, user } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);

  React.useEffect(() => {
    trackRegistrationFunnelOnce(
      'onboarding_started',
      REGISTRATION_FUNNEL_EVENTS.ONBOARDING_STARTED,
      { path: '/onboarding/risk' },
    );
  }, []);

  React.useEffect(() => {
    if (isHydrating) return;
    if (!isAuthenticated) {
      window.location.replace('/login?redirect=/onboarding/risk');
    } else if (user?.onboardingCompleted && !showCompletion) {
      window.location.replace('/dashboard');
    }
  }, [isAuthenticated, isHydrating, user?.onboardingCompleted, showCompletion]);

  const handleSelect = (questionId: string, option: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  const handleNext = async () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((curr) => curr + 1);
      return;
    }

    setIsFinalizing(true);
    try {
      let score = 50;
      Object.values(answers).forEach((val) => {
        score += val.length;
      });
      score = Math.min(Math.round(score), 100);

      const updated = await usersApi.updateRiskProfile({
        riskProfileJson: answers,
        riskDnaScore: score,
      });

      const token = useAuthStore.getState().accessToken;
      if (token) {
        useAuthStore.getState().login(token, updated);
      }
      if (typeof document !== 'undefined') {
        const secure =
          typeof window !== 'undefined' && window.location.protocol === 'https:'
            ? '; secure'
            : '';
        document.cookie = `onboarding_completed=1; path=/; max-age=7776000; samesite=lax${secure}`;
      }
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem('profytron_just_onboarded', '1');
      }
      trackEvent('onboarding_completed', { source: 'risk_dna' });
      trackRegistrationFunnel(REGISTRATION_FUNNEL_EVENTS.ONBOARDING_COMPLETED, {
        source: 'risk_dna',
      });
      void trackActivation(ACTIVATION_EVENTS.ONBOARDING_COMPLETED, {
        source: 'risk_dna',
      });
      toast.success('Risk profile saved', {
        description: 'Next: connect a paper account or browse strategies.',
      });
      setShowCompletion(true);
      setIsFinalizing(false);
    } catch (error: unknown) {
      const axiosErr = error as {
        response?: { data?: { error?: string }; status?: number };
        message?: string;
        code?: string;
      };
      const isNetwork =
        !axiosErr?.response &&
        (axiosErr?.code === 'ECONNREFUSED' ||
          axiosErr?.code === 'ERR_NETWORK' ||
          axiosErr?.message?.includes('Network Error'));

      toast.error(
        isNetwork
          ? 'Cannot reach the server'
          : (axiosErr?.response?.data?.error as string) || 'Could not save risk profile',
        {
          description: isNetwork
            ? 'Check your connection and try again.'
            : 'Please retry in a few seconds.',
        },
      );
      setIsFinalizing(false);
    }
  };

  const step = STEPS[currentStep];
  const progress = ((currentStep + 1) / STEPS.length) * 100;
  const stepComplete = step.questions.every((q) => Boolean(answers[q.id]));
  const motionProps = reduceMotion
    ? { initial: false as const, animate: { opacity: 1 }, exit: { opacity: 1 } }
    : {
        initial: { opacity: 0, y: 16 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -12 },
        transition: { duration: 0.35, ease: [0.23, 1, 0.32, 1] as const },
      };

  if (isHydrating || !isAuthenticated) {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-background text-muted-foreground"
        aria-busy="true"
        aria-live="polite"
      >
        <div className="flex flex-col items-center gap-3">
          <div
            className="h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary"
            aria-hidden
          />
          <p className="text-sm">Loading your profile…</p>
        </div>
      </div>
    );
  }

  return (
    <SceneProvider>
      <div className="relative flex min-h-screen min-w-0 flex-col items-center justify-center overflow-x-hidden bg-background px-4 py-12 pb-[max(3rem,env(safe-area-inset-bottom))] text-foreground">
        <AmbientDepthBackground variant="auth" position="fixed" />

        <div className="relative z-10 w-full max-w-2xl">
          <AnimatePresence mode="wait">
            {showCompletion ? (
              <motion.div
                key="completion"
                {...motionProps}
                className="dashboard-card space-y-8 p-6 text-center sm:p-8 lg:p-10"
                role="status"
              >
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10">
                  <ShieldCheck className="h-8 w-8 text-primary" aria-hidden />
                </div>
                <div className="space-y-2">
                  <h2 className="text-heading-4 font-bold tracking-tight text-foreground">
                    Risk profile saved
                  </h2>
                  <p className="mx-auto max-w-md text-body leading-relaxed text-muted-foreground">
                    You&apos;re on step 2 of 3. Connect a paper or live broker, then deploy a bot
                    within your limits.
                  </p>
                </div>
                <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                  <Button
                    variant="primary"
                    className="h-12 min-h-[48px] sm:flex-1"
                    onClick={() => {
                      window.location.assign('/get-bots?paper=1');
                    }}
                  >
                    Connect paper account
                    <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
                  </Button>
                  <Button
                    variant="outline"
                    className="h-12 min-h-[48px] sm:flex-1"
                    onClick={() => {
                      window.location.assign('/marketplace');
                    }}
                  >
                    Browse marketplace
                  </Button>
                </div>
                <button
                  type="button"
                  className="min-h-[44px] text-sm font-medium text-muted-foreground hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                  onClick={() => window.location.assign('/dashboard')}
                >
                  Go to dashboard
                </button>
              </motion.div>
            ) : !isFinalizing ? (
              <motion.div
                key={`step-${currentStep}`}
                {...motionProps}
                className="dashboard-card space-y-8 p-6 sm:p-8 lg:p-10"
              >
                <div className="space-y-4 text-center">
                  <div className="inline-flex items-center gap-2 rounded-full border border-[var(--card-border)] bg-primary/5 px-3 py-1 text-caption font-medium text-primary">
                    <Sparkles className="h-3.5 w-3.5" aria-hidden />
                    Risk DNA · Step {currentStep + 1} of {STEPS.length}
                  </div>
                  <motion.div
                    layoutId={reduceMotion ? undefined : 'step-icon'}
                    className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 shadow-[var(--shadow-card)]"
                  >
                    <step.icon className="h-8 w-8 text-primary" aria-hidden />
                  </motion.div>
                  <div className="space-y-2">
                    <h1 className="text-heading-3 font-bold tracking-tight text-foreground">
                      {step.title}
                    </h1>
                    <p className="mx-auto max-w-md text-body leading-relaxed text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-caption text-muted-foreground">
                    <span>Profile completion</span>
                    <span className="font-semibold text-primary">{Math.round(progress)}%</span>
                  </div>
                  <div
                    className="h-2 w-full overflow-hidden rounded-full bg-muted"
                    role="progressbar"
                    aria-valuenow={Math.round(progress)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="Risk profile completion"
                  >
                    <motion.div
                      initial={reduceMotion ? false : { width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
                      className="h-full rounded-full bg-primary"
                    />
                  </div>
                </div>

                <div className="space-y-8">
                  {step.questions.map((q) => (
                    <fieldset key={q.id} className="space-y-3 border-0 p-0 m-0 min-w-0">
                      <legend className="mb-0 text-sm font-semibold text-foreground">
                        {q.label}
                      </legend>
                      <div
                        className="grid grid-cols-1 gap-3 sm:grid-cols-2"
                        role="group"
                        aria-label={q.label}
                      >
                        {q.options.map((option) => (
                          <ChoiceCard
                            key={option}
                            label={option}
                            selected={answers[q.id] === option}
                            onClick={() => handleSelect(q.id, option)}
                          />
                        ))}
                      </div>
                    </fieldset>
                  ))}
                </div>

                <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                  {currentStep > 0 && (
                    <Button
                      variant="outline"
                      className="h-12 min-h-[48px] sm:flex-1"
                      onClick={() => setCurrentStep((c) => c - 1)}
                    >
                      Back
                    </Button>
                  )}
                  <Button
                    variant="primary"
                    onClick={() => void handleNext()}
                    disabled={!stepComplete}
                    className={cn(
                      'h-12 min-h-[48px] text-base',
                      currentStep === 0 ? 'w-full' : 'sm:flex-[2]',
                    )}
                  >
                    {currentStep === STEPS.length - 1 ? 'Save risk profile' : 'Continue'}
                    <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
                  </Button>
                </div>
                {!stepComplete && (
                  <p className="text-center text-xs text-muted-foreground" role="status">
                    Answer every question on this step to continue.
                  </p>
                )}

                <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 border-t border-[var(--card-border)] pt-4 text-sm">
                  <Link
                    href="/onboarding"
                    className="text-muted-foreground hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                  >
                    ← Back to overview
                  </Link>
                  <Link
                    href="/help"
                    className="inline-flex items-center gap-1.5 text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                  >
                    <Info className="h-3.5 w-3.5" aria-hidden />
                    Help
                  </Link>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="finalizing"
                {...(reduceMotion
                  ? { initial: false, animate: { opacity: 1 } }
                  : {
                      initial: { opacity: 0, scale: 0.98 },
                      animate: { opacity: 1, scale: 1 },
                    })}
                className="dashboard-card space-y-8 p-10 text-center"
                role="status"
                aria-live="polite"
                aria-busy="true"
              >
                <div className="relative mx-auto h-28 w-28">
                  <div className="absolute inset-0 rounded-full border-2 border-[var(--card-border)]" />
                  <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-primary" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Brain className="h-10 w-10 text-primary" aria-hidden />
                  </div>
                </div>
                <div className="space-y-2">
                  <h2 className="text-heading-4 font-bold">Saving your risk profile</h2>
                  <p className="mx-auto max-w-sm text-muted-foreground">
                    Applying drawdown guardrails and safety preferences from your answers.
                  </p>
                </div>
                <div className="premium-surface mx-auto max-w-sm space-y-3 p-5 text-left">
                  {[
                    'Recording capital band',
                    'Setting drawdown guardrails',
                    'Storing safety controls',
                  ].map((line, i) => (
                    <div key={line} className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span
                        className="h-2 w-2 animate-pulse rounded-full bg-primary"
                        style={{ animationDelay: `${i * 200}ms` }}
                        aria-hidden
                      />
                      {line}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="relative z-10 mt-10 flex flex-wrap items-center justify-center gap-6 text-caption text-muted-foreground">
          <span className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" aria-hidden />
            Encrypted in transit
          </span>
          <span className="flex items-center gap-2">
            <ChevronRight className="h-4 w-4" aria-hidden />
            Takes under 2 minutes
          </span>
        </div>
      </div>
    </SceneProvider>
  );
}
