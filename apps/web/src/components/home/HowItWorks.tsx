"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  Link2,
  ClipboardCheck,
  Store,
  Rocket,
  Quote,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TiltCard3D } from "@/components/animations/TiltCard3D";
import { durationSeconds, MOTION_EASING } from "@/platform/motion/motion-tokens";

const steps = [
  {
    layer: "STEP_01",
    title: "Connect Your Broker",
    description:
      "Link your MT5 trading account through an encrypted connection. Your funds stay at your broker — Profytron never holds or custodies your capital.",
    icon: Link2,
    theme: "violet" as const,
  },
  {
    layer: "STEP_02",
    title: "Set Your Risk Profile",
    description:
      "A short questionnaire captures your risk tolerance and capital constraints, so bot and strategy suggestions match how you actually want to trade.",
    icon: ClipboardCheck,
    theme: "violet" as const,
  },
  {
    layer: "STEP_03",
    title: "Choose a Strategy",
    description:
      "Subscribe to a vetted strategy from the marketplace or follow a proven trader through copy trading — no coding required.",
    icon: Store,
    theme: "indigo" as const,
  },
  {
    layer: "STEP_04",
    title: "Live, Monitored Execution",
    description:
      "Once live, the engine executes trades and tracks your equity and drawdown in real time, with risk limits that can pause a bot automatically.",
    icon: Rocket,
    theme: "emerald" as const,
  },
];

const themeStyles = {
  violet: {
    layer: "text-primary",
    iconBg: "bg-primary/10 border-primary/15",
    icon: "text-primary",
    node: "bg-primary shadow-[0_0_12px_color-mix(in_srgb,var(--primary)_50%,transparent)]",
  },
  indigo: {
    layer: "text-[var(--chart-5)]",
    iconBg: "bg-[var(--chart-5)]/10 border-[var(--chart-5)]/15",
    icon: "text-[var(--chart-5)]",
    node: "bg-[var(--chart-5)] shadow-[0_0_12px_color-mix(in_srgb,var(--chart-5)_45%,transparent)]",
  },
  emerald: {
    layer: "text-emerald-600 dark:text-emerald-400",
    iconBg: "bg-emerald-500/10 border-emerald-500/15",
    icon: "text-emerald-600 dark:text-emerald-400",
    node: "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.45)]",
  },
};

const TESTIMONIAL_QUOTE =
  "“Every strategy runs through the same four steps — connect, profile, choose, execute — so nothing reaches your capital without passing your own risk rules first.”";

const INTRO_COPY =
  "Four steps take you from signing up to live, monitored execution — no infrastructure to manage, no code required.";

function TimelineStep({
  step,
  index,
}: {
  step: (typeof steps)[number];
  index: number;
}) {
  const Icon = step.icon;
  const t = themeStyles[step.theme];

  return (
    <motion.div
      initial={{ opacity: 0, x: 28, scale: 0.98 }}
      whileInView={{ opacity: 1, x: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{
        duration: durationSeconds("Slow"),
        delay: index * 0.1,
        ease: MOTION_EASING.Smooth as unknown as number[],
      }}
      className="relative pl-10 sm:pl-12"
    >
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        viewport={{ once: true }}
        transition={{
          duration: durationSeconds("Standard"),
          delay: 0.12 + index * 0.1,
          ease: MOTION_EASING.SpringEase as unknown as number[],
        }}
        className={cn(
          "absolute left-[3px] top-8 z-10 h-[18px] w-[18px] rounded-full border-[3px] border-[var(--bg-secondary)] dark:border-background",
          t.node,
        )}
      />

      <div className="flex gap-4 rounded-[20px] border border-[var(--card-border)] bg-card p-5 shadow-[0_8px_32px_rgba(15,23,42,0.06)] sm:gap-5 sm:p-6 dark:shadow-[0_8px_32px_rgba(0,0,0,0.25)]">
        <div
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border",
            t.iconBg,
          )}
        >
          <Icon className={cn("h-5 w-5", t.icon)} />
        </div>
        <div className="min-w-0 pt-0.5">
          <span
            className={cn(
              "font-mono text-[10px] font-bold uppercase tracking-[0.2em]",
              t.layer,
            )}
          >
            {step.layer}
          </span>
          <h3 className="mt-1 mb-2 text-lg font-bold tracking-tight text-foreground">
            {step.title}
          </h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {step.description}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function QuoteCardBody() {
  return (
    <div className="relative rounded-[20px] border border-primary/20 bg-gradient-to-br from-primary/[0.08] via-card to-card p-6 shadow-[0_10px_40px_color-mix(in_srgb,var(--primary)_10%,transparent)] sm:p-8">
      <Quote className="mb-4 h-8 w-8 text-primary/70" />
      <p className="text-base leading-relaxed text-foreground sm:text-lg">
        {TESTIMONIAL_QUOTE}
      </p>
      <div className="mt-6 flex items-center gap-3 border-t border-[var(--card-border)] pt-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/15">
          <Rocket className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="text-sm font-bold text-foreground">Profytron Engineering</p>
          <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            Execution Design Principles
          </p>
        </div>
      </div>

      <svg
        aria-hidden
        viewBox="0 0 320 60"
        className="pointer-events-none absolute -bottom-2 left-4 h-12 w-[min(240px,70%)] text-primary/35"
        fill="none"
      >
        <path
          d="M0 30 Q 60 8, 120 32 T 240 28 T 320 20"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray="4 6"
        />
        <circle cx="120" cy="32" r="3" fill="currentColor" />
        <circle cx="240" cy="28" r="3" fill="currentColor" />
      </svg>
    </div>
  );
}

function QuoteCard() {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) return <QuoteCardBody />;

  return (
    <div className="max-sm:contents sm:block">
      <div className="sm:hidden">
        <QuoteCardBody />
      </div>
      <TiltCard3D intensity={8} className="hidden sm:block">
        <QuoteCardBody />
      </TiltCard3D>
    </div>
  );
}

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="landing-section overflow-hidden border-t border-[var(--card-border)]"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute top-20 left-1/4 h-72 w-72 rounded-full bg-primary/10 blur-[100px]" />
        <div className="absolute right-1/4 bottom-10 h-80 w-80 rounded-full bg-[var(--chart-5)]/8 blur-[100px]" />
      </div>

      <div className="page-container relative z-10 w-full">
        <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-2 xl:gap-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{
              duration: durationSeconds("Slow"),
              ease: MOTION_EASING.Smooth as unknown as number[],
            }}
            className="lg:sticky lg:top-28"
          >
            <span className="mb-6 inline-flex items-center gap-2 rounded-lg border border-primary/25 bg-card/80 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-primary shadow-sm">
              <span className="landing-live-dot" aria-hidden />
              Operational Alpha
            </span>

            <h2 className="brand-display-heading mb-5 text-3xl sm:text-4xl md:text-[2.75rem]">
              Your Path to{" "}
              <span className="brand-gradient-text">Automated Mastery.</span>
            </h2>

            <p className="mb-10 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
              {INTRO_COPY}
            </p>

            <QuoteCard />
          </motion.div>

          <div className="relative">
            <div
              aria-hidden
              className="absolute top-6 bottom-6 left-[11px] w-[3px] rounded-full bg-[var(--card-border)]"
            />
            <motion.div
              aria-hidden
              initial={{ scaleY: 0 }}
              whileInView={{ scaleY: 1 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{
                duration: durationSeconds("Hero"),
                ease: MOTION_EASING.Smooth as unknown as number[],
              }}
              style={{ transformOrigin: "top" }}
              className="absolute top-6 bottom-6 left-[11px] w-[3px] rounded-full bg-gradient-to-b from-primary via-[var(--chart-5)] to-emerald-500"
            />

            <div className="space-y-5 sm:space-y-6">
              {steps.map((step, i) => (
                <TimelineStep key={step.layer} step={step} index={i} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
