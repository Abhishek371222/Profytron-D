'use client';

import Link from 'next/link';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { BrandGradientText } from '@/components/brand/BrandGradientText';
import { AuthChartPanel } from '@/components/auth/AuthChartPanel';

export function RegisterVisualPanel() {
  return (
    <div className="relative hidden lg:flex flex-col overflow-hidden bg-[linear-gradient(160deg,color-mix(in_srgb,var(--accent)_28%,var(--background))_0%,var(--background)_50%,color-mix(in_srgb,var(--primary)_10%,var(--background))_100%)]">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-primary/20 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-destructive/10 blur-3xl"
      />

      <div className="relative z-10 flex min-h-full flex-col p-10 xl:p-12">
        <Link
          href="/"
          className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-card/90 px-4 py-2 text-sm font-medium text-muted-foreground shadow-[var(--shadow-sm)] transition hover:border-primary/30 hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back
        </Link>

        <AuthChartPanel
          badgeLabel="New Account"
          badgeIcon={Sparkles}
          headline={
            <>
              Start your <BrandGradientText>journey.</BrandGradientText>
            </>
          }
          description="Set up your Profytron profile to access strategy automation, analytics intelligence, and secure broker connectivity."
        />

        <div className="mt-6 flex items-center gap-3">
          <span className="text-xs font-medium text-muted-foreground">Step 1 of 3</span>
          <div className="flex items-center gap-1.5" aria-hidden>
            <span className="h-1 w-8 rounded-full bg-primary" />
            <span className="h-1 w-1 rounded-full bg-primary/30" />
            <span className="h-1 w-1 rounded-full bg-primary/30" />
          </div>
        </div>
      </div>
    </div>
  );
}
