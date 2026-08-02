"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";

interface SectionRevealerProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "left" | "right";
}

/** Brand reveal — clip wipe + lift (not generic fade). */
const ease = [0.16, 1, 0.3, 1] as const;

export function SectionRevealer({
  children,
  className = "",
  delay = 0,
  direction = "up",
}: SectionRevealerProps) {
  const reduceMotion = useReducedMotion();

  const hidden = {
    up: { opacity: 0, y: 48, clipPath: "inset(12% 0 0 0)" },
    left: { opacity: 0, x: -40, clipPath: "inset(0 18% 0 0)" },
    right: { opacity: 0, x: 40, clipPath: "inset(0 0 0 18%)" },
  }[direction];

  const visible = {
    up: { opacity: 1, y: 0, clipPath: "inset(0% 0 0 0)" },
    left: { opacity: 1, x: 0, clipPath: "inset(0 0% 0 0)" },
    right: { opacity: 1, x: 0, clipPath: "inset(0 0 0 0%)" },
  }[direction];

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={`relative ${className}`}
      initial={hidden}
      whileInView={visible}
      viewport={{ once: true, amount: 0.08, margin: "0px 0px -8% 0px" }}
      transition={{
        duration: 0.7,
        delay,
        ease,
      }}
    >
      {children}
    </motion.div>
  );
}
