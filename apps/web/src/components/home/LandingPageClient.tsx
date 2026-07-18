"use client";

import dynamic from "next/dynamic";
import { AppProviders } from "@/components/providers/AppProviders";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { HeroSection } from "@/components/home/HeroSection";
import { SectionRevealer } from "@/components/ui/SectionRevealer";
import { LenisProvider } from "@/components/providers/LenisProvider";
import React from "react";
import {
  startExperienceEngine,
  isExperienceEngineEnabled,
  ExperienceDevPanel,
} from "@/platform/experience";

const HowItWorks = dynamic(
  () => import("@/components/home/HowItWorks").then((m) => ({ default: m.HowItWorks })),
  { loading: () => null },
);

const ValuePillars = dynamic(
  () => import("@/components/home/ValuePillars").then((m) => ({ default: m.ValuePillars })),
  { loading: () => null },
);

const FeaturesSection = dynamic(
  () => import("@/components/home/FeaturesSection").then((m) => ({ default: m.FeaturesSection })),
  { loading: () => null },
);

const PricingSection = dynamic(
  () => import("@/components/home/PricingSection").then((m) => ({ default: m.PricingSection })),
  { loading: () => null },
);

const CTABanner = dynamic(
  () => import("@/components/home/CTABanner").then((m) => ({ default: m.CTABanner })),
  { loading: () => null },
);

const FaqSection = dynamic(
  () => import("@/components/home/FaqSection").then((m) => ({ default: m.FaqSection })),
  { loading: () => null },
);

const Footer = dynamic(
  () => import("@/components/home/Footer").then((m) => ({ default: m.Footer })),
  { loading: () => null },
);

export function LandingPageClient() {
  React.useEffect(() => {
    if (!isExperienceEngineEnabled()) return;
    return startExperienceEngine();
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

          <Footer />
        </div>
        {isExperienceEngineEnabled() && <ExperienceDevPanel />}
      </main>
    </LenisProvider>
    </AppProviders>
  );
}
