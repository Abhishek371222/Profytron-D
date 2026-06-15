"use client";

import React from "react";
import { Marquee } from "@/components/saasfly/marquee";

const companies = [
  { name: "Binance", initial: "B" },
  { name: "Bybit", initial: "B" },
  { name: "Coinbase", initial: "C" },
  { name: "Kraken", initial: "K" },
  { name: "TradingView", initial: "TV" },
  { name: "MetaTrader", initial: "MT" },
  { name: "Interactive Brokers", initial: "IB" },
  { name: "Gemini", initial: "G" },
];

function CompanyChip({ name, initial }: { name: string; initial: string }) {
  return (
    <div className="flex items-center gap-3 mx-8 shrink-0 opacity-60 hover:opacity-100 transition-opacity duration-300">
      <div className="w-10 h-10 rounded-xl border border-[var(--card-border)] bg-card flex items-center justify-center text-sm font-bold text-muted-foreground">
        {initial}
      </div>
      <span className="text-base font-semibold text-foreground/80 whitespace-nowrap">{name}</span>
    </div>
  );
}

export function SocialProofBar() {
  return (
    <div className="py-10 sm:py-14 border-y border-[var(--card-border)] bg-[var(--bg-secondary)] relative overflow-x-hidden">
      <div className="page-container mb-8">
        <p className="text-center text-overline text-muted-foreground tracking-widest">
          TRUSTED BY TRADERS &amp; INSTITUTIONS WORLDWIDE
        </p>
      </div>

      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-[var(--bg-secondary)] to-transparent z-10" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-[var(--bg-secondary)] to-transparent z-10" />

        <Marquee pauseOnHover repeat={4} className="[--duration:40s]">
          {companies.map((c, i) => (
            <CompanyChip key={`${c.name}-${i}`} {...c} />
          ))}
        </Marquee>
      </div>
    </div>
  );
}
