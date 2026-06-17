"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, Check, FileText } from "lucide-react";
import { TrustBadges } from "@/components/trust/TrustBadges";
import { HeroDashboardPreview } from "@/components/home/HeroDashboardPreview";
import { useAuthStore } from "@/lib/stores/useAuthStore";
import { useMounted } from "@/lib/hooks/useMounted";
import {
  LandingDashboardLink,
  LandingPrimaryLink,
  LandingSecondaryLink,
} from "@/components/home/LandingButtons";

const TRUST_POINTS = [
  "No credit card required",
  "Full access for 7 days",
  "Cancel anytime",
];

export function CTABanner() {
  const mounted = useMounted();
  const { isAuthenticated } = useAuthStore();

  return (
    <section className="relative py-16 sm:py-20 bg-[var(--bg-secondary)] dark:bg-background overflow-hidden">
      <div className="page-container max-w-[1200px]">
        <div className="relative rounded-[28px] sm:rounded-[32px] border border-[var(--card-border)] bg-card p-6 sm:p-10 lg:p-12 overflow-hidden shadow-[0_10px_40px_rgba(15,23,42,0.06)]">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,rgba(59,70,255,0.08)_0%,transparent_55%),radial-gradient(ellipse_at_90%_80%,rgba(139,92,246,0.06)_0%,transparent_50%)]"
          />

          <div className="relative z-10 grid lg:grid-cols-2 gap-10 lg:gap-12 xl:gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/[0.06] px-3.5 py-1.5 text-xs font-semibold text-primary mb-6">
                Built for traders. Designed to scale.
              </span>

              <h2 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold tracking-tight text-foreground leading-[1.1] mb-5">
                Ready to trade{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-indigo-500 to-violet-500">
                  smarter?
                </span>
              </h2>

              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-8 max-w-lg">
                Join thousands of traders using Profytron to automate strategies, manage risk,
                and track performance in one place.
              </p>

              <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 mb-8">
                {mounted && isAuthenticated ? (
                  <LandingDashboardLink className="w-full sm:w-auto" />
                ) : (
                  <LandingPrimaryLink href="/register?plan=starter" className="w-full sm:w-auto">
                    Start 7-Day Free Trial
                    <ArrowRight className="w-4 h-4 shrink-0" />
                  </LandingPrimaryLink>
                )}
                <LandingSecondaryLink href="/docs" className="w-full sm:w-auto">
                  <FileText className="w-4 h-4 text-primary shrink-0" />
                  Read Documentation
                </LandingSecondaryLink>
              </div>

              <div className="flex flex-col sm:flex-row sm:flex-wrap gap-x-6 gap-y-2.5">
                {TRUST_POINTS.map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground font-medium"
                  >
                    <Check className="w-4 h-4 text-[var(--success)] shrink-0" />
                    {item}
                  </span>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: 0.1 }}
              className="flex justify-center lg:justify-end"
            >
              <HeroDashboardPreview showHint={false} overviewTitle="Performance Overview" />
            </motion.div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, delay: 0.15 }}
          className="mt-8 sm:mt-10 flex justify-center"
        >
          <TrustBadges className="justify-center max-w-4xl" />
        </motion.div>
      </div>
    </section>
  );
}
