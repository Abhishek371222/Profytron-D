"use client";

import { memo, useCallback, useEffect, useRef } from "react";
import { animate } from "framer-motion";
import { cn } from "@/lib/utils";

interface GlowingEffectProps {
  blur?: number;
  inactiveZone?: number;
  proximity?: number;
  spread?: number;
  variant?: "default" | "indigo" | "cyan" | "violet";
  glow?: boolean;
  className?: string;
  disabled?: boolean;
  movementDuration?: number;
  borderWidth?: number;
}

export const GlowingEffect = memo(
  ({
    blur = 0,
    inactiveZone = 0.7,
    proximity = 0,
    spread = 20,
    variant = "default",
    glow = false,
    className,
    movementDuration = 2,
    borderWidth = 1,
    disabled = false,
  }: GlowingEffectProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const lastPosition = useRef({ x: 0, y: 0 });
    const animationFrameRef = useRef<number>(0);

    const getGradient = () => {
      switch (variant) {
        case "indigo":
          return `radial-gradient(circle, #6366f1 10%, #6366f100 20%),
            radial-gradient(circle at 40% 40%, #818cf8 5%, #818cf800 15%),
            radial-gradient(circle at 60% 60%, #4338ca 10%, #4338ca00 20%),
            repeating-conic-gradient(from 236.84deg at 50% 50%, #6366f1 0%, #818cf8 calc(25% / 5), #4338ca calc(50% / 5), #6366f1 calc(75% / 5), #818cf8 calc(100% / 5))`;
        case "cyan":
          return `radial-gradient(circle, #22d3ee 10%, #22d3ee00 20%),
            radial-gradient(circle at 40% 40%, #06b6d4 5%, #06b6d400 15%),
            repeating-conic-gradient(from 236.84deg at 50% 50%, #22d3ee 0%, #06b6d4 calc(25% / 5), #22d3ee calc(50% / 5), #0891b2 calc(75% / 5), #22d3ee calc(100% / 5))`;
        case "violet":
          return `radial-gradient(circle, #a855f7 10%, #a855f700 20%),
            radial-gradient(circle at 40% 40%, #8b5cf6 5%, #8b5cf600 15%),
            repeating-conic-gradient(from 236.84deg at 50% 50%, #a855f7 0%, #8b5cf6 calc(25% / 5), #7c3aed calc(50% / 5), #a855f7 calc(75% / 5), #8b5cf6 calc(100% / 5))`;
        default:
          return `radial-gradient(circle, #6366f1 10%, #6366f100 20%),
            radial-gradient(circle at 40% 40%, #a855f7 5%, #a855f700 15%),
            radial-gradient(circle at 60% 60%, #22d3ee 10%, #22d3ee00 20%),
            radial-gradient(circle at 40% 60%, #818cf8 10%, #818cf800 20%),
            repeating-conic-gradient(from 236.84deg at 50% 50%, #6366f1 0%, #a855f7 calc(25% / 5), #22d3ee calc(50% / 5), #818cf8 calc(75% / 5), #6366f1 calc(100% / 5))`;
      }
    };

    const handleMove = useCallback(
      (e?: MouseEvent | { x: number; y: number }) => {
        if (!containerRef.current) return;
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = requestAnimationFrame(() => {
          const element = containerRef.current;
          if (!element) return;
          const { left, top, width, height } = element.getBoundingClientRect();
          const mouseX = e?.x ?? lastPosition.current.x;
          const mouseY = e?.y ?? lastPosition.current.y;
          if (e) lastPosition.current = { x: mouseX, y: mouseY };

          const center = [left + width * 0.5, top + height * 0.5];
          const distanceFromCenter = Math.hypot(mouseX - center[0], mouseY - center[1]);
          const inactiveRadius = 0.5 * Math.min(width, height) * inactiveZone;
          if (distanceFromCenter < inactiveRadius) { element.style.setProperty("--active", "0"); return; }

          const isActive =
            mouseX > left - proximity &&
            mouseX < left + width + proximity &&
            mouseY > top - proximity &&
            mouseY < top + height + proximity;

          element.style.setProperty("--active", isActive ? "1" : "0");
          if (!isActive) return;

          const currentAngle = parseFloat(element.style.getPropertyValue("--start")) || 0;
          const targetAngle =
            (180 * Math.atan2(mouseY - center[1] || 0, mouseX - center[0] || 0)) / Math.PI + 90;
          const angleDiff = ((targetAngle - currentAngle + 180) % 360) - 180;
          const newAngle = currentAngle + angleDiff;

          void animate(currentAngle, newAngle, {
            duration: movementDuration,
            ease: [0.16, 1, 0.3, 1],
            onUpdate: (value) => element.style.setProperty("--start", String(value)),
          });
        });
      },
      [inactiveZone, proximity, movementDuration],
    );

    useEffect(() => {
      if (disabled) return;
      const handleScroll = () => handleMove();
      const handlePointerMove = (e: PointerEvent) => handleMove(e);
      window.addEventListener("scroll", handleScroll, { passive: true });
      document.body.addEventListener("pointermove", handlePointerMove, { passive: true });
      return () => {
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        window.removeEventListener("scroll", handleScroll);
        document.body.removeEventListener("pointermove", handlePointerMove);
      };
    }, [handleMove, disabled]);

    return (
      <div
        ref={containerRef}
        style={
          {
            "--blur": `${blur}px`,
            "--spread": spread,
            "--start": "0",
            "--active": "0",
            "--glowingeffect-border-width": `${borderWidth}px`,
            "--repeating-conic-gradient-times": "5",
            "--gradient": getGradient(),
          } as React.CSSProperties
        }
        className={cn(
          "pointer-events-none absolute inset-0 rounded-[inherit] opacity-100 transition-opacity",
          glow && "opacity-100",
          blur > 0 && "blur-[var(--blur)]",
          className,
          disabled && "!hidden",
        )}
      >
        <div
          className={cn(
            "glow rounded-[inherit]",
            'after:absolute after:inset-[calc(-1*var(--glowingeffect-border-width))] after:rounded-[inherit] after:content-[""]',
            "after:[border:var(--glowingeffect-border-width)_solid_transparent]",
            "after:[background-attachment:fixed] after:[background:var(--gradient)]",
            "after:opacity-[var(--active)] after:transition-opacity after:duration-300",
            "after:[mask-clip:padding-box,border-box]",
            "after:[mask-composite:intersect]",
            "after:[mask-image:linear-gradient(#0000,#0000),conic-gradient(from_calc((var(--start)-var(--spread))*1deg),#00000000_0deg,#fff,#00000000_calc(var(--spread)*2deg))]",
          )}
        />
      </div>
    );
  },
);

GlowingEffect.displayName = "GlowingEffect";
