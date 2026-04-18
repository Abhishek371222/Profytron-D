"use client";

import { motion } from "motion/react";
import { BarChart3, Gauge, Layers3, Sparkles } from "lucide-react";

const pillars = [
  {
    title: "Decision Clarity",
    description:
      "Signals are grouped by confidence and regime so you can prioritize action in seconds.",
    icon: BarChart3,
    metric: "4.6x faster review",
    accent: "from-cyan-400/35 to-sky-500/10",
  },
  {
    title: "Execution Discipline",
    description:
      "Pre-trade checks, slippage tolerance, and exposure limits are embedded into every flow.",
    icon: Gauge,
    metric: "< 50 ms routing",
    accent: "from-emerald-400/30 to-teal-500/10",
  },
  {
    title: "Composable Workflows",
    description:
      "Build, backtest, and deploy with modular blocks that remain readable as strategies scale.",
    icon: Layers3,
    metric: "Reusable strategy blocks",
    accent: "from-amber-400/30 to-orange-500/10",
  },
];

export function ValuePillars() {
  return (
    <section className="relative py-24 md:py-28" aria-labelledby="value-pillars-title">
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute -top-16 left-1/2 h-44 w-44 -translate-x-1/2 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-16 h-36 w-36 rounded-full bg-emerald-500/15 blur-3xl" />
      </div>

      <div className="container relative z-10 mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="mx-auto mb-12 max-w-3xl text-center"
        >
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.28em] text-white/70">
            <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
            Product Experience Upgrade
          </p>
          <h2
            id="value-pillars-title"
            className="text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl"
          >
            Built For Speed, Readability, And Control
          </h2>
          <p className="mt-4 text-base leading-relaxed text-white/60 sm:text-lg">
            A cleaner visual hierarchy and clearer data grouping reduce cognitive load
            across desktop and mobile.
          </p>
        </motion.div>

        <div className="grid gap-5 md:grid-cols-3">
          {pillars.map((pillar, index) => {
            const Icon = pillar.icon;
            return (
              <motion.article
                key={pillar.title}
                initial={{ opacity: 0, y: 26 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{
                  duration: 0.55,
                  delay: index * 0.08,
                  ease: "easeOut",
                }}
                whileHover={{ y: -8, scale: 1.01 }}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#0c1018]/85 p-6 backdrop-blur-xl"
              >
                <div
                  className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${pillar.accent} opacity-70 transition-opacity duration-300 group-hover:opacity-100`}
                />
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.08),transparent_35%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                <div className="relative z-10">
                  <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-white/15 bg-black/20">
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold tracking-tight text-white">{pillar.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-white/65">{pillar.description}</p>
                  <p className="mt-6 inline-flex rounded-full border border-white/15 bg-black/25 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-cyan-100/90">
                    {pillar.metric}
                  </p>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
