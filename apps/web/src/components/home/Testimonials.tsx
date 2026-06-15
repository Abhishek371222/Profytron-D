"use client";

import React from "react";
import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import { FadeUp } from "@/components/animations";
import { AnimatedGradientText } from "@/components/saasfly/animated-gradient-text";
import { Marquee } from "@/components/saasfly/marquee";

const testimonials = [
  {
    quote: "PROFYTRON has completely transformed how our prop desk handles HFT execution. The speed is incomparable to anything else I've used.",
    author: "Jameson Vane",
    role: "Chief Strategy Officer",
    company: "Vanguard Alpha",
    metrics: "+42% Alpha",
    rating: 5,
    color: "from-chart-2/15 to-transparent",
    border: "border-chart-2/20",
  },
  {
    quote: "The visual strategy builder is a masterclass in UX. We've reduced our concept-to-production time by over 70% since switching.",
    author: "Elena Soros",
    role: "Quant Researcher",
    company: "Nexus Capital",
    metrics: "−70% Dev Time",
    rating: 5,
    color: "from-chart-5/15 to-transparent",
    border: "border-chart-5/20",
  },
  {
    quote: "Security and compliance were our primary concerns. PROFYTRON delivered a bank-grade environment that our risk team fully trusts.",
    author: "Marcus Chen",
    role: "Head of Infrastructure",
    company: "Standard Trading",
    metrics: "SOC-2 Verified",
    rating: 5,
    color: "from-chart-3/15 to-transparent",
    border: "border-chart-3/20",
  },
  {
    quote: "Finally an algo platform that doesn't feel like it was built in 2012. The analytics dashboard alone is worth switching for.",
    author: "Priya Sharma",
    role: "Portfolio Manager",
    company: "Delta Quant",
    metrics: "+28% Efficiency",
    rating: 5,
    color: "from-chart-4/15 to-transparent",
    border: "border-chart-4/20",
  },
  {
    quote: "Deployed three strategies in one afternoon. The backtest fidelity against tick data is genuinely institutional grade.",
    author: "Tom Wexler",
    role: "Independent Trader",
    company: "Wexler Capital",
    metrics: "3 Strategies Live",
    rating: 5,
    color: "from-primary/15 to-transparent",
    border: "border-primary/20",
  },
  {
    quote: "The risk sentinel saved my account during the flash crash. Automated circuit breakers fired before I even saw the candle.",
    author: "Rena Park",
    role: "Algo Developer",
    company: "Arc Systems",
    metrics: "Capital Protected",
    rating: 5,
    color: "from-destructive/15 to-transparent",
    border: "border-destructive/20",
  },
];

const ROW_B = [...testimonials.slice(3), ...testimonials.slice(0, 3)];

function TestimonialCard({ t }: { t: typeof testimonials[0] }) {
  return (
    <div
      className={`relative flex-shrink-0 w-[340px] rounded-[22px] border ${t.border} bg-muted/2 p-6 mx-3 overflow-hidden group hover:bg-muted/4 transition-all duration-500 hover:scale-[1.02]`}
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
              <Star key={i} className="w-3.5 h-3.5 fill-chart-4 text-chart-4" />
            ))}
          </div>
          <span className="text-micro font-bold uppercase tracking-widest text-foreground/40 bg-foreground/5 border border-white/[0.08] px-2.5 py-1 rounded-lg">
            {t.metrics}
          </span>
        </div>

        {/* Quote */}
        <Quote className="w-7 h-7 text-foreground/8 mb-3 -ml-1" />
        <p className="text-body leading-relaxed text-foreground/65 font-medium mb-5 group-hover:text-foreground/85 transition-colors duration-400">
          {t.quote}
        </p>

        {/* Author */}
        <div className="flex items-center gap-3 pt-4 border-t border-white/[0.06]">
          <div className="w-9 h-9 rounded-xl bg-muted/6 border border-border flex items-center justify-center shrink-0">
            <span className="text-sm font-bold text-foreground/60">{t.author[0]}</span>
          </div>
          <div>
            <p className="text-caption font-bold text-foreground tracking-wide">{t.author}</p>
            <p className="text-micro text-foreground/35 uppercase tracking-widest">{t.company}</p>
          </div>
        </div>
      </div>
    </div>
  );
}


export function Testimonials() {
  return (
    <section id="testimonials" className="py-16 sm:py-24 lg:py-28 relative overflow-x-hidden bg-transparent border-t border-border">
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

      <div className="page-container relative z-10 mb-10 sm:mb-16">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 sm:gap-8">
          <FadeUp>
            <div className="mb-6">
              <AnimatedGradientText className="text-foreground/70">
                <span className="w-1.5 h-1.5 rounded-full bg-chart-2 animate-pulse mr-2 inline-block" />
                <span className="text-micro font-bold uppercase tracking-[0.4em]">Verification Logs</span>
              </AnimatedGradientText>
            </div>
            <h2 className="text-heading-1 sm:text-display-1 font-bold leading-tight tracking-tight text-foreground text-balance">
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
            <p className="text-foreground/40 text-base font-medium max-w-xs text-right leading-relaxed">
              Trusted by quantitative firms and prop desks who can't afford to be wrong.
            </p>
          </FadeUp>
        </div>
      </div>

      <div className="space-y-5 relative z-10" role="region" aria-label="Customer testimonials">
        <div className="pointer-events-none absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#030303] to-transparent z-20" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-[#030303] to-transparent z-20" />

        <Marquee pauseOnHover repeat={2} className="[--duration:50s] [--gap:0rem]">
          {testimonials.map((t, i) => (
            <TestimonialCard key={`row-a-${i}`} t={t} />
          ))}
        </Marquee>
        <Marquee pauseOnHover reverse repeat={2} className="[--duration:40s] [--gap:0rem]">
          {ROW_B.map((t, i) => (
            <TestimonialCard key={`row-b-${i}`} t={t} />
          ))}
        </Marquee>
      </div>

      {/* Bottom CTA hint */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="text-center mt-14 relative z-10"
      >
        <p className="text-sm text-foreground/30 font-medium">
          Join <span className="text-foreground/60 font-bold">12,000+</span> traders who made the switch
        </p>
      </motion.div>
    </section>
  );
}
