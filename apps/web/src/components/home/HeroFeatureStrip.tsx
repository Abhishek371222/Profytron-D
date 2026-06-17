"use client";

import { Bot, Rocket, Shield, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";

const FEATURES = [
  {
    icon: Bot,
    title: "AI-Powered",
    description: "Advanced algorithms that adapt and learn.",
  },
  {
    icon: Rocket,
    title: "Automated",
    description: "Deploy and manage strategies 24/7.",
  },
  {
    icon: Shield,
    title: "Secure",
    description: "Bank-grade security and data protection.",
  },
  {
    icon: BarChart3,
    title: "Data-Driven",
    description: "Real-time analytics for smarter decisions.",
  },
] as const;

export function HeroFeatureStrip() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mt-10 sm:mt-12">
      {FEATURES.map((feature, i) => {
        const Icon = feature.icon;
        return (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ delay: i * 0.06, duration: 0.45 }}
            className="rounded-[20px] border border-[var(--card-border)] bg-card p-5 shadow-sm hover:shadow-md hover:border-primary/20 transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
              <Icon className="w-5 h-5 text-primary" />
            </div>
            <p className="text-sm font-bold text-foreground mb-1.5">{feature.title}</p>
            <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
          </motion.div>
        );
      })}
    </div>
  );
}
