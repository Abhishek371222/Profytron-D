"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Check,
  Zap,
  Shield,
  Cpu,
  ArrowRight,
  Activity,
  Code2,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FadeUp } from "@/components/animations";

const plans = [
  {
    name: "Developer Node",
    price: { monthly: "$49", yearly: "$39" },
    description:
      "Sandbox environment for engineers backtesting automated logic.",
    features: [
      "3 Concurrent Worker Processes",
      "Standard Market Data Feed",
      "10GB Historical Trade Data",
      "Community Forum Support",
    ],
    icon: Code2,
    color: "text-zinc-500",
    button: "Initialize Node",
    recommended: false,
    capacity: 20,
  },
  {
    name: "Alpha Desk",
    price: { monthly: "$149", yearly: "$119" },
    description:
      "Production-grade execution path for active proprietary traders.",
    features: [
      "Unlimited Worker Processes",
      "Premium Low-Latency Routing",
      "Visual Strategy Builder IDE",
      "Risk Sentinel Enforcer",
      "24/7 Priority Engineering Chat",
    ],
    icon: Activity,
    color: "text-p",
    button: "Deploy Architecture",
    recommended: true,
    capacity: 80,
  },
  {
    name: "Institution",
    price: { monthly: "Custom", yearly: "Custom" },
    description:
      "Colocated bare metal for maximum throughput and zero latency.",
    features: [
      "NY4/LD4 Hardware Colocation",
      "FIX/WebSocket Direct TCP",
      "Dedicated Solutions Architect",
      "Whitelabel Client Dashboard",
      "On-Premise Deployment Options",
    ],
    icon: Cpu,
    color: "text-indigo-400",
    button: "Contact Engineering",
    recommended: false,
    capacity: 100,
  },
];

export function PricingSection() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    "yearly",
  );

  return (
    <section
      id="pricing"
      className="py-32 relative overflow-hidden bg-black selection:bg-p/30"
    >
      {/* Dynamic Background Architecture */}
      <div className="absolute inset-0 z-0 pointer-events-none flex justify-center">
        {/* Glow at top */}
        <div className="absolute top-[-20%] w-250 h-[500px] bg-p/20 blur-[120px] rounded-[100%] opacity-50" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      <div className="container mx-auto px-6 relative z-10 max-w-[1200px]">
        <div className="text-center mb-24">
          <FadeUp>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/3 border border-white/8 text-white/60 text-[11px] font-medium tracking-widest uppercase mb-6 backdrop-blur-md">
              <DollarSign className="w-3 h-3 text-p" />
              Deployment_Tiers
            </div>
            <h2 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight text-white m-0">
              Pricing that{" "}
              <span className="text-transparent bg-clip-text bg-linear-to-r from-white to-white/60">
                Scales.
              </span>
            </h2>
            <p className="text-lg text-white/40 max-w-2xl mx-auto font-medium mb-12">
              From sandbox backtesting to sub-millisecond execution. Start
              building with zero friction, then deploy directly to colocated
              hardware.
            </p>

            {/* Premium Vercel-style Toggle */}
            <div className="flex items-center justify-center p-1 bg-white/3 border border-white/8 rounded-full w-fit mx-auto backdrop-blur-md relative font-medium">
              <button
                onClick={() => setBillingCycle("monthly")}
                className={cn(
                  "px-8 py-2.5 rounded-full text-sm transition-all duration-300 z-10 w-32",
                  billingCycle === "monthly"
                    ? "bg-white/10 text-white shadow-sm"
                    : "text-white/40 hover:text-white/70",
                )}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle("yearly")}
                className={cn(
                  "px-8 py-2.5 rounded-full text-sm transition-all duration-300 z-10 w-32",
                  billingCycle === "yearly"
                    ? "bg-white/10 text-white shadow-sm"
                    : "text-white/40 hover:text-white/70",
                )}
              >
                Annually
              </button>
            </div>
          </FadeUp>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              viewport={{ once: true }}
              className="relative group h-full flex"
            >
              <div
                className={cn(
                  "relative p-8 rounded-3xl transition-all duration-500 flex flex-col w-full overflow-hidden backdrop-blur-sm",
                  plan.recommended
                    ? "bg-white/2 border border-p/30"
                    : "bg-white/1 border border-white/5",
                )}
              >
                {/* Spotlight Background for Recommended */}
                {plan.recommended && (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-b from-p/10 to-transparent opacity-50" />
                    <div className="absolute -top-px left-1/4 right-1/4 h-px bg-linear-to-r from-transparent via-p to-transparent" />
                  </>
                )}

                <div className="mb-8 relative z-10">
                  <div className="flex justify-between items-center mb-6">
                    <plan.icon className={cn("w-6 h-6", plan.color)} />
                    {plan.recommended && (
                      <span className="px-2.5 py-1 bg-p/20 text-p rounded-md text-[10px] font-bold uppercase tracking-widest shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                        Production
                      </span>
                    )}
                  </div>

                  <h4 className="text-xl font-bold text-white mb-2 tracking-tight">
                    {plan.name}
                  </h4>
                  <p className="text-white/40 text-sm leading-relaxed max-w-[90%] min-h-[40px]">
                    {plan.description}
                  </p>

                  <div className="mt-8 mb-2 flex items-end gap-1">
                    <span className="text-5xl font-bold tracking-tight text-white leading-none">
                      {billingCycle === "monthly"
                        ? plan.price.monthly
                        : plan.price.yearly}
                    </span>
                    {plan.price.monthly !== "Custom" && (
                      <span className="text-white/40 text-base font-medium mb-1">
                        /mo
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-white/30 font-medium h-4">
                    {plan.price.monthly !== "Custom" &&
                      billingCycle === "yearly" &&
                      "Billed annually"}
                  </div>
                </div>

                <div className="h-px w-full bg-white/5 my-2 relative z-10" />

                <div className="space-y-4 py-8 flex-grow relative z-10">
                  {plan.features.map((feature) => (
                    <div
                      key={feature}
                      className="flex items-start gap-3 group/item"
                    >
                      <Check
                        className={cn(
                          "w-4 h-4 shrink-0 mt-0.5",
                          plan.recommended
                            ? "text-p"
                            : "text-white/20 group-hover/item:text-white/40",
                        )}
                      />
                      <span className="text-sm text-white/60 group-hover/item:text-white/90 transition-colors">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-auto pt-6 relative z-10 w-full">
                  <Button
                    className={cn(
                      "w-full h-12 rounded-xl font-semibold text-sm transition-all duration-300",
                      plan.recommended
                        ? "bg-white text-black hover:bg-gray-100 hover:scale-[1.02] shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                        : "bg-white/5 hover:bg-white/10 text-white border border-white/5",
                    )}
                  >
                    {plan.button}
                    {plan.recommended && (
                      <ArrowRight className="w-4 h-4 ml-2" />
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="mt-16 w-full rounded-2xl bg-white/2 border border-white/8 p-8 md:p-12 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 backdrop-blur-sm group hover:border-white/15 transition-colors"
        >
          {/* Hardware grid background inside the block */}
          <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-20 pointer-events-none" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_20%,transparent_100%)] opacity-[0.02]" />

          <div className="relative z-10 text-center md:text-left max-w-2xl">
            <h5 className="text-2xl font-bold text-white mb-3 tracking-tight">
              Need Dedicated Infrastructure?
            </h5>
            <p className="text-white/50 text-base leading-relaxed">
              For funds running high-frequency algorithms, we offer dedicated
              bare-metal clusters cross-connected directly to primary exchanges.
              Sub-10 microsecond tick-to-trade latency guaranteed.
            </p>
          </div>

          <Button
            variant="outline"
            className="relative z-10 h-12 px-8 rounded-full border-white/10 bg-black/50 text-white hover:bg-white hover:text-black font-semibold transition-all w-full md:w-auto"
          >
            Explore Hardware Tier
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
