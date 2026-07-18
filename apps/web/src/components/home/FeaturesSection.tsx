'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Bot,
  LineChart,
  Shield,
  Zap,
  Copy,
  Brain,
} from 'lucide-react';
import { durationSeconds, MOTION_EASING } from '@/platform/motion';
import { LandingPrimaryLink } from '@/components/home/LandingButtons';

const FEATURES = [
  {
    icon: Bot,
    title: 'Automated trading bots',
    body: 'Deploy strategies with risk controls — paper or live MT5.',
  },
  {
    icon: Brain,
    title: 'Alpha Coach',
    body: 'Ask questions, review trades, and get calm guidance in context.',
  },
  {
    icon: Copy,
    title: 'Copy trading',
    body: 'Follow proven strategies with transparent performance.',
  },
  {
    icon: LineChart,
    title: 'Portfolio analytics',
    body: 'Equity, risk, and trade history in one precise view.',
  },
  {
    icon: Shield,
    title: 'Broker-connected security',
    body: 'Your capital stays at the broker — Profytron never holds funds.',
  },
  {
    icon: Zap,
    title: 'Real-time sync',
    body: 'MT5 positions and equity update without dashboard jank.',
  },
] as const;

/** Landing Features section — restores /#features. */
export function FeaturesSection() {
  return (
    <section
      id="features"
      className="landing-section relative py-20 sm:py-24"
      aria-labelledby="features-heading"
    >
      <div className="page-container max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{
            duration: durationSeconds('Slow'),
            ease: MOTION_EASING.Smooth as unknown as number[],
          }}
          className="mb-12 max-w-2xl"
        >
          <p className="landing-eyebrow mb-3">Features</p>
          <h2
            id="features-heading"
            className="brand-display-heading text-3xl sm:text-4xl text-foreground"
          >
            Everything you need to trade with confidence
          </h2>
          <p className="mt-4 text-base text-muted-foreground leading-relaxed">
            One platform for bots, copy trading, analytics, and AI coaching —
            precise, calm, and fast.
          </p>
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <motion.article
              key={f.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{
                duration: durationSeconds('Standard'),
                delay: i * 0.04,
                ease: MOTION_EASING.Out as unknown as number[],
              }}
              className="exp-marketing-card group rounded-2xl border border-[var(--card-border)] bg-[var(--exp-surface)] p-5 shadow-[var(--exp-shadow-card)] transition-[box-shadow,transform,border-color] duration-[var(--motion-standard,200ms)] hover:-translate-y-0.5 hover:border-[color-mix(in_srgb,var(--primary)_28%,var(--card-border))] hover:shadow-[var(--exp-shadow-card-hover)]"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <f.icon className="h-5 w-5" aria-hidden />
              </div>
              <h3 className="text-base font-semibold text-foreground">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {f.body}
              </p>
            </motion.article>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <LandingPrimaryLink href="/register">Get started</LandingPrimaryLink>
          <Link
            href="/pricing"
            className="inline-flex h-12 items-center justify-center rounded-[14px] border border-[var(--card-border)] bg-card/80 px-7 text-sm font-semibold text-foreground backdrop-blur-sm transition-colors duration-[var(--motion-fast,120ms)] hover:bg-card"
          >
            View pricing
          </Link>
        </div>
      </div>
    </section>
  );
}
