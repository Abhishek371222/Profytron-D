'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Zap, Cloud, TrendingUp, ArrowUpRight, type LucideIcon } from 'lucide-react';

interface AuthChartPanelProps {
  badgeLabel: string;
  badgeIcon: LucideIcon;
  headline: React.ReactNode;
  description: string;
}

// Badges live in the top band (top <= 26%); the curve is confined to the
// lower band (y >= 43% of the chart height) — the two never overlap.
const STAT_BADGES: {
  label: string;
  value: string;
  top: string;
  left?: string;
  right?: string;
}[] = [
  { label: 'Performance', value: '+12.5%', top: '8%', left: '2%' },
  { label: 'Strategies', value: '+3.2%', top: '20%', left: '35%' },
  { label: 'Portfolio', value: '+8.7%', top: '4%', right: '2%' },
];

const TRUST_ITEMS = [
  { icon: Shield, label: 'Bank-level security' },
  { icon: Zap, label: 'Real-time sync' },
  { icon: Cloud, label: '99.9% uptime' },
] as const;

// Smooth upward equity curve, confined to y ∈ [78, 142] (viewBox height 180)
// so it never enters the top ~43% where the floating badges live.
const CURVE_PATH = 'M10,140 C55,134 78,120 128,114 C168,110 186,122 218,110 C252,98 274,88 310,78';
const CURVE_FILL = `${CURVE_PATH} L310,180 L10,180 Z`;

function EquityChart() {
  return (
    <div className="relative mt-auto h-72 overflow-hidden rounded-card border border-border bg-card/80 p-6">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,color-mix(in_srgb,var(--foreground)_8%,transparent)_1px,transparent_1px),linear-gradient(to_bottom,color-mix(in_srgb,var(--foreground)_8%,transparent)_1px,transparent_1px)] bg-[size:20px_20px] opacity-25" />

      <svg viewBox="0 0 320 180" className="relative z-10 h-full w-full" aria-hidden="true">
        <defs>
          <linearGradient id="auth-chart-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="auth-chart-stroke" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--chart-5)" />
            <stop offset="100%" stopColor="var(--primary)" />
          </linearGradient>
          <filter id="auth-chart-glow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <motion.path
          d={CURVE_FILL}
          fill="url(#auth-chart-fill)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.9, delay: 0.5 }}
        />

        <motion.path
          d={CURVE_PATH}
          fill="none"
          stroke="url(#auth-chart-stroke)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#auth-chart-glow)"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.6, ease: 'easeOut' }}
        />

        <motion.circle
          cx="10"
          cy="140"
          r="3"
          fill="var(--chart-5)"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 0.6, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.6 }}
        />

        <motion.circle
          cx="310"
          cy="78"
          r="4.5"
          fill="var(--primary)"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 1.6 }}
        />
        <motion.circle
          cx="310"
          cy="78"
          r="4.5"
          fill="none"
          stroke="var(--primary)"
          strokeWidth="1.5"
          initial={{ opacity: 0, scale: 1 }}
          animate={{ opacity: [0.6, 0], scale: [1, 3.2] }}
          transition={{ duration: 1.8, delay: 1.9, repeat: Infinity, ease: 'easeOut' }}
        />
      </svg>

      {STAT_BADGES.map((badge, i) => (
        <motion.div
          key={badge.label}
          initial={{ opacity: 0, y: -10, scale: 0.92, filter: 'blur(4px)' }}
          animate={{ opacity: 1, y: [0, -5, 0], scale: 1, filter: 'blur(0px)' }}
          transition={{
            opacity: { duration: 0.5, delay: 0.9 + i * 0.14 },
            filter: { duration: 0.5, delay: 0.9 + i * 0.14 },
            scale: { duration: 0.5, delay: 0.9 + i * 0.14 },
            y: {
              duration: 3.4 + i * 0.4,
              delay: 1.3 + i * 0.14,
              repeat: Infinity,
              ease: 'easeInOut',
            },
          }}
          className="absolute flex items-center gap-2 rounded-input border border-border bg-card/95 py-1.5 pl-1.5 pr-3 shadow-[var(--shadow-md)] backdrop-blur-md"
          style={{ top: badge.top, left: badge.left, right: badge.right }}
        >
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[8px] bg-success/12 text-success">
            <ArrowUpRight className="h-3.5 w-3.5" />
          </div>
          <div>
            <p className="text-[10px] font-bold leading-tight text-success">{badge.value}</p>
            <p className="text-[10px] leading-tight text-muted-foreground">{badge.label}</p>
          </div>
        </motion.div>
      ))}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 1.7 }}
        className="absolute bottom-4 left-6 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-primary"
      >
        <TrendingUp className="h-3 w-3" />
        Live equity curve
      </motion.div>
    </div>
  );
}

export function AuthChartPanel({ badgeLabel, badgeIcon: BadgeIcon, headline, description }: AuthChartPanelProps) {
  return (
    <>
      <div className="mt-16 max-w-sm space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-caption font-semibold uppercase tracking-[0.2em] text-primary">
          <BadgeIcon className="h-3.5 w-3.5" />
          {badgeLabel}
        </div>
        <h2 className="brand-display-heading text-3xl sm:text-4xl">{headline}</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>

      <EquityChart />

      <div className="mt-6 flex items-center justify-between gap-3">
        {TRUST_ITEMS.map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Icon className="h-3.5 w-3.5 text-primary/70" />
            <span className="whitespace-nowrap">{label}</span>
          </div>
        ))}
      </div>
    </>
  );
}
