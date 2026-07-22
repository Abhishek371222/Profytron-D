"use client";

import dynamic from "next/dynamic";
import { AppProviders } from "@/components/providers/AppProviders";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { HeroSection } from "@/components/home/HeroSection";
import { SectionRevealer } from "@/components/ui/SectionRevealer";
import { LenisProvider } from "@/components/providers/LenisProvider";
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

/** Dev-only panel — keep out of the initial landing graph. */
const ExperienceDevPanel = dynamic(
  () =>
    import("@/platform/experience/experience-dev-panel").then((m) => ({
      default: m.ExperienceDevPanel,
    })),
  { ssr: false },
);

export function LandingPageClient({ footer }: { footer: React.ReactNode }) {
  React.useEffect(() => {
    if (!isExperienceEngineEnabled()) return;

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
  }, []);

  return (
    <AppProviders>
    <LenisProvider>
      <main className="relative min-h-screen w-full min-w-0 overflow-x-hidden bg-[var(--bg-secondary)] dark:bg-background exp-lighting">
        <div className="relative z-10">
          <PublicNavbar />
          <HeroSection />

          <SectionRevealer delay={0.08}>
            <HowItWorks />
          </SectionRevealer>

          <SectionRevealer delay={0.1}>
            <FeaturesSection />
          </SectionRevealer>

          <SectionRevealer delay={0.1}>
            <ValuePillars />
          </SectionRevealer>

          <SectionRevealer delay={0.1}>
            <PricingSection />
          </SectionRevealer>

          <SectionRevealer delay={0.1}>
            <CTABanner />
          </SectionRevealer>

          <SectionRevealer delay={0.08}>
            <FaqSection />
          </SectionRevealer>

          {footer}
        </div>
        {process.env.NEXT_PUBLIC_PLATFORM_METRICS === "1" &&
          isExperienceEngineEnabled() && <ExperienceDevPanel />}
      </main>
    </LenisProvider>
    </AppProviders>
  );
}
