"use client";

import { motion } from "framer-motion";
import {
  BarChart3,
  Gauge,
  Lock,
  Activity,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TiltCard3D } from "@/components/animations/TiltCard3D";
import { durationSeconds, MOTION_EASING } from "@/platform/motion/motion-tokens";

const pillars = [
  {
    title: "Decision Clarity",
    description:
      "Signals are organized by confidence and regime so you can prioritize actions in seconds, not minutes.",
    icon: BarChart3,
    metric: "Real-Time",
    metricLabel: "Position Sync",
    metricIcon: Activity,
    metricGradient: true,
    iconBg: "bg-primary/10 border-primary/15",
    iconColor: "text-primary",
    barClass: "bg-gradient-to-r from-primary via-[var(--chart-5)] to-accent",
    barWidth: "72%",
  },
  {
    title: "Execution Discipline",
    description:
      "SL/TP controls, drawdown limiters, and exposure limits are built into every execution flow.",
    icon: Gauge,
    metric: "Built-In",
    metricLabel: "Risk Controls",
    metricIcon: ShieldCheck,
    metricGradient: false,
    metricColor: "text-emerald-500",
    iconBg: "bg-emerald-500/10 border-emerald-500/15",
    iconColor: "text-emerald-600",
    barClass: "bg-emerald-500",
    barWidth: "58%",
  },
  {
    title: "Full Custody, Always",
    description:
      "Your capital never leaves your own broker account. Profytron connects to execute trades on your behalf — we never hold or custody your funds.",
    icon: Lock,
    metric: "Non-Custodial",
    metricLabel: "By Design",
    metricIcon: ShieldCheck,
    metricGradient: true,
    iconBg: "bg-primary/10 border-primary/15",
    iconColor: "text-primary",
    barClass: "bg-gradient-to-r from-primary via-[var(--chart-5)] to-accent",
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
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{
        duration: durationSeconds("Slow"),
        delay: index * 0.1,
        ease: MOTION_EASING.Smooth as unknown as number[],
      }}
      className="h-full"
    >
      <TiltCard3D intensity={9} className="h-full max-sm:pointer-events-none">
        <article className="flex h-full flex-col rounded-[24px] border border-[var(--card-border)] bg-card p-7 shadow-[0_10px_40px_rgba(15,23,42,0.06)] transition-shadow hover:shadow-[0_16px_48px_rgba(15,23,42,0.08)] dark:shadow-[0_10px_40px_rgba(0,0,0,0.28)]">
          <div
            className={cn(
              "mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl border",
              pillar.iconBg,
            )}
          >
            <Icon className={cn("h-5 w-5", pillar.iconColor)} />
          </div>

          <h3 className="mb-3 text-xl font-bold tracking-tight text-foreground">
            {pillar.title}
          </h3>
          <p className="mb-8 min-h-[4.5rem] flex-1 text-sm leading-relaxed text-muted-foreground">
            {pillar.description}
          </p>

          <div className="mb-4 flex flex-wrap items-end justify-between gap-x-3 gap-y-1.5">
            <span
              className={cn(
                "whitespace-nowrap text-xl font-extrabold leading-none tracking-tight sm:text-2xl",
                pillar.metricGradient
                  ? "bg-gradient-to-r from-primary via-[var(--chart-5)] to-accent bg-clip-text text-transparent"
                  : pillar.metricColor,
              )}
            >
              {pillar.metric}
            </span>
            <span className="flex items-center gap-1.5 pb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              <MetricIcon className="h-3.5 w-3.5 shrink-0 opacity-70" />
              {pillar.metricLabel}
            </span>
          </div>

          <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: pillar.barWidth }}
              viewport={{ once: true }}
              transition={{
                delay: 0.35 + index * 0.1,
                duration: durationSeconds("Background"),
                ease: MOTION_EASING.Smooth as unknown as number[],
              }}
              className={cn("h-full rounded-full", pillar.barClass)}
            />
          </div>
        </article>
      </TiltCard3D>
    </motion.div>
  );
}

export function ValuePillars() {
  return (
    <section
      className="landing-section overflow-hidden"
      aria-labelledby="value-pillars-title"
    >
      <div
        aria-hidden
        className="value-pillars-dots pointer-events-none absolute top-6 left-0 h-64 w-64 sm:h-80 sm:w-80"
      />

      <div
        aria-hidden
        className="pointer-events-none absolute -top-20 right-0 h-[min(360px,50vw)] w-[min(520px,70vw)]"
      >
        <div className="absolute top-0 right-0 h-64 w-64 rounded-full bg-primary/12 blur-[90px]" />
        <div className="value-pillars-arc absolute inset-0" />
      </div>

      <div className="page-container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.55 }}
          className="mx-auto mb-14 max-w-3xl text-center sm:mb-16"
        >
          <div className="mb-5 flex justify-center">
            <span className="landing-eyebrow">
              <span className="landing-live-dot" aria-hidden />
              Product Experience
            </span>
          </div>

          <h2
            id="value-pillars-title"
            className="brand-display-heading text-balance text-3xl sm:text-4xl md:text-5xl"
          >
            Built For Speed,{" "}
            <span className="landing-gradient-text">
              Clarity, and Control
            </span>
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            A cleaner visual hierarchy and data grouping reduce cognitive load so you focus on
            trading decisions — not navigating dashboards.
          </p>
        </motion.div>

        <div className="grid items-stretch gap-6 md:grid-cols-3">
          {pillars.map((pillar, i) => (
            <PillarCard key={pillar.title} pillar={pillar} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
