'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const companies = [
  { name: 'Binance', logo: '/logos/binance.svg' },
  { name: 'Coinbase', logo: '/logos/coinbase.svg' },
  { name: 'Kraken', logo: '/logos/kraken.svg' },
  { name: 'Gemini', logo: '/logos/gemini.svg' },
  { name: 'Bybit', logo: '/logos/bybit.svg' },
  { name: 'OKX', logo: '/logos/okx.svg' },
];

export function SocialProofBar() {
  return (
    <div className="py-16 border-y border-white/5 bg-white/[0.01] relative overflow-hidden">
      <div className="container mx-auto px-6">
        <p className="text-center text-[10px] font-black uppercase tracking-[0.4em] text-white/20 mb-12">
          Institutional Liquidity Connectivity
        </p>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-12 items-center justify-items-center">
          {companies.map((company) => (
            <motion.div 
              key={company.name}
              whileHover={{ y: -5 }}
              className="flex items-center gap-3 group cursor-pointer opacity-30 hover:opacity-100 transition-all duration-700"
            >
              <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-center font-black text-xl text-white/40 group-hover:bg-primary/20 group-hover:text-primary group-hover:border-primary/30 transition-all duration-500 shadow-xl group-hover:shadow-primary/10">
                {company.name[0]}
              </div>
              <span className="font-display font-bold text-xl tracking-tighter text-white/40 group-hover:text-white transition-all duration-500">
                {company.name}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
