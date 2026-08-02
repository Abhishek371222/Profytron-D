'use client';

/**
 * Product Phase 2 — PROD-P0-onboarding-welcome
 * Visible welcome shell so /onboarding never leaves body hidden mid-redirect.
 * PT-W06 — clearer steps + mobile-safe touch targets.
 */
import Link from 'next/link';
import { ArrowRight, ShieldCheck, Sparkles, Target, Box } from '@/components/ui/icons';
import { buttonVariants } from '@/components/ui/button';
import { SceneProvider } from '@/components/3d/SceneProvider';
import { AmbientDepthBackground } from '@/components/3d/AmbientDepthBackground';
import { cn } from '@/lib/utils';

const STEPS = [
  {
    n: '1',
    title: 'Risk DNA',
    body: 'Capital, risk appetite, and safety controls — about 2 minutes.',
  },
  {
    n: '2',
    title: 'Paper or live broker',
    body: 'Connect MT4/MT5, or start on paper without risking real capital.',
  },
  {
    n: '3',
    title: 'Deploy a bot',
    body: 'Activate a marketplace strategy or paper bot matched to your limits.',
  },
] as const;

export default function OnboardingWelcomePage() {
  return (
    <SceneProvider>
      <div className="animate-page-in relative flex min-h-screen min-w-0 flex-col items-center justify-center overflow-x-hidden bg-background px-4 py-12 text-foreground pb-[max(3rem,env(safe-area-inset-bottom))]">
        <AmbientDepthBackground variant="auth" position="fixed" />
        <div className="relative z-10 w-full max-w-lg space-y-6 p-6 text-center dashboard-card sm:p-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--card-border)] bg-primary/5 px-3 py-1 text-caption font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            Getting started · Step 1 of 3
          </div>
          <div
            className="mx-auto h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuenow={1}
            aria-valuemin={1}
            aria-valuemax={3}
            aria-label="Onboarding progress"
          >
            <div className="h-full w-1/3 rounded-full bg-primary" />
          </div>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10">
            <ShieldCheck className="h-8 w-8 text-primary" aria-hidden />
          </div>
          <div className="space-y-2">
            <h1 className="text-heading-3 font-bold tracking-tight">Set up your workspace</h1>
            <p className="text-body leading-relaxed text-muted-foreground">
              Three short steps. We size risk limits first so bot sizing stays within rules you
              choose — capital always stays at your broker.
            </p>
          </div>

          <ol className="space-y-3 text-left" aria-label="Onboarding steps">
            {STEPS.map((s) => (
              <li
                key={s.n}
                className="flex gap-3 rounded-xl border border-[var(--card-border)] bg-muted/30 px-3 py-3"
              >
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-xs font-bold text-primary"
                  aria-hidden
                >
                  {s.n}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{s.title}</p>
                  <p className="text-xs leading-relaxed text-muted-foreground">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>

          <Link
            href="/onboarding/risk"
            className={cn(
              buttonVariants({ size: 'lg' }),
              'min-h-[48px] w-full gap-2 focus-visible:ring-2 focus-visible:ring-ring',
            )}
          >
            Continue to Risk DNA
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Link
              href="/get-bots?paper=1"
              className="inline-flex min-h-[44px] items-center justify-center gap-2 text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
            >
              <Box className="h-4 w-4" aria-hidden />
              Skip to paper connect
            </Link>
            <span className="hidden text-muted-foreground sm:inline" aria-hidden>
              ·
            </span>
            <Link
              href="/help"
              className="inline-flex min-h-[44px] items-center justify-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
            >
              <Target className="h-4 w-4" aria-hidden />
              Need help?
            </Link>
          </div>

          <p className="text-caption text-muted-foreground">
            You can update risk preferences later under Settings → Trading.
          </p>
        </div>
      </div>
    </SceneProvider>
  );
}
