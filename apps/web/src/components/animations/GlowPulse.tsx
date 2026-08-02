"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

/** Soft attention pulse — scale only, no neon bloom. */
export const GlowPulse = ({
  children,
  className,
}: {
  children: React.ReactNode;
  color?: string;
  className?: string;
}) => {
  const reduce = useReducedMotion();

  if (reduce) {
    return <div className={cn("rounded-xl", className)}>{children}</div>;
  }

  return (
    <motion.div
      animate={{ scale: [1, 1.015, 1] }}
      transition={{
        duration: 2.4,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      className={cn("rounded-xl", className)}
    >
      {children}
    </motion.div>
  );
};
