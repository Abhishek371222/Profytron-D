"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";

interface SectionRevealerProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  /** Slight horizontal slide direction for variety */
  direction?: "up" | "left" | "right";
}

const ease = [0.22, 1, 0.36, 1] as const;

export function SectionRevealer({
  children,
  className = "",
  delay = 0,
  direction = "up",
}: SectionRevealerProps) {
  const reduceMotion = useReducedMotion();

  const hidden = {
    up: { opacity: 0, y: 40 },
    left: { opacity: 0, x: -32, y: 40 },
    right: { opacity: 0, x: 32, y: 40 },
  }[direction];

  const visible = {
    up: { opacity: 1, y: 0 },
    left: { opacity: 1, x: 0, y: 0 },
    right: { opacity: 1, x: 0, y: 0 },
  }[direction];

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={`relative ${className}`}
      initial={hidden}
      whileInView={visible}
      viewport={{ once: true, amount: 0.05, margin: "0px 0px -5% 0px" }}
      transition={{
        duration: 0.5,
        delay,
        ease,
      }}
    >
      {children}
    </motion.div>
  );
}
