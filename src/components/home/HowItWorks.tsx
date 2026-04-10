'use client';

import { motion } from 'framer-motion';
import { Network, Database, BrainCircuit, Rocket } from 'lucide-react';
import { FadeUp, StaggerList, DrawPath } from '@/components/animations';

const steps = [
 {
 title: 'Connect Exchanges',
 description: 'Securely link your trading accounts using encrypted API keys with read-write permissions.',
 icon: Network,
 badge: 'Step 01',
 },
 {
 title: 'Initialize Risk DNA',
 description: 'Our AI analyzes your risk tolerance and capital structure to build your unique risk profile.',
 icon: BrainCircuit,
 badge: 'Step 02',
 },
 {
 title: 'Select or Build Strategies',
 description: 'Choose from institutional templates or build your own using our visual flow editor.',
 icon: Database,
 badge: 'Step 03',
 },
 {
 title: 'Execute & Automate',
 description: 'Go live in one click. Our systems handle execution, rebalancing, and risk monitoring 24/7.',
 icon: Rocket,
 badge: 'Step 04',
 },
];

export function HowItWorks() {
 return (
 <section id="how-it-works" className="py-32 bg-white/[0.01] relative">
 {/* Decorative Blur */}
 <div className="absolute top-1/2 left-0 w-96 h-96 bg-primary/10 blur-[120px] rounded-full -translate-x-1/2 pointer-events-none" />

 <div className="container mx-auto px-6">
 <div className="flex flex-col lg:flex-row gap-24 items-start">
 {/* Sticky Left Content */}
 <div className="lg:w-[40%] lg:sticky lg:top-32">
 <FadeUp>
 <h2 className="text-sm font-bold uppercase tracking-[0.4em] text-primary mb-6">
 Operational Alpha
 </h2>
 <h3 className="text-5xl md:text-7xl font-display font-bold mb-10 leading-tight">
 Your Path to <br />
 <span className="text-gradient">Automated Mastery.</span>
 </h3>
 <p className="text-muted-foreground text-xl mb-12 leading-relaxed">
 We&apos;ve distilled decades of quantitative research into four actionable segments. 
 Experience institutional power without the complexity.
 </p>
 
 <div className="p-8 rounded-[32px] bg-primary/5 border border-primary/10 relative overflow-hidden group">
 <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[40px] rounded-full group-hover:scale-150 transition-transform duration-1000" />
 <p className="text-lg text-primary font-bold leading-relaxed relative z-10">
 &quot;The most sophisticated trading architecture 
 I&apos;ve ever seen delivered to public investors.&quot;
 </p>
 <div className="flex items-center gap-4 mt-6 relative z-10">
 <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/20">
 <Rocket className="w-5 h-5 text-primary" />
 </div>
 <p className="text-sm text-muted-foreground font-bold uppercase tracking-widest">
 CHIEF ANALYST // ALPHA QUANT
 </p>
 </div>
 </div>
 </FadeUp>
 </div>

 {/* Steps Right Content */}
 <div className="lg:w-[60%] space-y-16 relative">
 {/* Connecting Line (Desktop) */}
 <div className="absolute left-10 top-16 bottom-16 w-px bg-gradient-to-b from-primary/60 via-primary/20 to-transparent hidden lg:block" />

 <StaggerList className="space-y-16">
 {steps.map((step, i) => (
 <motion.div
 key={step.title}
 variants={{
 hidden: { opacity: 0, x: 30 },
 show: { opacity: 1, x: 0 },
 }}
 className="flex gap-10 relative group"
 >
 {/* Icon Circle */}
 <div className="w-20 h-20 rounded-[28px] bg-background border border-white/5 flex items-center justify-center shrink-0 z-10 transition-all duration-700 group-hover:border-primary/50 group-hover:scale-110 group-hover:rotate-3 shadow-2xl relative overflow-hidden">
 <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
 <step.icon className="w-9 h-9 text-primary group-hover:scale-110 transition-transform relative z-10" />
 </div>
 
 <div className="flex-1 pt-2">
 <div className="flex items-center gap-4 mb-3">
 <span className="text-xs font-bold text-primary tracking-[0.3em] uppercase">
 {step.badge}
 </span>
 <div className="h-px w-8 bg-white/10 group-hover:w-16 transition-all duration-700 group-hover:bg-primary/50" />
 </div>
 <h4 className="text-3xl font-display font-bold mb-4 tracking-tight group-hover:text-primary transition-colors">
 {step.title}
 </h4>
 <p className="text-muted-foreground text-lg leading-relaxed max-w-xl group-hover:text-foreground/80 transition-colors">
 {step.description}
 </p>
 </div>
 </motion.div>
 ))}
 </StaggerList>
 </div>
 </div>
 </div>
 </section>
 );
}
