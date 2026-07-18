"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Zap,
  Shield,
  Workflow,
  Crosshair,
  ArrowRight,
  Play,
  Sparkles,
  Activity,
  BarChart3,
  LineChart,
} from "lucide-react";
import { LandingPrimaryLink, LandingSecondaryLink } from "@/components/home/LandingButtons";

function LatencyPill() {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-[var(--card-border)] bg-muted/50 px-3 py-1.5 text-xs font-medium text-muted-foreground">
      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
      NY4 Cluster Active
      <span className="font-semibold text-emerald-600">1ms</span>
    </div>
  );
}

function OrbitVisual() {
  return (
    <div className="relative mx-auto h-[130px] w-full max-w-[200px]">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="absolute rounded-full border border-primary/15"
          style={{ inset: `${i * 14}%` }}
        />
      ))}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10">
          <span className="text-[10px] font-bold tracking-[0.18em] text-primary">OS</span>
        </div>
      </div>
      <div className="absolute left-[18%] top-[24%] h-2 w-2 rounded-full bg-primary/80" />
      <div className="absolute right-[20%] top-[38%] h-2 w-2 rounded-full bg-[var(--chart-3)]" />
      <div className="absolute bottom-[28%] left-[46%] h-2 w-2 rounded-full bg-primary/60" />
    </div>
  );
}

function RadarVis() {
  return (
    <div className="relative mx-auto h-[140px] w-[140px]">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="absolute rounded-full border border-primary/15"
          style={{ inset: `${i * 18}%` }}
        />
      ))}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "conic-gradient(from 210deg, transparent 62%, rgba(71,167,170,0.22) 82%, transparent 100%)",
        }}
      />
      {[
        { top: "22%", left: "62%" },
        { top: "58%", left: "28%" },
        { top: "70%", left: "68%" },
      ].map((pos, i) => (
        <div key={i} className="absolute h-1.5 w-1.5 rounded-full bg-primary" style={pos} />
      ))}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="rounded-full border border-primary/20 bg-card/90 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.16em] text-primary">
          Alpha
        </span>
      </div>
    </div>
  );
}

function SafetyBars() {
  return (
    <div className="w-full space-y-3 rounded-xl border border-[var(--card-border)] bg-muted/30 p-3">
      {[
        { label: "Drawdown Limit", val: "5.2%", width: "52%" },
        { label: "Daily Loss Cap", val: "0.8%", width: "18%" },
      ].map((row) => (
        <div key={row.label}>
          <div className="flex justify-between text-[11px] text-muted-foreground mb-1.5">
            <span>{row.label}</span>
            <span className="font-semibold text-primary">{row.val}</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent" style={{ width: row.width }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function StrategyCanvasMini() {
  return (
    <div className="w-full overflow-hidden rounded-xl bg-muted/25 text-left">
      <div className="border-b border-[var(--card-border)]/50 px-3 py-2 text-[10px] font-mono text-muted-foreground">
        strategy.canvas
      </div>
      <div className="relative h-[100px] p-3">
        <div className="absolute top-3 left-3 px-2 py-1 rounded-md bg-foreground text-background text-[9px] font-mono">
          RSI &gt; 70
        </div>
        <div className="absolute bottom-3 left-6 px-2 py-1 rounded-md bg-foreground text-background text-[9px] font-mono">
          MACD Cross
        </div>
        <div className="absolute top-1/2 right-3 -translate-y-1/2 px-2 py-1 rounded-md border border-primary/30 bg-primary/10 text-[9px] font-mono font-bold text-primary">
          EXPORT → DEPLOY
        </div>
        <svg className="absolute inset-0 w-full h-full pointer-events-none" fill="none">
          <path d="M 52 28 Q 90 30 118 52" stroke="rgba(71,167,170,0.35)" strokeWidth="1.5" strokeDasharray="4 3" />
          <path d="M 58 78 Q 95 55 118 52" stroke="rgba(71,167,170,0.25)" strokeWidth="1.5" strokeDasharray="4 3" />
        </svg>
      </div>
    </div>
  );
}

const STATUS_TAGS: {
  icon: React.ElementType;
  label: string;
  live?: boolean;
}[] = [
  { icon: Sparkles, label: "AI-Powered" },
  { icon: Zap, label: "Blazing Fast" },
  { icon: Shield, label: "Institutional Grade" },
  { icon: Activity, label: "Always On", live: true },
];

function FeatureCard({
  icon: Icon,
  title,
  description,
  children,
  delay = 0,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  children?: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, delay }}
      className="h-full"
    >
      <div className="flex h-full flex-col rounded-[20px] border border-[var(--card-border)] bg-card p-5 shadow-[0_8px_30px_rgba(15,23,42,0.05)]">
        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-primary/15 bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <h3 className="mb-2 text-base font-bold text-foreground">{title}</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
        <div className="mt-auto flex h-[176px] flex-col items-center justify-end gap-3 pt-4">
          {children}
        </div>
      </div>
    </motion.div>
  );
}

export function FeaturesSection() {
  return (
    <section
      id="features"
      className="landing-section overflow-hidden border-t border-[var(--card-border)]"
    >
      { }
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "linear-gradient(color-mix(in srgb, var(--border) 80%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb, var(--border) 80%, transparent) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      <div className="pointer-events-none absolute top-1/3 right-0 w-96 h-96 rounded-full bg-primary/10 blur-[100px]" />

      <div className="page-container relative z-10 w-full">
        <div className="grid grid-cols-1 items-center gap-12 xl:gap-16 lg:grid-cols-2">
          { }
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55 }}
            className="lg:sticky lg:top-28"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/[0.06] px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-primary mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              Features
            </span>

            <h2 className="text-3xl sm:text-4xl md:text-[2.75rem] brand-display-heading mb-5">
              Built for Total{" "}
              <span className="brand-gradient-text">Market Dominance.</span>
            </h2>

            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-lg mb-8">
              We abstracted the complexity of high-frequency trading infrastructure into a single,
              intuitive interface powered by smart analysis.
            </p>

            <div className="flex flex-col sm:flex-row flex-wrap gap-3 mb-8">
              <LandingPrimaryLink href="#features-grid" className="h-11 px-6">
                Explore Features
                <ArrowRight className="w-4 h-4" />
              </LandingPrimaryLink>
              <LandingSecondaryLink
                href="#how-it-works"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="h-11 px-6"
              >
                <Play className="w-4 h-4 fill-primary text-primary" />
                Watch Demo
              </LandingSecondaryLink>
            </div>

            <div className="flex flex-wrap gap-2 mb-10">
              {STATUS_TAGS.map(({ icon: Icon, label, live }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[var(--card-border)] bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground"
                >
                  {live ? (
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  ) : (
                    <Icon className="w-3.5 h-3.5 text-primary/70" />
                  )}
                  {label}
                </span>
              ))}
            </div>

            { }
            <div className="relative max-w-md">
              <div className="rounded-[20px] border border-[var(--card-border)] bg-card px-5 py-4 shadow-[0_10px_40px_rgba(15,23,42,0.06)] flex flex-wrap gap-6 sm:gap-10">
                <div className="flex items-center gap-3">
                  <LineChart className="w-5 h-5 text-emerald-500 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">System Uptime</p>
                    <p className="text-lg font-bold text-emerald-600 tabular-nums">99.99%</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <BarChart3 className="w-5 h-5 text-primary shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Avg. Latency</p>
                    <p className="text-lg font-bold text-foreground tabular-nums">1.2ms</p>
                  </div>
                </div>
              </div>
              <svg
                aria-hidden
                viewBox="0 0 400 80"
                className="absolute -right-4 sm:right-0 top-1/2 w-[min(280px,55vw)] h-16 text-primary/30 -z-10 hidden sm:block"
                fill="none"
              >
                <path
                  d="M0 40 C80 10, 160 70, 280 35 S 400 20, 400 20"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </motion.div>

          { }
          <div id="features-grid" className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
            <FeatureCard
              icon={Zap}
              title="Fast Order Routing"
              description="Low-latency execution through colocated servers so your strategies fill at the price you expect."
              delay={0}
            >
              <OrbitVisual />
              <LatencyPill />
            </FeatureCard>

            <FeatureCard
              icon={Crosshair}
              title="Signal Core AI"
              description="AI models scan news, social sentiment, and order flow to surface trade ideas in real time."
              delay={0.08}
            >
              <RadarVis />
            </FeatureCard>

            <FeatureCard
              icon={Shield}
              title="Safety Check"
              description="Automated circuit breakers halt execution during abnormal tail-risk volatility events."
              delay={0.12}
            >
              <SafetyBars />
            </FeatureCard>

            <FeatureCard
              icon={Workflow}
              title="Visual Strategy Builder"
              description="Drag, drop, and connect logic blocks to build strategies. Backtest before you go live."
              delay={0.16}
            >
              <Link
                href="/strategies/builder"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline underline-offset-4 w-fit"
              >
                Open Builder
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <StrategyCanvasMini />
            </FeatureCard>
          </div>
        </div>
      </div>
    </section>
  );
}
