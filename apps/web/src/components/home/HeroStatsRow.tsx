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
    <div className="mt-12 sm:mt-14 border-y border-[var(--card-border)] bg-card/50 rounded-[20px] overflow-hidden">
      <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[var(--card-border)]">
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
            <p className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#47a7aa] via-[#1e6d48] to-[#47a7aa] tabular-nums tracking-tight">
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
