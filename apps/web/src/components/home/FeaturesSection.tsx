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
import { durationSeconds, MOTION_EASING } from '@/platform/motion/motion-tokens';
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

export function FeaturesSection() {
  return (
    <section
      id="features"
      className="landing-section relative py-20 sm:py-24"
      aria-labelledby="features-heading"
    >
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/25 to-transparent" />

      <div className="page-container max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20, clipPath: 'inset(10% 0 0 0)' }}
          whileInView={{ opacity: 1, y: 0, clipPath: 'inset(0% 0 0 0)' }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{
            duration: durationSeconds('Hero'),
            ease: MOTION_EASING.Smooth as unknown as number[],
          }}
          className="mb-12 max-w-2xl"
        >
          <p className="landing-eyebrow mb-4">Platform</p>
          <h2
            id="features-heading"
            className="brand-display-heading text-3xl text-foreground sm:text-4xl"
          >
            Everything you need to{' '}
            <span className="landing-gradient-text">trade with confidence</span>
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            One platform for forex trading bots, analytics, and AI coaching —
            precise, calm, and fast.
          </p>
        </motion.div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4">
          {FEATURES.map((f, i) => (
            <motion.article
              key={f.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{
                type: 'spring',
                stiffness: 320,
                damping: 28,
                delay: i * 0.05,
              }}
              whileHover={{ y: -4 }}
              className="group relative overflow-hidden rounded-2xl border border-[var(--card-border)] bg-[var(--exp-surface)] p-5 shadow-[var(--exp-shadow-card)] transition-[border-color,box-shadow] duration-200 hover:border-primary/30 hover:shadow-[var(--exp-shadow-card-hover)]"
            >
              <div
                aria-hidden
                className="absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-gradient-to-r from-primary to-[var(--chart-4)] transition-transform duration-300 group-hover:scale-x-100"
              />
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-primary/15 bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-105">
                  <f.icon className="h-5 w-5" aria-hidden />
                </div>
                <span className="font-mono text-[10px] font-bold tracking-[0.18em] text-muted-foreground/70">
                  {String(i + 1).padStart(2, '0')}
                </span>
              </div>
              <h3 className="text-base font-semibold tracking-tight text-foreground">
                {f.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {f.body}
              </p>
            </motion.article>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15, duration: 0.45 }}
          className="mt-10 flex flex-wrap gap-3"
        >
          <LandingPrimaryLink href="/register">Get started</LandingPrimaryLink>
          <Link
            href="/pricing"
            className="inline-flex h-12 items-center justify-center rounded-xl border border-[var(--card-border)] bg-card/80 px-7 text-sm font-semibold text-foreground backdrop-blur-sm transition-all duration-200 hover:-translate-y-px hover:bg-card hover:border-primary/25"
          >
            View pricing
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
