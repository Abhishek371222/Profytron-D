"use client";

import { motion } from "framer-motion";
import { Network, Database, BrainCircuit, Rocket, Activity, Key } from "lucide-react";
import { FadeUp, StaggerList, DrawPath } from "@/components/animations";

const steps = [
  {
    title: "Exchange Integration",
    description: "Link your primary liquidity venues via secure, zero-knowledge API connections. We never hold your assets.",
    icon: Database,
    badge: "Layer_01",
  },
  {
    title: "Neural Profiling",
    description: "Our core engine ingests your risk tolerance, capital constraints, and latency requirements to build a unique trading fingerprint.",
    icon: BrainCircuit,
    badge: "Layer_02",
  },
  {
    title: "Logic Assembly",
    description: "Compile algorithmic models using visual node graphs or deploy vetted institutional templates instantly.",
    icon: Network,
    badge: "Layer_03",
  },
  {
    title: "Live Execution",
    description: "Push to production. The engine continuously routes orders, rebalances, and monitors drawdowns in real-time.",
    icon: Rocket,
    badge: "Layer_04",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-32 bg-[#020202] relative border-t border-white/5 overflow-hidden">
      {/* Decorative Architecture */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-bl from-p/5 to-transparent blur-[120px] rounded-full pointer-events-none opacity-50" />
      <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10 w-full max-w-[1400px]">
        <div className="flex flex-col lg:flex-row gap-20 lg:gap-32 items-start">
          {/* Sticky Left Content */}
          <div className="lg:w-[45%] lg:sticky lg:top-40">
            <FadeUp>
              <div className="inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-white/70 text-[10px] font-bold uppercase tracking-[0.4em] mb-8 shadow-inner">
                <div className="w-2 h-2 rounded-full bg-p animate-ping absolute" />
                <div className="w-2 h-2 rounded-full bg-p relative" />
                <span>Operational_Alpha</span>
              </div>
              
              <h3 className="text-5xl md:text-7xl font-bold mb-8 leading-[1.1] tracking-[-0.02em] text-white">
                Your Path to <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-p to-indigo-300 drop-shadow-[0_0_20px_rgba(99,102,241,0.2)]">Automated Mastery.</span>
              </h3>
              
              <p className="text-white/40 text-xl md:text-2xl mb-12 leading-relaxed font-medium">
                We&apos;ve distilled decades of quantitative research into four actionable segments. Experience institutional deployment without the infrastructure overhead.
              </p>

              {/* Redesigned Testimonial / Highlight Box */}
              <div className="p-8 md:p-10 rounded-[32px] bg-white/[0.02] border border-white/5 backdrop-blur-xl relative overflow-hidden group hover:borderColor-white/10 transition-colors duration-500 shadow-2xl">
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-p/20 blur-[50px] rounded-full group-hover:scale-150 transition-transform duration-1000" />
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                
                <p className="text-xl text-white/90 font-medium leading-relaxed relative z-10 italic">
                  &quot;The most sophisticated execution architecture I&apos;ve seen delivered outside of a tier-1 firm.&quot;
                </p>
                <div className="flex items-center gap-5 mt-8 relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 shadow-inner">
                    <Rocket className="w-5 h-5 text-p" />
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm tracking-wide">Dr. Alex Volkov</p>
                    <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-1">HEAD OF QUANT // OMEGA DESK</p>
                  </div>
                </div>
              </div>
            </FadeUp>
          </div>

          {/* Steps Right Content */}
          <div className="lg:w-[55%] relative pt-10 lg:pt-0">
            {/* Animated Connecting Line (Desktop) */}
            <div className="absolute left-[39px] top-8 bottom-24 w-px bg-white/5 hidden lg:block">
              <motion.div 
                className="w-full bg-gradient-to-b from-transparent via-p to-transparent absolute top-0 left-0"
                style={{ height: '30%' }}
                animate={{ top: ['-30%', '100%'] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              />
            </div>

            <StaggerList className="space-y-8 md:space-y-12">
              {steps.map((step, i) => (
                <motion.div
                  key={step.title}
                  variants={{
                    hidden: { opacity: 0, x: 40 },
                    show: { opacity: 1, x: 0 },
                  }}
                  className="flex flex-col md:flex-row gap-6 md:gap-12 relative group cursor-default"
                >
                  {/* Icon Circle */}
                  <div className="w-20 h-20 rounded-2xl bg-[#0c0c0c] border border-white/5 flex items-center justify-center shrink-0 z-10 transition-all duration-500 group-hover:border-p/40 group-hover:bg-[#111] group-hover:scale-105 shadow-xl relative overflow-hidden group-hover:shadow-[0_0_30px_rgba(99,102,241,0.15)]">
                    <div className="absolute inset-0 bg-gradient-to-br from-p/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <step.icon className="w-8 h-8 text-white/50 group-hover:text-p transition-colors relative z-10" />
                  </div>

                  <div className="flex-1 pt-1">
                    <div className="flex items-center gap-4 mb-4">
                      <span className="text-[10px] font-mono text-p tracking-[0.3em] uppercase bg-p/10 px-3 py-1 rounded-full border border-p/20">
                        {step.badge}
                      </span>
                      <div className="h-px w-12 bg-white/10 group-hover:w-24 transition-all duration-700 group-hover:bg-p/50" />
                    </div>
                    <h4 className="text-3xl font-bold mb-4 tracking-tight text-white/90 group-hover:text-white transition-colors">
                      {step.title}
                    </h4>
                    <p className="text-white/40 text-[17px] leading-relaxed max-w-lg group-hover:text-white/60 transition-colors duration-500 font-medium">
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
