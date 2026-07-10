"use client";

import React from "react";
import { motion } from "framer-motion";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import {
  Sparkles,
  ShieldCheck,
  TrendingUp,
  ArrowRight,
  Star,
  Flame,
  Award,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { Button } from "@/components/ui/button";

export interface FeaturedStrategyItem {
  id: string;
  name: string;
  returns: string;
  subscribers: string;
  chartData: { val: number }[];
  creator?: string;
  category?: string;
  verified?: boolean;
  monthlyPrice?: number;
  price?: number;
  risk?: string;
  sharpe?: number;
  returnsValue?: number;
  subscribersValue?: number;
  maxDrawdown?: number;
}

interface FeaturedRowProps {
  strategies?: FeaturedStrategyItem[];
  onSubscribe?: (strategy: FeaturedStrategyItem) => void;
}

function riskScore(risk?: string) {
  const r = (risk ?? "medium").toLowerCase();
  if (r.includes("low")) return 2;
  if (r.includes("high") || r.includes("expert")) return 8;
  return 5;
}

export function FeaturedRow({ strategies = [], onSubscribe }: FeaturedRowProps) {
  if (!strategies.length) return null;

  return (
    <div className="marketplace-elevation-featured w-full min-w-0 space-y-5 px-[var(--dashboard-p)] pt-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[color-mix(in_srgb,var(--primary)_12%,transparent)] text-primary shadow-[0_4px_16px_color-mix(in_srgb,var(--primary)_8%,transparent)]">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">Featured Strategies</h2>
            <p className="text-sm text-muted-foreground">Editor&apos;s choice · Institutional grade</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-flex items-center gap-1 rounded-full border border-[color-mix(in_srgb,var(--secondary)_30%,var(--card-border))] bg-[color-mix(in_srgb,var(--secondary)_12%,transparent)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
            <Sparkles className="h-3 w-3" />
            AI Recommended
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_srgb,var(--primary)_22%,var(--card-border))] bg-[color-mix(in_srgb,var(--primary)_8%,transparent)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            Live
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        {strategies.slice(0, 2).map((strategy, index) => {
          const price = Number(strategy.price ?? strategy.monthlyPrice ?? 0);
          const sharpe = Number(strategy.sharpe ?? 0);
          const dd = Number(strategy.maxDrawdown ?? 12);
          const winRate = Number(strategy.returnsValue ?? 0);
          const subs = Number(strategy.subscribersValue ?? 0);
          const aiScore = Math.min(99, Math.round(72 + sharpe * 8 + winRate * 0.15));
          const risk = riskScore(strategy.risk);
          const popularity = Math.min(100, subs / 150);

          return (
            <motion.article
              key={strategy.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: index * 0.08, ease: "easeOut" }}
              whileHover={{ y: -6 }}
              className="marketplace-product-card group relative overflow-hidden rounded-[var(--radius-card)] p-[1px]"
            >
              <div className="relative flex min-h-[22rem] flex-col rounded-[calc(var(--radius-card)-1px)] bg-card p-6 transition-all duration-[250ms] ease-out group-hover:shadow-[var(--shadow-card-hover)]">
                {/* Ribbon */}
                <div className="absolute right-5 top-0 flex items-center gap-1 rounded-b-[10px] border border-t-0 border-[color-mix(in_srgb,var(--primary)_25%,var(--card-border))] bg-[color-mix(in_srgb,var(--primary)_10%,transparent)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
                  <Flame className="h-3 w-3" />
                  Trending
                </div>

                {/* Header */}
                <div className="flex items-start gap-4 pr-16">
                  <UserAvatar name={strategy.creator ?? strategy.name} size="lg" className="ring-2 ring-primary/20" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-lg font-bold text-foreground">{strategy.name} AI</h3>
                      {strategy.verified && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[color-mix(in_srgb,var(--primary)_12%,transparent)] px-2 py-0.5 text-[10px] font-bold uppercase text-primary">
                          <ShieldCheck className="h-3 w-3" />
                          Verified
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {strategy.category ?? "Institutional Trend Following"}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Badge label={`AI ${aiScore}`} accent />
                      <Badge label={`Risk ${risk}/10`} />
                      <Badge label="Backtested 14Y" />
                      <div className="flex items-center gap-0.5 text-primary">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className={cn("h-3 w-3", s <= 4 && "fill-current")} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Equity curve */}
                <div className="mt-5 h-[5.5rem] -mx-1">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <AreaChart data={strategy.chartData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id={`feat-${strategy.id}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--chart-bull)" stopOpacity={0.32} />
                          <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Area
                        type="monotone"
                        dataKey="val"
                        stroke="var(--chart-bull)"
                        fill={`url(#feat-${strategy.id})`}
                        strokeWidth={2.5}
                        isAnimationActive={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Metrics row */}
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Metric label="30D Return" value={strategy.returns} positive />
                  <Metric label="Sharpe" value={sharpe > 0 ? sharpe.toFixed(2) : "—"} />
                  <Metric label="Win Rate" value={winRate > 0 ? `${winRate.toFixed(1)}%` : "—"} />
                  <Metric label="Max DD" value={`-${dd.toFixed(1)}%`} danger />
                </div>

                {/* Popularity */}
                <div className="mt-4">
                  <div className="mb-1.5 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    <span>Popularity</span>
                    <span className="tabular-nums text-foreground">{subs.toLocaleString()} users</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--muted)_50%,transparent)]">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max(popularity, 12)}%` }}
                      transition={{ duration: 0.9, ease: "easeOut" }}
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-auto flex items-center justify-between gap-4 border-t border-[var(--card-border)] pt-5">
                  <div>
                    <p className="text-xs text-muted-foreground">Monthly</p>
                    <p className="text-xl font-bold text-foreground">
                      {price > 0 ? `₹${price.toLocaleString('en-IN')}` : "FREE"}
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    size="lg"
                    className="btn-premium group/btn uppercase tracking-[0.1em]"
                    onClick={() => onSubscribe?.(strategy)}
                  >
                    Deploy
                    <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover/btn:translate-x-1" />
                  </Button>
                </div>
              </div>
            </motion.article>
          );
        })}
      </div>
    </div>
  );
}

function Badge({ label, accent }: { label: string; accent?: boolean }) {
  return (
    <span
      className={cn(
        "rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
        accent
          ? "border-[color-mix(in_srgb,var(--primary)_30%,var(--card-border))] bg-[color-mix(in_srgb,var(--primary)_12%,transparent)] text-primary"
          : "border-[var(--card-border)] bg-[color-mix(in_srgb,var(--muted)_40%,transparent)] text-muted-foreground",
      )}
    >
      {label}
    </span>
  );
}

function Metric({
  label,
  value,
  positive,
  danger,
}: {
  label: string;
  value: string;
  positive?: boolean;
  danger?: boolean;
}) {
  return (
    <div className="rounded-[14px] border border-[var(--card-border)] bg-[color-mix(in_srgb,var(--muted)_30%,transparent)] px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-1 text-base font-bold tabular-nums",
          danger ? "text-destructive" : positive ? "text-primary" : "text-foreground",
        )}
      >
        {value}
      </p>
    </div>
  );
}
