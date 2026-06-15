"use client";

import dynamic from "next/dynamic";
import { AppProviders } from "@/components/providers/AppProviders";
import { LandingNavbar } from "@/components/layout/LandingNavbar";
import { HeroSection } from "@/components/home/HeroSection";
import { SectionRevealer } from "@/components/ui/SectionRevealer";
import { LenisProvider } from "@/components/providers/LenisProvider";

const LiveTicker = dynamic(
  () => import("@/components/home/StatsSection").then((m) => ({ default: m.LiveTicker })),
  { loading: () => <div className="h-[72px]" aria-hidden /> },
);

const SocialProofBar = dynamic(
  () => import("@/components/home/SocialProofBar").then((m) => ({ default: m.SocialProofBar })),
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

const HowItWorks = dynamic(
  () => import("@/components/home/HowItWorks").then((m) => ({ default: m.HowItWorks })),
  { loading: () => null },
);

const StatsSection = dynamic(
  () => import("@/components/home/StatsSection").then((m) => ({ default: m.StatsSection })),
  { loading: () => null },
);

const Testimonials = dynamic(
  () => import("@/components/home/Testimonials").then((m) => ({ default: m.Testimonials })),
  { loading: () => null },
);

const PricingSection = dynamic(
  () => import("@/components/home/PricingSection").then((m) => ({ default: m.PricingSection })),
  { loading: () => null },
);

const FaqSection = dynamic(
  () => import("@/components/home/FaqSection").then((m) => ({ default: m.FaqSection })),
  { loading: () => null },
);

const CTABanner = dynamic(
  () => import("@/components/home/CTABanner").then((m) => ({ default: m.CTABanner })),
  { loading: () => null },
);

const Footer = dynamic(
  () => import("@/components/home/Footer").then((m) => ({ default: m.Footer })),
  { loading: () => null },
);

export function LandingPageClient() {
  return (
    <AppProviders>
    <LenisProvider>
      <main className="relative min-h-screen bg-background overflow-x-hidden">
        <div className="relative z-10">
          <LandingNavbar />
          <HeroSection />

          <SectionRevealer>
            <SocialProofBar />
          </SectionRevealer>

          <SectionRevealer delay={0.08}>
            <LiveTicker />
          </SectionRevealer>

          <SectionRevealer delay={0.1}>
            <ValuePillars />
          </SectionRevealer>

          <SectionRevealer delay={0.05} direction="right">
            <FeaturesSection />
          </SectionRevealer>

          <SectionRevealer delay={0.08}>
            <HowItWorks />
          </SectionRevealer>

          <SectionRevealer delay={0.06}>
            <StatsSection />
          </SectionRevealer>

          <SectionRevealer delay={0.08} direction="left">
            <Testimonials />
          </SectionRevealer>

          <SectionRevealer delay={0.1}>
            <PricingSection />
          </SectionRevealer>

          <SectionRevealer delay={0.08}>
            <FaqSection />
          </SectionRevealer>

          <SectionRevealer delay={0.12}>
            <CTABanner />
          </SectionRevealer>

          <Footer />
        </div>
      </main>
    </LenisProvider>
    </AppProviders>
  );
}
