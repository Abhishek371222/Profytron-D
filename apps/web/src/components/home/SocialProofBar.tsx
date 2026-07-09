"use client";

import React from "react";
import { Marquee } from "@/components/saasfly/marquee";

const companies = [
  "Binance",
  "Bybit",
  "Coinbase",
  "Kraken",
  "TradingView",
  "MetaTrader",
  "Interactive Brokers",
  "Gemini",
];

function CompanyChip({ name }: { name: string }) {
  return (
    <span className="mx-6 shrink-0 whitespace-nowrap text-sm font-semibold tracking-wide text-muted-foreground/70 transition-colors duration-300 hover:text-foreground sm:text-base">
      {name}
    </span>
  );
}

export function SocialProofBar() {
  return (
    <section className="landing-section relative overflow-x-hidden border-y border-[var(--card-border)] !py-10 sm:!py-14">
      <div className="page-container mb-8">
        <p className="text-center text-overline tracking-widest text-muted-foreground">
          TRUSTED BY TRADERS &amp; INSTITUTIONS WORLDWIDE
        </p>
      </div>

      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-[var(--bg-secondary)] to-transparent dark:from-[var(--background)]" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[var(--bg-secondary)] to-transparent dark:from-[var(--background)]" />

        <Marquee pauseOnHover repeat={4} className="[--duration:40s]">
          {companies.map((name, i) => (
            <CompanyChip key={`${name}-${i}`} name={name} />
          ))}
        </Marquee>
      </div>
    </section>
  );
}
