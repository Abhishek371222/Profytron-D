"use client";

import { LandingNavbar } from '@/components/layout/LandingNavbar';
import { HeroSection } from '@/components/home/HeroSection';
import { LiveTicker, StatsSection } from '@/components/home/StatsSection';
import { SocialProofBar } from '@/components/home/SocialProofBar';
import { ValuePillars } from '@/components/home/ValuePillars';
import { FeaturesSection } from '@/components/home/FeaturesSection';
import { HowItWorks } from '@/components/home/HowItWorks';
import { Testimonials } from '@/components/home/Testimonials';
import { PricingSection } from '@/components/home/PricingSection';
import { CTABanner } from '@/components/home/CTABanner';
import { Footer } from '@/components/home/Footer';
import { CinematicCursor } from '@/components/ui/CinematicCursor';
import { SectionRevealer } from '@/components/ui/SectionRevealer';

export function LandingPageClient() {
  return (
    <main className="min-h-screen bg-bg-base overflow-x-hidden noise relative aurora-bg">
      <CinematicCursor />

      <div className="fixed inset-0 pointer-events-none z-[-2] opacity-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.05)_0%,transparent_100%)]" />
      </div>

      <LandingNavbar />

      <HeroSection />

      <SectionRevealer>
        <LiveTicker />
      </SectionRevealer>

      <SectionRevealer delay={0.1}>
        <SocialProofBar />
      </SectionRevealer>

      <SectionRevealer delay={0.15}>
        <ValuePillars />
      </SectionRevealer>

      <SectionRevealer>
        <FeaturesSection />
      </SectionRevealer>

      <SectionRevealer>
        <HowItWorks />
      </SectionRevealer>

      <SectionRevealer>
        <StatsSection />
      </SectionRevealer>

      <SectionRevealer>
        <Testimonials />
      </SectionRevealer>

      <SectionRevealer>
        <PricingSection />
      </SectionRevealer>

      <SectionRevealer>
        <CTABanner />
      </SectionRevealer>

      <Footer />

      <div className="fixed inset-0 pointer-events-none z-[-1]">
        <div className="absolute top-[20%] -left-[10%] w-200 h-200 bg-primary/5 blur-[180px] rounded-full opacity-50" />
        <div className="absolute bottom-[20%] -right-[10%] w-200 h-200 bg-indigo-500/5 blur-[180px] rounded-full opacity-50" />
      </div>
    </main>
  );
}