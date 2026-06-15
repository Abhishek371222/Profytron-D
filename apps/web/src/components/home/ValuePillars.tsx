"use client";

import React, { useRef, useEffect, useState } from "react";
import { motion, useInView } from "framer-motion";
import { BarChart3, Gauge, Layers3, Sparkles } from "lucide-react";
import { WobbleCard } from "@/components/saasfly/wobble-card";
import { GlowingEffect } from "@/components/saasfly/glowing-effect";
import { AnimatedGradientText } from "@/components/saasfly/animated-gradient-text";

function useCountUp(target: number, duration = 1.8, startOnView = true) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  useEffect(() => {
    if (!inView && startOnView) return;
    let start = 0;
    const step = target / (duration * 60);
    const id = setInterval(() => {
      start += step;
      if (start >= target) { setValue(target); clearInterval(id); }
      else setValue(Math.floor(start));
    }, 1000 / 60);
    return () => clearInterval(id);
  }, [inView, target, duration, startOnView]);

  return { ref, value };
}

const pillars = [
  {
    title: "Decision Clarity",
    description:
      "Signals are grouped by confidence and regime so you can prioritize action in seconds, not minutes.",
    icon: BarChart3,
    metric: "4.6×",
    metricLabel: "faster review",
    accent: "violet",
    border: "border-chart-2/20",
    glow: "rgba(167,139,250,0.15)",
    iconColor: "text-chart-2",
    iconBg: "bg-chart-2/10 border-chart-2/20",
    barColor: "from-chart-2 to-chart-2",
    gradBg: "from-chart-2/[0.07] to-transparent",
    countTarget: 46,
  },
  {
    title: "Execution Discipline",
    description:
      "Pre-trade checks, slippage tolerance, and exposure limits are embedded into every execution flow.",
    icon: Gauge,
    metric: "< 50",
    metricLabel: "ms routing",
    accent: "emerald",
    border: "border-chart-3/20",
    glow: "rgba(52,211,153,0.15)",
    iconColor: "text-chart-3",
    iconBg: "bg-chart-3/10 border-chart-3/20",
    barColor: "from-chart-3 to-chart-3",
    gradBg: "from-chart-3/[0.07] to-transparent",
    countTarget: 50,
  },
  {
    title: "Composable Workflows",
    description:
      "Build, backtest, and deploy with modular logic blocks that remain readable as strategies scale.",
    icon: Layers3,
    metric: "10+",
    metricLabel: "block types",
    accent: "cyan",
    border: "border-chart-5/20",
    glow: "rgba(34,211,238,0.15)",
    iconColor: "text-chart-5",
    iconBg: "bg-chart-5/10 border-chart-5/20",
    barColor: "from-chart-5 to-chart-5",
    gradBg: "from-chart-5/[0.07] to-transparent",
    countTarget: 10,
  },
];

function PillarCard({ pillar, index }: { pillar: typeof pillars[0]; index: number }) {
  const Icon = pillar.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, delay: index * 0.1, ease: [0.23, 1, 0.32, 1] }}
    >
      <WobbleCard
        containerClassName={`landing-glass-card border ${pillar.border} cursor-default`}
        className="p-7 h-full"
      >
        {/* SaaSfly GlowingEffect */}
        <GlowingEffect variant="default" spread={22} proximity={50} />

        {/* Background gradient */}
        <div className={`absolute inset-0 bg-gradient-to-br ${pillar.gradBg} opacity-60 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-[24px]`} />
        {/* Top accent line */}
        <div className={`absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-current to-transparent ${pillar.iconColor} pointer-events-none rounded-t-[24px]`} />

        <div className="relative z-10">
          <div className={`inline-flex w-12 h-12 items-center justify-center rounded-2xl border ${pillar.iconBg} mb-6`}>
            <Icon className={`w-5 h-5 ${pillar.iconColor}`} />
          </div>
          <h3 className="text-xl font-bold tracking-tight text-foreground mb-3">{pillar.title}</h3>
          <p className="text-sm leading-relaxed text-foreground/55 mb-6">{pillar.description}</p>
          <div className="flex items-end gap-2 mb-4">
            <span className={`text-3xl font-extrabold font-mono tracking-tight ${pillar.iconColor}`}>{pillar.metric}</span>
            <span className="text-caption text-foreground/35 uppercase tracking-widest mb-1 font-semibold">{pillar.metricLabel}</span>
          </div>
          <div className="h-1 w-full rounded-full bg-muted/6 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: `${Math.min(100, pillar.countTarget * 8)}%` }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 + index * 0.1, duration: 1.2, ease: [0.23, 1, 0.32, 1] }}
              className={`h-full rounded-full bg-gradient-to-r ${pillar.barColor}`}
            />
          </div>
        </div>
      </WobbleCard>
    </motion.div>
  );
}

export function ValuePillars() {
  return (
    <section className="relative py-16 sm:py-24 md:py-28 overflow-x-hidden" aria-labelledby="value-pillars-title">
      {/* Ambient glows */}
      <div className="pointer-events-none absolute inset-0 opacity-50">
        <div className="absolute -top-20 left-1/2 h-48 w-56 -translate-x-1/2 rounded-full bg-chart-2/15 blur-[80px]" />
        <div className="absolute bottom-0 left-20 h-36 w-44 rounded-full bg-chart-3/10 blur-[60px]" />
        <div className="absolute bottom-0 right-20 h-36 w-44 rounded-full bg-chart-5/10 blur-[60px]" />
      </div>

      <div className="page-container relative z-10">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mx-auto mb-14 max-w-3xl text-center"
        >
          <div className="mb-4 flex justify-center">
            <AnimatedGradientText className="text-foreground/70">
              <Sparkles className="h-3.5 w-3.5 text-chart-2 mr-2" />
              <span className="text-caption font-bold uppercase tracking-[0.28em]">Product Experience</span>
            </AnimatedGradientText>
          </div>
          <h2
            id="value-pillars-title"
            className="text-heading-1 sm:text-display-1 font-extrabold leading-tight tracking-tight text-foreground text-balance"
          >
            Built For Speed,{" "}
            <span
              className="text-transparent bg-clip-text"
              style={{ backgroundImage: "linear-gradient(135deg, #a78bfa, #6366f1, #22d3ee)" }}
            >
              Clarity, and Control
            </span>
          </h2>
          <p className="mt-4 text-base leading-relaxed text-foreground/50 sm:text-lg max-w-2xl mx-auto">
            A cleaner visual hierarchy and data grouping reduce cognitive load
            so you focus on trading decisions — not navigating dashboards.
          </p>
        </motion.div>

        {/* Cards */}
        <div className="grid gap-5 md:grid-cols-3">
          {pillars.map((pillar, i) => (
            <PillarCard key={pillar.title} pillar={pillar} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
