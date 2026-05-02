'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
 ShieldCheck, 
 Target, 
 Zap, 
 Activity, 
 ChevronRight, 
 Lock,
 ArrowRight,
 Brain,
 Cpu,
 Sparkles
} from '@/components/ui/icons';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { toast } from 'sonner';

const STEPS = [
 {
 id: 'capital',
 title: 'Capital Allocation',
 description: 'Determine your strategic threshold for institutional-grade exposure.',
 icon: Target,
 questions: [
 { id: 'amount', label: 'TARGET DEPLOYMENT VOLUME', options: ['<$10K', '$10K - $100K', '$100K - $1M', '$1M+'], weight: 1 },
 { id: 'source', label: 'LIQUIDITY ORIGIN', options: ['Personal Savings', 'Your Fund', 'Venture Capital', 'Treasury'], weight: 1 }
 ]
 },
 {
 id: 'aggressiveness',
 title: 'Neural Aggression',
 description: 'Calibrate the smart analysis execution frequency and risk sensitivity.',
 icon: Zap,
 questions: [
 { id: 'leverage', label: 'MAXIMAL LEVERAGE EXPOSURE', options: ['1x (Spot)', '3x - 5x', '10x - 20x', '50x+ (Hyper)'], weight: 3 },
 { id: 'drawdown', label: 'ADMITTED DRAWDOWN THRESHOLD', options: ['<2% Price movement', '5% Tactical', '15% Growth', '30%+ High Alpha'], weight: 3 }
 ]
 },
 {
 id: 'security',
 title: 'System Security',
 description: 'Activate biometric lockdown and emergency liquidation protocols.',
 icon: Lock,
 questions: [
 { id: 'mfa', label: 'SECURITY LOCKDOWN LEVEL', options: ['Standard MFA', 'Hardware Key (Yubikey)', 'Multi-Sig Approval', 'Air-Gapped Proxy'], weight: 2 },
 { id: 'killswitch', label: 'KILL-SWITCH ACTIVATION', options: ['Manual Only', '2% Equity Drop', '5% System Anomaly', 'Instant Logic Disconnect'], weight: 2 }
 ]
 }
];

 import { usersApi } from '@/lib/api/users';

 export default function RiskOnboardingPage() {
 const router = useRouter();
 const [currentStep, setCurrentStep] = useState(0);
 const [answers, setAnswers] = useState<Record<string, string>>({});
 const [isFinalizing, setIsFinalizing] = useState(false);

 const handleSelect = (questionId: string, option: string) => {
 setAnswers(prev => ({ ...prev, [questionId]: option }));
 };

 const handleNext = async () => {
 if (currentStep < STEPS.length - 1) {
 setCurrentStep(curr => curr + 1);
 } else {
 setIsFinalizing(true);
 try {
   let score = 50;
   // Extremely simple mock score calculation based on string length to simulate real analysis
   Object.values(answers).forEach((val) => {
     score += val.length; 
   });
   
   score = Math.min(score, 100);

   await usersApi.updateRiskProfile({
     riskProfileJson: answers,
     riskDnaScore: score
   });
   toast.success('Risk DNA synchronized', {
     description: 'Your profile has been applied. Redirecting to dashboard.',
   });
   router.push('/dashboard');
 } catch (error) {
   console.error('Failed to save risk DNA', error);
   toast.error('Risk profile sync failed', {
     description: 'Please retry in a few seconds.',
   });
   setIsFinalizing(false);
 }
 }
 };

 const step = STEPS[currentStep];
 const progress = ((currentStep + 1) / STEPS.length) * 100;

 return (
 <div className="min-h-screen bg-[#050508] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
 {/* Background Atmosphere */}
 <div className="absolute inset-0 pointer-events-none">
 <div className="absolute top-0 left-0 w-full h-[500px] bg-primary/5 blur-[150px] rounded-full" />
 <div className="absolute bottom-0 right-0 w-full h-[500px] bg-indigo-500/5 blur-[150px] rounded-full" />
 <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
 </div>

 <div className="max-w-xl w-full relative z-10">
 <AnimatePresence mode="wait">
 {!isFinalizing ? (
 <motion.div 
 key="form"
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, scale: 0.95 }}
 className="space-y-12"
 >
 {/* Header */}
 <div className="text-center space-y-4">
 <motion.div 
 layoutId="icon"
 className="w-20 h-20 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto shadow-[0_0_50px_rgba(99,102,241,0.2)]"
 >
 <step.icon className="w-10 h-10 text-primary animate-pulse" />
 </motion.div>
 <div className="space-y-2">
 <h1 className="text-4xl font-semibold uppercase tracking-tight">{step.title}</h1>
 <p className="text-white/40 font-medium text-lg leading-relaxed">{step.description}</p>
 </div>
 </div>

 {/* Progress Bar */}
 <div className="space-y-3">
 <div className="flex justify-between items-end text-xs font-semibold uppercase tracking-[0.4em] text-white/20">
 <span>System Registration</span>
 <span className="text-primary">{Math.round(progress)}% Complete</span>
 </div>
 <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
 <motion.div 
 initial={{ width: 0 }}
 animate={{ width: `${progress}%` }}
 className="h-full bg-primary shadow-[0_0_15px_rgba(99,102,241,0.5)]" 
 />
 </div>
 </div>

 {/* Questions */}
 <div className="space-y-10">
 {step.questions.map((q) => (
 <div key={q.id} className="space-y-6">
 <label className="text-sm font-semibold text-white/30 uppercase tracking-[0.3em] flex items-center gap-3">
 <Activity className="w-3 h-3 text-primary" />
 {q.label}
 </label>
 <div className="grid grid-cols-2 gap-4">
 {q.options.map((option) => (
 <button
 key={option}
 onClick={() => handleSelect(q.id, option)}
 className={cn(
"h-16 rounded-2xl border transition-all duration-500 font-semibold text-xs uppercase tracking-widest relative overflow-hidden",
 answers[q.id] === option 
 ?"bg-primary border-primary text-white shadow-[0_0_30px_rgba(99,102,241,0.3)]" 
 :"bg-white/5 border-white/5 text-white/40 hover:border-white/20 hover:text-white"
 )}
 >
 <span className={cn("relative z-10", answers[q.id] === option ?"scale-110" :"")}>{option}</span>
 {answers[q.id] === option && (
 <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-shimmer" />
 )}
 </button>
 ))}
 </div>
 </div>
 ))}
 </div>

 {/* Action */}
 <Button 
 onClick={handleNext}
 disabled={step.questions.some(q => !answers[q.id])}
 className="w-full h-16 bg-white text-black hover:bg-white/90 rounded-2xl font-semibold uppercase tracking-widest text-lg group shadow-2xl disabled:opacity-30 disabled:grayscale transition-all"
 >
 {currentStep === STEPS.length - 1 ? 'Compute Risk DNA' : 'Synchronize Next Section'}
 <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-2 transition-transform" />
 </Button>
 </motion.div>
 ) : (
 <motion.div 
 key="finalizing"
 initial={{ opacity: 0, scale: 0.95 }}
 animate={{ opacity: 1, scale: 1 }}
 className="text-center space-y-8"
 >
 <div className="relative">
 <div className="w-32 h-32 rounded-full border-4 border-white/5 mx-auto flex items-center justify-center relative border-t-primary animate-spin" />
 <div className="absolute inset-0 flex items-center justify-center">
 <Brain className="w-12 h-12 text-primary animate-pulse" />
 </div>
 </div>
 <div className="space-y-2">
 <h2 className="text-3xl font-semibold uppercase tracking-[0.2em]">Analyzing Profile DNA...</h2>
 <p className="text-white/30 text-lg font-medium leading-relaxed uppercase tracking-widest">Compiling institutional risk constraints and neural execution protocols.</p>
 </div>
 <div className="bg-white/5 border border-white/10 p-6 rounded-4xl space-y-4 max-w-sm mx-auto">
 <div className="flex items-center gap-3">
 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
 <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest">System Systems Engaged</span>
 </div>
 <div className="flex items-center gap-3">
 <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
 <span className="text-xs font-semibold text-primary uppercase tracking-widest">Hardware Keys Validated</span>
 </div>
 </div>
 </motion.div>
 )}
 </AnimatePresence>
 </div>

 {/* Footer Branding */}
 <div className="absolute bottom-10 flex items-center gap-10 opacity-20 text-xs font-semibold uppercase tracking-[0.5em]">
 <div className="flex items-center gap-3">
 <Cpu className="w-4 h-4" />
 Safety Alert V4
 </div>
 <div className="flex items-center gap-3">
 <ShieldCheck className="w-4 h-4" />
 End-to-End Encryption
 </div>
 </div>
 </div>
 );
}
