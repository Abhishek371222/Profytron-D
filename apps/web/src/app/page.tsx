'use client';

import dynamic from 'next/dynamic';

// ─── Static import (needs SSR for above-the-fold) ───────────────────────────
import { LandingNavbar } from '@/components/layout/LandingNavbar';

// ─── Skeleton loaders for instant perceived performance ──────────────────────
const SectionSkeleton = () => (
 <div className="w-full py-32 animate-pulse">
 <div className="container mx-auto px-6 space-y-6">
 <div className="h-4 w-32 bg-white/5 rounded-full" />
 <div className="h-12 w-2/3 bg-white/5 rounded-2xl" />
 <div className="h-4 w-1/2 bg-white/5 rounded-full" />
 </div>
 </div>
);

const TickerSkeleton = () => (
 <div className="w-full h-14 bg-black/40 border-b border-white/5 animate-pulse" />
);

// ─── Dynamic imports — split JS bundle per section ───────────────────────────
// Hero loads client-side (has 3D globe + parallax scroll)
const HeroSection = dynamic(
 () => import('@/components/home/HeroSection').then((m) => ({ default: m.HeroSection })),
 { ssr: false, loading: () => <div className="min-h-screen bg-bg-base" /> }
);

const LiveTicker = dynamic(
 () => import('@/components/home/StatsSection').then((m) => ({ default: m.LiveTicker })),
 { ssr: false, loading: () => <TickerSkeleton /> }
);

const SocialProofBar = dynamic(
 () => import('@/components/home/SocialProofBar').then((m) => ({ default: m.SocialProofBar })),
 { ssr: false, loading: () => <SectionSkeleton /> }
);

const FeaturesSection = dynamic(
 () => import('@/components/home/FeaturesSection').then((m) => ({ default: m.FeaturesSection })),
 { ssr: false, loading: () => <SectionSkeleton /> }
);

const HowItWorks = dynamic(
 () => import('@/components/home/HowItWorks').then((m) => ({ default: m.HowItWorks })),
 { ssr: false, loading: () => <SectionSkeleton /> }
);

const StatsSection = dynamic(
 () => import('@/components/home/StatsSection').then((m) => ({ default: m.StatsSection })),
 { ssr: false, loading: () => <SectionSkeleton /> }
);

const Testimonials = dynamic(
 () => import('@/components/home/Testimonials').then((m) => ({ default: m.Testimonials })),
 { ssr: false, loading: () => <SectionSkeleton /> }
);

const PricingSection = dynamic(
 () => import('@/components/home/PricingSection').then((m) => ({ default: m.PricingSection })),
 { ssr: false, loading: () => <SectionSkeleton /> }
);

const CTABanner = dynamic(
 () => import('@/components/home/CTABanner').then((m) => ({ default: m.CTABanner })),
 { ssr: false, loading: () => <SectionSkeleton /> }
);

const Footer = dynamic(
 () => import('@/components/home/Footer').then((m) => ({ default: m.Footer })),
 { ssr: false, loading: () => <div className="h-64 bg-bg-base" /> }
);

const CinematicCursor = dynamic(
 () => import('@/components/ui/CinematicCursor').then((m) => ({ default: m.CinematicCursor })),
 { ssr: false, loading: () => null }
);

const SectionRevealer = dynamic(
 () => import('@/components/ui/SectionRevealer').then((m) => ({ default: m.SectionRevealer })),
 { ssr: false, loading: () => null }
);

// ─── Page (Server Component — no 'use client' here) ─────────────────────────
export default function LandingPage() {
 return (
 <main className="min-h-screen bg-bg-base overflow-x-hidden noise relative">
 {/* Cursor — loads lazily, no SSR needed */}
 <CinematicCursor />

 {/* Dynamic Background */}
 <div className="fixed inset-0 pointer-events-none z-[-2] opacity-20">
 <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.05)_0%,transparent_100%)]" />
 </div>

 {/* Navbar — static import, no lazy load needed (small, always visible) */}
 <LandingNavbar />

 {/* Hero — ssr:false because it contains Three.js / framer scroll hooks */}
 <HeroSection />

 {/* Below-fold sections — all deferred */}
 <SectionRevealer>
 <LiveTicker />
 </SectionRevealer>

 <SectionRevealer delay={0.1}>
 <SocialProofBar />
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

 {/* Background Glows */}
 <div className="fixed inset-0 pointer-events-none z-[-1]">
 <div className="absolute top-[20%] -left-[10%] w-[800px] h-[800px] bg-primary/5 blur-[180px] rounded-full opacity-50" />
 <div className="absolute bottom-[20%] -right-[10%] w-[800px] h-[800px] bg-indigo-500/5 blur-[180px] rounded-full opacity-50" />
 </div>
 </main>
 );
}
