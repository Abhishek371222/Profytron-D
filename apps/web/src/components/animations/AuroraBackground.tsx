"use client";

import { cn } from "@/lib/utils";

/** Profytron aurora — teal/green ambient glow behind hero */
export function AuroraBackground({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("absolute inset-0 overflow-hidden pointer-events-none", className)}>
      <div className="absolute inset-0" style={{ background: "var(--glow-hero)" }} />
      {/* Primary teal orb — center-top */}
      <div
        className="absolute -top-[40%] left-1/2 -translate-x-1/2 w-[120%] h-[80%] rounded-full animate-aurora opacity-70"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(71,167,170,0.16) 0%, rgba(30,109,72,0.08) 40%, rgba(71,167,170,0.03) 60%, transparent 75%)",
        }}
      />
      {/* Green orb — right */}
      <div
        className="absolute top-[10%] -right-[20%] w-[60%] h-[50%] rounded-full animate-aurora opacity-50"
        style={{
          background: "radial-gradient(circle, rgba(30,109,72,0.12) 0%, transparent 65%)",
          animationDelay: "-4s",
        }}
      />
      {/* Teal orb — bottom-left */}
      <div
        className="absolute -bottom-[10%] -left-[15%] w-[50%] h-[40%] rounded-full animate-aurora opacity-35"
        style={{
          background: "radial-gradient(circle, rgba(71,167,170,0.10) 0%, transparent 70%)",
          animationDelay: "-8s",
        }}
      />
      <div className="absolute inset-0 grid-bg-subtle" />
    </div>
  );
}
