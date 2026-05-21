"use client";

import React, { useState, useRef } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { Cpu, Workflow, Zap, Shield, ArrowRight, Activity } from "lucide-react";
import { FadeUp } from "@/components/animations";

/* Spotlight card — cursor glow follows mouse */
function SpotlightCard({
  children,
  className = "",
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const bg = useTransform(
    [mx, my],
    ([x, y]: number[]) =>
      `radial-gradient(380px circle at ${x}px ${y}px, rgba(99,102,241,0.09), transparent 60%)`
  );

  return (
    <div
      ref={ref}
      onMouseMove={(e) => {
        const r = ref.current?.getBoundingClientRect();
        if (r) { mx.set(e.clientX - r.left); my.set(e.clientY - r.top); }
      }}
      className={`relative overflow-hidden ${className}`}
      style={style}
    >
      <motion.div className="absolute inset-0 pointer-events-none z-10 transition-opacity duration-300" style={{ background: bg }} />
      {children}
    </div>
  );
}

/* Animated latency bar */
function LatencyBar() {
  return (
    <div className="inline-flex items-center gap-4 bg-black/60 border border-white/[0.07] px-5 py-3 rounded-xl backdrop-blur-md w-fit mt-8">
      <motion.div
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 1.6, repeat: Infinity }}
        className="w-2.5 h-2.5 bg-emerald-500 rounded-full"
        style={{ boxShadow: "0 0 10px rgba(16,185,129,0.5)" }}
      />
      <span className="text-xs font-mono text-white/50 uppercase tracking-wide">NY4 Cluster Active</span>
      <span className="text-xs font-mono text-emerald-400 font-bold">42μs</span>
    </div>
  );
}

/* Animated radar for Signal Core card */
function RadarVis() {
  return (
    <div className="absolute top-0 left-0 right-0 bottom-[195px] flex items-center justify-center pointer-events-none">
      <div className="relative w-[180px] h-[180px]">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="absolute inset-0 rounded-full border border-indigo-500/[0.12]"
            style={{ inset: `${i * 20}%` }}
          />
        ))}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-full h-px bg-indigo-500/[0.08]" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-px h-full bg-indigo-500/[0.08]" />
        </div>
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: "conic-gradient(from 0deg, transparent 72%, rgba(99,102,241,0.2) 92%, rgba(99,102,241,0.04) 100%)",
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "linear" }}
        />
        {[
          { top: "18%", left: "64%", delay: 0 },
          { top: "60%", left: "20%", delay: 1.2 },
          { top: "74%", left: "66%", delay: 2.5 },
        ].map((pos, i) => (
          <motion.div
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full bg-indigo-400"
            style={{ top: pos.top, left: pos.left }}
            animate={{ opacity: [0, 1, 0.2], scale: [0.8, 1.4, 1] }}
            transition={{ duration: 3.5, repeat: Infinity, delay: pos.delay }}
          />
        ))}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-400/50" />
        </div>
      </div>
    </div>
  );
}

/* Animated safety progress bar */
function SafetyBar() {
  return (
    <div className="bg-black/60 border border-white/[0.07] rounded-2xl p-5 flex flex-col gap-4">
      {[
        { label: "Drawdown Limit", val: "2.0%", progress: 65 },
        { label: "Daily Loss Cap",  val: "0.5%", progress: 28 },
      ].map(({ label, val, progress }) => (
        <div key={label}>
          <div className="flex justify-between text-[11px] font-mono uppercase text-white/35 mb-2">
            <span>{label}</span>
            <span className="text-cyan-400">{val}</span>
          </div>
          <div className="w-full h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
            <motion.div
              animate={{ width: [`${progress - 15}%`, `${progress}%`, `${progress - 15}%`] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="h-full bg-cyan-400 rounded-full"
              style={{ boxShadow: "0 0 8px rgba(34,211,238,0.5)" }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/* Animated strategy builder IDE preview */
function IDEPreview() {
  return (
    <div className="relative w-full max-w-[340px] h-[290px] border border-white/[0.08] rounded-2xl bg-[#080808] shadow-2xl overflow-hidden flex flex-col">
      {/* Window header */}
      <div className="h-10 bg-white/[0.02] border-b border-white/[0.05] flex items-center px-4 gap-2 shrink-0">
        {["bg-red-500/30", "bg-yellow-500/30", "bg-green-500/30"].map((c, i) => (
          <div key={i} className={`w-3 h-3 rounded-full ${c}`} />
        ))}
        <span className="ml-2 text-[10px] text-white/20 font-mono">strategy.canvas</span>
      </div>
      {/* Canvas */}
      <div
        className="relative flex-1 p-4 overflow-hidden"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.04) 1px, transparent 0)",
          backgroundSize: "16px 16px",
        }}
      >
        {/* Node 1 */}
        <motion.div
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-6 left-5 px-4 py-2 bg-[#1a1a1a] border border-white/[0.08] rounded-lg shadow-xl"
        >
          <span className="text-[11px] font-mono text-white/60">RSI &gt; 70</span>
        </motion.div>
        {/* Node 2 */}
        <motion.div
          animate={{ y: [0, 4, 0] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute top-[120px] left-10 px-4 py-2 bg-[#1a1a1a] border border-white/[0.08] rounded-lg shadow-xl"
        >
          <span className="text-[11px] font-mono text-white/60">MACD Cross</span>
        </motion.div>
        {/* Action node */}
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[68px] right-5 px-4 py-2 bg-indigo-500/10 border border-indigo-500/30 rounded-lg z-10"
          style={{ boxShadow: "0 0 16px rgba(99,102,241,0.15)" }}
        >
          <span className="text-[11px] font-mono font-bold text-indigo-400">EXECUTE SHORT</span>
        </motion.div>
        {/* SVG connections */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" fill="none" strokeWidth="1.5">
          <path d="M 95 40 Q 180 42 220 88" stroke="rgba(99,102,241,0.25)" strokeDasharray="5 4" />
          <path d="M 120 136 Q 175 135 220 88" stroke="rgba(99,102,241,0.2)" strokeDasharray="5 4" />
          <motion.circle
            cx={95} cy={40} r={3} fill="#6366f1"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <motion.circle
            cx={120} cy={136} r={3} fill="#6366f1"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.8 }}
          />
        </svg>
      </div>
    </div>
  );
}

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 relative overflow-hidden bg-[#050505]">
      {/* Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.07)_0%,transparent_68%)]" />
        <div className="absolute inset-0 bg-[url('/noise.svg')] mix-blend-overlay opacity-[0.08]" />
      </div>

      <div className="container mx-auto px-6 relative z-10 w-full max-w-[1400px]">
        {/* Section header */}
        <div className="max-w-3xl mb-20">
          <FadeUp>
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white/60 text-[10px] font-bold uppercase tracking-[0.4em] mb-8">
              <Cpu className="w-4 h-4 text-indigo-400" />
              <span>Features</span>
            </div>
            <h2 className="text-5xl md:text-7xl font-extrabold mb-8 leading-[1.08] tracking-[-0.03em] text-white">
              Built for{" "}
              <span className="text-white/25">Total</span>{" "}
              <br />
              <span
                className="text-transparent bg-clip-text"
                style={{
                  backgroundImage: "linear-gradient(135deg, #6366f1, #a855f7, #22d3ee)",
                  filter: "drop-shadow(0 0 20px rgba(99,102,241,0.25))",
                }}
              >
                Market Dominance.
              </span>
            </h2>
            <p className="text-white/40 text-xl leading-relaxed font-medium max-w-2xl">
              We abstracted the complexity of high-frequency trading infrastructure
              into a single, intuitive interface powered by smart analysis.
            </p>
          </FadeUp>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 w-full">
          {/* Card 1: Precision Execution — 8 cols */}
          <div className="col-span-1 md:col-span-8">
            <SpotlightCard className="rounded-[28px] border border-white/[0.06] bg-[#0d0d0d] h-[480px] flex flex-col justify-between overflow-hidden shadow-2xl group transition-all duration-500 hover:border-white/10">
              {/* Ambient glow */}
              <div className="absolute top-0 right-0 w-[420px] h-[420px] bg-indigo-500/[0.06] blur-[100px] rounded-full group-hover:bg-indigo-500/10 transition-all duration-700 pointer-events-none" />

              {/* Animated orbit visual */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[55%] h-full hidden sm:flex items-center justify-end pr-10 opacity-30 md:opacity-100 pointer-events-none overflow-hidden">
                <div className="relative w-[320px] h-[320px]">
                  {/* Orbit rings */}
                  {[0.9, 0.65, 0.4].map((scale, i) => (
                    <motion.div
                      key={i}
                      className="absolute inset-0 rounded-full border border-indigo-500/[0.1]"
                      style={{ inset: `${(1 - scale) * 50}%` }}
                      animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
                      transition={{ duration: 12 + i * 5, repeat: Infinity, ease: "linear" }}
                    />
                  ))}
                  {/* Orbiting dot */}
                  <motion.div
                    className="absolute w-2.5 h-2.5 rounded-full bg-white"
                    style={{
                      top: "50%", left: "50%",
                      boxShadow: "0 0 16px rgba(255,255,255,0.8)",
                    }}
                    animate={{
                      x: [0, 100, 190, 100, 0, -100, -190, -100, 0],
                      y: [-120, -85, 0, 85, 120, 85, 0, -85, -120],
                      opacity: [0, 0.8, 1, 0.8, 0, 0.8, 1, 0.8, 0],
                    }}
                    transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                  />
                  {/* Pulsing center */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.9, 0.5] }}
                      transition={{ duration: 2.5, repeat: Infinity }}
                      className="w-4 h-4 rounded-full bg-indigo-400/60"
                      style={{ boxShadow: "0 0 20px rgba(99,102,241,0.5)" }}
                    />
                  </div>
                </div>
              </div>

              <div className="relative z-10 w-full md:max-w-[52%] flex flex-col justify-center h-full p-10 md:p-14">
                <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center mb-8">
                  <Zap className="w-7 h-7 text-white/70" />
                </div>
                <h3 className="text-3xl font-bold text-white mb-4 tracking-tight">Zero-Latency Routing</h3>
                <p className="text-base text-white/45 leading-relaxed font-medium">
                  Colocated servers in NY4 and LD4 execute algorithmic trades in under
                  42 microseconds, ensuring you never miss the spread.
                </p>
                <LatencyBar />
              </div>
            </SpotlightCard>
          </div>

          {/* Card 2: Signal Core AI — 4 cols */}
          <div className="col-span-1 md:col-span-4">
            <SpotlightCard className="rounded-[28px] border border-white/[0.06] bg-[#0d0d0d] h-[480px] flex flex-col justify-end overflow-hidden shadow-2xl group transition-all duration-500 hover:border-indigo-500/20">
              <div
                className="absolute inset-0 opacity-[0.15]"
                style={{
                  backgroundImage: "radial-gradient(circle at 2px 2px, rgba(255,255,255,0.12) 1px, transparent 0)",
                  backgroundSize: "28px 28px",
                }}
              />
              <RadarVis />
              <div className="relative z-10 p-10 md:p-11">
                <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">Signal Core AI</h3>
                <p className="text-sm text-white/45 leading-relaxed font-medium">
                  Multi-modal reinforcement learning models scanning social, news, and
                  complex orderbook flow continuously.
                </p>
              </div>
            </SpotlightCard>
          </div>

          {/* Card 3: Safety Check — 4 cols */}
          <div className="col-span-1 md:col-span-4">
            <SpotlightCard className="rounded-[28px] border border-white/[0.06] bg-[#0d0d0d] h-[480px] flex flex-col justify-between overflow-hidden shadow-2xl group transition-all duration-500 hover:border-cyan-500/20">
              <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-30 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10 p-10 md:p-11">
                <div className="w-14 h-14 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-7">
                  <Shield className="w-7 h-7 text-cyan-400" style={{ filter: "drop-shadow(0 0 10px rgba(34,211,238,0.5))" }} />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">Safety Check</h3>
                <p className="text-sm text-white/45 leading-relaxed font-medium mb-8">
                  Automated circuit breakers halt execution during abnormal tail-risk
                  volatility events before losses compound.
                </p>
                <SafetyBar />
              </div>
            </SpotlightCard>
          </div>

          {/* Card 4: Visual Strategy Builder — 8 cols */}
          <div className="col-span-1 md:col-span-8">
            <SpotlightCard className="rounded-[28px] border border-white/[0.06] bg-[#0d0d0d] h-auto md:h-[480px] flex flex-col md:flex-row items-center justify-between overflow-hidden shadow-2xl group transition-all duration-500 hover:border-white/10 gap-10 md:gap-0">
              <div className="relative z-10 w-full md:w-[50%] flex flex-col justify-center h-full p-10 md:p-14">
                <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.07] flex items-center justify-center mb-8">
                  <Workflow className="w-7 h-7 text-white/65" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">Visual Strategy Builder</h3>
                <p className="text-base text-white/45 leading-relaxed font-medium mb-10">
                  Drag, drop, and connect execution logic blocks to build multi-dimensional
                  algorithms. Backtest instantly against 10 years of tick-level data.
                </p>
                <a
                  href="/strategies/builder"
                  className="group/btn relative inline-flex items-center w-fit gap-3 text-sm font-bold text-white px-7 py-3.5 rounded-xl transition-all"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-xl opacity-90 group-hover/btn:opacity-100 transition-opacity" />
                  <div className="absolute inset-[1px] bg-[#080808] rounded-[11px] group-hover/btn:bg-black/30 transition-colors" />
                  <span className="relative z-10 flex items-center gap-2 tracking-wide">
                    Open Canvas
                    <ArrowRight className="w-4 h-4 text-indigo-400 group-hover/btn:translate-x-1 transition-transform" />
                  </span>
                </a>
              </div>

              <div className="relative z-10 w-full md:w-[48%] h-[300px] md:h-full flex items-center justify-center md:justify-end pr-0 md:pr-10 pb-10 md:pb-0">
                <IDEPreview />
              </div>
            </SpotlightCard>
          </div>
        </div>
      </div>
    </section>
  );
}
