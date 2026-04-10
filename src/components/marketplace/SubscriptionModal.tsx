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
            className="relative w-full max-w-3xl glass-strong border border-white/10 rounded-[40px] shadow-[0_40px_100px_rgba(0,0,0,0.8)] overflow-hidden"
          >
            {/* Header / Stepper */}
            <div className="px-10 py-8 border-b border-white/[0.05] flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                    {[1, 2, 3].map((s) => (
                        <div 
                            key={s}
                            className={cn(
                                "w-2 h-2 rounded-full transition-all duration-500",
                                step >= s ? "bg-p w-6 shadow-[0_0_10px_#6366f1]" : "bg-white/10"
                            )}
                        />
                    ))}
                </div>
                <div className="flex flex-col">
                    <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Step {step} of 3</span>
                    <span className="text-xs font-bold text-white uppercase tracking-widest">
                        {step === 1 ? 'Select Subscription' : step === 2 ? 'Checkout Securely' : 'Success'}
                    </span>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5 text-white/40" />
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
                     <div className="w-14 h-14 rounded-2xl bg-p/10 border border-p/20 flex items-center justify-center">
                        <Zap className="w-6 h-6 text-p" />
                     </div>
                     <div>
                        <h2 className="text-2xl font-bold text-white font-syne tracking-tight">{strategy.name}</h2>
                        <p className="text-sm text-white/40">Choose your preferred tier to activate this strategy.</p>
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
                            ? "bg-p/10 border-p shadow-2xl shadow-p/20" 
                            : "bg-white/5 border-white/5 hover:border-white/20"
                        )}
                      >
                        {plan.badge && (
                            <div className="absolute -top-3 left-6 px-3 py-1 rounded-full bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest">
                                {plan.badge}
                            </div>
                        )}
                        <span className={cn(
                          "text-[10px] font-black uppercase tracking-widest",
                          selectedPlan === plan.id ? "text-p" : "text-white/20"
                        )}>
                          {plan.name}
                        </span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-bold text-white font-jet-mono">{plan.price}</span>
                          <span className="text-[10px] font-bold text-white/20">{plan.period}</span>
                        </div>
                        <p className="text-[10px] text-white/40 font-medium">{plan.desc}</p>
                      </button>
                    ))}
                  </div>

                  <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/[0.05] space-y-4">
                     <h4 className="text-[10px] font-black text-white/40 uppercase tracking-widest">Included Premium Features</h4>
                     <div className="grid grid-cols-2 gap-y-3 gap-x-6">
                        {['Auto-Execution Enabled', 'Risk Shielding', '1ms Latency Proxy', '24/7 Monitoring'].map((f) => (
                           <div key={f} className="flex items-center gap-3">
                              <div className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                                 <Check className="w-3 h-3 text-emerald-400" />
                              </div>
                              <span className="text-[11px] font-bold text-white/60">{f}</span>
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
                    <h3 className="text-xl font-bold text-white font-syne">Secure Checkout</h3>
                    <p className="text-sm text-white/40 font-dm-sans">Your transaction is encrypted and secured by Profytron Guard.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="space-y-6">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-white/30 uppercase tracking-widest">Selected Plan</label>
                           <div className="p-4 rounded-2xl glass-strong border border-p/30 flex items-center justify-between">
                              <span className="text-sm font-bold text-white">{selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)}</span>
                              <span className="text-sm font-bold text-p font-mono">{PLANS.find(p => p.id === selectedPlan)?.price}</span>
                           </div>
                        </div>

                        <div className="space-y-4">
                           <label className="text-[10px] font-black text-white/30 uppercase tracking-widest">Payment Method</label>
                           <div className="flex gap-3">
                              <button className="flex-1 p-4 rounded-2xl bg-white text-bg-base flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-widest">
                                 <CreditCard className="w-4 h-4" /> Card
                              </button>
                              <button className="flex-1 p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-colors">
                                 <Landmark className="w-4 h-4" /> UPI
                              </button>
                           </div>
                        </div>
                     </div>

                     <div className="p-6 rounded-3xl bg-black/40 border border-white/[0.05] space-y-6">
                        <h4 className="text-[10px] font-black text-white/30 uppercase tracking-widest">Order Summary</h4>
                        <div className="space-y-3">
                           <div className="flex justify-between text-xs">
                              <span className="text-white/40">Subtotal</span>
                              <span className="text-white font-mono">{PLANS.find(p => p.id === selectedPlan)?.price}</span>
                           </div>
                           <div className="flex justify-between text-xs">
                              <span className="text-white/40">Transaction Fee (0%)</span>
                              <span className="text-emerald-400 font-mono">₹0</span>
                           </div>
                           <div className="h-px bg-white/5 my-2" />
                           <div className="flex justify-between">
                              <span className="text-[10px] font-black text-white uppercase tracking-widest">Total Amount</span>
                              <span className="text-lg font-bold text-white font-jet-mono">{PLANS.find(p => p.id === selectedPlan)?.price}</span>
                           </div>
                        </div>
                        <div className="flex items-center gap-3 text-[9px] text-white/20 font-bold uppercase tracking-widest bg-white/[0.02] p-3 rounded-xl border border-white/[0.03]">
                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
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
                  <div className="w-24 h-24 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center relative">
                     <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1.5, opacity: 0 }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="absolute inset-0 rounded-full border border-emerald-500/50"
                     />
                     <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-3xl font-bold text-white font-syne">Subscription Active!</h2>
                    <p className="text-white/40 max-w-sm">Welcome to the elite tier. {strategy.name} is now available in your personal library.</p>
                  </div>
                  <div className="flex items-center gap-4 bg-p/10 border border-p/20 px-6 py-3 rounded-2xl">
                     <span className="text-[10px] font-black text-p uppercase tracking-widest">Next Billing Date: May 09, 2026</span>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="px-10 py-8 bg-black/40 border-t border-white/[0.05] flex items-center justify-between">
                {step < 3 ? (
                    <>
                        <button 
                            onClick={step === 1 ? onClose : () => setStep(step - 1)}
                            className="text-[10px] font-black text-white/30 hover:text-white uppercase tracking-[0.2em] transition-colors"
                        >
                            {step === 1 ? 'Cancel' : 'Back'}
                        </button>
                        <Button 
                            onClick={() => setStep(step + 1)}
                            className="h-12 px-10 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-indigo-600/20 active:scale-95 transition-all"
                        >
                            {step === 1 ? 'Continue to Checkout' : 'Complete Purchase'} <ArrowRight className="w-4 h-4 ml-4" />
                        </Button>
                    </>
                ) : (
                    <Button 
                        onClick={onClose}
                        className="w-full h-12 rounded-2xl bg-white text-bg-base font-black text-[10px] uppercase tracking-[0.2em] transition-all"
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
