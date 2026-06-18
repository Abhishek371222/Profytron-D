"use client";

import { motion, useInView } from "framer-motion";
import React from "react";

const CHART_PATH =
  "M 0 80 L 40 65 L 80 72 L 120 45 L 160 55 L 200 30 L 240 42 L 280 18 L 320 25 L 360 8";

export function AnimatedLineChart({ className = "" }: { className?: string }) {
  const ref = React.useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <svg
      ref={ref}
      viewBox="0 0 360 90"
      className={`w-full h-full ${className}`}
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#47a7aa" stopOpacity={0.25} />
          <stop offset="100%" stopColor="#47a7aa" stopOpacity={0} />
        </linearGradient>
      </defs>
      <motion.path
        d={`${CHART_PATH} L 360 90 L 0 90 Z`}
        fill="url(#chartFill)"
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ delay: 0.8, duration: 0.6 }}
      />
      <motion.path
        d={CHART_PATH}
        fill="none"
        stroke="#47a7aa"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={inView ? { pathLength: 1, opacity: 1 } : {}}
        transition={{ duration: 1.6, ease: "easeInOut", delay: 0.2 }}
      />
      <motion.circle
        cx={360}
        cy={8}
        r={4}
        fill="#47a7aa"
        initial={{ scale: 0, opacity: 0 }}
        animate={inView ? { scale: 1, opacity: 1 } : {}}
        transition={{ delay: 1.8, duration: 0.3 }}
      />
    </svg>
  );
}
