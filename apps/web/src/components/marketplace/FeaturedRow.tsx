"use client";

import React from "react";
import { motion } from "framer-motion";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import {
  Sparkles,
  ShieldCheck,
  ArrowRight,
  Star,
  Flame,
  Award,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { Button } from "@/components/ui/button";
import type { SubscriptionBillingModel } from "@/lib/api/marketplace";

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
  onSubscribe?: (strategy: FeaturedStrategyItem, billingModel?: SubscriptionBillingModel) => void;
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
    <div className="marketplace-elevation-featured w-full min-w-0 space-y-3 px-[var(--dashboard-p)] pt-4 sm:space-y-4 sm:pt-5 lg:pt-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-[color-mix(in_srgb,var(--primary)_12%,transparent)] text-primary sm:h-10 sm:w-10 sm:rounded-[14px]">
            <Award className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-sm font-bold text-foreground sm:text-base">
              Featured Strategies
            </h2>
            <p className="truncate text-xs text-muted-foreground sm:text-sm">
              Editor&apos;s choice · Institutional grade
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <span className="hidden items-center gap-1 rounded-full border border-[color-mix(in_srgb,var(--secondary)_30%,var(--card-border))] bg-[color-mix(in_srgb,var(--secondary)_12%,transparent)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary md:inline-flex">
            <Sparkles className="h-3 w-3" />
            AI Recommended
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_srgb,var(--primary)_22%,var(--card-border))] bg-[color-mix(in_srgb,var(--primary)_8%,transparent)] px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
            Live
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:gap-4 xl:grid-cols-2 xl:gap-5">
        {strategies.slice(0, 2).map((strategy, index) => {
          const price = Number(strategy.price ?? strategy.monthlyPrice ?? 0);
          const sharpe = Number(strategy.sharpe ?? 0);
          const dd = Number(strategy.maxDrawdown ?? 12);
          const winRate = Number(strategy.returnsValue ?? 0);
          const subs = Number(strategy.subscribersValue ?? 0);
          const aiScore = Math.min(99, Math.round(72 + sharpe * 8 + winRate * 0.15));
          const risk = riskScore(strategy.risk);
          const popularity = Math.min(100, subs / 150);
          const chartReady = Array.isArray(strategy.chartData) && strategy.chartData.length > 1;

          return (
            <motion.article
              key={strategy.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.06, ease: "easeOut" }}
              whileHover={{ y: -3 }}
              className="marketplace-product-card group relative overflow-hidden rounded-[var(--radius-card)] p-[1px]"
            >
              <div className="relative flex flex-col rounded-[calc(var(--radius-card)-1px)] bg-card p-3.5 transition-all duration-[250ms] ease-out group-hover:shadow-[var(--shadow-card-hover)] sm:p-5 lg:p-5">
                <div className="absolute right-3 top-0 z-10 flex items-center gap-1 rounded-b-[10px] border border-t-0 border-[color-mix(in_srgb,var(--primary)_25%,var(--card-border))] bg-[color-mix(in_srgb,var(--primary)_10%,transparent)] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary sm:right-4 sm:px-2.5 sm:py-1 sm:text-[10px]">
                  <Flame className="h-3 w-3" />
                  Trending
                </div>

                <div className="flex items-start gap-3 pr-14 sm:gap-3.5 sm:pr-16">
                  <UserAvatar
                    name={strategy.creator ?? strategy.name}
                    size="md"
                    className="ring-2 ring-primary/20 sm:hidden"
                  />
                  <UserAvatar
                    name={strategy.creator ?? strategy.name}
                    size="lg"
                    className="hidden ring-2 ring-primary/20 sm:flex"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <h3 className="max-w-full truncate text-base font-bold text-foreground sm:text-lg">
                        {strategy.name}
                      </h3>
                      {strategy.verified && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[color-mix(in_srgb,var(--primary)_12%,transparent)] px-1.5 py-0.5 text-[9px] font-bold uppercase text-primary sm:px-2 sm:text-[10px]">
                          <ShieldCheck className="h-3 w-3" />
                          Verified
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground sm:text-sm">
                      {strategy.category ?? "Institutional Trend Following"}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5 sm:mt-2 sm:gap-2">
                      <Badge label={strategy.category?.slice(0, 12) || "TREND"} />
                      <Badge label={`AI ${aiScore}`} accent />
                      <Badge label={`Risk ${risk}/10`} />
                      <Badge label="14Y BT" className="hidden xs:inline-flex sm:inline-flex" />
                      <div className="flex items-center gap-0.5 text-primary">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className={cn("h-2.5 w-2.5 sm:h-3 sm:w-3", s <= 4 && "fill-current")} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  className="mt-3 h-16 w-full min-w-0 shrink-0 sm:mt-4 sm:h-[4.5rem] lg:h-20"
                  aria-hidden="true"
                >
                  {chartReady ? (
                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                      minWidth={0}
                      minHeight={1}
                      initialDimension={{ width: 320, height: 80 }}
                    >
                      <AreaChart
                        data={strategy.chartData}
                        margin={{ top: 2, right: 0, left: 0, bottom: 0 }}
                      >
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
                          strokeWidth={2}
                          isAnimationActive={false}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center rounded-lg bg-muted/30 text-[10px] text-muted-foreground">
                      Equity preview unavailable
                    </div>
                  )}
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 sm:mt-3.5 sm:grid-cols-4 sm:gap-2.5">
                  <Metric label="30D Return" value={strategy.returns} positive />
                  <Metric label="Sharpe" value={sharpe > 0 ? sharpe.toFixed(2) : "—"} />
                  <Metric label="Win Rate" value={winRate > 0 ? `${winRate.toFixed(1)}%` : "—"} />
                  <Metric label="Max DD" value={`-${dd.toFixed(1)}%`} danger />
                </div>

                <div className="mt-3 sm:mt-3.5">
                  <div className="mb-1 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    <span>Popularity</span>
                    <span className="tabular-nums text-foreground">
                      {subs.toLocaleString()} users
                    </span>
                  </div>
                  <div className="h-1 overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--muted)_50%,transparent)] sm:h-1.5">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max(popularity, 12)}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                  </div>
                </div>

                <div className="mt-3 flex flex-col gap-2.5 border-t border-[var(--card-border)] pt-3 sm:mt-4 sm:flex-row sm:items-end sm:justify-between sm:gap-3 sm:pt-4">
                  <div className="flex items-baseline justify-between gap-2 sm:block sm:justify-start">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground sm:text-xs">
                      Monthly
                    </p>
                    <p className="text-lg font-bold text-foreground sm:text-xl">
                      {price > 0 ? `₹${price.toLocaleString("en-IN")}` : "FREE"}
                    </p>
                  </div>

                  <div className="grid w-full grid-cols-1 gap-2 min-[400px]:grid-cols-2 sm:flex sm:w-auto sm:min-w-0 sm:max-w-[min(100%,20rem)] sm:flex-col lg:min-w-[11.5rem]">
                    <Button
                      variant="primary"
                      size="sm"
                      className="btn-premium h-9 w-full min-w-0 justify-center gap-1 px-2.5 text-[11px] font-bold uppercase tracking-wide sm:h-9 sm:text-xs"
                      onClick={() => onSubscribe?.(strategy, "FIXED")}
                    >
                      <span className="truncate">Buy Subscription</span>
                      <ArrowRight className="h-3.5 w-3.5 shrink-0" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 w-full min-w-0 justify-center px-2.5 text-[11px] font-bold uppercase tracking-wide sm:h-9 sm:text-xs"
                      onClick={() => onSubscribe?.(strategy, "PROFIT_SHARE")}
                    >
                      <span className="truncate sm:hidden">Profit Share · ₹149</span>
                      <span className="hidden truncate sm:inline">Get Profit Sharing · ₹149</span>
                    </Button>
                  </div>
                </div>
              </div>
            </motion.article>
          );
        })}
      </div>
    </div>
  );
}

function Badge({
  label,
  accent,
  className,
}: {
  label: string;
  accent?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide sm:px-2 sm:text-[10px]",
        accent
          ? "border-[color-mix(in_srgb,var(--primary)_30%,var(--card-border))] bg-[color-mix(in_srgb,var(--primary)_12%,transparent)] text-primary"
          : "border-[var(--card-border)] bg-[color-mix(in_srgb,var(--muted)_40%,transparent)] text-muted-foreground",
        className,
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
    <div className="rounded-[12px] border border-[var(--card-border)] bg-[color-mix(in_srgb,var(--muted)_30%,transparent)] px-2.5 py-2 sm:rounded-[14px] sm:px-3 sm:py-2.5">
      <p className="truncate text-[9px] font-semibold uppercase tracking-wide text-muted-foreground sm:text-[10px]">
        {label}
      </p>
      <p
        className={cn(
          "mt-0.5 truncate text-sm font-bold tabular-nums sm:mt-1 sm:text-base",
          danger ? "text-destructive" : positive ? "text-primary" : "text-foreground",
        )}
      >
        {value}
      </p>
    </div>
  );
}
