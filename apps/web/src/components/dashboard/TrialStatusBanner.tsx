'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { X, ArrowRight, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type TrialStatusBannerProps = {
  planName: string;
  trialEndsAt: string | Date;
  onUpgrade: () => void;
  onDismiss: () => void;
  className?: string;
};

function daysRemaining(trialEndsAt: string | Date): number {
  const end = new Date(trialEndsAt).getTime();
  const now = Date.now();
  return Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
}

export function TrialStatusBanner({
  planName,
  trialEndsAt,
  onUpgrade,
  onDismiss,
  className,
}: TrialStatusBannerProps) {
  const daysLeft = daysRemaining(trialEndsAt);

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      className={cn('overflow-hidden', className)}
    >
      <div className="relative overflow-hidden rounded-[var(--radius-card)] border border-[color-mix(in_srgb,var(--primary)_22%,var(--card-border))] bg-card shadow-[var(--shadow-card)]">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[color-mix(in_srgb,var(--primary)_8%,transparent)] via-[color-mix(in_srgb,var(--secondary)_6%,transparent)] to-transparent" />
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-[3px] rounded-l-[var(--radius-card)] bg-gradient-to-b from-primary via-secondary to-primary" />

        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-[var(--radius-button)] border border-[var(--card-border)] bg-muted/60 text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="relative grid grid-cols-1 gap-4 px-4 py-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:gap-6 md:px-6 md:py-5">
          <div className="flex min-w-0 items-start gap-3 pr-10 md:items-center md:pr-12">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-button)] border border-[color-mix(in_srgb,var(--primary)_25%,var(--card-border))] bg-[color-mix(in_srgb,var(--primary)_12%,transparent)]">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-[min(100%,14rem)] flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-micro font-bold uppercase tracking-[0.12em] text-foreground">
                  {planName} Trial
                </span>
                <span className="inline-flex items-center rounded-full border border-[color-mix(in_srgb,var(--primary)_22%,var(--card-border))] bg-[color-mix(in_srgb,var(--primary)_10%,transparent)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-primary">
                  {daysLeft} day{daysLeft === 1 ? '' : 's'} left
                </span>
              </div>
              <p className="mt-1 max-w-prose text-sm font-medium leading-relaxed text-muted-foreground">
                No payment required during your trial. Upgrade anytime to keep your access after it ends.
              </p>
            </div>
          </div>

          <div className="flex w-full flex-col gap-3 pr-10 md:w-auto md:min-w-[min(100%,18rem)] md:flex-row md:items-center md:justify-end md:pr-12">
            <Button
              type="button"
              variant="primary"
              size="lg"
              onClick={onUpgrade}
              className="w-full min-w-0 uppercase tracking-[0.12em] md:min-w-[9.5rem] md:w-auto"
            >
              Upgrade Now
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
