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
 <section className="h-[200px] w-full relative overflow-hidden bg-[#0f0e2a]">
 {/* Animated Mesh Gradient */}
 <div className="absolute inset-0 opacity-40">
 <div className="absolute inset-0 bg-gradient-to-br from-[#1e1b4b] to-[#0f0e2a]" />
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
 className="absolute -top-1/2 -right-1/4 w-full h-[200%] bg-[radial-gradient(circle_at_center,rgba(236,72,153,0.15),transparent_70%)]" 
 />
 </div>

 <div className="relative h-full px-8 flex items-center justify-between">
 {/* Left Content */}
 <div className="flex flex-col gap-1">
 <span className="text-sm font-medium text-p uppercase tracking-[0.3em] font-dm-sans">
 Marketplace
 </span>
 <h1 className="text-3xl font-bold text-white tracking-tight">
 Discover Proven Strategies
 </h1>
 <p className="text-sm text-white/50 font-dm-sans max-w-md">
 Browse 50+ verified strategies from top quantitative creators.
 </p>

 {/* Stats Row */}
 <div className="flex items-center gap-6 mt-4">
 {STATS.map((stat, i) => (
 <div key={stat.label} className="flex items-center gap-3">
 <div className="flex flex-col">
 <span className="text-sm font-bold text-white font-jet-mono tracking-tight">
 <span className="text-p/50 mr-0.5">{stat.prefix}</span>
 {stat.value}
 </span>
 <span className="text-xs text-white/30 uppercase font-bold tracking-widest">{stat.label}</span>
 </div>
 {i < STATS.length - 1 && (
 <div className="h-4 w-px bg-white/10 ml-2" />
 )}
 </div>
 ))}
 </div>
 </div>

 {/* Right Content: Preview Card Stack */}
 <div className="relative w-64 h-full pointer-events-none hidden lg:block">
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
 className="absolute w-44 h-24 rounded-2xl p-4 glass-strong border border-white/10 shadow-2xl flex flex-col justify-between"
 >
 <div className="flex items-center justify-between">
 <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center">
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
 <span className="text-xs font-semibold text-white/30 uppercase tracking-widest">Strategy</span>
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
