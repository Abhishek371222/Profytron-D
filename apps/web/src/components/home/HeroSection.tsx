"use client";

import React from "react";
import { ArrowRight, Play, Check, Sparkles } from "lucide-react";
import { TrustBadges } from "@/components/trust/TrustBadges";
import { StaggerFadeUp, StaggerItem } from "@/components/animations/StaggerFadeUp";
import { MagneticWrap } from "@/components/animations";
import { RotatingWords } from "@/components/animations/RotatingWords";
import { HeroAmbientVisual } from "@/components/home/HeroAmbientVisual";
import { HeroStatsRow } from "@/components/home/HeroStatsRow";
import { HeroFeatureStrip } from "@/components/home/HeroFeatureStrip";
import { useAuthStore } from "@/lib/stores/useAuthStore";
import { LandingDashboardLink, LandingPrimaryLink, LandingSecondaryLink } from "@/components/home/LandingButtons";
import { useMounted } from "@/lib/hooks/useMounted";

const TRIAL_POINTS = ["No Credit Card", "7-Day Trial", "Cancel Anytime"];

export function HeroSection() {
  const mounted = useMounted();
  const { isAuthenticated } = useAuthStore();

  return (
    <section className="relative w-full min-w-0 overflow-x-hidden bg-[var(--bg-secondary)] pt-24 pb-14 dark:bg-background sm:pt-28 sm:pb-16 lg:pb-20">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: [
            "radial-gradient(ellipse 90% 60% at 50% -8%, rgba(71,167,170,0.14) 0%, transparent 62%)",
            "radial-gradient(ellipse 60% 45% at 88% 12%, rgba(30,109,72,0.09) 0%, transparent 58%)",
            "radial-gradient(ellipse 50% 40% at 8% 75%, rgba(71,167,170,0.07) 0%, transparent 52%)",
          ].join(", "),
        }}
      />

      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -right-32 h-[28rem] w-[28rem] orb-teal animate-orb-drift opacity-30 dark:opacity-45"
      />

      <div className="page-container relative z-10 pb-14 sm:pb-16 lg:pb-20">
        <div className="hero-main relative">
          <div className="relative z-10 grid grid-cols-1 items-center gap-6 lg:grid-cols-2 lg:gap-10 xl:gap-14">
            <div className="w-full min-w-0">
              <StaggerFadeUp>
              <StaggerItem>
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/[0.07] px-3.5 py-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs font-semibold text-primary">
                    AI-powered algorithmic trading platform
                  </span>
                </div>
              </StaggerItem>

              <StaggerItem>
                <h1 className="hero-headline mb-5 text-[clamp(2.25rem,4.5vw,4rem)] leading-[1.05] sm:mb-6">
                  <span className="block text-foreground">Stop Trading</span>
                  {/* Stable, complete accessible name for AT/SEO; the rotating
                      words below are decorative and marked aria-hidden. */}
                  <span className="sr-only"> manually, emotionally, blindly, or slowly.</span>
                  <RotatingWords
                    block
                    words={["Manually.", "Emotionally.", "Blindly.", "Slowly."]}
                    className="mt-1 text-[clamp(2.25rem,4.5vw,4rem)] sm:mt-2"
                  />
                </h1>
              </StaggerItem>

              <StaggerItem>
                <p className="mb-7 max-w-xl text-base leading-relaxed text-muted-foreground sm:mb-8 sm:text-lg">
                  Build and deploy automated strategies in minutes. Profytron handles execution,
                  AI risk management, and portfolio analytics — 24/7, without you watching the screen.
                </p>
              </StaggerItem>

              <StaggerItem>
                <div className="mb-5 flex flex-col flex-wrap items-stretch gap-3 sm:flex-row sm:items-center">
                  {mounted && isAuthenticated ? (
                    <MagneticWrap strength={0.22}>
                      <LandingDashboardLink />
                    </MagneticWrap>
                  ) : (
                    <MagneticWrap strength={0.28}>
                      <LandingPrimaryLink href="/register?plan=starter">
                        Start 7-Day Free Trial
                        <ArrowRight className="h-4 w-4 shrink-0" />
                      </LandingPrimaryLink>
                    </MagneticWrap>
                  )}
                  <MagneticWrap strength={0.15}>
                    <LandingSecondaryLink
                      href="#how-it-works"
                      onClick={(e) => {
                        e.preventDefault();
                        document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
                      }}
                    >
                      <Play className="h-4 w-4 shrink-0 fill-primary text-primary" />
                      See How It Works
                    </LandingSecondaryLink>
                  </MagneticWrap>
                </div>
              </StaggerItem>

              <StaggerItem>
                <div className="mb-6 flex flex-wrap items-center gap-x-5 gap-y-2">
                  {TRIAL_POINTS.map((t) => (
                    <span
                      key={t}
                      className="flex items-center gap-1.5 whitespace-nowrap text-sm font-medium text-muted-foreground"
                    >
                      <Check className="h-4 w-4 shrink-0 text-[var(--success)]" />
                      {t}
                    </span>
                  ))}
                </div>
              </StaggerItem>

              <StaggerItem>
                <div className="landing-trust-scroll -mx-1 overflow-x-auto pb-1">
                  <TrustBadges compact className="min-w-max px-1 sm:min-w-0 sm:flex-wrap" />
                </div>
              </StaggerItem>
              </StaggerFadeUp>
            </div>

            <div className="hero-ambient-layer">
              <HeroAmbientVisual />
            </div>
          </div>
        </div>

        <HeroStatsRow />
        <HeroFeatureStrip />
      </div>
    </section>
  );
}
