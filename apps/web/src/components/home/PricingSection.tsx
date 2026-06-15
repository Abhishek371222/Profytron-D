"use client";

import { motion } from "framer-motion";
import { DollarSign } from "lucide-react";
import { FadeUp } from "@/components/animations";
import { AnimatedGradientText } from "@/components/saasfly/animated-gradient-text";
import { PricingPlansGrid } from "@/components/pricing/PricingPlansGrid";

export function PricingSection() {
  return (
    <section
      id="pricing"
      className="py-16 lg:py-32 relative overflow-hidden bg-transparent selection:bg-primary/30"
    >
      <div className="container mx-auto px-6 relative z-10 max-w-[1200px]">
        <div className="text-center mb-10 lg:mb-16">
          <FadeUp>
            <div className="mb-6 flex justify-center">
              <AnimatedGradientText className="text-foreground/70">
                <DollarSign className="w-3 h-3 text-primary mr-2" />
                <span className="text-caption font-medium tracking-widest uppercase">
                  Plans in INR
                </span>
              </AnimatedGradientText>
            </div>
            <h2 className="text-4xl sm:text-5xl lg:text-7xl font-bold mb-6 tracking-tight text-foreground m-0">
              Pricing that{" "}
              <span className="text-transparent bg-clip-text bg-linear-to-r from-white to-white/60">
                scales with you.
              </span>
            </h2>
            <p className="text-lg text-foreground/40 max-w-2xl mx-auto font-medium">
              Start free with paper trading. Upgrade for live MT5 copy execution,
              AI coach, and strategy builder. 7-day trial on all paid plans.
            </p>
          </FadeUp>
        </div>

        <PricingPlansGrid variant="landing" showEnterprise={false} />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          viewport={{ once: true }}
          className="mt-16 w-full rounded-2xl bg-foreground/2 border border-border p-8 md:p-12 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8"
        >
          <div className="relative z-10 text-center md:text-left max-w-2xl">
            <h5 className="text-2xl font-bold text-foreground mb-3 tracking-tight">
              Need Enterprise or Business?
            </h5>
            <p className="text-foreground/50 text-base leading-relaxed">
              Prop desks and institutions get dedicated infrastructure, white-label
              dashboards, and custom SLAs.
            </p>
          </div>
          <a
            href="mailto:enterprise@profytron.com"
            className="shrink-0 inline-flex h-12 items-center px-8 rounded-xl bg-white text-primary-foreground font-semibold hover:bg-foreground/90 transition"
          >
            Contact Sales
          </a>
        </motion.div>
      </div>
    </section>
  );
}
