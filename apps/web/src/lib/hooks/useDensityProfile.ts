"use client";

import { useEffect, useState } from "react";

export type DensityProfile = "compact" | "standard" | "comfortable" | "expanded";

/**
 * Thin adaptive density — Phase 2 UI Excellence.
 * Selected from viewport geometry + DPR + browser zoom (visualViewport.scale).
 * Does not introduce a new layout engine; remaps CSS tokens via data-density.
 */
export function resolveDensityProfile(input: {
  width: number;
  height: number;
  dpr: number;
  zoom: number;
}): DensityProfile {
  const { width, height, dpr, zoom } = input;
  const aspect = width / Math.max(height, 1);
  const effectiveWidth = width / Math.max(zoom, 0.5);

  // Ultrawide + tall desktop → expanded
  if (effectiveWidth >= 1920 && height >= 900 && aspect >= 1.4 && dpr <= 1.5 && zoom <= 1.1) {
    return "expanded";
  }
  // Short laptop / high zoom → compact
  if (effectiveWidth < 768 || height < 700 || zoom >= 1.25 || (dpr >= 2 && effectiveWidth < 1100)) {
    return "compact";
  }
  // Comfortable mid desktop
  if (effectiveWidth >= 1440 && height >= 800 && zoom <= 1.05) {
    return "comfortable";
  }
  return "standard";
}

export function useDensityProfile() {
  const [density, setDensity] = useState<DensityProfile>("standard");

  useEffect(() => {
    const sync = () => {
      const vv = window.visualViewport;
      const zoom = vv?.scale ?? 1;
      setDensity(
        resolveDensityProfile({
          width: window.innerWidth,
          height: window.innerHeight,
          dpr: window.devicePixelRatio || 1,
          zoom,
        }),
      );
    };
    sync();
    window.addEventListener("resize", sync, { passive: true });
    window.visualViewport?.addEventListener("resize", sync);
    window.visualViewport?.addEventListener("scroll", sync);
    return () => {
      window.removeEventListener("resize", sync);
      window.visualViewport?.removeEventListener("resize", sync);
      window.visualViewport?.removeEventListener("scroll", sync);
    };
  }, []);

  return density;
}
