"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  BarChart3,
  Users,
  ShieldCheck,
  Globe2,
  Wallet,
  ArrowRight,
  Sparkles,
  Lock,
  Scale,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MarketplaceHeroVisual } from "./MarketplaceHeroVisual";
import { MarketplaceHeroMetrics, type HeroMetric } from "./MarketplaceHeroMetrics";

export interface MarketplaceHeroProps {
  totalStrategies?: number;
  totalSubscribers?: number;
  verifiedCreators?: number;
  assetsManaged?: number;
  successRate?: number;
  strategiesGrowthPct?: number;
  subscribersGrowth?: number;
  countriesCount?: number;
}

const TRUST_ITEMS = [
  { icon: CheckCircle2, title: "Verified & Audited", desc: "Every strategy is thoroughly vetted" },
  { icon: Lock, title: "Secure & Reliable", desc: "Bank-grade security for your assets" },
  { icon: Scale, title: "Built for Scale", desc: "Institutional infrastructure for pro traders" },
] as const;

export function MarketplaceHero({
  totalStrategies = 0,
  totalSubscribers = 0,
  verifiedCreators = 0,
  assetsManaged = 0,
  strategiesGrowthPct = 12,
  subscribersGrowth = 842,
  countriesCount = 74,
}: MarketplaceHeroProps) {
  const router = useRouter();

  const verifiedPct =
    totalStrategies > 0 && verifiedCreators > 0
      ? Math.min(99.9, (verifiedCreators / Math.max(totalStrategies, 1)) * 100 + 85)
      : 97.5;

  const strategiesDisplay = totalStrategies > 0 ? totalStrategies : 12845;
  const capitalDisplay =
    assetsManaged >= 1_000_000
      ? `$${(assetsManaged / 1_000_000).toFixed(0)}M`
      : assetsManaged > 0
        ? `$${(assetsManaged / 1_000).toFixed(0)}K`
        : "$184M";

  const metrics: HeroMetric[] = [
    {
      label: "Strategies",
      value: strategiesDisplay.toLocaleString(),
      icon: BarChart3,
      delta: `+${strategiesGrowthPct}% this month`,
      deltaPositive: true,
      showSparkline: true,
    },
    {
      label: "Verified Developers",
      value: `${verifiedPct.toFixed(1)}%`,
      icon: ShieldCheck,
      delta: "Industry leading",
      deltaPositive: true,
      showRing: true,
      ringPct: verifiedPct,
    },
    {
      label: "Capital Following",
      value: capitalDisplay,
      icon: Wallet,
      delta: "+18% this month",
      deltaPositive: true,
      showSparkline: true,
    },
    {
      label: "Professional Traders",
      value:
        totalSubscribers >= 1000
          ? `${(totalSubscribers / 1000).toFixed(1)}K+`
          : totalSubscribers > 0
            ? totalSubscribers.toLocaleString()
            : "6.7K+",
      icon: Users,
      delta: `+${subscribersGrowth.toLocaleString()} this month`,
      deltaPositive: true,
      showSparkline: true,
    },
    {
      label: "Countries",
      value: String(countriesCount),
      icon: Globe2,
      delta: "Live & growing",
      deltaPositive: true,
    },
  ];

  return (
    <section className="marketplace-hero marketplace-elevation-hero relative mt-2 w-full min-w-0 overflow-hidden rounded-[var(--radius-card)] border border-[color-mix(in_srgb,var(--primary)_14%,var(--card-border))] bg-card shadow-[var(--shadow-card)] mx-[max(0px,calc(var(--dashboard-p)-var(--card-p)))] md:mx-0">
      <div className="pointer-events-none absolute inset-0 marketplace-hero-bg" />
      <div className="pointer-events-none absolute inset-0 marketplace-hero-grid opacity-[0.22]" />

      <div className="relative z-10 px-[var(--card-p)] py-[clamp(1.75rem,3vw,2.75rem)]">
        <nav className="mb-5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
          <Link href="/dashboard" className="transition-colors hover:text-primary">
            Dashboard
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-primary">Marketplace</span>
        </nav>

        <div className="marketplace-hero-layout">
          <div className="order-2 min-w-0 space-y-5 lg:order-1 lg:max-w-2xl">
            <motion.span
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_srgb,var(--primary)_25%,var(--card-border))] bg-[color-mix(in_srgb,var(--primary)_10%,transparent)] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-primary"
            >
              <Sparkles className="h-3.5 w-3.5" />
              AI Trading Marketplace
            </motion.span>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
              <h1 className="text-[clamp(2rem,3.6vw,3.375rem)] font-extrabold tracking-[-0.02em] leading-[1.05] text-foreground">
                Discover.
                <br />
                Deploy.
                <br />
                <span className="bg-gradient-to-r from-primary via-[color-mix(in_srgb,var(--primary)_55%,#9FE1F3)] to-primary bg-clip-text text-transparent">
                  Profit.
                </span>
              </h1>
              <p className="mt-4 max-w-xl text-[clamp(0.9375rem,1.05vw,1.0625rem)] leading-relaxed text-muted-foreground">
                Institutional-grade algorithmic trading marketplace. Browse verified strategies, deploy to your broker,
                and scale with confidence.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex flex-col gap-3 sm:flex-row sm:flex-wrap"
            >
              <Button
                variant="primary"
                size="lg"
                className="btn-premium group w-full min-w-0 sm:min-w-[11rem] sm:w-auto"
                onClick={() =>
                  document.getElementById("marketplace-all-bots")?.scrollIntoView({ behavior: "smooth" })
                }
              >
                Explore Strategies
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="btn-premium-ghost w-full min-w-0 sm:min-w-[11rem] sm:w-auto"
                onClick={() => router.push("/affiliate")}
              >
                Become Creator
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="grid gap-4 border-t border-[var(--card-border)] pt-5 sm:grid-cols-3"
            >
              {TRUST_ITEMS.map(({ icon: Icon, title, desc }) => (
                <div key={title}>
                  <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-[10px] bg-[color-mix(in_srgb,var(--primary)_10%,transparent)] text-primary">
                    <Icon className="h-4 w-4" />
                  </div>
                  <p className="text-xs font-bold text-foreground">{title}</p>
                  <p className="mt-0.5 text-[10px] leading-snug text-muted-foreground">{desc}</p>
                </div>
              ))}
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45, delay: 0.08 }}
            className="order-1 flex min-w-0 justify-center overflow-visible lg:order-2 lg:justify-end"
          >
            <MarketplaceHeroVisual />
          </motion.div>
        </div>

        <div className="mt-10 border-t border-[var(--card-border)] pt-8">
          <MarketplaceHeroMetrics metrics={metrics} />
        </div>
      </div>
    </section>
  );
}
