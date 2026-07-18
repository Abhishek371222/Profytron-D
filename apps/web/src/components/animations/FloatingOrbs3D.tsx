"use client";

import React from "react";
import { cn } from "@/lib/utils";

const ORBS = [
  { color: "var(--primary)", size: "min(42vw, 480px)", top: "8%", left: "72%", delay: "0s", duration: "14s" },
  { color: "var(--chart-2)", size: "min(32vw, 360px)", top: "58%", left: "8%", delay: "-4s", duration: "18s" },
  { color: "var(--chart-3)", size: "min(28vw, 300px)", top: "72%", left: "65%", delay: "-8s", duration: "16s" },
  { color: "var(--chart-5)", size: "min(22vw, 240px)", top: "22%", left: "18%", delay: "-2s", duration: "20s" },
] as const;

type FloatingOrbs3DProps = {
  className?: string;
  variant?: "landing" | "dashboard" | "auth";
};

export function FloatingOrbs3D({ className, variant = "landing" }: FloatingOrbs3DProps) {
  const opacity = variant === "dashboard" ? 0.45 : variant === "auth" ? 0.55 : 0.65;

  return (
    <div
      className={cn("fixed inset-0 z-0 pointer-events-none scene-3d overflow-hidden", className)}
      aria-hidden
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            variant === "auth"
              ? `radial-gradient(ellipse 80% 60% at 50% 0%, color-mix(in srgb, var(--primary) 12%, transparent), transparent 70%), var(--background)`
              : `radial-gradient(ellipse 70% 45% at 78% 25%, color-mix(in srgb, var(--primary) 9%, transparent) 0%, transparent 55%), radial-gradient(ellipse 50% 35% at 15% 70%, color-mix(in srgb, var(--chart-3) 5%, transparent) 0%, transparent 50%), var(--background)`,
        }}
      />

      {ORBS.map((orb, i) => (
        <div
          key={i}
          className="orb-3d absolute"
          style={{
            width: orb.size,
            height: orb.size,
            top: orb.top,
            left: orb.left,
            background: `radial-gradient(circle at 35% 35%, color-mix(in srgb, ${orb.color} 55%, transparent), transparent 68%)`,
            opacity,
            animationDelay: orb.delay,
            animationDuration: orb.duration,
          }}
        />
      ))}

      { }
      <div
        className="absolute inset-x-0 bottom-0 h-[45vh] opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(color-mix(in srgb, var(--primary) 40%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb, var(--primary) 40%, transparent) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          transform: "perspective(600px) rotateX(72deg) translateY(40%)",
          transformOrigin: "center bottom",
        }}
      />
    </div>
  );
}
