"use client";

import { motion } from "framer-motion";
import { AnimatedCounter } from "@/components/animations/AnimatedCounter";

const STATS = [
  { label: "Active Traders", value: 12000, suffix: "+", prefix: "", decimals: 0 },
  { label: "Volume Traded", value: 1.2, suffix: "B+", prefix: "$", decimals: 1 },
  { label: "Uptime", value: 99.99, suffix: "%", prefix: "", decimals: 2 },
] as const;

export function HeroStatsRow() {
  return (
    <div className="landing-panel mt-12 overflow-hidden sm:mt-14">
      <div className="grid grid-cols-1 divide-y divide-[var(--card-border)] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {STATS.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.5, delay: i * 0.12 }}
            className="px-6 py-6 sm:py-7 text-center sm:text-left"
          >
            <p className="text-sm font-medium text-muted-foreground mb-2">{stat.label}</p>
            <p className="text-3xl font-bold tabular-nums tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary via-[color-mix(in_srgb,var(--primary)_55%,var(--secondary))] to-primary sm:text-4xl">
              <AnimatedCounter
                value={stat.value}
                prefix={stat.prefix}
                suffix={stat.suffix}
                decimals={stat.decimals}
                duration={2}
              />
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
