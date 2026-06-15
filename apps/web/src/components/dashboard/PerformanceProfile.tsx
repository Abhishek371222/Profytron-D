"use client";

import React from "react";
import { motion } from "framer-motion";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

type Bar = {
  label: string;
  score: number;
};

export function PerformanceProfile({
  bars,
  isLoading = false,
}: {
  bars: Bar[];
  isLoading?: boolean;
}) {
  return (
    <div className="pt-4 border-t border-[var(--card-border)]">
      <div className="flex items-center gap-1.5 mb-4">
        <p className="text-sm font-medium text-foreground">Performance Profile</p>
        <Info className="h-3.5 w-3.5 text-muted-foreground/60" aria-hidden />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-2.5 rounded-full bg-muted animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          <div className="space-y-3.5">
            {bars.map(({ label, score }, index) => {
              const pct = Math.min(100, Math.max(0, score));
              return (
                <div
                  key={label}
                  className="grid grid-cols-[4.5rem_1fr] sm:grid-cols-[5rem_1fr] items-center gap-3"
                >
                  <span className="text-sm text-muted-foreground pl-1">{label}</span>
                  <div className="h-2.5 rounded-full bg-primary/[0.08] overflow-hidden">
                    <motion.div
                      className={cn(
                        "h-full rounded-full",
                        label === "Drawdown" ? "bg-destructive/45" : "bg-primary/45",
                      )}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.85, ease: "easeOut", delay: index * 0.06 }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-3 grid grid-cols-[4.5rem_1fr] sm:grid-cols-[5rem_1fr] gap-3">
            <span />
            <div className="flex justify-between text-[10px] font-medium text-muted-foreground/70 tabular-nums">
              {[0, 25, 50, 75, 100].map((n) => (
                <span key={n}>{n}</span>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
