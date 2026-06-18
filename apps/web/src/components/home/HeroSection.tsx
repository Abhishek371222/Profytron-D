"use client";

import React from "react";
import { ArrowRight, Play, Check, Sparkles } from "lucide-react";
import { TrustBadges } from "@/components/trust/TrustBadges";
import { StaggerFadeUp, StaggerItem } from "@/components/animations/StaggerFadeUp";
import { HeroDashboardPreview } from "@/components/home/HeroDashboardPreview";
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
    <section className="relative overflow-x-hidden bg-[var(--bg-secondary)] dark:bg-background">
      {/* Ambient teal mesh gradient */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: [
            "radial-gradient(ellipse 80% 55% at 50% -5%, rgba(71,167,170,0.13) 0%, transparent 60%)",
            "radial-gradient(ellipse 55% 40% at 90% 15%, rgba(30,109,72,0.08) 0%, transparent 55%)",
            "radial-gradient(ellipse 45% 35% at 10% 80%, rgba(71,167,170,0.06) 0%, transparent 50%)",
          ].join(", "),
        }}
      />

      {/* Floating ambient orbs */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 orb-teal animate-orb-drift opacity-40 dark:opacity-60"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/3 -left-32 w-72 h-72 orb-green animate-orb-drift-alt opacity-30 dark:opacity-50"
      />

      <div className="page-container relative z-10 pt-28 pb-14 sm:pt-32 sm:pb-16 lg:pb-20">
        <div className="flex flex-col lg:flex-row items-center lg:items-start gap-10 lg:gap-12 xl:gap-16">
          <div className="flex-1 w-full min-w-0 max-w-[600px] lg:max-w-[520px] xl:max-w-[560px]">
            <StaggerFadeUp>
              <StaggerItem>
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/[0.07] px-3.5 py-1.5 mb-6">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-semibold text-primary">
                    AI-powered algorithmic trading platform
                  </span>
                </div>
              </StaggerItem>

              <StaggerItem>
                <h1 className="hero-headline text-[clamp(2.5rem,5vw,4.25rem)] text-foreground text-balance mb-5 sm:mb-6">
                  Stop Trading{" "}
                  <span className="text-gradient-hero">Manually.</span>
                </h1>
              </StaggerItem>

              <StaggerItem>
                <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-[520px] mb-7 sm:mb-8">
                  Build and deploy automated strategies in minutes. Profytron handles execution,
                  AI risk management, and portfolio analytics — 24/7, without you watching the screen.
                </p>
              </StaggerItem>

              <StaggerItem>
                <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 mb-5">
                  {mounted && isAuthenticated ? (
                    <LandingDashboardLink />
                  ) : (
                    <LandingPrimaryLink href="/register?plan=starter">
                      Start 7-Day Free Trial
                      <ArrowRight className="w-4 h-4 shrink-0" />
                    </LandingPrimaryLink>
                  )}
                  <LandingSecondaryLink
                    href="#how-it-works"
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
                    }}
                  >
                    <Play className="w-4 h-4 fill-primary text-primary shrink-0" />
                    See How It Works
                  </LandingSecondaryLink>
                </div>
              </StaggerItem>

              <StaggerItem>
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mb-6">
                  {TRIAL_POINTS.map((t) => (
                    <span
                      key={t}
                      className="flex items-center gap-1.5 text-sm text-muted-foreground font-medium whitespace-nowrap"
                    >
                      <Check className="w-4 h-4 text-[var(--success)] shrink-0" />
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

          <div className="w-full lg:flex-1 flex justify-center lg:justify-end min-w-0 lg:pt-2">
            <HeroDashboardPreview />
          </div>
        </div>

        <HeroStatsRow />
        <HeroFeatureStrip />
      </div>
    </section>
  );
}
