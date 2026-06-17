"use client";

import { motion } from "framer-motion";
import { IndianRupee } from "lucide-react";
import { PricingPlansGrid } from "@/components/pricing/PricingPlansGrid";

export function PricingSection() {
  return (
    <section
      id="pricing"
      className="relative py-20 sm:py-28 overflow-hidden bg-[var(--bg-secondary)] dark:bg-background"
    >
      {/* Side dot grids */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-24 left-4 w-32 h-48 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(circle, color-mix(in srgb, var(--muted-foreground) 35%, transparent) 1px, transparent 1px)",
          backgroundSize: "12px 12px",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-32 right-4 w-32 h-48 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(circle, color-mix(in srgb, var(--muted-foreground) 35%, transparent) 1px, transparent 1px)",
          backgroundSize: "12px 12px",
        }}
      />

      <div className="page-container relative z-10 max-w-[1200px]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10 sm:mb-14"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/[0.06] px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-primary mb-6">
            <IndianRupee className="w-3.5 h-3.5" />
            Plans in INR
          </span>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-5">
            Pricing that{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-500 via-indigo-500 to-cyan-400">
              scales with you.
            </span>
          </h2>

          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Start free with paper trading. Upgrade for live MT5 copy execution, AI coach, and
            strategy builder. 7-day trial on all paid plans.
          </p>
        </motion.div>

        <PricingPlansGrid variant="landing" showEnterprise={false} />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 rounded-[20px] border border-[var(--card-border)] bg-card p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm"
        >
          <div className="text-center md:text-left max-w-2xl">
            <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-2 tracking-tight">
              Need Enterprise or Business?
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Prop desks and institutions get dedicated infrastructure, white-label dashboards,
              and custom SLAs.
            </p>
          </div>
          <a
            href="mailto:enterprise@profytron.com"
            className="shrink-0 inline-flex h-12 items-center justify-center px-8 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:brightness-110 transition shadow-[var(--shadow-cta)]"
          >
            Contact Sales
          </a>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground"
        >
          {["7-Day Free Trial", "Cancel Anytime", "No Credit Card Required"].map((item) => (
            <span key={item} className="inline-flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-xs">
                ✓
              </span>
              {item}
            </span>
          ))}
        </motion.p>
      </div>
    </section>
  );
}
