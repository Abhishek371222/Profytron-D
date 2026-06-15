"use client";

import React from "react";
import Link from "next/link";
import { Shield, Target, Bot, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DashboardAIWidget } from "./DashboardAIWidget";
import { PerformanceProfile } from "./PerformanceProfile";

function RadialRing({
  value,
  max = 100,
  size = 96,
  sw = 8,
  color = "#3B5BFF",
  label,
  sub,
}: {
  value: number;
  max?: number;
  size?: number;
  sw?: number;
  color?: string;
  label: string;
  sub?: string;
}) {
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(value / max, 1);
  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--muted)" strokeWidth={sw} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={sw}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ - circ * pct}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-lg font-bold text-foreground leading-none">{label}</span>
        {sub && <span className="text-caption text-muted-foreground mt-1">{sub}</span>}
      </div>
    </div>
  );
}

type Strategy = {
  id: string;
  name: string;
  winRate: number;
  confidence: number;
};

type Props = {
  winRate: number;
  sharpeRatio: number;
  maxDrawdown: number;
  bestMonth: number;
  performanceBars: { label: string; score: number; color: string }[];
  activeStrategies: Strategy[];
  className?: string;
  isLoading?: boolean;
};

export function DashboardRightRail({
  winRate,
  sharpeRatio,
  maxDrawdown,
  bestMonth,
  performanceBars,
  activeStrategies,
  className,
  isLoading = false,
}: Props) {
  const ringColor = winRate >= 60 ? "#16A34A" : winRate >= 40 ? "#F59E0B" : "#3B5BFF";

  return (
    <div
        className={cn(
          "flex flex-col gap-4 w-full min-w-0",
          className ?? "hidden xl:flex xl:sticky xl:top-4 xl:self-start",
        )}
    >
      {/* Portfolio Health */}
      <div className="dashboard-card p-5 dashboard-enter" style={{ animationDelay: "0.08s" }}>
        <div className="flex items-center gap-2 mb-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Shield className="h-4 w-4 text-primary" />
          </div>
          <span className="text-sm font-semibold text-foreground">Portfolio Health</span>
        </div>

        <div className="flex flex-col items-center mb-5">
          {isLoading ? (
            <div className="h-24 w-24 rounded-full bg-muted animate-pulse" />
          ) : (
            <RadialRing
              value={winRate}
              max={100}
              color={ringColor}
              label={`${winRate.toFixed(0)}%`}
              sub="Win Rate"
            />
          )}
        </div>

        <div className="space-y-3 mb-5">
          {[
            { label: "Sharpe Ratio", val: sharpeRatio.toFixed(2), good: sharpeRatio > 1 },
            { label: "Max Drawdown", val: `${maxDrawdown.toFixed(1)}%`, good: maxDrawdown < 10 },
            { label: "Best Month", val: `+${bestMonth.toFixed(1)}%`, good: bestMonth > 0 },
          ].map(({ label, val, good }) => (
            <div
              key={label}
              className="flex items-center justify-between gap-4 py-1.5 border-b border-[var(--card-border)] last:border-0"
            >
              <span className="text-sm text-muted-foreground shrink-0">{label}</span>
              <span
                className={cn(
                  "text-sm font-semibold tabular-nums text-right",
                  good ? "text-chart-3" : "text-destructive",
                )}
              >
                {isLoading ? "—" : val}
              </span>
            </div>
          ))}
        </div>

        <PerformanceProfile bars={performanceBars} isLoading={isLoading} />
      </div>

      {/* Active Strategies */}
      <div className="dashboard-card p-5 dashboard-enter" style={{ animationDelay: "0.14s" }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Target className="h-4 w-4 text-primary" />
            </div>
            <span className="text-sm font-semibold text-foreground truncate">Active Strategies</span>
          </div>
          <Link
            href="/strategies"
            className="flex shrink-0 items-center gap-0.5 text-caption font-medium text-primary hover:underline"
          >
            Manage <ChevronRight className="h-3 w-3" />
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <div className="h-16 rounded-xl bg-muted animate-pulse" />
            <div className="h-16 rounded-xl bg-muted animate-pulse" />
          </div>
        ) : activeStrategies.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/80 border border-[var(--card-border)] mb-3">
              <Bot className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">No active strategies</p>
            <p className="text-caption text-muted-foreground mt-1 px-4 leading-relaxed">
              Build or subscribe to a strategy to start automated trading
            </p>
            <Link href="/strategies/builder" className="mt-4 w-full">
              <Button variant="outline" size="sm" className="w-full border-primary/30 text-primary hover:bg-primary/5">
                Build Strategy
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {activeStrategies.slice(0, 3).map((strat) => (
              <div
                key={strat.id}
                className="rounded-xl border border-[var(--card-border)] bg-muted/40 p-3"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <p className="text-sm font-semibold text-foreground truncate">{strat.name}</p>
                  <span className="text-caption font-medium text-chart-3 shrink-0">Running</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
                    style={{ width: `${strat.winRate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <DashboardAIWidget sharpeRatio={sharpeRatio} />
    </div>
  );
}
