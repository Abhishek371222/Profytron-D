'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

type TreeNode = {
  label: string;
  value: string;
  tone: string;
};

type AffiliateTreeSceneProps = {
  title: string;
  subtitle: string;
  nodes: TreeNode[];
  accentClassName?: string;
};

export function AffiliateTreeScene({ title, subtitle, nodes, accentClassName }: AffiliateTreeSceneProps) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative overflow-hidden rounded-[32px] border border-border bg-card p-5 shadow-card">
      <div className={cn('absolute inset-0 bg-[radial-gradient(circle_at_top,_color-mix(in_srgb,var(--primary)_22%,transparent),_transparent_52%)]', accentClassName)} />
      <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:32px_32px]" />
      <motion.div
        className="absolute -right-10 top-4 h-28 w-28 rounded-full bg-chart-5/10 blur-3xl"
        animate={reduceMotion ? undefined : { x: [-12, 12, -12], y: [0, 10, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -left-14 bottom-6 h-32 w-32 rounded-full bg-chart-2/10 blur-3xl"
        animate={reduceMotion ? undefined : { x: [0, 14, 0], y: [0, -8, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 0.35 }}
      />

      <div className="relative z-10 flex items-start justify-between gap-4 mb-6">
        <div>
          <p className="text-micro font-semibold uppercase tracking-[0.32em] text-foreground/30">{title}</p>
          <p className="mt-2 max-w-xl text-sm text-foreground/60">{subtitle}</p>
        </div>
        <div className="rounded-full border border-chart-3/20 bg-chart-3/10 px-3 py-1 text-micro font-semibold uppercase tracking-[0.24em] text-chart-3">
          Live growth map
        </div>
      </div>

      <div className="relative z-10 min-h-[300px] rounded-[28px] border border-border bg-foreground/5 p-4 md:p-6">
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 900 460" fill="none" aria-hidden="true">
          <motion.path
            d="M450 60 C 410 110, 360 150, 310 190 S 210 275, 150 330"
            stroke="color-mix(in srgb, var(--primary) 32%, transparent)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="10 12"
            animate={reduceMotion ? undefined : { pathLength: [0.35, 1, 0.35] }}
            transition={{ duration: 5.2, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.path
            d="M450 60 C 492 112, 540 150, 592 198 S 698 280, 772 336"
            stroke="color-mix(in srgb, var(--chart-5) 28%, transparent)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="10 12"
            animate={reduceMotion ? undefined : { pathLength: [1, 0.45, 1] }}
            transition={{ duration: 5.6, repeat: Infinity, ease: 'easeInOut', delay: 0.35 }}
          />
          <motion.path
            d="M450 110 C 430 170, 420 220, 452 282 S 520 340, 588 372"
            stroke="color-mix(in srgb, var(--accent) 45%, transparent)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="8 10"
            animate={reduceMotion ? undefined : { pathLength: [0.5, 1, 0.5] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 0.25 }}
          />
        </svg>

        <div className="absolute left-1/2 top-5 h-2 w-56 -translate-x-1/2 rounded-full bg-gradient-to-r from-transparent via-chart-5/50 to-transparent blur-sm" />

        <motion.div
          className="absolute left-1/2 top-6 -translate-x-1/2"
          animate={reduceMotion ? undefined : { y: [0, 8, 0], scale: [1, 1.05, 1] }}
          transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-full border border-border bg-gradient-to-br from-white/10 via-primary/20 to-chart-5/10 shadow-[0_0_30px_color-mix(in_srgb,var(--primary)_22%,transparent)]">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-primary/30 bg-primary/15 text-xs font-bold uppercase tracking-[0.3em] text-foreground">
              Root
            </div>
          </div>
        </motion.div>

        <div className="absolute left-1/2 top-[98px] -translate-x-1/2 rounded-full border border-border bg-foreground/10 px-4 py-1 text-micro font-semibold uppercase tracking-[0.28em] text-foreground/45 backdrop-blur-sm">
          Network origin
        </div>

        <div className="relative z-10 grid gap-4 pt-28 md:grid-cols-2 xl:grid-cols-5">
          {nodes.map((node, index) => (
            <motion.div
              key={node.label}
              initial={reduceMotion ? false : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: index * 0.08 }}
              whileHover={reduceMotion ? undefined : { y: -4, scale: 1.02 }}
              className="relative overflow-hidden rounded-[24px] border border-border bg-foreground/4 p-4 backdrop-blur-sm"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_60%)]" />
              <div className="absolute right-3 top-3 h-16 w-16 rounded-full bg-foreground/5 blur-2xl" />
              <div className="relative flex items-start justify-between gap-3">
                <div>
                  <p className={cn('text-xs font-semibold uppercase tracking-[0.25em]', node.tone)}>{node.label}</p>
                  <p className="mt-2 text-sm text-foreground/60">{node.value}</p>
                </div>
                <motion.div
                  className="h-3 w-3 rounded-full bg-foreground/50"
                  animate={reduceMotion ? undefined : { opacity: [0.45, 1, 0.45], scale: [1, 1.2, 1] }}
                  transition={{ duration: 2.2 + index * 0.2, repeat: Infinity, ease: 'easeInOut' }}
                />
              </div>
              <div className="relative mt-3 flex items-center gap-2 text-micro font-semibold uppercase tracking-[0.22em] text-foreground/25">
                <span className="h-1.5 w-1.5 rounded-full bg-foreground/40" />
                Branch {index + 1}
              </div>
              <div className="relative mt-4 h-1 overflow-hidden rounded-full bg-foreground/8">
                <motion.div
                  className={cn('absolute inset-y-0 left-0 rounded-full bg-gradient-to-r', index % 2 === 0 ? 'from-primary via-chart-5 to-chart-3' : 'from-chart-4 via-chart-5 to-destructive')}
                  initial={{ width: '22%' }}
                  animate={reduceMotion ? undefined : { width: ['22%', '82%', '22%'] }}
                  transition={{ duration: 4 + index * 0.2, repeat: Infinity, ease: 'easeInOut' }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
