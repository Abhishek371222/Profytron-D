'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle, Sparkles, X } from 'lucide-react';
import { growthApi } from '@/lib/api/growth';
import { cn, isAdminUser } from '@/lib/utils';
import { useAuthStore } from '@/lib/stores/useAuthStore';

export function ActivationChecklist({ compact = false }: { compact?: boolean }) {
  const [dismissed, setDismissed] = React.useState(false);
  const user = useAuthStore((s) => s.user);
  const sessionReady = useAuthStore((s) => s.sessionReady);

  React.useEffect(() => {
    setDismissed(localStorage.getItem('profytron_activation_dismissed') === 'true');
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ['activation-progress'],
    queryFn: () => growthApi.getActivation(),
    staleTime: 30_000,
    enabled: sessionReady && !isAdminUser(user),
  });

  if (isAdminUser(user) || dismissed || isLoading || !data) return null;
  if (data.progressPct >= 100 || data.isActivated) return null;

  const next = data.checklist.find((item) => !item.done);

  const dismiss = () => {
    localStorage.setItem('profytron_activation_dismissed', 'true');
    setDismissed(true);
  };

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative flex items-center gap-3 rounded-xl border border-primary/20 bg-background px-3 py-2.5 overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-chart-2/5 to-transparent pointer-events-none" />
        <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 border border-primary/25">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
        </div>
        <div className="relative min-w-0 flex-1">
          <p className="truncate text-caption font-semibold text-foreground">
            Get started · {data.completed}/{data.total} · {data.progressPct}%
          </p>
          <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-foreground/5">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${data.progressPct}%` }}
            />
          </div>
        </div>
        {next ? (
          <Link
            href={next.href}
            className="relative shrink-0 rounded-lg bg-primary px-3 py-1.5 text-micro font-bold uppercase tracking-widest text-primary-foreground hover:bg-primary-hover"
          >
            {next.label}
          </Link>
        ) : null}
        <button
          type="button"
          onClick={dismiss}
          className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-foreground/5 border border-border hover:bg-foreground/10"
          aria-label="Dismiss activation checklist"
        >
          <X className="h-3.5 w-3.5 text-foreground/30" />
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-primary/20 bg-background overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-chart-2/5 to-transparent pointer-events-none" />
      <div className="relative p-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground uppercase tracking-[0.2em]">
                Get Started
              </p>
              <p className="text-caption text-foreground/35 mt-0.5">
                {data.completed}/{data.total} complete · {data.progressPct}%
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={dismiss}
            className="w-8 h-8 rounded-lg bg-foreground/5 border border-border hover:bg-foreground/10 flex items-center justify-center"
          >
            <X className="w-3.5 h-3.5 text-foreground/30" />
          </button>
        </div>

        <div className="h-1.5 w-full bg-foreground/5 rounded-full overflow-hidden mb-4">
          <div
            className="h-full w-full origin-left bg-primary transition-transform duration-500 will-change-transform"
            style={{ transform: `scaleX(${Math.min(Math.max(data.progressPct, 0), 100) / 100})` }}
          />
        </div>

        <ul className="space-y-2 mb-4">
          {data.checklist.map((item) => (
            <li key={item.id} className="flex items-center gap-2.5 text-sm">
              {item.done ? (
                <CheckCircle2 className="w-4 h-4 text-chart-3 shrink-0" />
              ) : (
                <Circle className="w-4 h-4 text-foreground/20 shrink-0" />
              )}
              <span className={cn(item.done ? 'text-foreground/40 line-through' : 'text-foreground/70')}>
                {item.label}
              </span>
            </li>
          ))}
        </ul>

        {next && (
          <Link
            href={next.href}
            className="inline-flex items-center justify-center w-full h-[var(--control-h-sm)] rounded-[var(--radius-button)] bg-primary hover:bg-primary-hover text-primary-foreground text-caption font-bold uppercase tracking-widest transition-colors duration-200"
          >
            {next.label}
          </Link>
        )}
      </div>
    </motion.div>
  );
}
