"use client";

import React from "react";
import dynamic from "next/dynamic";
import { ArrowRight, Play, Check } from "lucide-react";
import { TrustBadges } from "@/components/trust/TrustBadges";
import { RotatingWords } from "@/components/animations/RotatingWords";
import { useAuthStore } from "@/lib/stores/useAuthStore";
import {
  LandingDashboardLink,
  LandingPrimaryLink,
  LandingSecondaryLink,
} from "@/components/home/LandingButtons";
import { useMounted } from "@/lib/hooks/useMounted";
import { HERO_COPY } from "@/lib/content/hero-copy";

const HeroAmbientVisual = dynamic(
  () =>
    import("@/components/home/HeroAmbientVisual").then((m) => ({
      default: m.HeroAmbientVisual,
    })),
  { ssr: false, loading: () => <div className="hero-ambient" aria-hidden /> },
);

export function HeroSection({
  deferAmbient = false,
}: {
  /** When true, skip hero visual mount (LCP path until heavy shell attaches). */
  deferAmbient?: boolean;
}) {
  const mounted = useMounted();
  const { isAuthenticated } = useAuthStore();
  const [canMountAmbient, setCanMountAmbient] = React.useState(false);

  React.useEffect(() => {
    if (deferAmbient) {
      setCanMountAmbient(false);
      return;
    }
    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    // Mobile: reserve layout slot with static poster class only — no framer/webgl graph.
    if (isMobile) {
      setCanMountAmbient(false);
      return;
    }
    setCanMountAmbient(true);
  }, [deferAmbient]);

  return (
    <section className="relative w-full min-w-0 overflow-x-hidden bg-[var(--bg-secondary)] pt-28 pb-14 dark:bg-background sm:pt-32 sm:pb-16 lg:pt-36 lg:pb-20">
      <div aria-hidden className="landing-hero-mesh pointer-events-none absolute inset-0" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent"
      />

      <div className="page-container relative z-10 pb-14 sm:pb-16 lg:pb-20">
        <div className="hero-main relative">
          <div className="relative z-10 grid grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-10 xl:gap-14">
            <div className="w-full min-w-0">
              <div className="mb-7 inline-flex items-center gap-2.5 rounded-lg border border-primary/25 bg-card/80 px-3 py-1.5 shadow-sm backdrop-blur-sm dark:bg-card/60">
                <span className="landing-live-dot" aria-hidden />
                <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                  {HERO_COPY.eyebrow}
                </span>
              </div>

              <h1 className="hero-headline mb-5 text-[clamp(2.35rem,5vw,4.15rem)] leading-[0.98] sm:mb-6">
                <span className="block text-foreground">{HERO_COPY.h1Lead}</span>
                <span className="sr-only">{HERO_COPY.h1SrOnly}</span>
                <RotatingWords
                  block
                  words={[...HERO_COPY.h1Rotate]}
                  className="mt-1 text-[clamp(2.35rem,5vw,4.15rem)] sm:mt-2"
                />
              </h1>

              <p className="mb-8 max-w-xl text-base leading-relaxed text-muted-foreground sm:mb-9 sm:text-lg">
                {HERO_COPY.body}
              </p>

              <div className="mb-6 flex flex-col flex-wrap items-stretch gap-3 sm:flex-row sm:items-center">
                {mounted && isAuthenticated ? (
                  <LandingDashboardLink />
                ) : (
                  <LandingPrimaryLink href={HERO_COPY.primaryHref}>
                    {HERO_COPY.primaryCta}
                    <ArrowRight className="h-4 w-4 shrink-0" />
                  </LandingPrimaryLink>
                )}
                <LandingSecondaryLink
                  href={HERO_COPY.secondaryHref}
                  onClick={(e) => {
                    e.preventDefault();
                    document
                      .getElementById("how-it-works")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  <Play className="h-4 w-4 shrink-0 fill-primary text-primary" />
                  {HERO_COPY.secondaryCta}
                </LandingSecondaryLink>
              </div>

              <div className="mb-7 flex flex-wrap items-center gap-x-5 gap-y-2">
                {HERO_COPY.trialPoints.map((t) => (
                  <span
                    key={t}
                    className="flex items-center gap-1.5 whitespace-nowrap text-sm font-medium text-foreground/80"
                  >
                    <Check className="h-4 w-4 shrink-0 text-primary" strokeWidth={2.5} />
                    {t}
                  </span>
                ))}
              </div>

              <TrustBadges compact className="max-w-xl" />
            </div>

            <div className="hero-ambient-layer" aria-hidden>
              {canMountAmbient ? (
                <HeroAmbientVisual />
              ) : (
                <div className="hero-ambient" data-hero-layer="static" />
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
