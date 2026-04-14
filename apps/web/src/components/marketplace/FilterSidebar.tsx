'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, X, Shield, Activity, Target, Zap, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface FilterSidebarProps {
 isOpen: boolean;
 onClose: () => void;
 value: {
  priceMax: number;
  selectedRisks: string[];
  selectedAssets: string[];
  verifiedOnly: boolean;
 };
 onChange: (value: {
  priceMax: number;
  selectedRisks: string[];
  selectedAssets: string[];
  verifiedOnly: boolean;
 }) => void;
 onApply: () => void;
 onSavePreset: () => void;
}

const RISK_LEVELS = [
 { id: 'low', label: 'Low', color: 'bg-emerald-500' },
 { id: 'medium', label: 'Medium', color: 'bg-amber-500' },
 { id: 'high', label: 'High', color: 'bg-red-500' },
 { id: 'expert', label: 'Expert', color: 'bg-purple-500' },
];

const ASSETS = ['Forex', 'Crypto', 'Indices', 'Commodities'];
const TIMEFRAMES = ['M1', 'M5', 'M15', 'H1', 'H4', 'D1'];

export function FilterSidebar({ isOpen, onClose, value, onChange, onApply, onSavePreset }: FilterSidebarProps) {
 const { priceMax: price, selectedRisks, selectedAssets, verifiedOnly } = value;

 const toggleRisk = (id: string) => {
 const next = selectedRisks.includes(id)
  ? selectedRisks.filter(r => r !== id)
  : [...selectedRisks, id];
 onChange({ ...value, selectedRisks: next });
 };

 return (
 <aside className={cn(
"w-[280px] border-r border-white/5 bg-[#0d0d12]/50 backdrop-blur-3xl flex flex-col shrink-0 transition-all duration-300 relative z-40",
 !isOpen &&"-ml-[280px]"
 )}>
 <div className="p-6 border-b border-white/5 flex items-center justify-between">
 <div className="flex items-center gap-3">
 <Filter className="w-4 h-4 text-p" />
 <h3 className="text-sm font-semibold text-white uppercase tracking-widest">Filters</h3>
 </div>
 <div className="flex items-center gap-2">
 <span className="w-5 h-5 rounded-full bg-p/20 flex items-center justify-center text-xs font-semibold text-p">
 {selectedRisks.length + selectedAssets.length}
 </span>
 </div>

 <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
 {/* Price Range */}
 <div className="space-y-6">
 <div className="flex items-center justify-between">
 <h4 className="text-xs font-semibold text-white/30 uppercase tracking-[0.2em]">Monthly Fee</h4>
 <span className="text-xs font-semibold text-white font-mono">₹0 - ₹{price.toLocaleString()}</span>
 </div>
 <div className="relative pt-2">
 <input 
 type="range"
 min="0"
 max="10000"
 step="500"
 value={price}
 onChange={(e) => onChange({ ...value, priceMax: parseInt(e.target.value) })}
 className="w-full h-1 bg-white/5 rounded-full appearance-none cursor-pointer accent-indigo-500"
 />
 <div className="flex items-center justify-between mt-3 px-1">
 <span className="text-xs font-bold text-white/20 uppercase tracking-widest">Free</span>
 <span className="text-xs font-bold text-white/20 uppercase tracking-widest">Premium Elite</span>
 </div>
 </div>
 </div>

 {/* Risk Level */}
 <div className="space-y-4">
 <h4 className="text-xs font-semibold text-white/30 uppercase tracking-[0.2em]">Risk Exposure</h4>
 <div className="grid grid-cols-2 gap-2">
 {RISK_LEVELS.map((risk) => (
 <button
 key={risk.id}
 onClick={() => toggleRisk(risk.id)}
 className={cn(
"p-3 rounded-2xl border transition-all duration-300 flex items-center gap-3 group relative overflow-hidden",
 selectedRisks.includes(risk.id)
 ?"bg-white/5 border-white/20 shadow-xl"
 :"bg-transparent border-white/5 hover:border-white/10"
 )}
 >
 <div className={cn("w-2 h-2 rounded-full", risk.color, selectedRisks.includes(risk.id) ?"shadow-[0_0_8px_currentColor]" :"opacity-30")} />
 <span className={cn(
"text-xs font-semibold uppercase tracking-widest",
 selectedRisks.includes(risk.id) ?"text-white" :"text-white/30"
 )}>
 {risk.label}
 </span>
 <AnimatePresence>
 {selectedRisks.includes(risk.id) && (
 <motion.div 
 initial={{ opacity: 0, scale: 0.8 }}
 animate={{ opacity: 1, scale: 1 }}
 className="absolute top-2 right-2"
 >
 <Check className="w-3 h-3 text-p" />
 </motion.div>
 )}
 </AnimatePresence>
 </button>
 ))}
 </div>
 </div>

 {/* Asset Class */}
 <div className="space-y-4">
 <h4 className="text-xs font-semibold text-white/30 uppercase tracking-[0.2em]">Asset Universe</h4>
 <div className="flex flex-wrap gap-2">
 {ASSETS.map((asset) => (
 <button
 key={asset}
 onClick={() => {
  const next = selectedAssets.includes(asset)
   ? selectedAssets.filter(a => a !== asset)
   : [...selectedAssets, asset];
  onChange({ ...value, selectedAssets: next });
 }}
 className={cn(
"px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-widest transition-all",
 selectedAssets.includes(asset)
 ?"bg-p/20 border-p/50 text-p border"
 :"bg-white/5 border border-white/5 text-white/30 hover:border-white/20"
 )}
 >
 {asset}
 </button>
 ))}
 </div>
 </div>

 {/* Timeframes */}
 <div className="space-y-4">
 <h4 className="text-xs font-semibold text-white/30 uppercase tracking-[0.2em]">Resolution</h4>
 <div className="grid grid-cols-3 gap-2">
 {TIMEFRAMES.map((tf) => (
 <button
 key={tf}
 className="py-2.5 rounded-xl bg-white/5 border border-white/5 text-xs font-bold text-white/20 hover:text-white hover:border-white/10 transition-all"
 >
 {tf}
 </button>
 ))}
 </div>
 </div>

 {/* Verification */}
 <div className="pt-4">
 <div className="p-4 rounded-2xl glass-strong border border-white/5 flex items-center justify-between">
 <div className="flex flex-col">
 <span className="text-xs font-semibold text-white uppercase tracking-widest">Verified Only</span>
 <span className="text-xs text-white/30 font-bold uppercase tracking-tight mt-0.5">Show only audited creators</span>
 </div>
 <button
  onClick={() => onChange({ ...value, verifiedOnly: !verifiedOnly })}
  className={cn(
   "w-10 h-5 rounded-full relative cursor-pointer p-1 transition-colors",
   verifiedOnly ? "bg-indigo-500/40 hover:bg-indigo-500/50" : "bg-white/10 hover:bg-white/20",
  )}
 >
 <div className={cn("w-3 h-3 rounded-full bg-white/90 transition-transform", verifiedOnly && "translate-x-5")} />
 </button>
 </div>
 </div>
 </div>
 </div>

 <div className="p-8 space-y-3">
 <Button onClick={onApply} className="w-full h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs uppercase tracking-[0.2em] shadow-2xl shadow-indigo-600/20 active:scale-95 transition-all">
 Apply Filters
 </Button>
 <button
  onClick={onSavePreset}
  className="w-full text-xs font-semibold text-indigo-300/70 hover:text-indigo-200 uppercase tracking-[0.25em] transition-colors py-1"
 >
  Save Preset
 </button>
 <button 
 onClick={() => {
 onChange({ ...value, selectedRisks: [], selectedAssets: [], verifiedOnly: false, priceMax: 5000 });
 }}
 className="w-full text-xs font-semibold text-red-400/50 hover:text-red-400 uppercase tracking-[0.3em] transition-colors py-2"
 >
 Reset All
 </button>
 </div>
 </aside>
 );
}
