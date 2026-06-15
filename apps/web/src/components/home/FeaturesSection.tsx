"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { Cpu, Workflow, Zap, Shield, ArrowRight, Activity } from "lucide-react";
import { FadeUp } from "@/components/animations";
import { GlowingEffect } from "@/components/saasfly/glowing-effect";
import { AnimatedGradientText } from "@/components/saasfly/animated-gradient-text";

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
    <div className="inline-flex items-center gap-3 bg-muted/60 border border-[var(--card-border)] px-4 py-2.5 rounded-xl w-fit mt-6">
      <span className="w-2 h-2 bg-chart-3 rounded-full shrink-0" />
      <span className="text-xs font-medium text-muted-foreground">NY4 cluster active</span>
      <span className="text-xs font-semibold text-chart-3">13ms</span>
    </div>
  );
}

/* Animated radar for Signal Core card */
function RadarVis() {
  return (
    <div className="relative w-[180px] h-[180px] mx-auto">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="absolute inset-0 rounded-full border border-primary/15"
          style={{ inset: `${i * 20}%` }}
        />
      ))}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-full h-px bg-primary/10" />
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-px h-full bg-primary/10" />
      </div>
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: "conic-gradient(from 0deg, transparent 72%, rgba(59,91,255,0.18) 92%, rgba(59,91,255,0.04) 100%)",
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
          className="absolute w-1.5 h-1.5 rounded-full bg-primary"
          style={{ top: pos.top, left: pos.left }}
          animate={{ opacity: [0, 1, 0.2], scale: [0.8, 1.4, 1] }}
          transition={{ duration: 3.5, repeat: Infinity, delay: pos.delay }}
        />
      ))}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-1.5 h-1.5 rounded-full bg-primary/50" />
      </div>
    </div>
  );
}

/* Animated safety progress bar */
function SafetyBar() {
  return (
    <div className="rounded-xl border border-[var(--card-border)] bg-muted/40 p-4 flex flex-col gap-4">
      {[
        { label: "Drawdown limit", val: "2.3%", progress: 65 },
        { label: "Daily loss cap", val: "0.5%", progress: 28 },
      ].map(({ label, val, progress }) => (
        <div key={label}>
          <div className="flex justify-between text-xs text-muted-foreground mb-2">
            <span>{label}</span>
            <span className="font-semibold text-chart-5">{val}</span>
          </div>
          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-chart-5 rounded-full" style={{ width: `${progress}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* Animated strategy builder IDE preview */
function IDEPreview() {
  return (
    <div className="relative w-full max-w-[340px] h-[260px] sm:h-[290px] border border-border rounded-card bg-card shadow-md overflow-hidden flex flex-col">
      {/* Window header */}
      <div className="h-10 bg-muted/2 border-b border-white/[0.05] flex items-center px-4 gap-2 shrink-0">
        {["bg-red-500/30", "bg-yellow-500/30", "bg-green-500/30"].map((c, i) => (
          <div key={i} className={`w-3 h-3 rounded-full ${c}`} />
        ))}
        <span className="ml-2 text-micro text-foreground/20 font-mono">strategy.canvas</span>
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
          <span className="text-caption font-mono text-foreground/60">RSI &gt; 70</span>
        </motion.div>
        {/* Node 2 */}
        <motion.div
          animate={{ y: [0, 4, 0] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute top-[120px] left-10 px-4 py-2 bg-[#1a1a1a] border border-white/[0.08] rounded-lg shadow-xl"
        >
          <span className="text-caption font-mono text-foreground/60">MACD Cross</span>
        </motion.div>
        {/* Action node */}
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[68px] right-5 px-4 py-2 bg-primary/10 border border-primary/30 rounded-lg z-10"
          style={{ boxShadow: "0 0 16px rgba(99,102,241,0.15)" }}
        >
          <span className="text-caption font-mono font-bold text-primary">EXECUTE SHORT</span>
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
    <section id="features" className="py-16 sm:py-24 relative overflow-x-hidden bg-transparent">
      {/* Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.07)_0%,transparent_68%)]" />
      </div>

      <div className="page-container relative z-10 w-full max-w-[1400px]">
        {/* Section header */}
        <div className="max-w-3xl mb-12 sm:mb-16 lg:mb-20">
          <FadeUp>
            <div className="mb-8">
              <AnimatedGradientText className="text-foreground/70">
                <Cpu className="w-4 h-4 text-primary mr-2" />
                <span className="text-micro font-bold uppercase tracking-[0.4em]">Features</span>
              </AnimatedGradientText>
            </div>
            <h2 className="text-heading-1 sm:text-display-1 font-extrabold mb-6 sm:mb-8 leading-tight tracking-tight text-foreground text-balance">
              Built for{" "}
              <span className="text-muted-foreground">Total</span>{" "}
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
            <p className="text-muted-foreground text-body-lg sm:text-xl leading-relaxed max-w-2xl">
              We abstracted the complexity of high-frequency trading infrastructure
              into a single, intuitive interface powered by smart analysis.
            </p>
          </FadeUp>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 w-full">
          {/* Card 1: Precision Execution — 8 cols */}
          <div className="col-span-1 md:col-span-8">
            <SpotlightCard className="landing-glass-card rounded-card min-h-[360px] sm:min-h-[420px] lg:min-h-[480px] flex flex-col justify-between overflow-hidden group transition-all duration-300 hover:border-primary/30">
              <GlowingEffect variant="indigo" spread={30} proximity={60} />
              {/* Ambient glow */}

              {/* Animated orbit visual */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[55%] h-full hidden sm:flex items-center justify-end pr-10 opacity-30 md:opacity-100 pointer-events-none overflow-hidden">
                <div className="relative w-[320px] h-[320px]">
                  {/* Orbit rings */}
                  {[0.9, 0.65, 0.4].map((scale, i) => (
                    <motion.div
                      key={i}
                      className="absolute inset-0 rounded-full border border-primary/[0.1]"
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
                      className="w-4 h-4 rounded-full bg-primary/60"
                      style={{ boxShadow: "0 0 20px rgba(99,102,241,0.5)" }}
                    />
                  </div>
                </div>
              </div>

              <div className="relative z-10 w-full md:max-w-[52%] flex flex-col justify-center h-full p-10 md:p-14">
                <div className="w-14 h-14 rounded-2xl bg-muted/4 border border-white/[0.07] flex items-center justify-center mb-8">
                  <Zap className="w-7 h-7 text-foreground/70" />
                </div>
                <h3 className="text-3xl font-bold text-foreground mb-4 tracking-tight">Fast Order Routing</h3>
                <p className="text-base text-muted-foreground leading-relaxed">
                  Low-latency execution through colocated servers so your strategies fill at the price you expect.
                </p>
                <LatencyBar />
              </div>
            </SpotlightCard>
          </div>

          {/* Card 2: Signal Core AI — 4 cols */}
          <div className="col-span-1 md:col-span-4">
            <SpotlightCard className="landing-glass-card rounded-card min-h-[360px] sm:min-h-[420px] lg:min-h-[480px] flex flex-col overflow-hidden group transition-all duration-300 hover:border-primary/25">
              <GlowingEffect variant="violet" spread={25} proximity={60} />
              <div className="flex-1 flex items-center justify-center p-8 pt-10 min-h-[220px]">
                <RadarVis />
              </div>
              <div className="relative z-10 p-8 md:p-10 border-t border-[var(--card-border)]">
                <h3 className="text-2xl font-bold text-foreground mb-3 tracking-tight">Signal Core AI</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  AI models scan news, social sentiment, and order flow to surface trade ideas in real time.
                </p>
              </div>
            </SpotlightCard>
          </div>

          {/* Card 3: Safety Check — 4 cols */}
          <div className="col-span-1 md:col-span-4">
            <SpotlightCard className="landing-glass-card rounded-card min-h-[360px] sm:min-h-[420px] lg:min-h-[480px] flex flex-col justify-between overflow-hidden group transition-all duration-300 hover:border-chart-5/25">
              <GlowingEffect variant="cyan" spread={25} proximity={60} />
              <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-chart-5 to-transparent opacity-30 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10 p-10 md:p-11">
                <div className="w-14 h-14 rounded-xl bg-chart-5/10 border border-chart-5/20 flex items-center justify-center mb-7">
                  <Shield className="w-7 h-7 text-chart-5" style={{ filter: "drop-shadow(0 0 10px rgba(34,211,238,0.5))" }} />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-3 tracking-tight">Safety Check</h3>
                <p className="text-sm text-foreground/45 leading-relaxed font-medium mb-8">
                  Automated circuit breakers halt execution during abnormal tail-risk
                  volatility events before losses compound.
                </p>
                <SafetyBar />
              </div>
            </SpotlightCard>
          </div>

          {/* Card 4: Visual Strategy Builder — 8 cols */}
          <div className="col-span-1 md:col-span-8">
            <SpotlightCard className="landing-glass-card rounded-card min-h-[320px] md:min-h-[400px] lg:min-h-[480px] flex flex-col md:flex-row items-center justify-between overflow-hidden group transition-all duration-300 hover:border-primary/30 gap-8 md:gap-10">
              <GlowingEffect variant="default" spread={30} proximity={60} />
              <div className="relative z-10 w-full md:w-[50%] flex flex-col justify-center p-10 md:p-14 shrink-0">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/15 flex items-center justify-center mb-6">
                  <Workflow className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-3 tracking-tight">Visual Strategy Builder</h3>
                <p className="text-base text-muted-foreground leading-relaxed mb-6">
                  Drag, drop, and connect logic blocks to build strategies. Backtest before you go live.
                </p>
                <Link
                  href="/strategies/builder"
                  className="inline-flex items-center gap-2 h-11 px-6 rounded-xl bg-primary text-white text-sm font-semibold w-fit hover:bg-[var(--primary-hover)] transition-colors"
                >
                  Open Builder
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="relative z-10 w-full md:flex-1 flex items-center justify-center p-6 md:p-10 md:pl-0">
                <IDEPreview />
              </div>
            </SpotlightCard>
          </div>
        </div>
      </div>
    </section>
  );
}
