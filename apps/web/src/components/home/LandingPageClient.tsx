"use client";

import dynamic from "next/dynamic";
import { AppProviders } from "@/components/providers/AppProviders";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { HeroSection } from "@/components/home/HeroSection";
import React from "react";
import { isExperienceEngineEnabled } from "@/platform/experience/index-flag";
import {
  HowItWorksSkeleton,
  FeaturesSkeleton,
  ValuePillarsSkeleton,
  PricingSkeleton,
  CTABannerSkeleton,
  FaqSkeleton,
} from "@/components/home/LandingSectionSkeletons";

const HowItWorks = dynamic(
  () => import("@/components/home/HowItWorks").then((m) => ({ default: m.HowItWorks })),
  { loading: () => <HowItWorksSkeleton /> },
);

const ValuePillars = dynamic(
  () => import("@/components/home/ValuePillars").then((m) => ({ default: m.ValuePillars })),
  { loading: () => <ValuePillarsSkeleton /> },
);

const FeaturesSection = dynamic(
  () => import("@/components/home/FeaturesSection").then((m) => ({ default: m.FeaturesSection })),
  { loading: () => <FeaturesSkeleton /> },
);

const PricingSection = dynamic(
  () => import("@/components/home/PricingSection").then((m) => ({ default: m.PricingSection })),
  { loading: () => <PricingSkeleton /> },
);

const CTABanner = dynamic(
  () => import("@/components/home/CTABanner").then((m) => ({ default: m.CTABanner })),
  { loading: () => <CTABannerSkeleton /> },
);

const FaqSection = dynamic(
  () => import("@/components/home/FaqSection").then((m) => ({ default: m.FaqSection })),
  { loading: () => <FaqSkeleton /> },
);

/** Carries the hero's texture past its bottom edge; see HeroSeamBleed. */
const HeroSeamBleed = dynamic(
  () =>
    import("@/components/home/scene/HeroSeamBleed").then((m) => ({
      default: m.HeroSeamBleed,
    })),
  { ssr: false },
);

const ExperienceDevPanel = dynamic(
  () =>
    import("@/platform/experience/experience-dev-panel").then((m) => ({
      default: m.ExperienceDevPanel,
    })),
  { ssr: false },
);

/** 3D / Lenis shell — pulled only after LCP window (PT-W01). */
const LandingHeavyShell = dynamic(
  () =>
    import("@/components/home/LandingHeavyShell").then((m) => ({
      default: m.LandingHeavyShell,
    })),
  { ssr: false },
);

function scheduleAfterFirstPaint(fn: () => void) {
  const run = () => {
    if (typeof window.requestIdleCallback === "function") {
      window.requestIdleCallback(() => fn(), { timeout: 5000 });
    } else {
      window.setTimeout(fn, 2000);
    }
  };

  if (typeof window === "undefined") return;
  if (document.readyState === "complete") {
    run();
    return;
  }
  window.addEventListener("load", run, { once: true });
}

function LandingContent({
  footer,
  allowHeavyFx,
}: {
  footer: React.ReactNode;
  allowHeavyFx: boolean;
}) {
  return (
    <>
      <PublicNavbar />
      <HeroSection deferAmbient={!allowHeavyFx} />
      {/* Sits between the two so it can paint over the next section's opaque
          background — it cannot live inside the hero, which clips overflow. */}
      <HeroSeamBleed active={allowHeavyFx} />

      <section className="relative">
        <HowItWorks />
      </section>
      <section className="relative">
        <FeaturesSection />
      </section>
      <section className="relative">
        <ValuePillars />
      </section>
      <section className="relative">
        <PricingSection />
      </section>
      <section className="relative">
        <CTABanner />
      </section>
      <section className="relative">
        <FaqSection />
      </section>

      {footer}
    </>
  );
}

export function LandingPageClient({ footer }: { footer: React.ReactNode }) {
  // Keep ambient WebGL / experience engine off the LCP-critical window (PT-W01).
  const [allowHeavyFx, setAllowHeavyFx] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    scheduleAfterFirstPaint(() => {
      if (!cancelled) setAllowHeavyFx(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    if (!allowHeavyFx || !isExperienceEngineEnabled()) return;

    let cancelled = false;
    let cleanup: (() => void) | undefined;

    void import("@/platform/experience/experience-engine").then((m) => {
      if (cancelled) return;
      cleanup = m.startExperienceEngine() ?? undefined;
      if (cancelled) {
        cleanup?.();
        cleanup = undefined;
      }
    });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [allowHeavyFx]);

  const content = <LandingContent footer={footer} allowHeavyFx={allowHeavyFx} />;

  return (
    <AppProviders>
      {allowHeavyFx ? (
        <LandingHeavyShell
          experienceMetrics={process.env.NEXT_PUBLIC_PLATFORM_METRICS === "1"}
        >
          {content}
          {process.env.NEXT_PUBLIC_PLATFORM_METRICS === "1" &&
            isExperienceEngineEnabled() && <ExperienceDevPanel />}
        </LandingHeavyShell>
      ) : (
        <main className="relative min-h-screen w-full min-w-0 overflow-x-hidden bg-[var(--bg-secondary)] dark:bg-background">
          <div className="relative z-10">{content}</div>
        </main>
      )}
    </AppProviders>
  );
}
