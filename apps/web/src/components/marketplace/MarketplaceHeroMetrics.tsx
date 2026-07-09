"use client";

import React from "react";
import { motion } from "framer-motion";
import { LucideIcon, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

export type HeroMetric = {
  label: string;
  value: string;
  icon: LucideIcon;
  delta?: string;
  deltaPositive?: boolean;
  showSparkline?: boolean;
  showRing?: boolean;
  ringPct?: number;
};

function MetricSparkline({ positive = true }: { positive?: boolean }) {
  const stroke = positive ? "var(--chart-bull)" : "var(--chart-bear)";
  return (
    <svg viewBox="0 0 80 24" className="mt-3 h-6 w-full" aria-hidden>
      <defs>
        <linearGradient id="metricFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.2" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M 0 18 L 12 14 L 24 16 L 36 10 L 48 12 L 60 6 L 72 8 L 80 4 L 80 24 L 0 24 Z"
        fill="url(#metricFill)"
      />
      <polyline
        points="0,18 12,14 24,16 36,10 48,12 60,6 72,8 80,4"
        fill="none"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MetricRing({ pct }: { pct: number }) {
  const r = 14;
  const circ = 2 * Math.PI * r;
  return (
    <div className="mt-3 flex justify-end">
      <svg width="36" height="36" className="-rotate-90">
        <circle cx="18" cy="18" r={r} fill="none" stroke="var(--muted)" strokeWidth="3" />
        <circle
          cx="18"
          cy="18"
          r={r}
          fill="none"
          stroke="var(--primary)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ - (circ * pct) / 100}
        />
      </svg>
    </div>
  );
}

export function MarketplaceHeroMetrics({ metrics }: { metrics: HeroMetric[] }) {
  return (
    <div className="marketplace-hero-metrics-grid">
      {metrics.map((metric, i) => (
        <motion.div
          key={metric.label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.12 + i * 0.05, ease: "easeOut" }}
          whileHover={{ y: -2 }}
          className="marketplace-metric-card group relative min-w-0 overflow-hidden rounded-[16px] border border-[color-mix(in_srgb,var(--primary)_12%,var(--card-border))] bg-[color-mix(in_srgb,var(--card)_92%,transparent)] p-4 backdrop-blur-md transition-shadow duration-[250ms] hover:shadow-[0_8px_28px_color-mix(in_srgb,var(--primary)_10%,transparent)]"
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

          <div className="flex items-start justify-between gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-[color-mix(in_srgb,var(--primary)_12%,transparent)] text-primary transition-transform duration-200 group-hover:scale-105">
              <metric.icon className="h-4 w-4" />
            </div>
            {metric.delta && (
              <span
                className={cn(
                  "inline-flex max-w-[5.5rem] items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-bold leading-tight tabular-nums",
                  metric.deltaPositive !== false
                    ? "bg-[color-mix(in_srgb,var(--primary)_12%,transparent)] text-primary"
                    : "bg-[color-mix(in_srgb,var(--destructive)_12%,transparent)] text-destructive",
                )}
              >
                {metric.deltaPositive !== false && <TrendingUp className="h-2.5 w-2.5 shrink-0" />}
                <span className="truncate">{metric.delta}</span>
              </span>
            )}
          </div>

          <p className="mt-3 text-[clamp(1.125rem,1.4vw,1.375rem)] font-bold tabular-nums leading-none tracking-tight text-foreground">
            {metric.value}
          </p>
          <p className="mt-1.5 text-[10px] font-bold uppercase leading-snug tracking-[0.08em] text-muted-foreground [overflow-wrap:normal] [word-break:normal]">
            {metric.label}
          </p>

          {metric.showSparkline && <MetricSparkline positive={metric.deltaPositive !== false} />}
          {metric.showRing && metric.ringPct != null && <MetricRing pct={metric.ringPct} />}
        </motion.div>
      ))}
    </div>
  );
}
