'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Box } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATS = [
 { label: 'subscribers today', value: '847', prefix: '' },
 { label: 'revenue generated', value: '12.4Cr', prefix: '₹' },
 { label: 'new this week', value: '23', prefix: '+' }
];

export function MarketplaceHero() {
 return (
 <section className="h-[170px] md:h-[184px] w-full relative overflow-hidden bg-[#0d1130] border-b border-white/5">
 {/* Animated Mesh Gradient */}
 <div className="absolute inset-0 opacity-45">
 <div className="absolute inset-0 bg-linear-to-br from-[#171b49] via-[#11173f] to-[#0b1233]" />
 <motion.div 
 animate={{
 x: [0, 40, 0],
 y: [0, -20, 0],
 scale: [1, 1.1, 1],
 }}
 transition={{
 duration: 20,
 repeat: Infinity,
 ease:"easeInOut"
 }}
 className="absolute -top-1/2 -right-1/4 w-full h-[200%] bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.28),transparent_70%)]" 
 />
 </div>

 <div className="relative h-full px-5 md:px-8 flex items-center justify-between">
 {/* Left Content */}
 <div className="flex flex-col gap-1">
 <span className="text-[11px] font-semibold text-indigo-300 uppercase tracking-[0.24em] font-dm-sans">
 Marketplace
 </span>
 <h1 className="text-2xl md:text-[34px] font-bold text-white tracking-tight leading-[1.05]">
 Discover Proven Strategies
 </h1>
 <p className="text-xs md:text-sm text-white/60 font-dm-sans max-w-lg">
 Browse 50+ verified strategies from top quantitative creators.
 </p>

 {/* Stats Row */}
 <div className="flex items-center gap-4 md:gap-6 mt-3.5">
 {STATS.map((stat, i) => (
 <div key={stat.label} className="flex items-center gap-2 md:gap-3">
 <div className="flex flex-col">
 <span className="text-xs md:text-sm font-bold text-white font-jet-mono tracking-tight">
 <span className="text-p/50 mr-0.5">{stat.prefix}</span>
 {stat.value}
 </span>
 <span className="text-[10px] text-white/35 uppercase font-bold tracking-[0.12em]">{stat.label}</span>
 </div>
 {i < STATS.length - 1 && (
 <div className="h-4 w-px bg-white/12 ml-1.5" />
 )}
 </div>
 ))}
 </div>
 </div>

 {/* Right Content: Preview Card Stack */}
 <div className="relative w-56 h-full pointer-events-none hidden xl:block">
 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
 {[
 { id: 1, rotate: -8, x: -40, z: 10, name: 'Neural Alpha', ret: '+124%', price: '₹2,499' },
 { id: 2, rotate: 0, x: 0, z: 20, name: 'Quantum Arb', ret: '+42%', price: 'FREE' },
 { id: 3, rotate: 8, x: 40, z: 10, name: 'Gamma Sniper', ret: '+412%', price: '₹5,499' }
 ].map((card) => (
 <motion.div
 key={card.id}
 initial={{ rotate: card.rotate, x: card.x, opacity: 0 }}
 animate={{ 
 opacity: 1,
 y: [0, -10, 0]
 }}
 transition={{
 y: { duration: 4, repeat: Infinity, ease:"easeInOut", delay: card.id * 0.5 }
 }}
 style={{ zIndex: card.z }}
 className="absolute w-40 h-20 rounded-xl p-3 glass-strong border border-white/10 shadow-2xl flex flex-col justify-between"
 >
 <div className="flex items-center justify-between">
 <div className="w-5 h-5 rounded-md bg-white/10 flex items-center justify-center">
 <Box className="w-3 h-3 text-white/40" />
 </div>
 <span className={cn(
"text-xs font-semibold px-1.5 py-0.5 rounded-md",
 card.ret.includes('+') ?"bg-emerald-500/10 text-emerald-400" :"bg-p/10 text-p"
 )}>
 {card.ret}
 </span>
 </div>
 <div className="flex flex-col">
 <span className="text-[10px] font-semibold text-white/35 uppercase tracking-[0.12em]">Strategy</span>
 <span className="text-xs font-bold text-white truncate">{card.name}</span>
 </div>
 </motion.div>
 ))}
 </div>
 </div>
 </div>
 </section>
 );
}
