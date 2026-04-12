'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Zap, Shield, Crown, Info, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { FadeUp, StaggerList } from '@/components/animations';

const plans = [
 {
 name: 'Starter',
 price: { monthly: '$49', yearly: '$39' },
 description: 'Perfect for individual traders starting their automation journey.',
 features: [
 '3 Active Strategies',
 'Basic Performance Analytics',
 'Daily Backtesting Reports',
 'Email Support',
 'Standard Execution Speed',
 ],
 icon: Zap,
 color: 'text-zinc-400',
 bg: 'bg-zinc-400/5',
 button: 'Start for Free',
 recommended: false,
 },
 {
 name: 'Professional',
 price: { monthly: '$149', yearly: '$119' },
 description: 'Advanced tools for serious traders and small portfolios.',
 features: [
 'Unlimited Active Strategies',
 'Real-time Advanced Analytics',
 'Priority Execution Path',
 'Visual Strategy Builder',
 '24/7 Priority Support',
 'Advanced Risk Guard',
 ],
 icon: Crown,
 color: 'text-primary',
 bg: 'bg-primary/10',
 button: 'Get Professional',
 recommended: true,
 },
 {
 name: 'Institutional',
 price: { monthly: 'Custom', yearly: 'Custom' },
 description: 'Enterprise-grade infrastructure for funds and desks.',
 features: [
 'Sub-millisecond Execution',
 'Custom Strategy Development',
 'Dedicated Account Manager',
 'Whitelabel Dashboard',
 'API Direct Access',
 'On-premise Options',
 ],
 icon: Shield,
 color: 'text-emerald-400',
 bg: 'bg-emerald-400/5',
 button: 'Contact Sales',
 recommended: false,
 },
];

export function PricingSection() {
 const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

 return (
 <section id="pricing" className="py-40 relative overflow-hidden bg-black">
 {/* Dynamic Background Architecture */}
 <div className="absolute inset-0 z-0 pointer-events-none opacity-20">
 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-indigo-500/10 rounded-full blur-[200px]" />
 <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay opacity-30" />
 </div>

 <div className="container mx-auto px-6 relative z-10">
 <div className="text-center mb-32">
 <FadeUp>
 <div className="inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-p/10 border border-p/20 text-p text-xs font-semibold uppercase tracking-[0.5em] mb-8">
 <Shield className="w-4 h-4" />
 Access_Protocol_Synchronized
 </div>
 <h2 className="text-6xl md:text-8xl font-semibold mb-10 leading-tight tracking-tight uppercase">
 Transparent <span className="text-white/10 outline-text">Tiers,</span> <br />
 <span className="text-p drop-shadow-[0_0_20px_#6366f1]">Engineered for Scale.</span>
 </h2>
 
 {/* Industrial Toggle */}
 <div className="flex items-center justify-center gap-4 mt-12 bg-white/[0.03] border border-white/5 p-1.5 rounded-[22px] w-fit mx-auto backdrop-blur-3xl shadow-2xl relative overflow-hidden group">
 <div className="absolute inset-0 bg-scanlines opacity-5" />
 <button
 onClick={() => setBillingCycle('monthly')}
 className={cn(
"px-8 py-3 rounded-2xl text-sm font-semibold uppercase tracking-[0.2em] transition-all duration-500 relative z-10",
 billingCycle === 'monthly' ?"bg-p text-white shadow-[0_0_30px_rgba(99,102,241,0.4)]" :"text-white/40 hover:text-white/60"
 )}
 >
 Pulse_Monthly
 </button>
 <button
 onClick={() => setBillingCycle('yearly')}
 className={cn(
"px-8 py-3 rounded-2xl text-sm font-semibold uppercase tracking-[0.2em] transition-all duration-500 relative z-10",
 billingCycle === 'yearly' ?"bg-p text-white shadow-[0_0_30px_rgba(99,102,241,0.4)]" :"text-white/40 hover:text-white/60"
 )}
 >
 Epoch_Yearly
 <span className="absolute -top-4 -right-1 px-2 py-0.5 bg-emerald-500 text-xs text-white rounded-md font-semibold shadow-lg animate-pulse">
 SAVE_20%
 </span>
 </button>
 </div>
 </FadeUp>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
 {plans.map((plan) => (
 <motion.div 
 key={plan.name}
 whileHover={{ y: -10, scale: 1.02 }}
 transition={{ type:"spring", stiffness: 300, damping: 20 }}
 className="h-full"
 >
 <motion.div
 className={cn(
 'relative p-12 rounded-[52px] border transition-all duration-700 group flex flex-col h-[750px] overflow-hidden',
 plan.recommended 
 ? 'bg-white/[0.04] border-p shadow-[0_0_100px_rgba(99,102,241,0.15)] ring-1 ring-p/30' 
 : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04]'
 )}
 >
 {/* Digital Signature Overlay */}
 <div className="absolute top-0 right-0 p-8 flex flex-col items-end gap-1 opacity-20 select-none">
 <span className="text-xs font-jet-mono text-white/40 uppercase tracking-widest">{plan.name}_ACCESS_NODE</span>
 <div className="h-px w-24 bg-gradient-to-l from-white/40 to-transparent" />
 </div>

 {plan.recommended && (
 <div className="absolute top-0 left-12 px-5 py-2 bg-p text-white text-xs font-semibold uppercase tracking-[0.3em] rounded-b-xl shadow-2xl">
 Recommended_Unit
 </div>
 )}

 <div className="mb-12 relative z-10 pt-4">
 <div className={cn('w-20 h-20 rounded-[28px] flex items-center justify-center mb-10 border border-white/10 shadow-2xl transition-transform group-hover:scale-110 group-hover:rotate-3 p-5', plan.bg)}>
 <plan.icon className={cn('w-10 h-10', plan.color)} />
 </div>
 <h4 className="text-4xl font-semibold mb-4 tracking-tight uppercase">{plan.name}</h4>
 <div className="flex items-baseline gap-2 mb-8">
 <span className="text-6xl font-semibold tracking-tight text-white">
 {billingCycle === 'monthly' ? plan.price.monthly : plan.price.yearly}
 </span>
 {plan.price.monthly !== 'Custom' && (
 <span className="text-white/20 text-xs font-semibold uppercase tracking-[0.2em]">/ PULSE</span>
 )}
 </div>
 <p className="text-white/40 text-lg leading-relaxed font-medium tracking-tight">
 {plan.description}
 </p>
 </div>

 <div className="space-y-4 mb-12 flex-grow relative z-10">
 {plan.features.map((feature) => (
 <div key={feature} className="flex items-center gap-4 group/item">
 <div className="w-5 h-5 rounded-lg bg-white/5 flex items-center justify-center shrink-0 border border-white/10 group-hover/item:border-p/50 transition-colors">
 <Check className="w-3 h-3 text-p" />
 </div>
 <span className="text-sm text-white/50 group-hover/item:text-white transition-colors font-medium tracking-tight">{feature}</span>
 </div>
 ))}
 </div>

 <div className="mt-auto relative z-10">
 <Button 
 className={cn(
 'w-full h-20 rounded-[28px] font-semibold text-sm uppercase tracking-[0.3em] group transition-all duration-700 relative overflow-hidden shadow-2xl',
 plan.recommended
 ? 'bg-p hover:bg-indigo-500 text-white shadow-p/20 hover:shadow-p/40'
 : 'bg-white/5 hover:bg-white/10 text-white border border-white/5'
 )}
 >
 <span className="relative z-10 flex items-center gap-3">
 {plan.button}
 {plan.recommended && <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />}
 </span>
 <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
 </Button>
 
 {plan.name === 'Starter' && (
 <div className="flex items-center justify-center gap-2 mt-6">
 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
 <p className="text-xs text-white/20 uppercase tracking-[0.15em] font-semibold">
 Instant_Node_Activation
 </p>
 </div>
 )}
 </div>
 
 {/* Holographic background depth */}
 <div className="absolute inset-0 bg-scanlines opacity-5 pointer-events-none" />
 </motion.div>
 </motion.div>
 ))}
 </div>
 
 <motion.div 
 initial={{ opacity: 0, y: 40 }}
 whileInView={{ opacity: 1, y: 0 }}
 transition={{ duration: 1 }}
 className="mt-32 p-16 rounded-[60px] bg-gradient-to-br from-white/[0.03] to-transparent border border-white/5 flex flex-col lg:flex-row items-center justify-between gap-16 relative overflow-hidden group"
 >
 <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-p/10 blur-[150px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
 
 <div className="flex flex-col md:flex-row items-center gap-12 relative z-10">
 <div className="w-24 h-24 rounded-[32px] bg-white/5 border border-white/10 flex items-center justify-center p-6 shadow-2xl group-hover:scale-110 group-hover:rotate-6 transition-transform">
 <Crown className="w-full h-full text-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
 </div>
 <div className="text-center md:text-left">
 <h5 className="text-4xl font-semibold mb-4 tracking-tight uppercase">Institutional Forge</h5>
 <p className="text-white/40 text-xl max-w-xl leading-relaxed font-medium tracking-tight">
 Craft bespoke infrastructure for funds managing &gt;$50MM AUM. 
 Dedicated neural clusters and on-premise deployment options.
 </p>
 </div>
 </div>
 
 <Button variant="ghost" className="h-20 px-12 border-2 border-white/5 bg-white/[0.02] hover:bg-p hover:text-white rounded-[28px] font-semibold text-sm uppercase tracking-[0.4em] transition-all duration-500 z-10 shadow-2xl">
 Request_Deployment
 </Button>
 
 <div className="absolute inset-0 bg-scanlines opacity-5 pointer-events-none" />
 </motion.div>
 </div>
 </section>
 );
}
