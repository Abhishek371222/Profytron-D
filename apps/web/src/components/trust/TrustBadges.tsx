"use client";

import {
  Activity,
  BarChart3,
  Bot,
  BrainCircuit,
  Network,
  ShieldCheck,
  Sparkles,
  Workflow,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { durationSeconds, MOTION_EASING } from "@/platform/motion/motion-tokens";

const BADGES = [
  { label: "AI Strategies", icon: BrainCircuit },
  { label: "Auto Execution", icon: Workflow },
  { label: "Risk Controls", icon: ShieldCheck },
  { label: "Live Analytics", icon: BarChart3 },
  { label: "Broker Connect", icon: Network },
  { label: "24/7 Monitoring", icon: Activity },
  { label: "Trading Bots", icon: Bot },
  { label: "Alpha Coach", icon: Sparkles },
] as const;

export function TrustBadges({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <div
      className={cn(
        compact
          ? "grid grid-cols-2 gap-2.5 sm:flex sm:flex-wrap sm:items-center sm:gap-2.5"
          : "flex flex-wrap items-center gap-2.5",
        className,
      )}
      role="list"
      aria-label="Profytron platform capabilities"
    >
      {BADGES.map(({ label, icon: Icon }, i) => {
        const chip = (
          <span
            role="listitem"
            className={cn(
              "landing-trust-chip",
              compact
                ? "w-full justify-center px-3 py-2 text-xs normal-case tracking-normal sm:w-auto sm:justify-start sm:px-2.5 sm:py-1 sm:text-[11px]"
                : "px-3 py-1.5 text-caption",
            )}
          >
            <Icon
              className={cn(compact ? "h-3.5 w-3.5" : "h-3.5 w-3.5", "shrink-0 text-primary")}
              aria-hidden
            />
            {label}
          </span>
        );

        if (reduceMotion) {
          return <span key={label}>{chip}</span>;
        }

        return (
          <motion.span
            key={label}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-20px" }}
            transition={{
              duration: durationSeconds("Standard"),
              delay: i * 0.045,
              ease: MOTION_EASING.Out as unknown as number[],
            }}
            className={compact ? "contents sm:block" : undefined}
          >
            {chip}
          </motion.span>
        );
      })}
    </div>
  );
}
