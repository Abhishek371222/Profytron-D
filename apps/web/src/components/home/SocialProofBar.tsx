"use client";

import React from "react";
import { motion } from "framer-motion";

const companies = [
  { name: "Binance",  initial: "B", color: "text-amber-400",   bg: "bg-amber-400/10   border-amber-400/20"   },
  { name: "Coinbase", initial: "C", color: "text-blue-400",    bg: "bg-blue-400/10    border-blue-400/20"    },
  { name: "Kraken",   initial: "K", color: "text-violet-400",  bg: "bg-violet-400/10  border-violet-400/20"  },
  { name: "Gemini",   initial: "G", color: "text-cyan-400",    bg: "bg-cyan-400/10    border-cyan-400/20"    },
  { name: "Bybit",    initial: "B", color: "text-emerald-400", bg: "bg-emerald-400/10 border-emerald-400/20" },
  { name: "OKX",      initial: "O", color: "text-rose-400",    bg: "bg-rose-400/10    border-rose-400/20"    },
];

// Duplicate for infinite scroll
const ITEMS = [...companies, ...companies];

export function SocialProofBar() {
  return (
    <div className="py-16 border-y border-white/[0.05] bg-black relative overflow-hidden">
      {/* Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[200px] bg-indigo-500/[0.04] blur-[100px] rounded-full pointer-events-none" />

      {/* Label */}
      <div className="flex items-center justify-center gap-4 mb-10 relative z-10">
        <div className="h-px w-16 bg-gradient-to-r from-transparent to-white/15" />
        <p className="text-center text-[11px] font-bold uppercase tracking-[0.38em] text-white/40">
          Liquidity Connectivity
        </p>
        <div className="h-px w-16 bg-gradient-to-l from-transparent to-white/15" />
      </div>

      {/* Infinite scroll strip */}
      <div className="relative overflow-hidden">
        {/* Left/right fades */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-black to-transparent z-10" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-black to-transparent z-10" />

        <motion.div
          className="flex"
          animate={{ x: [0, -(companies.length * 200)] }}
          transition={{ duration: 24, ease: "linear", repeat: Infinity }}
        >
          {ITEMS.map((company, i) => (
            <motion.div
              key={`${company.name}-${i}`}
              whileHover={{ y: -4, scale: 1.06 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="flex items-center gap-3.5 mx-8 group cursor-pointer opacity-50 hover:opacity-100 transition-opacity duration-400 shrink-0"
              style={{ minWidth: "160px" }}
            >
              <div
                className={`w-11 h-11 rounded-xl border flex items-center justify-center font-bold text-lg ${company.bg} ${company.color} group-hover:shadow-[0_0_20px_var(--glow)] transition-all duration-400`}
                style={{ "--glow": "rgba(255,255,255,0.1)" } as React.CSSProperties}
              >
                {company.initial}
              </div>
              <span className="font-bold text-lg tracking-wide text-white/70 group-hover:text-white transition-colors duration-400">
                {company.name}
              </span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
