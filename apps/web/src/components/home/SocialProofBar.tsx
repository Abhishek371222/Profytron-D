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
    <span className="shrink-0 whitespace-nowrap rounded-full border border-primary/15 bg-primary/[0.06] px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-primary/30 hover:bg-primary/10 sm:px-5 sm:text-base">
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

      <div className="relative overflow-hidden" aria-label="Supported trading platforms">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-[var(--bg-secondary)] to-transparent dark:from-[var(--background)]" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[var(--bg-secondary)] to-transparent dark:from-[var(--background)]" />

        <Marquee
          pauseOnHover
          repeat={3}
          className="profytron-auto-scroll [--duration:34s] [--gap:0.75rem] sm:[--gap:1rem]"
        >
          {companies.map((name, i) => (
            <CompanyChip key={`${name}-${i}`} name={name} />
          ))}
        </Marquee>
      </div>
    </section>
  );
}
