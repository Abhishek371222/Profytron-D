"use client";

import { cn } from "@/lib/utils";

/** Linear/Vercel-style aurora — blue, purple, white glow behind hero */
export function AuroraBackground({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("absolute inset-0 overflow-hidden pointer-events-none", className)}>
      <div className="absolute inset-0" style={{ background: "var(--glow-hero)" }} />
      <div
        className="absolute -top-[40%] left-1/2 -translate-x-1/2 w-[120%] h-[80%] rounded-full animate-aurora opacity-70"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(59,91,255,0.15) 0%, rgba(99,102,241,0.08) 35%, rgba(139,92,246,0.04) 55%, transparent 70%)",
        }}
      />
      <div
        className="absolute top-[10%] -right-[20%] w-[60%] h-[50%] rounded-full animate-aurora opacity-50"
        style={{
          background: "radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 65%)",
          animationDelay: "-4s",
        }}
      />
      <div
        className="absolute -bottom-[10%] -left-[15%] w-[50%] h-[40%] rounded-full animate-aurora opacity-40"
        style={{
          background: "radial-gradient(circle, rgba(59,91,255,0.08) 0%, transparent 70%)",
          animationDelay: "-8s",
        }}
      />
      <div className="absolute inset-0 grid-bg-subtle" />
    </div>
  );
}
