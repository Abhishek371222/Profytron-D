'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Target,
  Zap,
  ChevronRight,
  Lock,
  ArrowRight,
  Brain,
  Sparkles,
} from '@/components/ui/icons';
import { Button } from '@/components/ui/button';
import { ChoiceCard } from '@/components/ui/ChoiceCard';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { usersApi } from '@/lib/api/users';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { LandingAmbientBackground } from '@/components/home/LandingAmbientBackground';

const STEPS = [
  {
    id: 'capital',
    title: 'Capital allocation',
    description: 'Tell us how much you plan to deploy so we can size risk limits appropriately.',
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
        options: ['Personal savings', 'Trading fund', 'Venture capital', 'Treasury'],
      },
    ],
  },
  {
    id: 'aggressiveness',
    title: 'Risk appetite',
    description: 'We use this to tune leverage caps, drawdown alerts, and strategy recommendations.',
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
        options: ['Standard MFA', 'Hardware key', 'Multi-sig approval', 'Air-gapped proxy'],
      },
      {
        id: 'killswitch',
        label: 'Auto kill-switch trigger',
        options: ['Manual only', '2% equity drop', '5% anomaly detected', 'Instant disconnect'],
      },
    ],
  },
];

export default function RiskOnboardingPage() {
  const router = useRouter();
  const { isAuthenticated, isHydrating, user } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isFinalizing, setIsFinalizing] = useState(false);

  React.useEffect(() => {
    if (isHydrating) return;
    if (!isAuthenticated) {
      router.replace('/login?redirect=/onboarding/risk');
    } else if (user?.onboardingCompleted) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, isHydrating, user?.onboardingCompleted, router]);

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
        document.cookie = 'onboarding_completed=1; path=/; max-age=7776000; samesite=lax';
      }
      toast.success('Risk profile saved', {
        description: 'Next: connect a paper account or browse strategies.',
      });
      router.push('/get-bots?paper=1');
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

      console.error('Failed to save risk profile', error);
      toast.error(
        isNetwork
          ? 'Cannot reach the server'
          : (axiosErr?.response?.data?.error as string) || 'Could not save risk profile',
        {
          description: isNetwork
            ? 'Start the API (port 4000) and try again.'
            : 'Please retry in a few seconds.',
        },
      );
      setIsFinalizing(false);
    }
  };

  const step = STEPS[currentStep];
  const progress = ((currentStep + 1) / STEPS.length) * 100;
  const stepComplete = step.questions.every((q) => Boolean(answers[q.id]));

  if (isHydrating || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
          <p className="text-sm">Loading your profile…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-background text-foreground flex flex-col items-center justify-center px-4 py-12 overflow-hidden">
      <LandingAmbientBackground />

      <div className="relative z-10 w-full max-w-2xl">
        <AnimatePresence mode="wait">
          {!isFinalizing ? (
            <motion.div
              key={`step-${currentStep}`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
              className="dashboard-card p-6 sm:p-8 lg:p-10 space-y-8"
            >
              {/* Header */}
              <div className="text-center space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-[var(--card-border)] bg-primary/5 px-3 py-1 text-caption font-medium text-primary">
                  <Sparkles className="h-3.5 w-3.5" />
                  Risk DNA · Step {currentStep + 1} of {STEPS.length}
                </div>
                <motion.div
                  layoutId="step-icon"
                  className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 shadow-[var(--shadow-card)]"
                >
                  <step.icon className="h-8 w-8 text-primary" />
                </motion.div>
                <div className="space-y-2">
                  <h1 className="text-heading-3 font-bold tracking-tight text-foreground">
                    {step.title}
                  </h1>
                  <p className="text-body text-muted-foreground max-w-md mx-auto leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>

              {/* Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-caption text-muted-foreground">
                  <span>Profile completion</span>
                  <span className="font-semibold text-primary">{Math.round(progress)}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                    className="h-full rounded-full bg-gradient-to-r from-primary to-[var(--indigo)]"
                  />
                </div>
              </div>

              {/* Questions */}
              <div className="space-y-8">
                {step.questions.map((q) => (
                  <div key={q.id} className="space-y-3">
                    <p className="text-sm font-semibold text-foreground">{q.label}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {q.options.map((option) => (
                        <ChoiceCard
                          key={option}
                          label={option}
                          selected={answers[q.id] === option}
                          onClick={() => handleSelect(q.id, option)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                {currentStep > 0 && (
                  <Button
                    variant="outline"
                    className="sm:flex-1 h-12"
                    onClick={() => setCurrentStep((c) => c - 1)}
                  >
                    Back
                  </Button>
                )}
                <Button
                  variant="primary"
                  onClick={handleNext}
                  disabled={!stepComplete}
                  className={cn('h-12 text-base', currentStep === 0 ? 'w-full' : 'sm:flex-[2]')}
                >
                  {currentStep === STEPS.length - 1 ? 'Save risk profile' : 'Continue'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="finalizing"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="dashboard-card p-10 text-center space-y-8"
            >
              <div className="relative mx-auto h-28 w-28">
                <div className="absolute inset-0 rounded-full border-2 border-[var(--card-border)]" />
                <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Brain className="h-10 w-10 text-primary" />
                </div>
              </div>
              <div className="space-y-2">
                <h2 className="text-heading-4 font-bold">Building your risk profile</h2>
                <p className="text-muted-foreground max-w-sm mx-auto">
                  Calibrating limits, alerts, and strategy filters to match your answers.
                </p>
              </div>
              <div className="premium-surface p-5 space-y-3 max-w-sm mx-auto text-left">
                {['Analyzing capital allocation', 'Setting drawdown guardrails', 'Applying safety controls'].map(
                  (line, i) => (
                    <div key={line} className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span
                        className="h-2 w-2 rounded-full bg-primary animate-pulse"
                        style={{ animationDelay: `${i * 200}ms` }}
                      />
                      {line}
                    </div>
                  ),
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="relative z-10 mt-10 flex flex-wrap items-center justify-center gap-6 text-caption text-muted-foreground">
        <span className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          End-to-end encrypted
        </span>
        <span className="flex items-center gap-2">
          <ChevronRight className="h-4 w-4" />
          Takes under 2 minutes
        </span>
      </div>
    </div>
  );
}
