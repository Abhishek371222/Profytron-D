"use client";

import React from "react";
import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import { FadeUp } from "@/components/animations";

const testimonials = [
  {
    quote: "PROFYTRON has completely transformed how our prop desk handles HFT execution. The speed is incomparable to anything else I've used.",
    author: "Jameson Vane",
    role: "Chief Strategy Officer",
    company: "Vanguard Alpha",
    metrics: "+42% Alpha",
    rating: 5,
    color: "from-violet-400/15 to-transparent",
    border: "border-violet-400/20",
  },
  {
    quote: "The visual strategy builder is a masterclass in UX. We've reduced our concept-to-production time by over 70% since switching.",
    author: "Elena Soros",
    role: "Quant Researcher",
    company: "Nexus Capital",
    metrics: "−70% Dev Time",
    rating: 5,
    color: "from-cyan-400/15 to-transparent",
    border: "border-cyan-400/20",
  },
  {
    quote: "Security and compliance were our primary concerns. PROFYTRON delivered a bank-grade environment that our risk team fully trusts.",
    author: "Marcus Chen",
    role: "Head of Infrastructure",
    company: "Standard Trading",
    metrics: "SOC-2 Verified",
    rating: 5,
    color: "from-emerald-400/15 to-transparent",
    border: "border-emerald-400/20",
  },
  {
    quote: "Finally an algo platform that doesn't feel like it was built in 2012. The analytics dashboard alone is worth switching for.",
    author: "Priya Sharma",
    role: "Portfolio Manager",
    company: "Delta Quant",
    metrics: "+28% Efficiency",
    rating: 5,
    color: "from-amber-400/15 to-transparent",
    border: "border-amber-400/20",
  },
  {
    quote: "Deployed three strategies in one afternoon. The backtest fidelity against tick data is genuinely institutional grade.",
    author: "Tom Wexler",
    role: "Independent Trader",
    company: "Wexler Capital",
    metrics: "3 Strategies Live",
    rating: 5,
    color: "from-indigo-400/15 to-transparent",
    border: "border-indigo-400/20",
  },
  {
    quote: "The risk sentinel saved my account during the flash crash. Automated circuit breakers fired before I even saw the candle.",
    author: "Rena Park",
    role: "Algo Developer",
    company: "Arc Systems",
    metrics: "Capital Protected",
    rating: 5,
    color: "from-rose-400/15 to-transparent",
    border: "border-rose-400/20",
  },
];

// Duplicate for seamless infinite scroll
const ROW_A = [...testimonials, ...testimonials];
const ROW_B = [...testimonials.slice(3), ...testimonials.slice(0, 3), ...testimonials.slice(3), ...testimonials.slice(0, 3)];

function TestimonialCard({ t }: { t: typeof testimonials[0] }) {
  return (
    <div
      className={`relative flex-shrink-0 w-[340px] rounded-[22px] border ${t.border} bg-white/[0.02] p-6 mx-3 overflow-hidden group hover:bg-white/[0.04] transition-all duration-500 hover:scale-[1.02]`}
      style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.3)" }}
    >
      {/* Top gradient overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br ${t.color} opacity-60 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`} />
      {/* Top shine line */}
      <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent`} />

      <div className="relative z-10">
        {/* Metrics badge */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-1">
            {Array.from({ length: t.rating }).map((_, i) => (
              <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            ))}
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/40 bg-white/5 border border-white/[0.08] px-2.5 py-1 rounded-lg">
            {t.metrics}
          </span>
        </div>

        {/* Quote */}
        <Quote className="w-7 h-7 text-white/8 mb-3 -ml-1" />
        <p className="text-[15px] leading-relaxed text-white/65 font-medium mb-5 group-hover:text-white/85 transition-colors duration-400">
          {t.quote}
        </p>

        {/* Author */}
        <div className="flex items-center gap-3 pt-4 border-t border-white/[0.06]">
          <div className="w-9 h-9 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center shrink-0">
            <span className="text-sm font-bold text-white/60">{t.author[0]}</span>
          </div>
          <div>
            <p className="text-[12px] font-bold text-white tracking-wide">{t.author}</p>
            <p className="text-[10px] text-white/35 uppercase tracking-widest">{t.company}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function MarqueeRow({ items, direction = 1, speed = 45 }: { items: typeof testimonials; direction?: 1 | -1; speed?: number }) {
  const width = items.length * 364;
  return (
    <div className="overflow-hidden relative">
      <motion.div
        className="flex"
        animate={{
          x: direction === 1 ? [-width / 2, 0] : [0, -width / 2],
        }}
        transition={{
          duration: speed,
          ease: "linear",
          repeat: Infinity,
        }}
        style={{ width: width * 2 }}
      >
        {items.map((t, i) => (
          <TestimonialCard key={`${t.author}-${i}`} t={t} />
        ))}
      </motion.div>
    </div>
  );
}

export function Testimonials() {
  return (
    <section id="testimonials" className="py-28 relative overflow-hidden bg-[#030303] border-t border-white/[0.04]">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(99,102,241,0.07)_0%,transparent_65%)]" />
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)`,
            backgroundSize: "64px 64px",
          }}
        />
      </div>

      <div className="container mx-auto px-6 relative z-10 mb-16">
        <div className="flex flex-col md:flex-row justify-between items-end gap-8">
          <FadeUp>
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-white/60 text-[10px] font-bold uppercase tracking-[0.4em] mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
              Verification Logs
            </div>
            <h2 className="text-5xl md:text-6xl font-bold leading-[1.1] tracking-[-0.02em] text-white">
              Validated by the{" "}
              <span
                className="text-transparent bg-clip-text"
                style={{
                  backgroundImage: "linear-gradient(135deg, #a855f7, #6366f1, #22d3ee)",
                }}
              >
                Industry Elite.
              </span>
            </h2>
          </FadeUp>
          <FadeUp delay={0.15} className="hidden md:block shrink-0">
            <p className="text-white/40 text-base font-medium max-w-xs text-right leading-relaxed">
              Trusted by quantitative firms and prop desks who can't afford to be wrong.
            </p>
          </FadeUp>
        </div>
      </div>

      {/* Marquee rows */}
      <div className="space-y-5 relative z-10">
        {/* Left fade overlay */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#030303] to-transparent z-20" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-[#030303] to-transparent z-20" />

        <MarqueeRow items={ROW_A} direction={1} speed={50} />
        <MarqueeRow items={ROW_B} direction={-1} speed={40} />
      </div>

      {/* Bottom CTA hint */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="text-center mt-14 relative z-10"
      >
        <p className="text-sm text-white/30 font-medium">
          Join <span className="text-white/60 font-bold">12,000+</span> traders who made the switch
        </p>
      </motion.div>
    </section>
  );
}
