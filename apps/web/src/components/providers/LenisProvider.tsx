"use client";

import React from "react";
import Lenis from "lenis";

export function LenisProvider({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const prefersReduced =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    let cancelled = false;
    let lenis: Lenis | null = null;
    let raf = 0;
    let paused = document.visibilityState === "hidden";
    let idleId: number | undefined;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const loop = (time: number) => {
      if (!paused && lenis) lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };

    const onVisibility = () => {
      paused = document.visibilityState === "hidden";
    };

    const start = () => {
      if (cancelled) return;
      lenis = new Lenis({
        duration: 0.9,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
      });
      document.addEventListener("visibilitychange", onVisibility);
      raf = requestAnimationFrame(loop);
    };

    // Defer smooth-scroll bootstrap so it does not compete with LCP/hydration.
    if (typeof window.requestIdleCallback === "function") {
      idleId = window.requestIdleCallback(start, { timeout: 2000 });
    } else {
      timeoutId = setTimeout(start, 600);
    }

    return () => {
      cancelled = true;
      if (idleId !== undefined && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleId);
      }
      if (timeoutId !== undefined) clearTimeout(timeoutId);
      document.removeEventListener("visibilitychange", onVisibility);
      cancelAnimationFrame(raf);
      lenis?.destroy();
    };
  }, []);

  return <>{children}</>;
}
