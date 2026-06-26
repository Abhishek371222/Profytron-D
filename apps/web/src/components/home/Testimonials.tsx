"use client";

import { motion } from "framer-motion";
import { Star, Quote, BadgeCheck, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

type BadgeTone = "violet" | "emerald" | "rose" | "blue" | "amber";

const testimonials = [
  {
    quote:
      "PROFYTRON has completely transformed how our prop desk handles HFT execution. The speed is incomparable.",
    author: "Jameson Vane",
    company: "Vanguard Alpha",
    metrics: "+42% Alpha",
    badge: "emerald" as BadgeTone,
  },
  {
    quote:
      "The visual strategy builder reduced our concept-to-production time by over 70% since switching.",
    author: "Elena Soros",
    company: "Nexus Capital",
    metrics: "−70% Dev Time",
    badge: "blue" as BadgeTone,
  },
  {
    quote:
      "Bank-grade environment that our risk team fully trusts. Compliance review was the fastest we've seen.",
    author: "Marcus Chen",
    company: "Standard Trading",
    metrics: "SOC-2 Verified",
    badge: "violet" as BadgeTone,
  },
  {
    quote:
      "Finally an algo platform that doesn't feel legacy. The analytics dashboard alone is worth switching for.",
    author: "Priya Sharma",
    company: "Delta Quant",
    metrics: "+28% Efficiency",
    badge: "emerald" as BadgeTone,
  },
  {
    quote:
      "Deployed three strategies in one afternoon. Backtest fidelity against tick data is institutional grade.",
    author: "Tom Wexler",
    company: "Wexler Capital",
    metrics: "3 Strategies Live",
    badge: "violet" as BadgeTone,
  },
  {
    quote:
      "The risk sentinel saved my account during the flash crash. Circuit breakers fired before I saw the candle.",
    author: "Rena Park",
    company: "Arc Systems",
    metrics: "Capital Protected",
    badge: "rose" as BadgeTone,
  },
  {
    quote:
      "Latency under 50ms on our NY4 routes. Execution quality matches what we had in-house at a fraction of cost.",
    author: "Omar Haddad",
    company: "Pulse Markets",
    metrics: "< 50ms Routing",
    badge: "blue" as BadgeTone,
  },
  {
    quote:
      "Onboarded 14 junior traders onto copy workflows in a week. Governance controls are exactly what we needed.",
    author: "Sofia Lind",
    company: "Northstar Desk",
    metrics: "14 Seats Live",
    badge: "violet" as BadgeTone,
  },
  {
    quote:
      "Our Sharpe improved within the first month. Risk caps and kill-switches are first-class, not bolted on.",
    author: "Daniel Okoye",
    company: "Meridian Flow",
    metrics: "+1.8 Sharpe",
    badge: "emerald" as BadgeTone,
  },
  {
    quote:
      "Support resolved a broker API issue in under an hour. That level of ops maturity is rare in retail-facing tools.",
    author: "Hannah Weiss",
    company: "Weiss Quant",
    metrics: "24/7 Support",
    badge: "amber" as BadgeTone,
  },
];

const badgeStyles: Record<BadgeTone, string> = {
  violet: "bg-[#47a7aa]/10 text-[#47a7aa] border-[#47a7aa]/20",
  emerald: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  rose: "bg-rose-500/10 text-rose-600 border-rose-500/20",
  blue: "bg-[#47a7aa]/10 text-[#47a7aa] border-[#47a7aa]/20",
  amber: "bg-amber-500/10 text-amber-700 border-amber-500/20",
};

function TestimonialCard({ t }: { t: (typeof testimonials)[number] }) {
  return (
    <article className="rounded-[18px] border border-[var(--card-border)] bg-card p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow h-full flex flex-col min-h-[220px]">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex gap-0.5 shrink-0">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
          ))}
        </div>
        <span
          className={cn(
            "text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md border max-w-[52%] text-right leading-snug",
            badgeStyles[t.badge],
          )}
        >
          {t.metrics}
        </span>
      </div>

      <Quote className="w-5 h-5 text-primary/30 mb-2 shrink-0" />
      <p className="text-sm text-foreground/80 leading-relaxed flex-1 mb-4 break-words">
        {t.quote}
      </p>

      <div className="flex items-start gap-2.5 pt-3 border-t border-[var(--card-border)] mt-auto">
        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
          {t.author[0]}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-foreground leading-snug break-words">{t.author}</p>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground leading-snug break-words mt-0.5">
            {t.company}
          </p>
        </div>
      </div>
    </article>
  );
}

export function Testimonials() {
  return (
    <section
      id="testimonials"
      className="py-16 sm:py-24 relative overflow-hidden bg-[var(--bg-secondary)] dark:bg-background border-t border-[var(--card-border)]"
    >
      <div className="page-container max-w-[1280px]">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(280px,360px)_1fr] gap-10 xl:gap-14 items-start">
          {/* Left — trust column */}
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="lg:sticky lg:top-28"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-[#47a7aa]/25 bg-[#47a7aa]/[0.06] px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-[#47a7aa] dark:text-[#5bbec1] mb-6">
              <BadgeCheck className="w-3.5 h-3.5" />
              Verification Logs
            </span>

            <h2 className="text-3xl sm:text-4xl font-extrabold leading-[1.1] tracking-tight text-foreground mb-4">
              Validated by the{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#47a7aa] via-[#1e6d48] to-[#5bbec1]">
                Industry Elite.
              </span>
            </h2>

            <p className="text-base text-muted-foreground leading-relaxed mb-8">
              Trusted by quantitative firms and prop desks who can&apos;t afford to be wrong.
            </p>

            <div className="rounded-[20px] border border-[var(--card-border)] bg-card p-6 shadow-[0_8px_32px_rgba(15,23,42,0.06)]">
              <div className="flex gap-1 mb-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-2xl font-bold text-foreground">
                4.9<span className="text-lg text-muted-foreground font-semibold">/5</span>
                <span className="text-base font-medium text-muted-foreground ml-2">Average Rating</span>
              </p>
              <p className="text-sm text-muted-foreground mt-1 mb-6">From 2,500+ verified reviews</p>

              <div className="pt-5 border-t border-[var(--card-border)]">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-3">
                  Verified by
                </p>
                <div className="flex flex-wrap gap-2">
                  {["SOC 2", "ISO 27001", "GDPR"].map((cert) => (
                    <span
                      key={cert}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--card-border)] bg-[var(--bg-secondary)] px-3 py-1.5 text-xs font-semibold text-foreground"
                    >
                      <Shield className="w-3.5 h-3.5 text-primary" />
                      {cert}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right — testimonial grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.author}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.4, delay: (i % 3) * 0.06 }}
              >
                <TestimonialCard t={t} />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
