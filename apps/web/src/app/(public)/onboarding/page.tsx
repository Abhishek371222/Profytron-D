'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
 Shield, 
 Zap, 
 BarChart3, 
 Target, 
 ChevronRight, 
 ChevronLeft, 
 CheckCircle2, 
 Loader2, 
 Coins, 
 BrainCircuit,
 TrendingUp,
 LineChart,
 Lock,
 Sparkles
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { CinematicCursor } from '@/components/ui/CinematicCursor';
import { Magnetic } from '@/components/ui/Interactions';
import { Slider } from '@/components/ui/slider';

// --- Types ---
type RiskProfile = 'conservative' | 'balanced' | 'aggressive' | 'degen';
type StrategyType = 'scalping' | 'trend' | 'arbitrage' | 'ai-hybrid';

interface OnboardingState {
 step: number;
 experience: RiskProfile;
 capital: number;
 strategy: StrategyType[];
}

// --- Step Components ---

const StepExperience = ({ selected, onSelect }: { selected: RiskProfile, onSelect: (v: RiskProfile) => void }) => {
 const options: { id: RiskProfile; label: string; desc: string; icon: any; color: string }[] = [
 { id: 'conservative', label: 'Shield First', desc: 'Prioritize capital preservation & steady growth.', icon: Shield, color: 'text-success' },
 { id: 'balanced', label: 'Oracle Mode', desc: 'Balanced risk/reward with structural logic.', icon: BarChart3, color: 'text-p' },
 { id: 'aggressive', label: 'Apex Predator', desc: 'High volatility capture with precision exits.', icon: Target, color: 'text-error' },
 { id: 'degen', label: 'Hyperdrive', desc: 'Maximum exposure for exponential scale.', icon: Zap, color: 'text-[#facc15]' },
 ];

 return (
 <div className="space-y-8 max-w-4xl w-full mx-auto px-6">
 <div className="text-center space-y-4">
 <h2 className="text-5xl font-display font-semibold tracking-tight text-white">
 Define your <span className="text-gradient">Risk DNA.</span>
 </h2>
 <p className="text-slate-400 text-lg max-w-xl mx-auto font-body">
 Our neural engine personalizes the terminal based on your psychological appetite for volatility.
 </p>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
 {options.map((opt) => (
 <motion.div
 key={opt.id}
 whileHover={{ y: -8, scale: 1.02 }}
 whileTap={{ scale: 0.98 }}
 onClick={() => onSelect(opt.id)}
 className={`cursor-pointer group relative bg-bg-card/40 backdrop-blur-3xl border ${selected === opt.id ? 'border-p ring-1 ring-p/50 shadow-[0_0_30px_rgba(var(--p-rgb),0.3)]' : 'border-white/10 opacity-70 hover:opacity-100'} rounded-3xl p-8 transition-all duration-300 overflow-hidden`}
 >
 <div className={`w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 transition-colors ${selected === opt.id ? 'bg-p/20 border-p/30' : 'group-hover:border-white/20'}`}>
 <opt.icon className={`w-7 h-7 ${selected === opt.id ? opt.color : 'text-white/40'}`} />
 </div>
 <h3 className="text-xl font-display font-bold text-white mb-2">{opt.label}</h3>
 <p className="text-white/40 text-sm leading-relaxed">{opt.desc}</p>
 
 {/* Selection indicator */}
 <AnimatePresence>
 {selected === opt.id && (
 <motion.div 
 initial={{ opacity: 0, scale: 0.5 }}
 animate={{ opacity: 1, scale: 1 }}
 exit={{ opacity: 0, scale: 0.5 }}
 className="absolute top-4 right-4"
 >
 <CheckCircle2 className="w-6 h-6 text-p" />
 </motion.div>
 )}
 </AnimatePresence>
 </motion.div>
 ))}
 </div>
 </div>
 );
};

const StepCapital = ({ value, onChange }: { value: number, onChange: (v: number) => void }) => {
 const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

 return (
 <div className="space-y-12 max-w-2xl w-full mx-auto px-6 text-center">
 <div className="space-y-4">
 <h2 className="text-5xl font-display font-semibold tracking-tight text-white">
 Initial <span className="text-gradient">Liquidity.</span>
 </h2>
 <p className="text-slate-400 text-lg font-body">Scale the terminal's execution power to your starting equity.</p>
 </div>

 <div className="relative p-12 bg-bg-card/40 backdrop-blur-3xl border border-white/10 rounded-[40px] shadow-2xl group overflow-hidden">
 <div className="absolute inset-0 noise opacity-10 pointer-events-none" />
 
 <div className="relative z-10 space-y-10">
 <div className="py-8">
 <motion.div 
 key={value}
 initial={{ scale: 0.9, opacity: 0 }}
 animate={{ scale: 1, opacity: 1 }}
 className="text-7xl lg:text-8xl font-display font-semibold tracking-tight text-white"
 >
 {formatCurrency(value)}
 </motion.div>
 <div className="text-p font-bold uppercase tracking-[0.3em] text-xs mt-4">Authorized Deployment Limit</div>
 </div>

 <div className="relative pt-6 pb-2">
 <Slider 
 value={[value]} 
 onValueChange={(vals: number[]) => onChange(vals[0])}
 min={10000}
 max={1000000}
 step={10000}
 className="relative py-4"
 />
 {/* Custom styled rail and ticks can be added here if needed */}
 <div className="flex justify-between mt-6 text-xs uppercase font-bold text-white/20 tracking-widest">
 <span>$10k (Alpha)</span>
 <span>$500k (Vanguard)</span>
 <span>$1M+ (Sovereign)</span>
 </div>
 </div>
 </div>

 {/* Decorative corner accents */}
 <div className="absolute top-4 left-4 w-2 h-2 border-t border-l border-white/20" />
 <div className="absolute top-4 right-4 w-2 h-2 border-t border-r border-white/20" />
 <div className="absolute bottom-4 left-4 w-2 h-2 border-b border-l border-white/20" />
 <div className="absolute bottom-4 right-4 w-2 h-2 border-b border-r border-white/20" />
 </div>
 </div>
 );
};

const StepStrategy = ({ selected, onToggle }: { selected: StrategyType[], onToggle: (s: StrategyType) => void }) => {
 const strategies: { id: StrategyType; label: string; icon: any; tags: string[] }[] = [
 { id: 'scalping', label: 'Momentum Scalp', icon: Zap, tags: ['High Freq', 'Precision'] },
 { id: 'trend', label: 'Trend Sentinel', icon: TrendingUp, tags: ['Low Freq', 'Capital Scale'] },
 { id: 'arbitrage', label: 'Delta Neutral', icon: LineChart, tags: ['Market Neutral', 'Stable'] },
 { id: 'ai-hybrid', label: 'Neural Hybrid', icon: BrainCircuit, tags: ['Auto-Adaptive', 'Risk Aware'] },
 ];

 return (
 <div className="space-y-8 max-w-4xl w-full mx-auto px-6">
 <div className="text-center space-y-4">
 <h2 className="text-5xl font-display font-semibold tracking-tight text-white">
 Execution <span className="text-gradient">Alignment.</span>
 </h2>
 <p className="text-slate-400 text-lg font-body">Select the algorithmic modules to synchronize with your core terminal.</p>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 {strategies.map((s) => (
 <motion.div
 key={s.id}
 whileHover={{ scale: 1.02 }}
 onClick={() => onToggle(s.id)}
 className={`cursor-pointer group relative p-8 bg-bg-card/40 backdrop-blur-3xl border ${selected.includes(s.id) ? 'border-p ring-1 ring-p/50 shadow-[0_0_20px_rgba(var(--p-rgb),0.2)]' : 'border-white/10 opacity-60'} rounded-3xl transition-all duration-300`}
 >
 <div className="flex items-start gap-6">
 <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors ${selected.includes(s.id) ? 'bg-p/20 text-p' : 'bg-white/5 text-white/40 group-hover:bg-white/10 group-hover:text-white/60'}`}>
 <s.icon className="w-8 h-8" />
 </div>
 <div className="space-y-3">
 <h3 className="text-2xl font-display font-bold text-white">{s.label}</h3>
 <div className="flex flex-wrap gap-2">
 {s.tags.map(tag => (
 <span key={tag} className="px-3 py-1 bg-white/5 border border-white/5 rounded-full text-xs uppercase font-bold tracking-widest text-white/40">{tag}</span>
 ))}
 </div>
 </div>
 </div>
 {selected.includes(s.id) && (
 <motion.div 
 layoutId="check"
 className="absolute bottom-6 right-8 w-10 h-10 rounded-full bg-p/20 border border-p/40 flex items-center justify-center"
 >
 <CheckCircle2 className="w-5 h-5 text-p" />
 </motion.div>
 )}
 </motion.div>
 ))}
 </div>
 </div>
 );
};

const StepFinalizing = () => {
 return (
 <div className="space-y-12 max-w-lg w-full mx-auto text-center">
 <div className="relative w-48 h-48 mx-auto">
 {/* Radar/Pulse Animation */}
 <motion.div 
 animate={{ scale: [1, 1.2, 1], rotate: 360 }}
 transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
 className="absolute inset-0 border-2 border-dashed border-p/20 rounded-full"
 />
 <motion.div 
 animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
 transition={{ duration: 2, repeat: Infinity }}
 className="absolute inset-4 border border-p/40 rounded-full"
 />
 <div className="absolute inset-8 rounded-full bg-linear-to-br from-p to-p-dark flex items-center justify-center shadow-[0_0_60px_rgba(var(--p-rgb),0.5)]">
 <BrainCircuit className="w-16 h-16 text-white animate-pulse" />
 </div>
 </div>

 <div className="space-y-4">
 <h2 className="text-4xl font-display font-semibold tracking-tight text-white mb-2">Neural <span className="text-p">Synchronization.</span></h2>
 <div className="flex flex-col gap-2">
 <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
 <motion.div 
 initial={{ width: 0 }}
 animate={{ width: '100%' }}
 transition={{ duration: 4, ease: 'easeInOut' }}
 className="h-full bg-linear-to-r from-p to-p-dark shadow-[0_0_10px_rgba(var(--p-rgb),0.8)]"
 />
 </div>
 <div className="flex justify-between items-center text-xs font-bold text-white/20 uppercase tracking-widest px-1">
 <span className="animate-pulse">Analyzing Risk DNA...</span>
 <span className="text-p">Finalizing Gateway</span>
 </div>
 </div>
 <p className="text-slate-400 pt-4 px-8 text-sm opacity-60">
 Compiling your algorithmic execution layer. This synchronization ensures institutional grade precision and loss prevention.
 </p>
 </div>
 </div>
 );
};

// --- Main Page ---

export default function OnboardingPage() {
 const router = useRouter();
 const [step, setStep] = useState(1);
 const [data, setData] = useState<OnboardingState>({
 step: 1,
 experience: 'balanced',
 capital: 100000,
 strategy: ['ai-hybrid'],
 });

 const nextStep = () => {
 if (step < 4) setStep(step + 1);
 };

 const prevStep = () => {
 if (step > 1) setStep(step - 1);
 };

 useEffect(() => {
 if (step === 4) {
 const timer = setTimeout(() => {
 router.push('/dashboard');
 }, 5000); // Give 5s for the cinematic synchronization
 return () => clearTimeout(timer);
 }
 }, [step, router]);

 return (
 <main className="h-screen w-full bg-bg-base overflow-hidden noise relative flex flex-col items-center justify-center">
 <CinematicCursor />
 
 {/* Dynamic Background Atmosphere */}
 <div className="fixed inset-0 pointer-events-none z-0">
 <motion.div 
 animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
 transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
 className="absolute top-1/4 -left-1/4 w-200 h-200 bg-p/10 blur-[200px] rounded-full opacity-30" 
 />
 <motion.div 
 animate={{ x: [0, -40, 0], y: [0, -50, 0] }}
 transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
 className="absolute bottom-1/4 -right-1/4 w-150 h-150 bg-s/10 blur-[180px] rounded-full opacity-25" 
 />
 </div>

 {/* Progress & Header */}
 <header className="fixed top-0 inset-x-0 h-24 z-50 px-12 flex items-center justify-between pointer-events-none">
 <div className="bg-bg-card/40 backdrop-blur-xl border border-white/5 px-6 py-2 rounded-full pointer-events-auto flex items-center gap-4 shadow-2xl">
 <Link href="/" className="flex items-center gap-3">
 <Zap className="w-5 h-5 text-p fill-p" />
 <span className="text-xl font-display font-semibold tracking-tight text-white">PROFYTRON</span>
 </Link>
 <div className="h-4 w-[1px] bg-white/10 mx-2" />
 <div className="flex items-center gap-2">
 <span className="text-xs font-bold text-white/20 uppercase tracking-widest">Setup Phase</span>
 <div className="flex gap-1.5 h-1">
 {[1, 2, 3, 4].map((i) => (
 <div 
 key={i} 
 className={`w-4 rounded-full transition-all duration-500 ${step >= i ? 'bg-p shadow-[0_0_8px_rgba(var(--p-rgb),0.5)]' : 'bg-white/5'}`} 
 />
 ))}
 </div>
 </div>
 </div>

 <div className="bg-bg-card/40 backdrop-blur-xl border border-white/5 px-6 py-3 rounded-full pointer-events-auto flex items-center gap-4 shadow-2xl">
 <Lock className="w-4 h-4 text-p" />
 <span className="text-xs font-bold text-white/40 uppercase tracking-[0.2em]">Your Access Level: 2</span>
 </div>
 </header>

 {/* Wizard Content */}
 <div className="relative z-10 w-full h-full flex items-center justify-center p-6">
 <AnimatePresence mode="wait">
 {step === 1 && (
 <motion.div
 key="step1"
 initial={{ opacity: 0, x: 50 }}
 animate={{ opacity: 1, x: 0 }}
 exit={{ opacity: 0, x: -50 }}
 transition={{ type: 'spring', damping: 25, stiffness: 120 }}
 className="w-full"
 >
 <StepExperience 
 selected={data.experience} 
 onSelect={(val) => setData({ ...data, experience: val })} 
 />
 </motion.div>
 )}
 {step === 2 && (
 <motion.div
 key="step2"
 initial={{ opacity: 0, x: 50 }}
 animate={{ opacity: 1, x: 0 }}
 exit={{ opacity: 0, x: -50 }}
 className="w-full"
 >
 <StepCapital 
 value={data.capital} 
 onChange={(val) => setData({ ...data, capital: val })} 
 />
 </motion.div>
 )}
 {step === 3 && (
 <motion.div
 key="step3"
 initial={{ opacity: 0, x: 50 }}
 animate={{ opacity: 1, x: 0 }}
 exit={{ opacity: 0, x: -50 }}
 className="w-full"
 >
 <StepStrategy 
 selected={data.strategy} 
 onToggle={(s) => {
 const current = [...data.strategy];
 if (current.includes(s)) {
 setData({ ...data, strategy: current.filter(x => x !== s) });
 } else {
 setData({ ...data, strategy: [...current, s] });
 }
 }} 
 />
 </motion.div>
 )}
 {step === 4 && (
 <motion.div
 key="step4"
 initial={{ opacity: 0, scale: 0.9 }}
 animate={{ opacity: 1, scale: 1 }}
 className="w-full"
 >
 <StepFinalizing />
 </motion.div>
 )}
 </AnimatePresence>
 </div>

 {/* Navigation Footer */}
 {step < 4 && (
 <footer className="fixed bottom-12 inset-x-0 z-50 px-12 flex items-center justify-between">
 <Magnetic strength={0.3}>
 <button
 onClick={prevStep}
 className={`flex items-center gap-3 text-white/40 font-bold uppercase tracking-widest text-xs hover:text-white transition-colors ${step === 1 ? 'invisible' : ''}`}
 >
 <ChevronLeft className="w-5 h-5" />
 Return
 </button>
 </Magnetic>

 <Magnetic strength={0.3}>
 <Button
 onClick={nextStep}
 className="h-16 px-12 bg-linear-to-r from-p to-p-dark text-white font-semibold text-xl rounded-2xl flex items-center gap-4 transition-all shadow-2xl shadow-p/40 group relative overflow-hidden"
 >
 <span className="relative z-10 flex items-center gap-4">
 {step === 3 ? 'Neural Synchronization' : 'Initialize Next Phase'}
 <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
 </span>
 <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer" />
 </Button>
 </Magnetic>

 <div className="hidden lg:flex items-center gap-3 text-white/20 font-bold text-xs uppercase tracking-[0.3em]">
 <Sparkles className="w-4 h-4" /> Finalizing Risk DNA Phase 0{step}
 </div>
 </footer>
 )}

 {/* Global Bottom Shadow Gradient */}
 <div className="fixed bottom-0 inset-x-0 h-40 bg-linear-to-t from-bg-base to-transparent pointer-events-none z-0" />
 </main>
 );
}
