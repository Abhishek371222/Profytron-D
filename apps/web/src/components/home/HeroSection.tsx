"use client";

import dynamic from "next/dynamic";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Play, Check } from "lucide-react";
import { TrustBadges } from "@/components/trust/TrustBadges";
import { StaggerFadeUp, StaggerItem } from "@/components/animations/StaggerFadeUp";
import { RotatingWords } from "@/components/animations/RotatingWords";
import { useAuthStore } from "@/lib/stores/useAuthStore";
import {
  LandingDashboardLink,
  LandingPrimaryLink,
  LandingSecondaryLink,
} from "@/components/home/LandingButtons";
import { useMounted } from "@/lib/hooks/useMounted";

const HeroAmbientVisual = dynamic(
  () =>
    import("@/components/home/HeroAmbientVisual").then((m) => ({
      default: m.HeroAmbientVisual,
    })),
  { ssr: false, loading: () => <div className="hero-ambient" aria-hidden /> },
);

const TRIAL_POINTS = ["No Credit Card", "7-Day Trial", "Cancel Anytime"];

export function HeroSection() {
  const mounted = useMounted();
  const { isAuthenticated } = useAuthStore();
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative w-full min-w-0 overflow-x-hidden bg-[var(--bg-secondary)] pt-28 pb-14 dark:bg-background sm:pt-32 sm:pb-16 lg:pt-36 lg:pb-20">
      <div aria-hidden className="landing-hero-mesh pointer-events-none absolute inset-0" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent"
      />

      <div className="page-container relative z-10 pb-14 sm:pb-16 lg:pb-20">
        <div className="hero-main relative">
          <div className="relative z-10 grid grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-10 xl:gap-14">
            <div className="w-full min-w-0">
              <StaggerFadeUp>
                <StaggerItem>
                  <div className="mb-7 inline-flex items-center gap-2.5 rounded-lg border border-primary/25 bg-card/80 px-3 py-1.5 shadow-sm backdrop-blur-sm dark:bg-card/60">
                    <span className="landing-live-dot" aria-hidden />
                    <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                      Live engine · MT5 ready
                    </span>
                  </div>
                </StaggerItem>
              </StaggerFadeUp>

              <h1 className="hero-headline mb-5 text-[clamp(2.35rem,5vw,4.15rem)] leading-[0.98] sm:mb-6">
                <span className="block text-foreground">Stop Trading</span>
                <span className="sr-only"> manually, emotionally, blindly, or slowly.</span>
                <RotatingWords
                  block
                  words={["Manually.", "Emotionally.", "Blindly.", "Slowly."]}
                  className="mt-1 text-[clamp(2.35rem,5vw,4.15rem)] sm:mt-2"
                />
              </h1>

              <motion.p
                initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                className="mb-8 max-w-xl text-base leading-relaxed text-muted-foreground sm:mb-9 sm:text-lg"
              >
                Build and deploy automated strategies in minutes. Profytron handles execution,
                AI risk management, and portfolio analytics — 24/7, without you watching the screen.
              </motion.p>

              <StaggerFadeUp>
                <StaggerItem>
                  <div className="mb-6 flex flex-col flex-wrap items-stretch gap-3 sm:flex-row sm:items-center">
                    {mounted && isAuthenticated ? (
                      <LandingDashboardLink />
                    ) : (
                      <LandingPrimaryLink href="/register?plan=starter">
                        Start 7-Day Free Trial
                        <ArrowRight className="h-4 w-4 shrink-0" />
                      </LandingPrimaryLink>
                    )}
                    <LandingSecondaryLink
                      href="#how-it-works"
                      onClick={(e) => {
                        e.preventDefault();
                        document
                          .getElementById("how-it-works")
                          ?.scrollIntoView({ behavior: "smooth" });
                      }}
                    >
                      <Play className="h-4 w-4 shrink-0 fill-primary text-primary" />
                      See How It Works
                    </LandingSecondaryLink>
                  </div>
                </StaggerItem>

                <StaggerItem>
                  <div className="mb-7 flex flex-wrap items-center gap-x-5 gap-y-2">
                    {TRIAL_POINTS.map((t) => (
                      <span
                        key={t}
                        className="flex items-center gap-1.5 whitespace-nowrap text-sm font-medium text-foreground/80"
                      >
                        <Check className="h-4 w-4 shrink-0 text-primary" strokeWidth={2.5} />
                        {t}
                      </span>
                    ))}
                  </div>
                </StaggerItem>

                <StaggerItem>
                  <TrustBadges compact className="max-w-xl" />
                </StaggerItem>
              </StaggerFadeUp>
            </div>

            <div className="hero-ambient-layer">
              <HeroAmbientVisual />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
