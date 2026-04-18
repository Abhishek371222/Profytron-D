"use client";

import React, { useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useMotionValue,
  useSpring,
} from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Zap, Shield, Sparkles, Cpu, Terminal } from "lucide-react";
import { FadeUp } from "@/components/animations";
import { Magnetic } from "@/components/ui/Interactions";
import dynamic from "next/dynamic";
import Link from "next/link";

// Lazy-load Three.js Globe — defers ~600KB of Three.js until AFTER hero text paints
const ThreeGlobe = dynamic(
  () => import("./ThreeGlobe").then((m) => ({ default: m.ThreeGlobe })),
  {
    ssr: false,
    loading: () => (
      <div className="w-[300px] h-[300px] lg:w-[400px] lg:h-100 rounded-full bg-primary/5 animate-pulse" />
    ),
  },
);

export function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 200]);

  // Mouse Interaction for parallax
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springConfig = { damping: 25, stiffness: 150 };
  const springX = useSpring(mouseX, springConfig);
  const springY = useSpring(mouseY, springConfig);

  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    mouseX.set((clientX / innerWidth - 0.5) * 60);
    mouseY.set((clientY / innerHeight - 0.5) * 60);
  };

  return (
    <section
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative min-h-screen flex items-center pt-28 pb-10 overflow-hidden bg-[#05070f]"
    >
      {/* Cinematic Background Architecture */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {/* Dynamic Glows */}
        <motion.div
          style={{ x: springX, y: springY }}
          className="absolute top-[5%] left-[5%] w-[900px] h-[900px] bg-p/15 rounded-full blur-[220px] opacity-35 animate-pulse-slow"
        />
        <motion.div
          style={{
            x: useTransform(springX, (v) => v * -1.5),
            y: useTransform(springY, (v) => v * -1.5),
          }}
          className="absolute bottom-[10%] right-[5%] w-[700px] h-[700px] bg-indigo-500/12 rounded-full blur-[200px] opacity-30"
        />
        <motion.div
          style={{ x: springX, y: useTransform(springY, (v) => v * 0.8) }}
          className="absolute top-1/2 left-1/3 w-[500px] h-[500px] bg-cyan-500/8 rounded-full blur-[150px] opacity-20"
        />

        {/* Holographic Layering */}
        <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-15 brightness-75 contrast-125" />
        <div className="absolute inset-0 panel-grid opacity-[0.08]" />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black z-[1]" />

        {/* Scanlines */}
        <div className="absolute inset-0 animate-scanline bg-gradient-to-b from-transparent via-white/3 to-transparent h-[200%] pointer-events-none z-[2]" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-[1.3fr_0.7fr] gap-12 lg:gap-24 items-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="text-left space-y-8 lg:space-y-10"
          >
            {/* Badge */}
            <FadeUp delay={0.05}>
              <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-white/3 border border-white/8 text-white/70 text-[10px] font-bold tracking-[0.4em] uppercase backdrop-blur-md relative group overflow-hidden">
                <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                <Terminal className="w-3 h-3 text-p" />
                <span>v5.0_Kernel_Ready</span>
              </div>
            </FadeUp>

            {/* Main Headline */}
            <FadeUp delay={0.1}>
              <div className="space-y-4">
                <motion.h1
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 1,
                    delay: 0.15,
                    ease: [0.23, 1, 0.32, 1],
                  }}
                  className="text-5xl sm:text-6xl md:text-8xl lg:text-[104px] xl:text-[116px] font-bold leading-[0.95] tracking-[-0.04em] uppercase bg-clip-text bg-gradient-to-b from-white via-white to-white/20 text-transparent"
                >
                  Trade Smarter <br />
                  <span className="bg-linear-to-r from-p via-indigo-300 to-white/70 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(99,102,241,0.3)]">
                    With Calm Precision.
                  </span>
                </motion.h1>

                <FadeUp delay={0.2}>
                  <p className="text-lg md:text-xl text-white/60 leading-relaxed max-w-2xl font-medium tracking-tight">
                    Deploy, monitor, and optimize algorithmic portfolios with a
                    clearer control surface, lower latency execution, and
                    real-time intelligence that remains legible under pressure.
                  </p>
                </FadeUp>
              </div>
            </FadeUp>

            {/* CTA Buttons */}
            <FadeUp delay={0.3}>
              <div className="flex flex-col sm:flex-row items-start gap-6 pt-2">
                <Magnetic strength={0.35}>
                  <Link href="/register">
                    <motion.div
                      whileHover={{ scale: 1.02, y: -4 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        size="lg"
                        className="h-14 px-8 text-base bg-white hover:bg-gray-100 text-black rounded-full group shadow-[0_0_40px_rgba(255,255,255,0.1)] transition-all duration-500 font-bold tracking-wide border-0"
                      >
                        <span className="relative z-10 flex items-center gap-3">
                          Start Trading Workspace
                          <motion.div
                            animate={{ x: [0, 4, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          >
                            <ArrowRight className="w-4 h-4" />
                          </motion.div>
                        </span>
                      </Button>
                    </motion.div>
                  </Link>
                </Magnetic>

                <Magnetic strength={0.2}>
                  <Link href="/dashboard">
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        variant="ghost"
                        size="lg"
                        className="h-14 px-8 text-base border border-white/10 bg-white/5 hover:bg-white/10 rounded-full font-bold tracking-wide text-white/70 hover:text-white transition-all duration-500 shadow-inner"
                      >
                        <Play className="mr-3 w-4 h-4 fill-current" />
                        View Platform Tour
                      </Button>
                    </motion.div>
                  </Link>
                </Magnetic>
              </div>
            </FadeUp>

            {/* Stats Row */}
            <FadeUp delay={0.5}>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 pt-10 mt-8 border-t border-white/5">
                {[
                  {
                    label: "Security Level",
                    icon: Shield,
                    val: "MIL-GRADE",
                  },
                  {
                    label: "Latency",
                    icon: Zap,
                    val: "<42ms",
                  },
                  {
                    label: "Uptime",
                    icon: Cpu,
                    val: "99.99%",
                  },
                ].map((stat, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + i * 0.1 }}
                    className="flex flex-col gap-2 group"
                  >
                    <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-[0.3em] text-white/40 group-hover:text-white transition-colors">
                      <stat.icon className="w-3.5 h-3.5" />
                      {stat.label}
                    </div>
                    <span className="text-3xl sm:text-4xl font-mono font-bold tracking-[-0.03em] text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                      {stat.val}
                    </span>
                  </motion.div>
                ))}
              </div>
            </FadeUp>
          </motion.div>

          {/* Right Column - Structured Visual Module */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative hidden md:flex h-[620px] lg:h-[640px] w-full flex-col justify-between rounded-3xl border border-white/15 bg-white/[0.05] p-5 lg:p-6 backdrop-blur-xl md:mt-6 lg:mt-0"
          >
            <motion.div
              style={{
                y: y1,
                rotateX: useTransform(springY, (v) => v * -0.04),
                rotateY: useTransform(springX, (v) => v * 0.04),
              }}
              className="relative h-[360px] w-full overflow-hidden rounded-2xl border border-white/10 bg-[#0a1020]/70"
            >
              <div className="absolute inset-0 panel-grid opacity-[0.12]" />
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <div className="h-72 w-72 rounded-full border border-p/25" />
              </motion.div>
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 42, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <div className="h-56 w-56 rounded-full border border-cyan-400/20" />
              </motion.div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-80 w-80 rounded-full bg-linear-to-br from-p/25 to-cyan-400/10 blur-[90px]" />
              </div>
              <div className="relative z-10 flex h-full items-center justify-center drop-shadow-[0_0_50px_rgba(99,102,241,0.35)]">
                <ThreeGlobe />
              </div>
              <div className="absolute bottom-4 left-4 right-4 rounded-xl border border-white/15 bg-black/55 px-4 py-3 backdrop-blur-md">
                <p className="text-[10px] uppercase tracking-[0.28em] text-white/70 font-semibold">Signal Confidence</p>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                  <motion.div
                    animate={{ width: ["62%", "79%", "74%", "82%"] }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                    className="h-full rounded-full bg-linear-to-r from-cyan-300 to-p"
                  />
                </div>
              </div>
            </motion.div>

            <div className="grid grid-cols-2 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                className="rounded-2xl border border-white/20 bg-black/45 p-4 shadow-[0_16px_32px_rgba(0,0,0,0.25)]"
              >
                <p className="text-[10px] uppercase tracking-[0.25em] text-white/70 font-semibold">Execution Queue</p>
                <p className="mt-2 text-3xl font-mono font-extrabold text-white">134</p>
                <p className="mt-1 text-xs font-semibold text-emerald-300">+12.4% live throughput</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 }}
                className="rounded-2xl border border-white/20 bg-black/45 p-4 shadow-[0_16px_32px_rgba(0,0,0,0.25)]"
              >
                <p className="text-[10px] uppercase tracking-[0.25em] text-white/70 font-semibold">Risk Envelope</p>
                <p className="mt-2 text-3xl font-mono font-extrabold text-white">0.42%</p>
                <p className="mt-1 text-xs font-semibold text-cyan-300">Within guardrails</p>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65 }}
              className="rounded-2xl border border-white/20 bg-black/50 px-4 py-3"
            >
              <div className="flex items-center justify-between">
                <p className="text-[10px] uppercase tracking-[0.25em] text-white/70 font-semibold">Realtime Micro-Chart</p>
                <p className="text-xs font-bold text-emerald-300">+3.8%</p>
              </div>
              <svg viewBox="0 0 320 88" className="mt-3 h-24 w-full">
                <defs>
                  <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#22d3ee" />
                    <stop offset="100%" stopColor="#6366f1" />
                  </linearGradient>
                  <linearGradient id="fillGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(99,102,241,0.35)" />
                    <stop offset="100%" stopColor="rgba(99,102,241,0.02)" />
                  </linearGradient>
                </defs>
                <path
                  d="M0 66 C28 62, 42 54, 63 56 C83 58, 96 68, 118 64 C140 60, 156 30, 178 34 C199 38, 216 76, 237 68 C257 61, 276 44, 320 48 L320 88 L0 88 Z"
                  fill="url(#fillGrad)"
                />
                <motion.path
                  d="M0 66 C28 62, 42 54, 63 56 C83 58, 96 68, 118 64 C140 60, 156 30, 178 34 C199 38, 216 76, 237 68 C257 61, 276 44, 320 48"
                  fill="none"
                  stroke="url(#lineGrad)"
                  strokeWidth="3"
                  initial={{ pathLength: 0.2, opacity: 0.5 }}
                  animate={{ pathLength: [0.2, 1], opacity: [0.5, 1] }}
                  transition={{ duration: 1.6, ease: "easeOut" }}
                />
              </svg>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
