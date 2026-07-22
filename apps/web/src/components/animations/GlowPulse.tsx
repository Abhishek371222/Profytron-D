"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export const GlowPulse = ({
  children,
  color = "color-mix(in srgb, var(--primary) 15%, transparent)",
  className,
}: {
  children: React.ReactNode;
  color?: string;
  className?: string;
}) => {
  return (
    <motion.div
      animate={{
        boxShadow: [
          `0 0 0 0 ${color}`,
          `0 0 0 15px color-mix(in srgb, var(--primary) 0%, transparent)`,
          `0 0 0 0 color-mix(in srgb, var(--primary) 0%, transparent)`,
        ],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      className={cn("rounded-full", className)}
    >
      {children}
    </motion.div>
  );
};
