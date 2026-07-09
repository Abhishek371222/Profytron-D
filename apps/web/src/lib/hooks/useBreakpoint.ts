"use client";

import { useEffect, useState } from "react";

export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;

function getBreakpoint(width: number): Breakpoint {
  if (width >= BREAKPOINTS["2xl"]) return "2xl";
  if (width >= BREAKPOINTS.xl) return "xl";
  if (width >= BREAKPOINTS.lg) return "lg";
  if (width >= BREAKPOINTS.md) return "md";
  if (width >= BREAKPOINTS.sm) return "sm";
  return "sm";
}

export function useBreakpoint() {
  const [width, setWidth] = useState<number | null>(null);

  useEffect(() => {
    const sync = () => setWidth(window.innerWidth);
    sync();
    window.addEventListener("resize", sync, { passive: true });
    return () => window.removeEventListener("resize", sync);
  }, []);

  const bp = width == null ? "lg" : getBreakpoint(width);

  return {
    width,
    breakpoint: bp,
    isMobile: width != null && width < BREAKPOINTS.lg,
    isTablet: width != null && width >= BREAKPOINTS.md && width < BREAKPOINTS.lg,
    isDesktop: width != null && width >= BREAKPOINTS.lg,
    isSm: width != null && width < BREAKPOINTS.sm,
    isMdUp: width != null && width >= BREAKPOINTS.md,
    isLgUp: width != null && width >= BREAKPOINTS.lg,
  };
}
