'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Bot, BarChart3, Shield, TrendingUp } from 'lucide-react';

const FEATURES = [
  {
    icon: Bot,
    title: 'Smart Automation',
    description: 'Build, backtest & deploy in minutes',
  },
  {
    icon: BarChart3,
    title: 'Real-time Analytics',
    description: 'Track performance and get actionable insights',
  },
  {
    icon: Shield,
    title: 'Bank-grade Security',
    description: 'Your data and funds are always protected',
  },
] as const;

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

        <div className="mt-10 max-w-md">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-card/80 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-primary shadow-[var(--shadow-sm)]">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            New Account
          </span>

          <h2 className="mt-5 text-[2rem] xl:text-[2.35rem] font-extrabold tracking-tight text-foreground leading-[1.12]">
            Create your{' '}
            <span className="text-gradient-hero">
              account
            </span>
          </h2>

          <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
            Set up your Profytron profile to access strategy automation, analytics
            intelligence, and secure broker connectivity.
          </p>
        </div>

        {/* Illustration — 3D hero asset in glass frame */}
        <div className="relative my-8 flex flex-1 items-center justify-center min-h-[240px]">
          <div className="relative w-full max-w-[400px]">
            <div className="absolute -inset-3 rounded-card bg-gradient-to-br from-primary/20 via-accent/15 to-transparent blur-xl" />
            <div className="relative overflow-hidden rounded-card border border-border/60 bg-card/40 p-2 shadow-[var(--shadow-lg)] backdrop-blur-sm">
              <div className="relative aspect-[4/3] overflow-hidden rounded-input bg-[#1E252B]">
                <Image
                  src="/hero/hero-trading-3d.png"
                  alt=""
                  fill
                  className="object-cover object-center scale-105"
                  sizes="400px"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1E252B]/80 via-transparent to-transparent" />

                {/* Floating stats overlay */}
                <div className="absolute left-4 top-4 rounded-input border border-white/10 bg-white/10 px-3 py-2 backdrop-blur-md">
                  <p className="text-[10px] font-medium text-white/70">Performance</p>
                  <p className="text-sm font-bold text-success">+12.4%</p>
                </div>
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between rounded-input border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-md">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-button bg-primary/30">
                      <TrendingUp className="h-4 w-4 text-teal-tint-6" />
                    </div>
                    <div>
                      <p className="text-[10px] text-white/60">Active strategies</p>
                      <p className="text-sm font-bold text-white">24 Live</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-success/20 px-2.5 py-1 text-[10px] font-semibold text-success">
                    Live
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-auto space-y-4">
          <div className="grid grid-cols-1 gap-2.5">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="flex items-center gap-3 rounded-card border border-border/60 bg-card/75 px-4 py-3 shadow-[var(--shadow-sm)] backdrop-blur-sm"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-input bg-primary/10 text-primary">
                  <Icon className="h-[18px] w-[18px]" aria-hidden />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{title}</p>
                  <p className="text-xs text-muted-foreground leading-snug">{description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3 pt-1">
            <span className="text-xs font-medium text-muted-foreground">Step 1 of 3</span>
            <div className="flex items-center gap-1.5" aria-hidden>
              <span className="h-1 w-8 rounded-full bg-primary" />
              <span className="h-1 w-1 rounded-full bg-primary/30" />
              <span className="h-1 w-1 rounded-full bg-primary/30" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
