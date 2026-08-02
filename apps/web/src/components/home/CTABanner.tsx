"use client";

import React from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { ArrowRight, Check, FileText } from "lucide-react";
import { useAuthStore } from "@/lib/stores/useAuthStore";
import { useMounted } from "@/lib/hooks/useMounted";
import {
  LandingDashboardLink,
  LandingPrimaryLink,
  LandingSecondaryLink,
} from "@/components/home/LandingButtons";

const HeroAmbientVisual = dynamic(
  () =>
    import("@/components/home/HeroAmbientVisual").then((m) => ({
      default: m.HeroAmbientVisual,
    })),
  { ssr: false, loading: () => <div className="hero-ambient" aria-hidden /> },
);

const TRUST_POINTS = [
  "No credit card required",
  "Full access for 7 days",
  "Cancel anytime",
];

export function CTABanner() {
  const mounted = useMounted();
  const { isAuthenticated } = useAuthStore();

  return (
    <section className="landing-section overflow-hidden !py-0">
      <div className="page-container relative z-10 w-full py-[clamp(3.5rem,7vw,5.5rem)]">
        <div className="landing-cta-frame relative overflow-hidden rounded-[28px] border border-primary/20 bg-card px-6 py-10 sm:px-10 sm:py-12 lg:px-14 lg:py-14">
          <div aria-hidden className="landing-cta-frame-glow pointer-events-none absolute inset-0" />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"
          />

          <div className="relative z-10 grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-12">
            <motion.div
              initial={{ opacity: 0, y: 28, clipPath: "inset(8% 0 0 0)" }}
              whileInView={{ opacity: 1, y: 0, clipPath: "inset(0% 0 0 0)" }}
              viewport={{ once: true }}
              transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
              className="w-full min-w-0"
            >
              <span className="landing-eyebrow mb-6">
                <span className="landing-live-dot" aria-hidden />
                Built for traders
              </span>

              <h2 className="brand-display-heading mb-5 text-3xl sm:text-4xl lg:text-[2.85rem]">
                Ready to trade{" "}
                <span className="landing-gradient-text">smarter?</span>
              </h2>

              <p className="mb-8 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
                Automate strategies, manage risk, and track performance in one place — with your
                capital staying at your own broker the whole time.
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
                {TRUST_POINTS.map((item, i) => (
                  <motion.span
                    key={item}
                    initial={{ opacity: 0, x: -8 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 + i * 0.07, duration: 0.4 }}
                    className="inline-flex items-center gap-2 text-sm font-medium text-foreground/75"
                  >
                    <Check className="h-4 w-4 shrink-0 text-primary" strokeWidth={2.5} />
                    {item}
                  </motion.span>
                ))}
              </div>
            </motion.div>

            <div className="hero-ambient-layer hero-ambient-layer-cta relative min-h-[14rem]">
              <HeroAmbientVisual variant="cta" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
