'use client';

/**
 * Product Phase 2 — PROD-P0-onboarding-welcome
 * Visible welcome shell so /onboarding never leaves body hidden mid-redirect.
 * Evidence: docs/product-audit/phase1/reports/PRODUCT_DEBT.md
 */
import Link from 'next/link';
import { ArrowRight, ShieldCheck, Sparkles } from '@/components/ui/icons';
import { Button } from '@/components/ui/button';
import { LandingAmbientBackground } from '@/components/home/LandingAmbientBackground';

export default function OnboardingWelcomePage() {
  return (
    <div className="relative min-h-screen bg-background text-foreground flex flex-col items-center justify-center px-4 py-12 overflow-hidden">
      <LandingAmbientBackground />
      <div className="relative z-10 w-full max-w-lg dashboard-card p-8 sm:p-10 space-y-6 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--card-border)] bg-primary/5 px-3 py-1 text-caption font-medium text-primary">
          <Sparkles className="h-3.5 w-3.5" />
          Welcome
        </div>
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
          <ShieldCheck className="h-8 w-8 text-primary" />
        </div>
        <div className="space-y-2">
          <h1 className="text-heading-3 font-bold tracking-tight">Set up your workspace</h1>
          <p className="text-body text-muted-foreground leading-relaxed">
            Next, tell us how you want to trade so we can size risk limits and recommendations.
          </p>
        </div>
        <Button asChild className="w-full gap-2" size="lg">
          <Link href="/onboarding/risk">
            Continue to Risk DNA
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
        <p className="text-caption text-muted-foreground">
          Takes about two minutes. You can update preferences later in Settings.
        </p>
      </div>
    </div>
  );
}
