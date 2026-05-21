"use client";

import React, { useRef, useEffect, useState } from "react";
import { motion, useInView } from "framer-motion";
import { BarChart3, Gauge, Layers3, Sparkles } from "lucide-react";

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
    border: "border-violet-400/20",
    glow: "rgba(167,139,250,0.15)",
    iconColor: "text-violet-400",
    iconBg: "bg-violet-400/10 border-violet-400/20",
    barColor: "from-violet-400 to-violet-600",
    gradBg: "from-violet-500/[0.07] to-transparent",
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
    border: "border-emerald-400/20",
    glow: "rgba(52,211,153,0.15)",
    iconColor: "text-emerald-400",
    iconBg: "bg-emerald-400/10 border-emerald-400/20",
    barColor: "from-emerald-400 to-emerald-600",
    gradBg: "from-emerald-500/[0.07] to-transparent",
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
    border: "border-cyan-400/20",
    glow: "rgba(34,211,238,0.15)",
    iconColor: "text-cyan-400",
    iconBg: "bg-cyan-400/10 border-cyan-400/20",
    barColor: "from-cyan-400 to-cyan-600",
    gradBg: "from-cyan-500/[0.07] to-transparent",
    countTarget: 10,
  },
];

function PillarCard({ pillar, index }: { pillar: typeof pillars[0]; index: number }) {
  const [hovered, setHovered] = useState(false);
  const Icon = pillar.icon;

  return (
    <motion.article
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, delay: index * 0.1, ease: [0.23, 1, 0.32, 1] }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`group relative overflow-hidden rounded-[24px] border ${pillar.border} bg-white/[0.02] p-7 cursor-default transition-all duration-500`}
      style={{
        boxShadow: hovered ? `0 20px 60px ${pillar.glow}, 0 0 0 1px rgba(255,255,255,0.06)` : "none",
        transform: hovered ? "translateY(-6px)" : "translateY(0)",
      }}
    >
      {/* Background gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${pillar.gradBg} opacity-60 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`} />
      {/* Shimmer on hover */}
      <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.07),transparent_35%)] opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none" />
      {/* Top accent line */}
      <motion.div
        animate={{ opacity: hovered ? 1 : 0.3, scaleX: hovered ? 1 : 0.6 }}
        transition={{ duration: 0.4 }}
        className={`absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-current to-transparent ${pillar.iconColor} pointer-events-none`}
        style={{ originX: "50%" }}
      />

      <div className="relative z-10">
        {/* Icon */}
        <motion.div
          animate={{ rotate: hovered ? [0, -8, 8, 0] : 0 }}
          transition={{ duration: 0.6 }}
          className={`inline-flex w-12 h-12 items-center justify-center rounded-2xl border ${pillar.iconBg} mb-6`}
        >
          <Icon className={`w-5 h-5 ${pillar.iconColor}`} />
        </motion.div>

        {/* Title */}
        <h3 className="text-xl font-bold tracking-tight text-white mb-3">{pillar.title}</h3>
        <p className="text-sm leading-relaxed text-white/55 mb-6">{pillar.description}</p>

        {/* Metric */}
        <div className="flex items-end gap-2 mb-4">
          <span className={`text-3xl font-extrabold font-mono tracking-tight ${pillar.iconColor}`}>
            {pillar.metric}
          </span>
          <span className="text-[11px] text-white/35 uppercase tracking-widest mb-1 font-semibold">
            {pillar.metricLabel}
          </span>
        </div>

        {/* Animated bar */}
        <div className="h-1 w-full rounded-full bg-white/[0.06] overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            whileInView={{ width: `${Math.min(100, pillar.countTarget * 8)}%` }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 + index * 0.1, duration: 1.2, ease: [0.23, 1, 0.32, 1] }}
            className={`h-full rounded-full bg-gradient-to-r ${pillar.barColor}`}
          />
        </div>
      </div>
    </motion.article>
  );
}

export function ValuePillars() {
  return (
    <section className="relative py-24 md:py-28 overflow-hidden" aria-labelledby="value-pillars-title">
      {/* Ambient glows */}
      <div className="pointer-events-none absolute inset-0 opacity-50">
        <div className="absolute -top-20 left-1/2 h-48 w-56 -translate-x-1/2 rounded-full bg-violet-500/15 blur-[80px]" />
        <div className="absolute bottom-0 left-20 h-36 w-44 rounded-full bg-emerald-500/10 blur-[60px]" />
        <div className="absolute bottom-0 right-20 h-36 w-44 rounded-full bg-cyan-500/10 blur-[60px]" />
      </div>

      <div className="container relative z-10 mx-auto px-6">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mx-auto mb-14 max-w-3xl text-center"
        >
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/[0.1] bg-white/[0.03] px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.28em] text-white/60">
            <Sparkles className="h-3.5 w-3.5 text-violet-300" />
            Product Experience
          </p>
          <h2
            id="value-pillars-title"
            className="text-4xl font-extrabold leading-tight tracking-[-0.02em] text-white sm:text-5xl"
          >
            Built For Speed,{" "}
            <span
              className="text-transparent bg-clip-text"
              style={{ backgroundImage: "linear-gradient(135deg, #a78bfa, #6366f1, #22d3ee)" }}
            >
              Clarity, and Control
            </span>
          </h2>
          <p className="mt-4 text-base leading-relaxed text-white/50 sm:text-lg max-w-2xl mx-auto">
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
