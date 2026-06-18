'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, CreditCard, Landmark, CheckCircle2, ShieldCheck, Zap, ArrowRight, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface SubscriptionModalProps {
 strategy: any;
 isOpen: boolean;
 onClose: () => void;
}

const PLANS = [
 { id: 'monthly', name: 'Monthly', price: '₹2,499', period: '/ mo', desc: 'Full access, cancel anytime' },
 { id: 'annual', name: 'Annual', price: '₹1,999', period: '/ mo', desc: 'Billed ₹23,988 yearly', badge: 'Save 20%' },
 { id: 'lifetime', name: 'Lifetime', price: '₹14,999', period: ' once', desc: 'One-time investment', badge: 'Best Value' },
];

export function SubscriptionModal({ strategy, isOpen, onClose }: SubscriptionModalProps) {
 const [step, setStep] = React.useState(1);
 const [selectedPlan, setSelectedPlan] = React.useState('annual');

 if (!strategy) return null;

 return (
 <AnimatePresence>
 {isOpen && (
 <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
 <motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 onClick={onClose}
 className="absolute inset-0 bg-black/80 backdrop-blur-md"
 />

 <motion.div
 initial={{ opacity: 0, scale: 0.9, y: 20 }}
 animate={{ opacity: 1, scale: 1, y: 0 }}
 exit={{ opacity: 0, scale: 0.9, y: 20 }}
 className="relative w-full max-w-3xl glass-strong border border-border rounded-[40px] shadow-[0_40px_100px_rgba(0,0,0,0.8)] overflow-hidden"
 >
 {/* Header / Stepper */}
 <div className="px-10 py-8 border-b border-border flex items-center justify-between">
 <div className="flex items-center gap-6">
 <div className="flex items-center gap-2">
 {[1, 2, 3].map((s) => (
 <div 
 key={s}
 className={cn(
"w-2 h-2 rounded-full transition-all duration-500",
 step >= s ?"bg-primary w-6 shadow-[0_0_10px_#1e6d48]" :"bg-foreground/10"
 )}
 />
 ))}
 </div>
 <div className="flex flex-col">
 <span className="text-xs font-semibold text-foreground/20 uppercase tracking-[0.2em]">Step {step} of 3</span>
 <span className="text-xs font-bold text-foreground uppercase tracking-widest">
 {step === 1 ? 'Select Subscription' : step === 2 ? 'Checkout Securely' : 'Success'}
 </span>
 </div>
 </div>
 <button 
 onClick={onClose}
 className="w-10 h-10 rounded-full bg-foreground/5 border border-border flex items-center justify-center hover:bg-foreground/10 transition-colors"
 >
 <X className="w-5 h-5 text-foreground/40" />
 </button>
 </div>

 <div className="px-10 py-10 max-h-[70vh] overflow-y-auto no-scrollbar">
 {step === 1 && (
 <motion.div 
 initial={{ opacity: 0, x: 20 }}
 animate={{ opacity: 1, x: 0 }}
 className="space-y-10"
 >
 <div className="flex items-center gap-4">
 <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
 <Zap className="w-6 h-6 text-primary" />
 </div>
 <div>
 <h2 className="text-2xl font-bold text-foreground tracking-tight">{strategy.name}</h2>
 <p className="text-sm text-foreground/40">Choose your preferred tier to activate this strategy.</p>
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 {PLANS.map((plan) => (
 <button
 key={plan.id}
 onClick={() => setSelectedPlan(plan.id)}
 className={cn(
"relative p-6 rounded-3xl border transition-all duration-500 flex flex-col gap-3 text-left",
 selectedPlan === plan.id 
 ?"bg-primary/10 border-primary shadow-2xl shadow-p/20" 
 :"bg-foreground/5 border-border hover:border-border"
 )}
 >
 {plan.badge && (
 <div className="absolute -top-3 left-6 px-3 py-1 rounded-full bg-chart-3 text-foreground text-xs font-semibold uppercase tracking-widest">
 {plan.badge}
 </div>
 )}
 <span className={cn(
"text-xs font-semibold uppercase tracking-widest",
 selectedPlan === plan.id ?"text-primary" :"text-foreground/20"
 )}>
 {plan.name}
 </span>
 <div className="flex items-baseline gap-1">
 <span className="text-2xl font-bold text-foreground font-jet-mono">{plan.price}</span>
 <span className="text-xs font-bold text-foreground/20">{plan.period}</span>
 </div>
 <p className="text-xs text-foreground/40 font-medium">{plan.desc}</p>
 </button>
 ))}
 </div>

 <div className="p-6 rounded-3xl bg-foreground/2 border border-border space-y-4">
 <h4 className="text-xs font-semibold text-foreground/40 uppercase tracking-widest">Included Premium Features</h4>
 <div className="grid grid-cols-2 gap-y-3 gap-x-6">
 {['Auto-Execution Enabled', 'Safety Alerting', '1ms Speed Proxy', '24/7 Monitoring'].map((f) => (
 <div key={f} className="flex items-center gap-3">
 <div className="w-5 h-5 rounded-full bg-chart-3/10 border border-chart-3/20 flex items-center justify-center">
 <Check className="w-3 h-3 text-chart-3" />
 </div>
 <span className="text-sm font-bold text-foreground/60">{f}</span>
 </div>
 ))}
 </div>
 </div>
 </motion.div>
 )}

 {step === 2 && (
 <motion.div 
 initial={{ opacity: 0, x: 20 }}
 animate={{ opacity: 1, x: 0 }}
 className="space-y-8"
 >
 <div className="flex flex-col gap-1">
 <h3 className="text-xl font-bold text-foreground">Secure Checkout</h3>
 <p className="text-sm text-foreground/40 font-dm-sans">Your transaction is encrypted and secured by Profytron Guard.</p>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
 <div className="space-y-6">
 <div className="space-y-2">
 <label className="text-xs font-semibold text-foreground/30 uppercase tracking-widest">Selected Plan</label>
 <div className="p-4 rounded-2xl glass-strong border border-primary/30 flex items-center justify-between">
 <span className="text-sm font-bold text-foreground">{selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)}</span>
 <span className="text-sm font-bold text-primary font-mono">{PLANS.find(p => p.id === selectedPlan)?.price}</span>
 </div>
 </div>

 <div className="space-y-4">
 <label className="text-xs font-semibold text-foreground/30 uppercase tracking-widest">Payment Method</label>
 <div className="flex gap-3">
 <button className="flex-1 p-4 rounded-2xl bg-white text-bg-base flex items-center justify-center gap-3 font-semibold text-xs uppercase tracking-widest">
 <CreditCard className="w-4 h-4" /> Card
 </button>
 <button className="flex-1 p-4 rounded-2xl bg-foreground/5 border border-border flex items-center justify-center gap-3 font-semibold text-xs uppercase tracking-widest hover:bg-foreground/10 transition-colors">
 <Landmark className="w-4 h-4" /> UPI
 </button>
 </div>
 </div>
 </div>

 <div className="p-6 rounded-3xl bg-black/40 border border-border space-y-6">
 <h4 className="text-xs font-semibold text-foreground/30 uppercase tracking-widest">Order Summary</h4>
 <div className="space-y-3">
 <div className="flex justify-between text-xs">
 <span className="text-foreground/40">Subtotal</span>
 <span className="text-foreground font-mono">{PLANS.find(p => p.id === selectedPlan)?.price}</span>
 </div>
 <div className="flex justify-between text-xs">
 <span className="text-foreground/40">Transaction Fee (0%)</span>
 <span className="text-chart-3 font-mono">₹0</span>
 </div>
 <div className="h-px bg-foreground/5 my-2" />
 <div className="flex justify-between">
 <span className="text-xs font-semibold text-foreground uppercase tracking-widest">Total Amount</span>
 <span className="text-lg font-bold text-foreground font-jet-mono">{PLANS.find(p => p.id === selectedPlan)?.price}</span>
 </div>
 </div>
 <div className="flex items-center gap-3 text-xs text-foreground/20 font-bold uppercase tracking-widest bg-foreground/2 p-3 rounded-xl border border-border">
 <ShieldCheck className="w-4 h-4 text-chart-3" />
 Secure Stripe Integration
 </div>
 </div>
 </div>
 </motion.div>
 )}

 {step === 3 && (
 <motion.div 
 initial={{ opacity: 0, scale: 0.8 }}
 animate={{ opacity: 1, scale: 1 }}
 className="flex flex-col items-center justify-center py-10 space-y-6 text-center"
 >
 <div className="w-24 h-24 rounded-full bg-chart-3/20 border border-chart-3/30 flex items-center justify-center relative">
 <motion.div 
 initial={{ scale: 0 }}
 animate={{ scale: 1.5, opacity: 0 }}
 transition={{ repeat: Infinity, duration: 2 }}
 className="absolute inset-0 rounded-full border border-chart-3/50"
 />
 <CheckCircle2 className="w-12 h-12 text-chart-3" />
 </div>
 <div className="space-y-2">
 <h2 className="text-3xl font-bold text-foreground">Subscription Active!</h2>
 <p className="text-foreground/40 max-w-sm">Welcome to the elite tier. {strategy.name} is now available in your personal library.</p>
 </div>
 <div className="flex items-center gap-4 bg-primary/10 border border-primary/20 px-6 py-3 rounded-2xl">
 <span className="text-xs font-semibold text-primary uppercase tracking-widest">Next Billing Date: May 09, 2026</span>
 </div>
 </motion.div>
 )}
 </div>

 {/* Footer Actions */}
 <div className="px-10 py-8 bg-black/40 border-t border-border flex items-center justify-between">
 {step < 3 ? (
 <>
 <button 
 onClick={step === 1 ? onClose : () => setStep(step - 1)}
 className="text-xs font-semibold text-foreground/30 hover:text-foreground uppercase tracking-[0.2em] transition-colors"
 >
 {step === 1 ? 'Cancel' : 'Back'}
 </button>
 <Button 
 onClick={() => setStep(step + 1)}
 className="h-12 px-10 rounded-2xl bg-primary hover:bg-primary text-foreground font-semibold text-xs uppercase tracking-[0.2em] shadow-2xl shadow-primary/20 active:scale-95 transition-all"
 >
 {step === 1 ? 'Continue to Checkout' : 'Complete Purchase'} <ArrowRight className="w-4 h-4 ml-4" />
 </Button>
 </>
 ) : (
 <Button 
 onClick={onClose}
 className="w-full h-12 rounded-2xl bg-white text-bg-base font-semibold text-xs uppercase tracking-[0.2em] transition-all"
 >
 Go to Strategy Library
 </Button>
 )}
 </div>
 </motion.div>
 </div>
 )}
 </AnimatePresence>
 );
}
