"use client";

import { motion } from "framer-motion";
import { IndianRupee } from "lucide-react";
import { PricingPlansGrid } from "@/components/pricing/PricingPlansGrid";

export function PricingSection() {
  return (
    <section
      className="landing-section overflow-hidden"
      id="pricing"
    >
      <div
        aria-hidden
        className="value-pillars-dots pointer-events-none absolute top-24 left-0 h-40 w-40 opacity-25"
      />
      <div
        aria-hidden
        className="value-pillars-dots pointer-events-none absolute top-32 right-0 h-40 w-40 opacity-25"
        style={{ transform: "scaleX(-1)" }}
      />

      <div className="page-container relative z-10 w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10 sm:mb-14"
        >
          <span className="landing-eyebrow mb-6">
            <IndianRupee className="h-3.5 w-3.5" />
            Plans in INR
          </span>

          <h2 className="brand-display-heading mb-5 text-3xl sm:text-4xl md:text-5xl">
            Pricing that{" "}
            <span className="landing-gradient-text">scales with you.</span>
          </h2>

          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Start free with paper trading. Upgrade for live MT5 bot execution, AI coach, and
            strategy builder. 7-day trial on all paid plans.
          </p>
        </motion.div>

        <PricingPlansGrid variant="landing" showEnterprise={false} />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="landing-panel mt-12 flex flex-col items-center justify-between gap-6 p-6 sm:p-8 md:flex-row"
        >
          <div className="text-center md:text-left max-w-2xl">
            <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-2 tracking-tight">
              Need custom enterprise deployment?
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Institutions get white-label dashboards, colocation, and dedicated support beyond
              our Elite plan.
            </p>
          </div>
          <a
            href="mailto:support@profytron.com"
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
