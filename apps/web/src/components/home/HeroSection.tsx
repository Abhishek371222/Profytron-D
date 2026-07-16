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
  const trustScrollRef = React.useRef<HTMLDivElement>(null);
  const trustTrackRef = React.useRef<HTMLDivElement>(null);
  const trustDrag = React.useRef<{ pointerId: number; startX: number; startScrollLeft: number } | null>(null);
  const [trustScroll, setTrustScroll] = React.useState({ thumbWidthPct: 100, thumbLeftPct: 0, scrollable: false });

  const updateTrustScroll = React.useCallback(() => {
    const el = trustScrollRef.current;
    if (!el) return;
    const { scrollWidth, clientWidth, scrollLeft } = el;
    const scrollable = scrollWidth - clientWidth > 4;
    const thumbWidthPct = scrollable ? Math.max((clientWidth / scrollWidth) * 100, 20) : 100;
    const maxScrollLeft = scrollWidth - clientWidth;
    const thumbLeftPct =
      scrollable && maxScrollLeft > 0 ? (scrollLeft / maxScrollLeft) * (100 - thumbWidthPct) : 0;
    setTrustScroll({ thumbWidthPct, thumbLeftPct, scrollable });
  }, []);

  React.useEffect(() => {
    updateTrustScroll();
    window.addEventListener("resize", updateTrustScroll);
    return () => window.removeEventListener("resize", updateTrustScroll);
  }, [updateTrustScroll]);

  const handleTrustThumbPointerDown = React.useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const el = trustScrollRef.current;
    if (!el) return;
    trustDrag.current = { pointerId: e.pointerId, startX: e.clientX, startScrollLeft: el.scrollLeft };
    e.currentTarget.setPointerCapture(e.pointerId);
  }, []);

  const handleTrustThumbPointerMove = React.useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const el = trustScrollRef.current;
    const track = trustTrackRef.current;
    const drag = trustDrag.current;
    if (!el || !track || !drag || drag.pointerId !== e.pointerId) return;
    const maxScrollLeft = el.scrollWidth - el.clientWidth;
    const thumbTravelPx = track.clientWidth * (1 - trustScroll.thumbWidthPct / 100);
    if (thumbTravelPx <= 0) return;
    const deltaX = e.clientX - drag.startX;
    const scrollRatio = maxScrollLeft / thumbTravelPx;
    el.scrollLeft = Math.min(Math.max(drag.startScrollLeft + deltaX * scrollRatio, 0), maxScrollLeft);
  }, [trustScroll.thumbWidthPct]);

  const handleTrustThumbPointerUp = React.useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (trustDrag.current?.pointerId === e.pointerId) trustDrag.current = null;
  }, []);

  return (
    <section className="relative w-full min-w-0 overflow-x-hidden bg-[var(--bg-secondary)] pt-28 pb-14 dark:bg-background sm:pt-32 sm:pb-16 lg:pt-36 lg:pb-20">
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
                {/* data-lenis-prevent stops Lenis from capturing touch/wheel so this row can scroll horizontally on mobile */}
                <div
                  id="trust-badges-scroll"
                  ref={trustScrollRef}
                  data-lenis-prevent
                  onScroll={updateTrustScroll}
                  className="landing-trust-scroll -mx-1 touch-pan-x overflow-x-auto pb-1"
                >
                  <TrustBadges compact className="min-w-max px-1 sm:min-w-0 sm:flex-wrap" />
                </div>
                {trustScroll.scrollable && (
                  <div
                    ref={trustTrackRef}
                    className="relative mt-1 flex h-5 w-full touch-none items-center"
                    role="scrollbar"
                    aria-controls="trust-badges-scroll"
                    aria-orientation="horizontal"
                    aria-valuenow={Math.round(trustScroll.thumbLeftPct)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <div className="pointer-events-none absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-[var(--card-border)]" />
                    <div
                      onPointerDown={handleTrustThumbPointerDown}
                      onPointerMove={handleTrustThumbPointerMove}
                      onPointerUp={handleTrustThumbPointerUp}
                      onPointerCancel={handleTrustThumbPointerUp}
                      className="absolute top-1/2 h-1.5 -translate-y-1/2 cursor-grab rounded-full bg-primary active:cursor-grabbing"
                      style={{
                        width: `${trustScroll.thumbWidthPct}%`,
                        left: `${trustScroll.thumbLeftPct}%`,
                      }}
                    />
                  </div>
                )}
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
