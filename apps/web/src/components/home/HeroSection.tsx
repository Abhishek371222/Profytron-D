"use client";

import React from "react";
import { ArrowRight, Play, Check } from "lucide-react";
import { TrustBadges } from "@/components/trust/TrustBadges";
import { AuroraBackground } from "@/components/animations/AuroraBackground";
import { MouseSpotlight } from "@/components/animations/MouseSpotlight";
import { StaggerFadeUp, StaggerItem } from "@/components/animations/StaggerFadeUp";
import { AnimatedCounter } from "@/components/animations/AnimatedCounter";
import { HeroDashboardPreview } from "@/components/home/HeroDashboardPreview";
import { useAuthStore } from "@/lib/stores/useAuthStore";
import { LandingDashboardLink, LandingPrimaryLink, LandingSecondaryLink } from "@/components/home/LandingButtons";

const TRIAL_POINTS = ["No Credit Card", "7-Day Trial", "Cancel Anytime"];

export function HeroSection() {
  const { isAuthenticated, isHydrating } = useAuthStore();

  return (
    <section className="relative min-h-[min(100dvh,920px)] flex items-center overflow-x-hidden">
      <AuroraBackground />
      <MouseSpotlight />

      <div className="page-container relative z-10 pt-28 pb-16 sm:pt-32 sm:pb-20 lg:pb-24">
        <div className="flex flex-col lg:flex-row items-center lg:items-center gap-12 lg:gap-10 xl:gap-14">
          <div className="flex-1 w-full min-w-0 max-w-[600px] lg:max-w-[540px]">
            <StaggerFadeUp>
              <StaggerItem>
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1.5 mb-6">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span className="text-xs font-semibold text-primary tracking-wide">
                    AI-powered algorithmic trading platform
                  </span>
                </div>
              </StaggerItem>

              <StaggerItem>
                <h1 className="hero-headline text-hero text-foreground text-balance mb-5 sm:mb-6">
                  Stop Trading{" "}
                  <span className="text-gradient-hero">Manually.</span>
                </h1>
              </StaggerItem>

              <StaggerItem>
                <p className="text-body-lg text-muted-foreground leading-relaxed max-w-[520px] mb-7 sm:mb-8">
                  Build and deploy automated strategies in minutes. Profytron handles execution,
                  AI risk management, and portfolio analytics — 24/7, without you watching the screen.
                </p>
              </StaggerItem>

              <StaggerItem>
                <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 mb-5">
                  {!isHydrating && isAuthenticated ? (
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
                    <span key={t} className="flex items-center gap-1.5 text-sm text-muted-foreground font-medium whitespace-nowrap">
                      <Check className="w-3.5 h-3.5 text-[var(--success)] shrink-0" />
                      {t}
                    </span>
                  ))}
                </div>
              </StaggerItem>

              <StaggerItem>
                <TrustBadges compact className="mb-8" />
              </StaggerItem>

              <StaggerItem>
                <div className="flex flex-wrap items-center gap-8 sm:gap-12 pt-6 border-t border-border">
                  <div>
                    <p className="text-sm text-muted-foreground font-medium mb-1">Active Traders</p>
                    <p className="text-2xl font-bold text-foreground tabular-nums">
                      <AnimatedCounter value={12000} suffix="+" />
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-medium mb-1">Volume Traded</p>
                    <p className="text-2xl font-bold text-foreground tabular-nums">
                      <AnimatedCounter value={1.2} prefix="$" suffix="B+" decimals={1} />
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-medium mb-1">Uptime</p>
                    <p className="text-2xl font-bold text-foreground tabular-nums">
                      <AnimatedCounter value={99.99} suffix="%" decimals={2} />
                    </p>
                  </div>
                </div>
              </StaggerItem>
            </StaggerFadeUp>
          </div>

          <div className="w-full lg:flex-1 flex justify-center lg:justify-end min-w-0">
            <HeroDashboardPreview />
          </div>
        </div>
      </div>
    </section>
  );
}
