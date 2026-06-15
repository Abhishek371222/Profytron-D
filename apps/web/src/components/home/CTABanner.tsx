"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, Zap } from "lucide-react";
import { FadeUp } from "@/components/animations";
import { AnimatedGradientText } from "@/components/saasfly/animated-gradient-text";
import { useAuthStore } from "@/lib/stores/useAuthStore";
import { LandingDashboardLink, LandingPrimaryLink, LandingSecondaryLink } from "@/components/home/LandingButtons";

export function CTABanner() {
  const { isAuthenticated, isHydrating } = useAuthStore();

  return (
    <section className="pt-2 pb-32 relative overflow-hidden bg-transparent">
      <div className="container mx-auto px-6 max-w-[1200px]">
        <div className="landing-glass-card relative rounded-[32px] p-10 md:p-16 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,rgba(59,91,255,0.06)_0%,transparent_70%)]" />

          <div className="relative z-10 text-center max-w-3xl mx-auto flex flex-col items-center">
            <FadeUp>
              {/* Badge — SaaSfly AnimatedGradientText */}
              <motion.div
                animate={{ scale: [1, 1.03, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="mb-8"
              >
                <AnimatedGradientText className="text-foreground/70">
                  <motion.span
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="w-1.5 h-1.5 rounded-full bg-chart-2 mr-2 inline-block"
                    style={{ boxShadow: "0 0 6px #8b5cf6" }}
                  />
                  <span className="text-xs font-semibold text-primary">Get started today</span>
                </AnimatedGradientText>
              </motion.div>

              {/* Headline */}
              <h2 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight text-foreground leading-[1.08]">
                Ready to trade smarter?
              </h2>

              <p className="text-lg md:text-xl text-muted-foreground mb-10 leading-relaxed font-medium max-w-xl">
                Join thousands of traders using Profytron to automate strategies, manage risk, and track performance in one place.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full">
                {!isHydrating && isAuthenticated ? (
                  <LandingDashboardLink className="w-full sm:w-auto" />
                ) : (
                  <LandingPrimaryLink href="/register" className="w-full sm:w-auto min-w-[200px]">
                    Start Free Trial
                    <ArrowRight className="w-4 h-4 shrink-0" />
                  </LandingPrimaryLink>
                )}

                <LandingSecondaryLink href="/docs" className="w-full sm:w-auto">
                  <Zap className="w-4 h-4 text-primary shrink-0" />
                  Read Documentation
                </LandingSecondaryLink>
              </div>

              {/* Trust signals */}
              <div className="flex items-center gap-8 mt-10 flex-wrap justify-center">
                {[
                  "No credit card required",
                  "Free 14-day trial",
                  "Cancel anytime",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-chart-3" />
                    <span className="text-caption text-muted-foreground font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </FadeUp>
          </div>
        </div>
      </div>
    </section>
  );
}
