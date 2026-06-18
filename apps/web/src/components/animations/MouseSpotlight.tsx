"use client";

import React from "react";

/** Subtle cursor spotlight — opacity ~0.05 */
export function MouseSpotlight() {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onMove = (e: MouseEvent) => {
      el.style.setProperty("--spot-x", `${e.clientX}px`);
      el.style.setProperty("--spot-y", `${e.clientY}px`);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[2]"
      style={{
        background:
          "radial-gradient(600px circle at var(--spot-x, 50%) var(--spot-y, 50%), rgba(71,167,170,0.05), transparent 60%)",
      }}
    />
  );
}
