"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const companies = [
  { name: "Binance", logo: "/logos/binance.svg" },
  { name: "Coinbase", logo: "/logos/coinbase.svg" },
  { name: "Kraken", logo: "/logos/kraken.svg" },
  { name: "Gemini", logo: "/logos/gemini.svg" },
  { name: "Bybit", logo: "/logos/bybit.svg" },
  { name: "OKX", logo: "/logos/okx.svg" },
];

export function SocialProofBar() {
  return (
    <div className="pt-20 pb-4 border-y border-white/5 bg-gradient-to-b from-black via-white/2 to-black relative overflow-hidden">
      {/* Subtle Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-200 h-[300px] bg-p/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="flex items-center justify-center gap-4 mb-14">
          <div className="h-px w-12 bg-linear-to-r from-transparent to-white/20" />
          <p className="text-center text-xs font-bold uppercase tracking-[0.4em] text-white/60 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
            Your Liquidity Connectivity
          </p>
          <div className="h-px w-12 bg-gradient-to-l from-transparent to-white/20" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-12 items-center justify-items-center">
          {companies.map((company) => (
            <motion.div
              key={company.name}
              whileHover={{ y: -5, scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="flex items-center gap-4 group cursor-pointer opacity-70 hover:opacity-100 transition-all duration-500"
            >
              <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center font-bold text-2xl text-white/80 group-hover:bg-p/20 group-hover:text-p group-hover:border-p/50 transition-all duration-500 shadow-xl group-hover:shadow-[0_0_20px_rgba(99,102,241,0.3)]">
                {company.name[0]}
              </div>
              <span className="font-display font-bold text-xl tracking-wide text-white/80 group-hover:text-white transition-colors duration-500">
                {company.name}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Industrial Scanlines */}
      <div className="absolute inset-0 bg-scanlines opacity-[0.03] pointer-events-none" />
    </div>
  );
}
