"use client";

import { motion } from "framer-motion";
import {
  Database,
  BrainCircuit,
  Network,
  Rocket,
  Sparkles,
  Quote,
} from "lucide-react";
import { cn } from "@/lib/utils";

const steps = [
  {
    layer: "LAYER_01",
    title: "Exchange Integration",
    description:
      "Link your primary liquidity venues via secure, zero-knowledge API connections. We never hold or custody your assets.",
    icon: Database,
    theme: "violet" as const,
  },
  {
    layer: "LAYER_02",
    title: "Neural Profiling",
    description:
      "Our core engine ingests your risk tolerance, capital constraints, and latency requirements to build a unique trading fingerprint.",
    icon: BrainCircuit,
    theme: "violet" as const,
  },
  {
    layer: "LAYER_03",
    title: "Logic Assembly",
    description:
      "Compile algorithmic models using visual node graphs or deploy vetted institutional strategy templates instantly.",
    icon: Network,
    theme: "indigo" as const,
  },
  {
    layer: "LAYER_04",
    title: "Live Execution",
    description:
      "Push to production. The engine continuously routes orders, rebalances positions, and monitors drawdowns in real-time.",
    icon: Rocket,
    theme: "emerald" as const,
  },
];

const themeStyles = {
  violet: {
    layer: "text-violet-600",
    iconBg: "bg-violet-500/10 border-violet-500/15",
    icon: "text-violet-600",
    node: "bg-violet-500 shadow-[0_0_12px_rgba(139,92,246,0.5)]",
  },
  indigo: {
    layer: "text-indigo-600",
    iconBg: "bg-indigo-500/10 border-indigo-500/15",
    icon: "text-indigo-600",
    node: "bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.45)]",
  },
  emerald: {
    layer: "text-emerald-600",
    iconBg: "bg-emerald-500/10 border-emerald-500/15",
    icon: "text-emerald-600",
    node: "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.45)]",
  },
};

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
      initial={{ opacity: 0, x: 24 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="relative pl-10 sm:pl-12"
    >
      {/* Timeline node */}
      <div
        className={cn(
          "absolute left-[3px] top-8 z-10 h-[18px] w-[18px] rounded-full border-[3px] border-[var(--bg-secondary)] dark:border-background",
          t.node,
        )}
      />

      <div className="rounded-[20px] border border-[var(--card-border)] bg-card p-5 sm:p-6 shadow-[0_8px_32px_rgba(15,23,42,0.06)] flex gap-4 sm:gap-5">
        <div
          className={cn(
            "w-12 h-12 shrink-0 rounded-xl border flex items-center justify-center",
            t.iconBg,
          )}
        >
          <Icon className={cn("w-5 h-5", t.icon)} />
        </div>
        <div className="min-w-0 pt-0.5">
          <span
            className={cn(
              "text-[10px] font-bold uppercase tracking-[0.2em] font-mono",
              t.layer,
            )}
          >
            {step.layer}
          </span>
          <h3 className="text-lg font-bold text-foreground mt-1 mb-2 tracking-tight">
            {step.title}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {step.description}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="relative py-20 sm:py-28 overflow-hidden bg-[var(--bg-secondary)] dark:bg-background border-t border-[var(--card-border)]"
    >
      {/* Ambient blobs */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute top-20 left-1/4 w-72 h-72 rounded-full bg-violet-500/10 blur-[100px]" />
        <div className="absolute bottom-10 right-1/4 w-80 h-80 rounded-full bg-indigo-500/8 blur-[100px]" />
      </div>

      <div className="page-container relative z-10 max-w-[1280px]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 xl:gap-20 items-start">
          {/* ── Left ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55 }}
            className="lg:sticky lg:top-28"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-violet-500/25 bg-violet-500/[0.06] px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-violet-600 dark:text-violet-400 mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              Operational Alpha
            </span>

            <h2 className="text-3xl sm:text-4xl md:text-[2.75rem] font-extrabold leading-[1.08] tracking-tight text-foreground mb-5">
              Your Path to{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-500 via-indigo-500 to-cyan-400">
                Automated Mastery.
              </span>
            </h2>

            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-lg mb-10">
              We&apos;ve distilled decades of quantitative research into four actionable
              segments. Experience institutional deployment without the infrastructure overhead.
            </p>

            {/* Testimonial */}
            <div className="relative rounded-[20px] border border-violet-500/15 bg-gradient-to-br from-violet-500/[0.06] via-card to-card p-6 sm:p-8 shadow-[0_10px_40px_rgba(139,92,246,0.08)]">
              <Quote className="w-8 h-8 text-violet-400/50 mb-4" />
              <p className="text-base sm:text-lg text-foreground/90 leading-relaxed italic">
                &ldquo;The most sophisticated execution architecture I&apos;ve seen delivered
                outside of a tier-1 firm.&rdquo;
              </p>
              <div className="flex items-center gap-3 mt-6 pt-6 border-t border-[var(--card-border)]">
                <div className="w-10 h-10 rounded-xl bg-violet-500/15 border border-violet-500/20 flex items-center justify-center">
                  <Rocket className="w-4 h-4 text-violet-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">Dr. Alex Volkov</p>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground mt-0.5">
                    Head of Quant // Omega Desk
                  </p>
                </div>
              </div>

              {/* Wavy data path */}
              <svg
                aria-hidden
                viewBox="0 0 320 60"
                className="absolute -bottom-2 left-4 w-[min(240px,70%)] h-12 text-violet-400/25 pointer-events-none"
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
          </motion.div>

          {/* ── Right: timeline ── */}
          <div className="relative">
            {/* Vertical gradient line */}
            <div
              aria-hidden
              className="absolute left-[11px] top-6 bottom-6 w-[3px] rounded-full bg-gradient-to-b from-violet-500 via-indigo-500 to-emerald-500 opacity-80"
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
