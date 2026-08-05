"use client";

import React from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
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
import {
  HERO_LAYOUT_VARIANT,
  HERO_SCENE,
} from "@/components/home/scene/hero-scene-config";

/** Hero scenes are pulled in only once the LCP window has passed. */
const HeroParticleScene = dynamic(
  () =>
    import("@/components/home/scene/HeroParticleScene").then((m) => ({
      default: m.HeroParticleScene,
    })),
  { ssr: false },
);

const HeroExecutionScene = dynamic(
  () =>
    import("@/components/home/scene/HeroExecutionScene").then((m) => ({
      default: m.HeroExecutionScene,
    })),
  { ssr: false },
);

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
  const heroRef = React.useRef<HTMLElement | null>(null);
  const depthRef = React.useRef<HTMLDivElement | null>(null);

  /** A full-stage scene replaces the chart — running both is visual clutter. */
  const sceneOn = HERO_SCENE !== "off";
  const showChart = !sceneOn;
  const showDepthAnimals = HERO_SCENE === "execution-core";

  React.useEffect(() => {
    if (deferAmbient || !showChart) {
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
  }, [deferAmbient, showChart]);

  React.useEffect(() => {
    if (!showDepthAnimals || deferAmbient) return;
    const hero = heroRef.current;
    const depth = depthRef.current;
    if (!hero || !depth) return;

    const finePointer = window.matchMedia(
      "(hover: hover) and (pointer: fine)",
    ).matches;
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const setPosition = (
      bullX: number,
      bullY: number,
      bearX: number,
      bearY: number,
    ) => {
      depth.style.setProperty("--bull-depth-x", `${bullX.toFixed(2)}px`);
      depth.style.setProperty("--bull-depth-y", `${bullY.toFixed(2)}px`);
      depth.style.setProperty("--bear-depth-x", `${bearX.toFixed(2)}px`);
      depth.style.setProperty("--bear-depth-y", `${bearY.toFixed(2)}px`);
    };
    if (reducedMotion) {
      setPosition(0, 0, 0, 0);
      return;
    }

    let raf = 0;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let inView = true;

    const tick = (now: number) => {
      currentX += (targetX - currentX) * 0.055;
      currentY += (targetY - currentY) * 0.055;

      // A low-amplitude 12–14 second drift keeps touch and idle states alive.
      const driftX = Math.sin(now / 1990) * (finePointer ? 1.7 : 2.8);
      const driftY = Math.cos(now / 2180) * (finePointer ? 1.2 : 2.1);
      setPosition(
        currentX * 10 + driftX * 0.7,
        currentY * 7 + driftY * 0.65,
        currentX * 14 - driftX * 0.85,
        currentY * 9 + driftY * 0.8,
      );
      raf = window.requestAnimationFrame(tick);
    };

    const pause = () => {
      if (raf) window.cancelAnimationFrame(raf);
      raf = 0;
    };
    const resume = () => {
      if (!raf && inView && !document.hidden)
        raf = window.requestAnimationFrame(tick);
    };
    const onPointerMove = (event: PointerEvent) => {
      const rect = hero.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      targetX = Math.max(
        -1,
        Math.min(1, ((event.clientX - rect.left) / rect.width - 0.5) * 2),
      );
      targetY = Math.max(
        -1,
        Math.min(1, ((event.clientY - rect.top) / rect.height - 0.5) * 2),
      );
    };
    const reset = () => {
      targetX = 0;
      targetY = 0;
    };
    const onVisibility = () => (document.hidden ? pause() : resume());
    const observer =
      typeof IntersectionObserver !== "undefined"
        ? new IntersectionObserver(
            ([entry]) => {
              inView = entry.isIntersecting;
              if (inView) resume();
              else pause();
            },
            { rootMargin: "80px" },
          )
        : null;

    if (finePointer) {
      hero.addEventListener("pointermove", onPointerMove, { passive: true });
      hero.addEventListener("pointerleave", reset, { passive: true });
    }
    window.addEventListener("blur", reset);
    document.addEventListener("visibilitychange", onVisibility);
    observer?.observe(hero);
    resume();

    return () => {
      if (finePointer) {
        hero.removeEventListener("pointermove", onPointerMove);
        hero.removeEventListener("pointerleave", reset);
      }
      window.removeEventListener("blur", reset);
      document.removeEventListener("visibilitychange", onVisibility);
      observer?.disconnect();
      pause();
    };
  }, [deferAmbient, showDepthAnimals]);

  return (
    <section
      ref={heroRef}
      className={`relative w-full min-w-0 overflow-x-hidden pt-28 pb-14 sm:pt-32 sm:pb-16 lg:pt-36 lg:pb-20 ${
        sceneOn ? "hero-stage" : "bg-[var(--bg-secondary)] dark:bg-background"
      }`}
      data-hero-scene={HERO_SCENE}
      data-hero-layout={HERO_LAYOUT_VARIANT}
    >
      {HERO_SCENE === "execution-core" ? (
        // Uses the same existing post-LCP gate as the other ambient visuals.
        <HeroExecutionScene active={!deferAmbient} />
      ) : HERO_SCENE === "particles" ? (
        // `deferAmbient` is the existing post-LCP gate; the scene reuses it so
        // nothing here loads or paints during the critical window.
        <HeroParticleScene active={!deferAmbient} />
      ) : (
        <div
          aria-hidden
          className="landing-hero-mesh pointer-events-none absolute inset-0"
        />
      )}
      {showDepthAnimals && !deferAmbient ? (
        <div ref={depthRef} className="hero-depth-parallax" aria-hidden>
          <div className="hero-depth-reflection hero-depth-reflection-bull" />
          <div className="hero-depth-reflection hero-depth-reflection-bear" />
          <div className="hero-depth-animal hero-depth-bull">
            <Image
              src="/hero/bull-cutout.png"
              alt=""
              width={1060}
              height={1484}
              sizes="(max-width: 767px) 76vw, (max-width: 1023px) 60vw, 42vw"
              quality={75}
              className="hero-depth-animal-base"
            />
            <Image
              src="/hero/bull-cutout.png"
              alt=""
              width={1060}
              height={1484}
              sizes="(max-width: 767px) 76vw, (max-width: 1023px) 60vw, 42vw"
              quality={75}
              className="hero-depth-animal-rim"
            />
          </div>
          <div className="hero-depth-animal hero-depth-bear">
            <Image
              src="/hero/bear-cutout.png"
              alt=""
              width={1122}
              height={1402}
              sizes="(max-width: 767px) 82vw, (max-width: 1023px) 64vw, 44vw"
              quality={75}
              className="hero-depth-animal-base"
            />
            <Image
              src="/hero/bear-cutout.png"
              alt=""
              width={1122}
              height={1402}
              sizes="(max-width: 767px) 82vw, (max-width: 1023px) 64vw, 44vw"
              quality={75}
              className="hero-depth-animal-rim"
            />
          </div>
        </div>
      ) : null}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent"
      />

      <div className="page-container relative z-10 pb-14 sm:pb-16 lg:pb-20">
        <div className="hero-main relative">
          <div className="relative z-10 grid grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-10 xl:gap-14">
            <div className="hero-copy-shield w-full min-w-0">
              <div className="mb-7 inline-flex items-center gap-2.5 rounded-lg border border-primary/25 bg-card/80 px-3 py-1.5 shadow-sm backdrop-blur-sm dark:bg-card/60">
                <span className="landing-live-dot" aria-hidden />
                <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                  {HERO_COPY.eyebrow}
                </span>
              </div>

              <h1 className="hero-headline mb-5 text-[clamp(2.35rem,5vw,4.15rem)] leading-[0.98] sm:mb-6">
                <span className="block text-foreground">
                  {HERO_COPY.h1Lead}
                </span>
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
                    <Check
                      className="h-4 w-4 shrink-0 text-primary"
                      strokeWidth={2.5}
                    />
                    {t}
                  </span>
                ))}
              </div>

              <TrustBadges compact className="max-w-xl" />
            </div>

            {showChart ? (
              <div className="hero-ambient-layer" aria-hidden>
                {canMountAmbient ? (
                  <HeroAmbientVisual />
                ) : (
                  <div className="hero-ambient" data-hero-layer="static" />
                )}
              </div>
            ) : (
              // The full-stage artwork owns this column. Rendering the ambient
              // chart as well would add both clutter and unnecessary work.
              <div aria-hidden className="hidden lg:block" />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
