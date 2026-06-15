"use client";

import React, { useRef, useCallback } from "react";
import { motion, useSpring, useTransform, type MotionStyle } from "framer-motion";
import { cn } from "@/lib/utils";

type TiltCard3DProps = {
  children: React.ReactNode;
  className?: string;
  intensity?: number;
  glare?: boolean;
  style?: MotionStyle;
};

export function TiltCard3D({
  children,
  className,
  intensity = 12,
  glare = true,
  style,
}: TiltCard3DProps) {
  const ref = useRef<HTMLDivElement>(null);
  const rotateX = useSpring(0, { stiffness: 260, damping: 22 });
  const rotateY = useSpring(0, { stiffness: 260, damping: 22 });
  const scale = useSpring(1, { stiffness: 260, damping: 22 });

  const glareX = useTransform(rotateY, [-intensity, intensity], ["0%", "100%"]);
  const glareY = useTransform(rotateX, [intensity, -intensity], ["0%", "100%"]);

  const handleMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      rotateY.set(x * intensity * 2);
      rotateX.set(-y * intensity * 2);
      scale.set(1.02);
    },
    [intensity, rotateX, rotateY, scale],
  );

  const handleLeave = useCallback(() => {
    rotateX.set(0);
    rotateY.set(0);
    scale.set(1);
  }, [rotateX, rotateY, scale]);

  return (
    <div style={{ perspective: 1000 }} className={cn("card-3d relative", className)}>
    <motion.div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{
        rotateX,
        rotateY,
        scale,
        transformStyle: "preserve-3d",
        ...style,
      }}
      className="h-full w-full"
    >
      {glare && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[inherit] overflow-hidden"
          style={{
            background: `radial-gradient(circle at ${glareX} ${glareY}, color-mix(in srgb, var(--primary) 18%, transparent), transparent 55%)`,
          }}
        />
      )}
      <div style={{ transform: "translateZ(24px)", transformStyle: "preserve-3d" }}>
        {children}
      </div>
    </motion.div>
    </div>
  );
}
