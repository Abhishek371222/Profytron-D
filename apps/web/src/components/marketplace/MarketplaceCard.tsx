"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ShieldCheck, Star, Activity, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { Button } from "@/components/ui/button";
import type { SubscriptionBillingModel } from "@/lib/api/marketplace";

function formatInr(amount: number) {
  if (!amount || amount <= 0) return "FREE";
  return `₹${Number(amount).toLocaleString("en-IN")}`;
}

interface MarketplaceCardProps {
  strategy: {
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
    rating?: number;
    reviewCount?: number;
    drawdown?: number;
  };
  onSubscribe: (strategy: MarketplaceCardProps["strategy"], billingModel?: SubscriptionBillingModel) => void;
}

export function MarketplaceCard({ strategy, onSubscribe }: MarketplaceCardProps) {
  const { returns, sharpe, subscribers, price, rating = 0, reviewCount = 0, drawdown = 0 } = strategy;
  const roundedRating = Math.round(rating);
  const aiScore = rating > 0 ? rating : Math.min(99, 60 + sharpe * 12);

  return (
    <motion.article
      whileHover={{ y: -4 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="marketplace-featured-card group relative overflow-hidden rounded-[var(--radius-card)] p-[1px]"
    >
      <div className="flex h-full flex-col gap-4 rounded-[calc(var(--radius-card)-1px)] bg-card p-5 transition-shadow duration-[250ms] group-hover:shadow-[var(--shadow-card-hover)]">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[color-mix(in_srgb,var(--primary)_10%,transparent)] text-primary">
              <Activity className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                {strategy.category}
              </p>
              <h3 className="truncate text-sm font-bold text-foreground">{strategy.name}</h3>
            </div>
          </div>
          <span className="rounded-[10px] bg-[color-mix(in_srgb,var(--secondary)_18%,transparent)] px-2 py-1 text-[10px] font-bold tabular-nums text-primary">
            AI {aiScore.toFixed(0)}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Stat label="Win Rate" value={returns > 0 ? `${returns.toFixed(1)}%` : "—"} positive />
          <Stat label="Sharpe" value={sharpe > 0 ? sharpe.toFixed(2) : "—"} />
          <Stat label="Max DD" value={drawdown > 0 ? `-${drawdown.toFixed(1)}%` : "—"} danger />
        </div>

        <div className="flex items-center justify-between border-t border-[var(--card-border)] pt-3">
          <div>
            <p className="text-lg font-bold text-foreground">{formatInr(price)}</p>
            {price > 0 && (
              <p className="text-[10px] uppercase text-muted-foreground">/ month · INR</p>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold tabular-nums text-foreground">{subscribers.toLocaleString()}</span> subs
          </p>
        </div>

        <div className="flex items-center gap-2">
          <UserAvatar name={strategy.creator} size="sm" />
          <div className="flex min-w-0 flex-1 items-center gap-1">
            <span className="truncate text-xs font-semibold text-foreground">{strategy.creator}</span>
            {strategy.verified && <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-primary" />}
          </div>
          {reviewCount > 0 ? (
            <div className="flex items-center gap-1">
              <div className="flex gap-0.5 text-primary">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className={cn("h-2.5 w-2.5", s <= roundedRating && "fill-current")} />
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="grid gap-2">
          <Button variant="primary" size="sm" className="group/btn w-full uppercase tracking-[0.1em]" onClick={() => onSubscribe(strategy, 'FIXED')}>
            Buy Subscription
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-0.5" />
          </Button>
          <Button variant="outline" size="sm" className="w-full uppercase tracking-[0.1em]" onClick={() => onSubscribe(strategy, 'PROFIT_SHARE')}>
            Get Profit Sharing · ₹149
          </Button>
        </div>
        <Link
          href={`/marketplace/${strategy.id}`}
          className="text-center text-[10px] font-semibold uppercase tracking-wide text-muted-foreground transition-colors hover:text-primary"
        >
          View Details →
        </Link>
      </div>
    </motion.article>
  );
}

function Stat({
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
    <div className="rounded-[12px] bg-[color-mix(in_srgb,var(--muted)_35%,transparent)] p-2">
      <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-0.5 text-xs font-bold tabular-nums",
          danger ? "text-destructive" : positive ? "text-primary" : "text-foreground",
        )}
      >
        {value}
      </p>
    </div>
  );
}
