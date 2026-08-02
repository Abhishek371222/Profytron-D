"use client";

import React from "react";
import { LenisProvider } from "@/components/providers/LenisProvider";
import { SceneProvider } from "@/components/3d/SceneProvider";
import { AmbientDepthBackground } from "@/components/3d/AmbientDepthBackground";
import { MarketingTransitionFrame } from "@/components/3d/MarketingTransitionFrame";

/**
 * Post-LCP landing shell: WebGL ambient + Lenis + scene transition.
 * Dynamically imported so the critical hero path does not parse this graph.
 */
export function LandingHeavyShell({
  children,
}: {
  children: React.ReactNode;
  experienceMetrics?: boolean;
}) {
  const isMobile =
    typeof window !== "undefined" &&
    window.matchMedia("(max-width: 767px)").matches;

  return (
    <SceneProvider>
      <LenisProvider>
        <main className="relative min-h-screen w-full min-w-0 overflow-x-hidden bg-[var(--bg-secondary)] dark:bg-background exp-lighting">
          <AmbientDepthBackground
            variant="marketing"
            position="fixed"
            enableAmbientScene={!isMobile}
          />
          <MarketingTransitionFrame transition="cameraPush" className="relative z-10">
            {children}
          </MarketingTransitionFrame>
        </main>
      </LenisProvider>
    </SceneProvider>
  );
}
