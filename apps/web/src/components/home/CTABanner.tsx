"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, Check, FileText } from "lucide-react";
import { HeroAmbientVisual } from "@/components/home/HeroAmbientVisual";
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
    <section className="landing-section overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: [
            "radial-gradient(ellipse 70% 50% at 85% 40%, rgba(71,167,170,0.1) 0%, transparent 60%)",
            "radial-gradient(ellipse 50% 40% at 15% 70%, rgba(30,109,72,0.06) 0%, transparent 55%)",
          ].join(", "),
        }}
      />

      <div className="page-container relative z-10 w-full">
        <div className="hero-main relative">
          <div className="relative z-10 grid grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-12 xl:gap-14">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="w-full min-w-0"
            >
              <span className="landing-eyebrow mb-6">Built for traders. Designed to scale.</span>

              <h2 className="brand-display-heading mb-5 text-3xl sm:text-4xl lg:text-[2.75rem]">
                Ready to trade{" "}
                <span className="landing-gradient-text">smarter?</span>
              </h2>

              <p className="mb-8 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
                Join thousands of traders using Profytron to automate strategies, manage risk,
                and track performance in one place.
              </p>

              <div className="mb-8 flex flex-col flex-wrap items-stretch gap-3 sm:flex-row sm:items-center">
                {mounted && isAuthenticated ? (
                  <LandingDashboardLink className="w-full sm:w-auto" />
                ) : (
                  <LandingPrimaryLink href="/register?plan=starter" className="w-full sm:w-auto">
                    Start 7-Day Free Trial
                    <ArrowRight className="h-4 w-4 shrink-0" />
                  </LandingPrimaryLink>
                )}
                <LandingSecondaryLink href="/docs" className="w-full sm:w-auto">
                  <FileText className="h-4 w-4 shrink-0 text-primary" />
                  Read Documentation
                </LandingSecondaryLink>
              </div>

              <div className="flex flex-col gap-y-2.5 sm:flex-row sm:flex-wrap sm:gap-x-6">
                {TRUST_POINTS.map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground"
                  >
                    <Check className="h-4 w-4 shrink-0 text-[var(--success)]" />
                    {item}
                  </span>
                ))}
              </div>
            </motion.div>

            <div className="hero-ambient-layer hero-ambient-layer-cta">
              <HeroAmbientVisual variant="cta" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
