"use client";

import React from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Network, Database, BrainCircuit, Rocket } from "lucide-react";
import { FadeUp } from "@/components/animations";

const steps = [
  {
    title: "Exchange Integration",
    description:
      "Link your primary liquidity venues via secure, zero-knowledge API connections. We never hold or custody your assets.",
    icon: Database,
    badge: "Layer_01",
    color: "text-cyan-400",
    border: "border-cyan-400/20",
    glow: "rgba(34,211,238,0.12)",
    iconBg: "bg-cyan-400/10 border-cyan-400/20",
  },
  {
    title: "Neural Profiling",
    description:
      "Our core engine ingests your risk tolerance, capital constraints, and latency requirements to build a unique trading fingerprint.",
    icon: BrainCircuit,
    badge: "Layer_02",
    color: "text-violet-400",
    border: "border-violet-400/20",
    glow: "rgba(167,139,250,0.12)",
    iconBg: "bg-violet-400/10 border-violet-400/20",
  },
  {
    title: "Logic Assembly",
    description:
      "Compile algorithmic models using visual node graphs or deploy vetted institutional strategy templates instantly.",
    icon: Network,
    badge: "Layer_03",
    color: "text-indigo-400",
    border: "border-indigo-400/20",
    glow: "rgba(99,102,241,0.12)",
    iconBg: "bg-indigo-400/10 border-indigo-400/20",
  },
  {
    title: "Live Execution",
    description:
      "Push to production. The engine continuously routes orders, rebalances positions, and monitors drawdowns in real-time.",
    icon: Rocket,
    badge: "Layer_04",
    color: "text-emerald-400",
    border: "border-emerald-400/20",
    glow: "rgba(52,211,153,0.12)",
    iconBg: "bg-emerald-400/10 border-emerald-400/20",
  },
];

function StepCard({ step, index }: { step: typeof steps[0]; index: number }) {
  const Icon = step.icon;
  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, delay: index * 0.12, ease: [0.23, 1, 0.32, 1] }}
      className="flex flex-col md:flex-row gap-6 md:gap-10 relative group cursor-default"
    >
      {/* Icon */}
      <motion.div
        whileHover={{ scale: 1.08 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className={`w-[72px] h-[72px] rounded-2xl flex items-center justify-center shrink-0 z-10 border transition-all duration-500 group-hover:shadow-[0_0_30px_var(--glow)] ${step.iconBg}`}
        style={{ "--glow": step.glow } as React.CSSProperties}
      >
        <Icon className={`w-7 h-7 ${step.color} transition-colors`} />
      </motion.div>

      {/* Content */}
      <div className="flex-1 pt-1">
        <div className="flex items-center gap-4 mb-4">
          <span
            className={`text-[10px] font-mono tracking-[0.3em] uppercase px-3 py-1 rounded-full border ${step.border} ${step.color}`}
            style={{ background: "rgba(255,255,255,0.03)" }}
          >
            {step.badge}
          </span>
          <motion.div
            initial={{ width: "3rem" }}
            whileInView={{ width: "6rem" }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 + index * 0.1, duration: 0.7 }}
            className={`h-px bg-gradient-to-r from-current to-transparent ${step.color} opacity-30`}
          />
        </div>
        <h4 className={`text-2xl font-bold mb-3 tracking-tight text-white/85 group-hover:text-white transition-colors`}>
          {step.title}
        </h4>
        <p className="text-white/40 text-base leading-relaxed max-w-lg group-hover:text-white/60 transition-colors duration-400 font-medium">
          {step.description}
        </p>
      </div>
    </motion.div>
  );
}

export function HowItWorks() {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 0.8", "end 0.3"],
  });
  const lineH = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <section
      id="how-it-works"
      className="py-32 bg-[#020202] relative border-t border-white/[0.04] overflow-hidden"
    >
      {/* Background */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-indigo-500/[0.05] to-transparent blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-[0.06] mix-blend-overlay pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10 w-full max-w-[1400px]">
        <div className="flex flex-col lg:flex-row gap-20 lg:gap-28 items-start">

          {/* ── LEFT: sticky content ── */}
          <div className="lg:w-[45%] lg:sticky lg:top-36">
            <FadeUp>
              <div className="inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white/60 text-[10px] font-bold uppercase tracking-[0.4em] mb-8 relative">
                <motion.span
                  animate={{ scale: [1, 1.6, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute w-2 h-2 rounded-full bg-indigo-400 left-4"
                />
                <span className="w-2 h-2 rounded-full bg-indigo-400 relative" />
                <span>Operational Alpha</span>
              </div>

              <h3 className="text-5xl md:text-6xl font-extrabold mb-8 leading-[1.08] tracking-[-0.03em] text-white">
                Your Path to{" "}
                <br />
                <span
                  className="text-transparent bg-clip-text"
                  style={{
                    backgroundImage: "linear-gradient(135deg, #6366f1, #a855f7)",
                    filter: "drop-shadow(0 0 20px rgba(99,102,241,0.2))",
                  }}
                >
                  Automated Mastery.
                </span>
              </h3>

              <p className="text-white/40 text-lg mb-12 leading-relaxed font-medium">
                We've distilled decades of quantitative research into four actionable
                segments. Experience institutional deployment without the infrastructure overhead.
              </p>

              {/* Quote card */}
              <div className="p-8 rounded-[24px] bg-white/[0.02] border border-white/[0.06] relative overflow-hidden group hover:border-white/10 transition-colors duration-500">
                <div className="absolute -top-20 -right-20 w-44 h-44 bg-indigo-500/15 blur-[50px] rounded-full group-hover:scale-150 transition-transform duration-1000" />
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
                <p className="text-lg text-white/80 font-medium leading-relaxed relative z-10 italic">
                  "The most sophisticated execution architecture I've seen delivered
                  outside of a tier-1 firm."
                </p>
                <div className="flex items-center gap-4 mt-7 relative z-10">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center border border-white/[0.08]">
                    <Rocket className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm tracking-wide">Dr. Alex Volkov</p>
                    <p className="text-[10px] text-white/35 font-bold uppercase tracking-widest mt-0.5">Head of Quant // Omega Desk</p>
                  </div>
                </div>
              </div>
            </FadeUp>
          </div>

          {/* ── RIGHT: steps ── */}
          <div className="lg:w-[55%] relative pt-8 lg:pt-0" ref={containerRef}>
            {/* Animated connecting line */}
            <div className="absolute left-[35px] top-8 bottom-16 w-px bg-white/[0.05] hidden lg:block overflow-hidden">
              <motion.div
                className="w-full bg-gradient-to-b from-indigo-400 via-violet-400 to-emerald-400 absolute top-0 left-0"
                style={{ height: lineH }}
              />
            </div>

            <div className="space-y-12 md:space-y-16">
              {steps.map((step, i) => (
                <StepCard key={step.title} step={step} index={i} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
