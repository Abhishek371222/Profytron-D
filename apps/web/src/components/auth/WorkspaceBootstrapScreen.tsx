'use client';

import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Check,
  Cloud,
  Loader2,
  Shield,
  Sparkles,
  UserRound,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { BrandLogo } from '@/components/brand/BrandLogo';
import {
  bootstrapProgress,
  useWorkspaceBootstrapStore,
  type BootstrapStepId,
} from '@/lib/stores/useWorkspaceBootstrapStore';
import { cn } from '@/lib/utils';

type StatusBeat = {
  id: string;
  title: string;
  subtitle: string;
  Icon: LucideIcon;
  step: BootstrapStepId;
};

const STATUS_BEATS: StatusBeat[] = [
  {
    id: 'prepare',
    title: 'Preparing your personalized workspace…',
    subtitle: 'Setting up a secure trading environment',
    Icon: Sparkles,
    step: 'session',
  },
  {
    id: 'profile',
    title: 'Synchronizing your profile…',
    subtitle: 'Pulling your account identity and permissions',
    Icon: UserRound,
    step: 'profile',
  },
  {
    id: 'preferences',
    title: 'Loading your preferences…',
    subtitle: 'Applying theme, risk, and display settings',
    Icon: Zap,
    step: 'preferences',
  },
  {
    id: 'accounts',
    title: 'Connecting your secure session…',
    subtitle: 'Establishing encrypted broker and API channels',
    Icon: Shield,
    step: 'accounts',
  },
  {
    id: 'workspace',
    title: 'Optimizing your experience…',
    subtitle: 'Warming analytics and portfolio intelligence',
    Icon: Cloud,
    step: 'workspace',
  },
  {
    id: 'final',
    title: 'Finalizing your dashboard…',
    subtitle: 'Composing your live overview',
    Icon: Loader2,
    step: 'workspace',
  },
  {
    id: 'welcome',
    title: 'Welcome! Your profile is ready.',
    subtitle: 'Opening your trading workspace…',
    Icon: Check,
    step: 'ready',
  },
];

function pickBeat(completed: BootstrapStepId[]): StatusBeat {
  if (completed.includes('ready')) {
    return STATUS_BEATS[STATUS_BEATS.length - 1];
  }
  if (completed.includes('workspace')) {
    return STATUS_BEATS.find((b) => b.id === 'final') ?? STATUS_BEATS[5];
  }
  if (completed.includes('accounts')) {
    return STATUS_BEATS.find((b) => b.id === 'accounts') ?? STATUS_BEATS[3];
  }
  if (completed.includes('preferences')) {
    return STATUS_BEATS.find((b) => b.id === 'preferences') ?? STATUS_BEATS[2];
  }
  if (completed.includes('profile')) {
    return STATUS_BEATS.find((b) => b.id === 'profile') ?? STATUS_BEATS[1];
  }
  return STATUS_BEATS[0];
}

export function WorkspaceBootstrapScreen() {
  const active = useWorkspaceBootstrapStore((s) => s.active);
  const exiting = useWorkspaceBootstrapStore((s) => s.exiting);
  const completedSteps = useWorkspaceBootstrapStore((s) => s.completedSteps);
  const finish = useWorkspaceBootstrapStore((s) => s.finish);

  React.useEffect(() => {
    if (!exiting) return;
    const id = window.setTimeout(() => finish(), 900);
    return () => window.clearTimeout(id);
  }, [exiting, finish]);

  const beat = pickBeat(completedSteps);
  const progress = bootstrapProgress(completedSteps);
  const Icon = beat.Icon;

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key="workspace-bootstrap"
          className="fixed inset-0 z-[200] flex items-center justify-center overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: exiting ? 0 : 1, scale: exiting ? 1.02 : 1 }}
          exit={{ opacity: 0, scale: 1.03 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          aria-live="polite"
          aria-busy={!exiting}
          role="status"
        >
          {/* Atmosphere */}
          <div className="absolute inset-0 bg-[radial-gradient(1200px_700px_at_50%_-10%,color-mix(in_srgb,var(--primary)_22%,transparent),transparent_60%),linear-gradient(160deg,#f7fbfc_0%,#eef6f8_45%,#f8fafb_100%)] dark:bg-[radial-gradient(1000px_600px_at_50%_-10%,color-mix(in_srgb,var(--primary)_28%,transparent),transparent_55%),linear-gradient(165deg,#0b1214_0%,#101a1d_50%,#0d1416_100%)]" />
          <motion.div
            className="pointer-events-none absolute -left-24 top-1/4 h-72 w-72 rounded-full bg-[color-mix(in_srgb,var(--primary)_18%,transparent)] blur-3xl"
            animate={{ x: [0, 30, 0], y: [0, -20, 0], opacity: [0.45, 0.7, 0.45] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="pointer-events-none absolute -right-16 bottom-1/5 h-80 w-80 rounded-full bg-[color-mix(in_srgb,var(--teal-tint-1)_35%,transparent)] blur-3xl"
            animate={{ x: [0, -24, 0], y: [0, 18, 0], opacity: [0.35, 0.6, 0.35] }}
            transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Soft grid */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.35] dark:opacity-[0.18]"
            style={{
              backgroundImage:
                'linear-gradient(color-mix(in srgb, var(--primary) 12%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb, var(--primary) 12%, transparent) 1px, transparent 1px)',
              backgroundSize: '48px 48px',
              maskImage: 'radial-gradient(ellipse at center, black 20%, transparent 75%)',
            }}
          />

          <motion.div
            className="relative z-10 mx-6 w-full max-w-[440px]"
            initial={{ opacity: 0, y: 18, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="rounded-[28px] border border-[color-mix(in_srgb,var(--primary)_18%,var(--card-border))] bg-[color-mix(in_srgb,var(--card)_82%,transparent)] p-8 shadow-[0_24px_80px_-28px_color-mix(in_srgb,var(--primary)_35%,transparent)] backdrop-blur-2xl">
              <div className="mb-8 flex justify-center">
                <BrandLogo size="lg" />
              </div>

              <div className="relative mx-auto mb-7 flex h-24 w-24 items-center justify-center">
                <motion.div
                  className="absolute inset-0 rounded-full border border-[color-mix(in_srgb,var(--primary)_25%,transparent)]"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
                />
                <motion.div
                  className="absolute inset-2 rounded-full border border-dashed border-[color-mix(in_srgb,var(--primary)_35%,transparent)]"
                  animate={{ rotate: -360 }}
                  transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
                />
                <motion.div
                  className="absolute inset-0 rounded-full bg-[color-mix(in_srgb,var(--primary)_12%,transparent)] blur-md"
                  animate={{ opacity: [0.4, 0.85, 0.4], scale: [0.92, 1.05, 0.92] }}
                  transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
                />
                <AnimatePresence mode="wait">
                  <motion.div
                    key={beat.id}
                    className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-[color-mix(in_srgb,var(--primary)_22%,var(--card-border))] bg-card shadow-[0_0_0_1px_color-mix(in_srgb,var(--primary)_8%,transparent),0_12px_40px_-16px_color-mix(in_srgb,var(--primary)_45%,transparent)]"
                    initial={{ opacity: 0, scale: 0.7, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.85, y: -8 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <Icon
                      className={cn(
                        'h-6 w-6 text-primary',
                        beat.id === 'final' && 'animate-spin',
                      )}
                      strokeWidth={1.75}
                    />
                  </motion.div>
                </AnimatePresence>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={beat.title}
                  className="min-h-[88px] text-center"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                >
                  <p className="text-[17px] font-semibold tracking-tight text-foreground sm:text-lg">
                    {beat.title}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {beat.subtitle}
                  </p>
                </motion.div>
              </AnimatePresence>

              <div className="mt-6 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  <span>Workspace sync</span>
                  <span className="tabular-nums text-primary">{progress}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--primary)_10%,var(--muted))]">
                  <motion.div
                    className="h-full rounded-full bg-[linear-gradient(90deg,var(--primary),color-mix(in_srgb,var(--teal-tint-1)_70%,var(--primary)))]"
                    initial={false}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
              </div>

              <div className="mt-6 flex items-center justify-center gap-1.5">
                {([0, 1, 2] as const).map((i) => (
                  <motion.span
                    key={i}
                    className="h-1.5 w-1.5 rounded-full bg-primary/50"
                    animate={{ opacity: [0.25, 1, 0.25], scale: [0.85, 1.15, 0.85] }}
                    transition={{
                      duration: 1.4,
                      repeat: Infinity,
                      delay: i * 0.18,
                      ease: 'easeInOut',
                    }}
                  />
                ))}
              </div>
            </div>

            <p className="mt-5 text-center text-[11px] tracking-wide text-muted-foreground/80">
              Bank-level security · Real-time sync · Private session
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
