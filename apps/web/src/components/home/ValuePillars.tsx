"use client";

import { motion } from "framer-motion";
import {
  BarChart3,
  Gauge,
  Layers3,
  Zap,
  SlidersHorizontal,
  ShieldCheck,
  Puzzle,
} from "lucide-react";
import { cn } from "@/lib/utils";

const pillars = [
  {
    title: "Decision Clarity",
    description:
      "Signals are organized by confidence and regime so you can prioritize actions in seconds, not minutes.",
    icon: BarChart3,
    metric: "4.6×",
    metricLabel: "Faster Review",
    metricIcon: SlidersHorizontal,
    metricGradient: true,
    iconBg: "bg-[#47a7aa]/10 border-[#47a7aa]/15",
    iconColor: "text-[#47a7aa]",
    barClass: "bg-gradient-to-r from-[#47a7aa] via-[#1e6d48] to-[#5bbec1]",
    barWidth: "72%",
  },
  {
    title: "Execution Discipline",
    description:
      "Pre-built checks, stepwise logic, and exposure limits are embedded into every execution flow.",
    icon: Gauge,
    metric: "< 50",
    metricLabel: "Misrouting",
    metricIcon: ShieldCheck,
    metricGradient: false,
    metricColor: "text-emerald-500",
    iconBg: "bg-emerald-500/10 border-emerald-500/15",
    iconColor: "text-emerald-600",
    barClass: "bg-emerald-500",
    barWidth: "58%",
  },
  {
    title: "Composable Workflows",
    description:
      "Build, backtest, and deploy with modular logic blocks that remain reusable as strategies scale.",
    icon: Layers3,
    metric: "10+",
    metricLabel: "Block Types",
    metricIcon: Puzzle,
    metricGradient: true,
    iconBg: "bg-[#47a7aa]/10 border-[#47a7aa]/15",
    iconColor: "text-[#47a7aa]",
    barClass: "bg-gradient-to-r from-[#47a7aa] via-[#1e6d48] to-[#5bbec1]",
    barWidth: "86%",
  },
] as const;

function PillarCard({
  pillar,
  index,
}: {
  pillar: (typeof pillars)[number];
  index: number;
}) {
  const Icon = pillar.icon;
  const MetricIcon = pillar.metricIcon;

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.55, delay: index * 0.1, ease: [0.23, 1, 0.32, 1] }}
      className="h-full rounded-[24px] border border-[var(--card-border)] bg-card p-7 shadow-[0_10px_40px_rgba(15,23,42,0.06)] hover:shadow-[0_16px_48px_rgba(15,23,42,0.08)] transition-shadow"
    >
      <div
        className={cn(
          "inline-flex w-12 h-12 items-center justify-center rounded-2xl border mb-6",
          pillar.iconBg,
        )}
      >
        <Icon className={cn("w-5 h-5", pillar.iconColor)} />
      </div>

      <h3 className="text-xl font-bold tracking-tight text-foreground mb-3">
        {pillar.title}
      </h3>
      <p className="text-sm leading-relaxed text-muted-foreground mb-8 min-h-[4.5rem]">
        {pillar.description}
      </p>

      <div className="flex items-end justify-between gap-3 mb-4">
        <span
          className={cn(
            "text-3xl sm:text-[2rem] font-extrabold tracking-tight leading-none",
            pillar.metricGradient
              ? "text-transparent bg-clip-text bg-gradient-to-r from-[#47a7aa] via-[#1e6d48] to-[#5bbec1]"
              : pillar.metricColor,
          )}
        >
          {pillar.metric}
        </span>
        <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground pb-1">
          <MetricIcon className="w-3.5 h-3.5 shrink-0 opacity-70" />
          {pillar.metricLabel}
        </span>
      </div>

      <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: pillar.barWidth }}
          viewport={{ once: true }}
          transition={{ delay: 0.35 + index * 0.1, duration: 1.1, ease: [0.23, 1, 0.32, 1] }}
          className={cn("h-full rounded-full", pillar.barClass)}
        />
      </div>
    </motion.article>
  );
}

export function ValuePillars() {
  return (
    <section
      className="relative py-20 sm:py-28 overflow-hidden bg-[var(--bg-secondary)] dark:bg-background"
      aria-labelledby="value-pillars-title"
    >
      {/* Dot grid — top left */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-8 left-4 sm:left-12 w-48 h-48 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(circle, color-mix(in srgb, var(--muted-foreground) 35%, transparent) 1px, transparent 1px)",
          backgroundSize: "14px 14px",
        }}
      />

      {/* Purple glow + curved accent — top right */}
      <div aria-hidden className="pointer-events-none absolute -top-16 right-0 w-[min(520px,70vw)] h-[320px]">
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-[#47a7aa]/15 blur-[80px]" />
        <svg
          viewBox="0 0 400 200"
          className="absolute top-4 right-0 w-full h-auto text-[#5bbec1]/25"
          fill="none"
        >
          <path
            d="M20 180 C120 40, 280 20, 380 60"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <div className="page-container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.55 }}
          className="mx-auto mb-14 sm:mb-16 max-w-3xl text-center"
        >
          <div className="mb-5 flex justify-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#47a7aa]/25 bg-[#47a7aa]/[0.06] px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-[#47a7aa] dark:text-[#5bbec1]">
              <Zap className="h-3.5 w-3.5" />
              Product Experience
            </span>
          </div>

          <h2
            id="value-pillars-title"
            className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-[1.1] tracking-tight text-foreground text-balance"
          >
            Built For Speed,{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#47a7aa] via-[#1e6d48] to-[#5bbec1]">
              Clarity, and Control
            </span>
          </h2>

          <p className="mt-5 text-base sm:text-lg leading-relaxed text-muted-foreground max-w-2xl mx-auto">
            A cleaner visual hierarchy and data grouping reduce cognitive load so you focus on
            trading decisions — not navigating dashboards.
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-3">
          {pillars.map((pillar, i) => (
            <PillarCard key={pillar.title} pillar={pillar} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
