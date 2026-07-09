"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { ShieldCheck, Activity, ArrowRight, Bot, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { Button } from "@/components/ui/button";

export interface MarketplaceStrategyRow {
  id: string;
  name: string;
  category: string;
  creator: string;
  verified?: boolean;
  returns: number;
  sharpe: number;
  risk: string;
  subscribers: number;
  price: number;
  drawdown?: number;
  rating?: number;
}

function aiScore(s: MarketplaceStrategyRow) {
  if (s.rating && s.rating > 0) return Math.round(s.rating);
  return Math.min(99, Math.round(60 + s.sharpe * 10 + s.returns * 0.2));
}

function riskLevel(risk: string) {
  const r = risk.toLowerCase();
  if (r.includes("low")) return { label: "Low", pct: 25, tone: "text-primary" };
  if (r.includes("high") || r.includes("expert")) return { label: "High", pct: 85, tone: "text-destructive" };
  return { label: "Med", pct: 55, tone: "text-foreground" };
}

export function MarketplaceStrategyTable({
  strategies,
  onSubscribe,
}: {
  strategies: MarketplaceStrategyRow[];
  onSubscribe: (s: MarketplaceStrategyRow) => void;
}) {
  const maxSubs = Math.max(...strategies.map((s) => s.subscribers), 1);

  return (
    <>
      {/* Mobile: card layout */}
      <div className="space-y-3 md:hidden">
        {strategies.map((s, rowIndex) => {
          const score = aiScore(s);
          const risk = riskLevel(s.risk);
          const dd = s.drawdown ?? Math.max(5, 20 - s.sharpe * 3);

          return (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: rowIndex * 0.03 }}
              className="rounded-[var(--radius-card)] border border-[var(--card-border)] bg-card p-4 shadow-[var(--shadow-card)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[color-mix(in_srgb,var(--primary)_10%,transparent)] text-primary">
                    <Activity className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <Link
                      href={`/marketplace/${s.id}`}
                      className="block truncate text-sm font-bold text-foreground"
                    >
                      {s.name}
                    </Link>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">{s.creator}</p>
                  </div>
                </div>
                <span className="shrink-0 text-sm font-bold text-foreground">
                  {s.price > 0 ? `$${s.price.toLocaleString()}` : "FREE"}
                </span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg bg-muted/40 px-2.5 py-2">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Return</p>
                  <p className="mt-0.5 font-bold tabular-nums text-primary">+{s.returns.toFixed(1)}%</p>
                </div>
                <div className="rounded-lg bg-muted/40 px-2.5 py-2">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">AI Score</p>
                  <p className="mt-0.5 font-bold tabular-nums text-foreground">{score}</p>
                </div>
                <div className="rounded-lg bg-muted/40 px-2.5 py-2">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Risk</p>
                  <p className={cn("mt-0.5 font-bold", risk.tone)}>{risk.label}</p>
                </div>
                <div className="rounded-lg bg-muted/40 px-2.5 py-2">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Drawdown</p>
                  <p className="mt-0.5 font-bold tabular-nums text-destructive">-{dd.toFixed(1)}%</p>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="mt-3 w-full min-h-[var(--touch-min)]"
                onClick={() => onSubscribe(s)}
              >
                View Strategy
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </motion.div>
          );
        })}
      </div>

      {/* Desktop: table layout */}
      <div className="marketplace-elevation-table marketplace-table responsive-table-shell hidden rounded-[var(--radius-card)] border border-[var(--card-border)] bg-card shadow-[var(--shadow-card)] md:block">
      <div className="responsive-table-inner overflow-x-auto">
        <table className="w-full min-w-[56rem]">
          <thead className="sticky top-0 z-10 bg-[color-mix(in_srgb,var(--muted)_45%,var(--card))] backdrop-blur-md">
            <tr>
              {["Bot", "Category", "Developer", "AI Score", "Return", "Win Rate", "Risk", "Popularity", "Price", ""].map(
                (h, i) => (
                  <th
                    key={h || "action"}
                    className={cn(
                      "px-4 py-3.5 text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground",
                      i >= 8 ? "text-right" : "text-left",
                    )}
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {strategies.map((s, rowIndex) => {
              const spark = buildSpark(s.returns, s.id);
              const dd = s.drawdown ?? Math.max(5, 20 - s.sharpe * 3);
              const score = aiScore(s);
              const risk = riskLevel(s.risk);
              const popPct = (s.subscribers / maxSubs) * 100;

              return (
                <motion.tr
                  key={s.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: rowIndex * 0.03 }}
                  className="marketplace-table-row group border-b border-[color-mix(in_srgb,var(--card-border)_60%,transparent)] last:border-0"
                >
                  <td className="px-4 py-4">
                    <div className="flex min-w-[200px] items-center gap-3">
                      <div className="relative">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[color-mix(in_srgb,var(--primary)_10%,transparent)] text-primary transition-all duration-200 group-hover:scale-[1.04] group-hover:shadow-[0_4px_14px_color-mix(in_srgb,var(--primary)_12%,transparent)]">
                          <Activity className="h-5 w-5" />
                        </div>
                        {rowIndex < 3 && (
                          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[8px] font-bold text-primary-foreground">
                            {rowIndex + 1}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <Link
                          href={`/marketplace/${s.id}`}
                          className="block truncate text-sm font-bold text-foreground transition-colors hover:text-primary"
                        >
                          {s.name}
                        </Link>
                        <span className="mt-0.5 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                          <Sparkles className="h-2.5 w-2.5 text-primary" />
                          {risk.label} Risk
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="inline-flex rounded-full border border-[color-mix(in_srgb,var(--primary)_20%,var(--card-border))] bg-[color-mix(in_srgb,var(--primary)_8%,transparent)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-primary">
                      {s.category}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <UserAvatar name={s.creator} size="sm" />
                      <div className="min-w-0">
                        <p className="flex items-center gap-1 truncate text-sm font-medium text-foreground">
                          {s.creator}
                          {s.verified && <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-primary" />}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <div className="relative h-9 w-9">
                        <svg viewBox="0 0 36 36" className="h-9 w-9 -rotate-90">
                          <circle cx="18" cy="18" r="14" fill="none" stroke="var(--muted)" strokeWidth="3" />
                          <circle
                            cx="18"
                            cy="18"
                            r="14"
                            fill="none"
                            stroke="var(--chart-bull)"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeDasharray={`${(score / 100) * 88} 88`}
                          />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold tabular-nums text-primary">
                          {score}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold tabular-nums text-primary">+{s.returns.toFixed(1)}%</span>
                      <div className="hidden h-8 w-[4.5rem] md:block">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                          <AreaChart data={spark}>
                            <Area
                              type="monotone"
                              dataKey="v"
                              stroke="var(--chart-bull)"
                              fill="var(--chart-bull)"
                              fillOpacity={0.14}
                              strokeWidth={1.5}
                              isAnimationActive={false}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm font-semibold tabular-nums text-foreground">{s.returns.toFixed(1)}%</span>
                    <p className="text-[10px] text-destructive tabular-nums">DD -{dd.toFixed(1)}%</p>
                  </td>
                  <td className="px-4 py-4">
                    <div className="w-16">
                      <div className="mb-1 flex justify-between text-[9px] font-bold uppercase text-muted-foreground">
                        <span className={risk.tone}>{risk.label}</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-500",
                            risk.pct > 70 ? "bg-destructive" : risk.pct > 45 ? "bg-primary" : "bg-secondary",
                          )}
                          style={{ width: `${risk.pct}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="w-24">
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
                          style={{ width: `${Math.max(popPct, 8)}%` }}
                        />
                      </div>
                      <p className="mt-1 text-[10px] font-semibold tabular-nums text-muted-foreground">
                        {s.subscribers.toLocaleString()}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right text-sm font-bold text-foreground">
                    {s.price > 0 ? `$${s.price.toLocaleString()}` : "FREE"}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="btn-premium-ghost rounded-[12px] border border-[var(--card-border)] text-[11px] font-bold uppercase tracking-wide"
                      onClick={() => onSubscribe(s)}
                    >
                      View
                      <ArrowRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                    </Button>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
      </div>
    </>
  );
}

function buildSpark(base: number, seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return Array.from({ length: 8 }, (_, i) => ({
    v: base * 0.3 + ((h + i * 17) % 20) + i * 1.5,
  }));
}
